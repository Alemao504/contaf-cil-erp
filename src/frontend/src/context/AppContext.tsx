import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserProfile } from "../backend";
import { useActor } from "../hooks/useActor";
import { migrateFromLocalStorage } from "../lib/db";
import { type Client, loadClients, saveClients } from "../types/local";

interface AppContextValue {
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  clients: Client[];
  setClients: (c: Client[]) => void;
  userProfile: UserProfile | null;
  setUserProfile: (p: UserProfile | null) => void;
  currentPage: string;
  setCurrentPage: (p: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clients, setClientsState] = useState<Client[]>(() => loadClients());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { actor, isFetching } = useActor();

  useEffect(() => {
    migrateFromLocalStorage().catch((err) =>
      console.warn("IndexedDB migration failed:", err),
    );
  }, []);

  const setClients = useCallback((c: Client[]) => {
    setClientsState(c);
    saveClients(c);
  }, []);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const initProfile = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const p = await actor.getCallerUserProfile();
      if (p) setUserProfile(p);
    } catch {}
  }, [actor, isFetching]);

  useEffect(() => {
    initProfile();
  }, [initProfile]);

  return (
    <AppContext.Provider
      value={{
        selectedClientId,
        setSelectedClientId,
        clients,
        setClients,
        userProfile,
        setUserProfile,
        currentPage,
        setCurrentPage,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be inside AppProvider");
  return ctx;
}
