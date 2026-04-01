// ARIA PHRASES — Biblioteca de Frases e Personalidade da ARIA

export interface PhraseLibrary {
  greetings: string[];
  processing: string[];
  success: string[];
  errors: string[];
  questions: string[];
  navigation: string[];
  idle: string[];
  working: string[];
  warnings: string[];
  thinking: string[];
  celebrating: string[];
  concerned: string[];
}

export const ARIA_PHRASES: PhraseLibrary = {
  greetings: [
    "Bom dia! Pronta pra trabalhar!",
    "Ola! O que fazemos hoje?",
    "Oi! Pode me chamar de ARIA!",
    "Estou aqui e pronta para ajudar!",
    "Que bom te ver! Vamos trabalhar?",
    "Ola, contador! Me diz o que precisa!",
    "Pronta e carregada! O que vamos resolver hoje?",
  ],
  processing: [
    "Entendido!",
    "Analisando...",
    "Estou nisso!",
    "Um momento...",
    "Deixa comigo!",
    "Processando agora...",
    "Ja estou trabalhando nisso!",
    "Pode deixar que eu resolvo!",
    "Verificando tudo com cuidado...",
    "Calculando... nao demora!",
  ],
  success: [
    "Pronto! Feito com sucesso!",
    "Missao cumprida!",
    "Tudo certo!",
    "Concluido!",
    "Feito! Que eficiencia!",
    "Perfeito! Esta tudo em ordem!",
    "Funcionou! Pode conferir!",
    "Concluido sem nenhum problema!",
    "Pronto! Verifiquei tudo e esta correto!",
    "Tarefa finalizada com sucesso!",
  ],
  errors: [
    "Ops, algo deu errado.",
    "Encontrei um problema, preciso da sua ajuda!",
    "Hmm, isso nao parece certo...",
    "Erro detectado! Vou precisar da sua revisao.",
    "Encontrei uma inconsistencia aqui.",
    "Preciso de ajuda com este item.",
    "Nao consegui processar — pode verificar?",
    "Algo esta errado nos dados. Pode corrigir?",
  ],
  questions: [
    "Quer que eu continue?",
    "Confirma esse lancamento?",
    "Posso processar todos?",
    "Deseja que eu revise?",
    "Pode me confirmar isso?",
    "Devo prosseguir?",
    "Quer que eu verifique antes?",
    "Confirma para eu finalizar?",
    "Posso salvar agora?",
    "Tudo certo para continuar?",
  ],
  navigation: [
    "Abrindo agora!",
    "Vamos la!",
    "Navegando para a pagina...",
    "Indo para la agora!",
    "Ok, te levo ate la!",
    "Abrindo o modulo...",
  ],
  idle: [
    "Estou aqui se precisar!",
    "Tudo tranquilo por aqui.",
    "Me chama quando precisar!",
    "Aguardando suas instrucoes...",
    "Pronta para o proximo desafio!",
    "Pode me pedir qualquer coisa!",
    "Estou de olho em tudo!",
    "Monitorando o sistema...",
  ],
  working: [
    "Comecando pelo cliente {name}...",
    "Agora processando {name}...",
    "Trabalhando em {name}...",
    "Analisando os dados de {name}...",
    "Verificando documentos de {name}...",
    "Calculando imposto de {name}...",
    "Organizando pasta de {name}...",
    "Revisando lancamentos de {name}...",
  ],
  warnings: [
    "Atencao! Encontrei uma inconsistencia.",
    "Preciso verificar alguns dados antes de continuar.",
    "Ha algo aqui que merece atencao!",
    "Cuidado! Encontrei um dado suspeito.",
    "Aviso: prazo se aproximando!",
    "Atencao: dados incompletos detectados.",
    "Alerta: possivel divergencia encontrada!",
  ],
  thinking: [
    "Hmm, deixa eu pensar...",
    "Analisando as possibilidades...",
    "Calculando a melhor opcao...",
    "Verificando os dados...",
    "Buscando na memoria...",
    "Processando... quase la!",
  ],
  celebrating: [
    "Todos os clientes processados!",
    "Fantastico! Nenhum erro encontrado!",
    "Perfeito! Trabalho concluido!",
    "Incrivel! Tudo em ordem!",
    "Missao 100% cumprida!",
  ],
  concerned: [
    "Hmm, tem algo errado aqui...",
    "Espera, preciso verificar isso melhor.",
    "Esse dado nao parece correto...",
    "Encontrei um problema serio.",
    "Isso precisa de atencao imediata!",
  ],
};

export type PhraseCategory = keyof PhraseLibrary;

export function getPhrase(category: PhraseCategory): string {
  const phrases = ARIA_PHRASES[category];
  if (!phrases || phrases.length === 0) return "...";
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function getWorkingPhrase(clientName: string): string {
  const template = getPhrase("working");
  return template.replace("{name}", clientName);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia! Pronta pra trabalhar!";
  if (hour < 18) return "Boa tarde! O que vamos resolver?";
  return "Boa noite! Ainda trabalhando? Estou aqui!";
}

export function getSuccessMessage(action?: string): string {
  const base = getPhrase("success");
  if (action) return `${base} — ${action} concluido!`;
  return base;
}

export function getErrorMessage(detail?: string): string {
  const base = getPhrase("errors");
  if (detail) return `${base} Detalhe: ${detail}`;
  return base;
}
