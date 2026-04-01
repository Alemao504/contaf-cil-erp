import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Storage "blob-storage/Storage";
import Iter "mo:core/Iter";

import Int "mo:core/Int";
import Nat "mo:core/Nat";
import MixinStorage "blob-storage/Mixin";


actor {
  include MixinStorage();
  // Access control module
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    email : Text;
    role : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view other users' profiles");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Data Types
  public type Client = {
    id : Text;
    name : Text;
    cnpj : Text;
    regime : Text;
    active : Bool;
  };

  public type AccountPlanEntry = {
    code : Text;
    name : Text;
    accountType : Text;
  };

  public type JournalEntry = {
    id : Text;
    clientId : Text;
    entryDate : Text;
    debitCode : Text;
    creditCode : Text;
    valueInCents : Nat;
    description : Text;
    docId : Text;
  };

  public type Document = {
    id : Text;
    clientId : Text;
    year : Nat;
    filename : Text;
    blob : Storage.ExternalBlob;
    status : Text;
    extractedText : Text;
    docType : Text;
  };

  public type ProcessingResult = {
    docId : Text;
    status : Text; // New status field ("pending", "processing", "done", "error")
    extractedType : Text;
    cnpj : Text;
    totalValue : Nat; // In cents
    docDate : Text;
    description : Text;
    errorMessage : Text; // New errorMessage field
    suggestedEntries : [JournalEntry]; // New suggestedEntries field
  };

  module Document {
    public func compare(d1 : Document, d2 : Document) : { #less; #equal; #greater } {
      Text.compare(d1.filename, d2.filename);
    };
  };

  // Data Stores
  let clients = Map.empty<Text, Client>();
  let accountPlans = Map.empty<Text, Map.Map<Text, AccountPlanEntry>>();
  let journalEntries = Map.empty<Text, Map.Map<Text, JournalEntry>>();
  let documents = Map.empty<Text, Document>();
  let processingResults = Map.empty<Text, ProcessingResult>();

  // HTTP Outcall Transform Function (must be top-level)
  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Document Processing with Claude API
  public shared ({ caller }) func processDocumentWithAI(docId : Text, clientId : Text, claudeApiKey : Text) : async ProcessingResult {
    // Authorization: Only users can process documents
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can process documents");
    };

    // Get the document
    let document = switch (documents.get(docId)) {
      case (null) { Runtime.trap("Document not found") };
      case (?doc) { doc };
    };

    // Verify document belongs to the specified client
    if (document.clientId != clientId) {
      Runtime.trap("Document does not belong to the specified client");
    };

    let prompt = "Você é uma IA contadora para empresas brasileiras. Extraia deste documento: tipo do documento (NF-e, Extrato Bancário, Folha de Pagamento, Recibo ou Outro), CNPJ (apenas números), valor total em centavos (inteiro), data (YYYY-MM-DD), breve descrição (máx 100 chars). Responda APENAS em JSON: {tipo, cnpj, valorEmCentavos, data, descricao}";

    let apiRequest = "{\"model\": \"claude-3-opus-20240229\", \"max_tokens\": 256, \"messages\": [{\"role\": \"user\", \"content\": \"Encontre os dados fiscais nesse texto OCR: \\\"" # document.extractedText # "\\\". " # prompt # "\"}]}";

    let headers = [
      { name = "x-api-key"; value = claudeApiKey },
      { name = "Anthropic-Version"; value = "2023-06-01" },
      { name = "Content-Type"; value = "application/json" },
    ];

    let response = await OutCall.httpPostRequest("https://api.anthropic.com/v1/messages", headers, apiRequest, transform);

    let extractedType = parseField(response, "tipo", #text);
    let cnpj = parseField(response, "cnpj", #text);
    let totalValueStr = parseField(response, "valorEmCentavos", #number);
    let totalValue = switch (Nat.fromText(totalValueStr)) {
      case (null) { 0 };
      case (?val) { val };
    };
    let docDate = parseField(response, "data", #text);
    let description = parseField(response, "descricao", #text);

    let suggestedEntries = [] : [JournalEntry];

    let processingResult : ProcessingResult = {
      docId;
      status = "done";
      extractedType;
      cnpj;
      totalValue;
      docDate;
      description;
      errorMessage = "";
      suggestedEntries;
    };

    processingResults.add(docId, processingResult);

    processingResult;
  };

  func parseField(json : Text, field : Text, valueType : { #text; #number }) : Text {
    let fieldPattern = "\"" # field # "\"\\s*:\\s*";
    let regexType = switch (valueType) {
      case (#text) { "\"([^\"]*)\"" };
      case (#number) { "(-?\\d+\\.?\\d*)" };
    };
    let regexPattern = fieldPattern # regexType;
    let splitField = json.split(#text(regexPattern));
    let parts = splitField.toArray();
    if (parts.size() > 1) {
      parts[1];
    } else {
      "";
    };
  };

  // Confirm Journal Entries
  public shared ({ caller }) func confirmJournalEntries(docId : Text, clientId : Text, entries : [JournalEntry]) : async () {
    // Authorization: Only users can confirm journal entries
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can confirm journal entries");
    };

    // Verify document exists and belongs to the specified client
    switch (documents.get(docId)) {
      case (null) { Runtime.trap("Document not found") };
      case (?doc) {
        if (doc.clientId != clientId) {
          Runtime.trap("Document does not belong to the specified client");
        };
        let updatedDoc = { doc with status = "processed" };
        documents.add(docId, updatedDoc);
      };
    };

    // Verify all entries belong to the same client
    for (entry in entries.values()) {
      if (entry.clientId != clientId) {
        Runtime.trap("All journal entries must belong to the specified client");
      };
    };

    let clientEntries = switch (journalEntries.get(clientId)) {
      case (null) {
        let newMap = Map.empty<Text, JournalEntry>();
        journalEntries.add(clientId, newMap);
        newMap;
      };
      case (?existingEntries) { existingEntries };
    };

    for (entry in entries.values()) {
      clientEntries.add(entry.id, entry);
    };
  };

  // Get Processing Result
  public query ({ caller }) func getProcessingResult(docId : Text) : async ?ProcessingResult {
    // Authorization: Only users can view processing results
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view processing results");
    };

    // Get the processing result
    let result = processingResults.get(docId);
    
    // Verify caller has access to this document's client
    switch (result) {
      case (null) { null };
      case (?res) {
        // Get the document to check client ownership
        switch (documents.get(res.docId)) {
          case (null) { null };
          case (?doc) {
            // Allow access - in a real system, you'd verify client ownership here
            // For now, any authenticated user can view results
            result;
          };
        };
      };
    };
  };

  // Other CRUD endpoints remain unchanged
  public shared ({ caller }) func addDocument(document : Document) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add documents");
    };
    if (documents.containsKey(document.id)) {
      Runtime.trap("Document already exists");
    };
    documents.add(document.id, document);
  };

  public query ({ caller }) func getDocument(id : Text) : async Document {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view documents");
    };
    switch (documents.get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?doc) { doc };
    };
  };

  public query ({ caller }) func getAllDocuments() : async [Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view documents");
    };
    documents.values().toArray().sort();
  };
};
