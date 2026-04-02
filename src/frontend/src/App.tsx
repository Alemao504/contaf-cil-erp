import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import ARIABubble from "./components/ARIABubble";
import ARIAChat from "./components/ARIAChat";
import Sidebar from "./components/Sidebar";
import { ARIAProvider, useARIA } from "./context/ARIAContext";
import { AppProvider, useAppContext } from "./context/AppContext";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import Agenda from "./pages/Agenda";
import AnalisePreditiva from "./pages/AnalisePreditiva";
import ApisGovernamentais from "./pages/ApisGovernamentais";
import AppMobile from "./pages/AppMobile";
import AriaAgendamentos from "./pages/AriaAgendamentos";
import AriaAprendizado from "./pages/AriaAprendizado";
import AriaAprovacao from "./pages/AriaAprovacao";
import AriaLote from "./pages/AriaLote";
import AriaMemoria from "./pages/AriaMemoria";
import AriaPasstas from "./pages/AriaPasstas";
import AriaProcessamento from "./pages/AriaProcessamento";
import AriaVoz from "./pages/AriaVoz";
import AssinaturaDigital from "./pages/AssinaturaDigital";
import BIStudio from "./pages/BIStudio";
import BuscaImagens from "./pages/BuscaImagens";
import Clientes from "./pages/Clientes";
import ClientesFull from "./pages/ClientesFull";
import Configuracoes from "./pages/Configuracoes";
import Dashboard from "./pages/Dashboard";
import DeteccaoFraudes from "./pages/DeteccaoFraudes";
import Digitalizacao from "./pages/Digitalizacao";
import Documentos from "./pages/Documentos";
import FiscalModule from "./pages/FiscalModule";
import GestaoContratos from "./pages/GestaoContratos";
import IRPF from "./pages/IRPF";
import Lancamentos from "./pages/Lancamentos";
import Login from "./pages/Login";
import NotasFiscais from "./pages/NotasFiscais";
import NotasLivres from "./pages/NotasLivres";
import Notificacoes from "./pages/Notificacoes";
import Orcamento from "./pages/Orcamento";
import Patrimonio from "./pages/Patrimonio";
import PortalCliente from "./pages/PortalCliente";
import Relatorios from "./pages/Relatorios";
import RelatoriosAvancados from "./pages/RelatoriosAvancados";
import RelatoriosGerenciais from "./pages/RelatoriosGerenciais";
import RelatoriosMensaisIA from "./pages/RelatoriosMensaisIA";
import SimulacaoCenarios from "./pages/SimulacaoCenarios";
import SimuladorTributario from "./pages/SimuladorTributario";
import SincronizacaoNuvem from "./pages/SincronizacaoNuvem";
import SincronizacaoSeguranca from "./pages/SincronizacaoSeguranca";
import WebClipper from "./pages/WebClipper";
import Workflow from "./pages/Workflow";

function AppContent() {
  const { currentPage } = useAppContext();
  const { isOnline } = useOnlineStatus();
  const { isChatOpen } = useARIA();

  const page = (() => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "clientes":
        return <Clientes />;
      case "clientes-cadastro":
        return <ClientesFull />;
      case "documentos":
        return <Documentos />;
      case "digitalizacao":
        return <Digitalizacao />;
      case "notas-livres":
        return <NotasLivres />;
      case "busca-imagens":
        return <BuscaImagens />;
      case "lancamentos":
        return <Lancamentos />;
      case "relatorios":
        return <Relatorios />;
      case "relatorios-gerenciais":
        return <RelatoriosGerenciais />;
      case "notas-fiscais":
        return <NotasFiscais />;
      case "agenda":
        return <Agenda />;
      case "portal-cliente":
        return <PortalCliente />;
      case "patrimonio":
        return <Patrimonio />;
      case "orcamento":
        return <Orcamento />;
      case "notificacoes":
        return <Notificacoes />;
      case "apis-governamentais":
        return <ApisGovernamentais />;
      case "configuracoes":
        return <Configuracoes />;
      case "workflow-aprovacao":
        return <Workflow />;
      case "simulador-tributario":
        return <SimuladorTributario />;
      case "deteccao-fraudes":
        return <DeteccaoFraudes />;
      case "web-clipper":
        return <WebClipper />;
      case "assinatura-digital":
        return <AssinaturaDigital />;
      case "aria-aprendizado":
        return <AriaAprendizado />;
      case "aria-memoria":
        return <AriaMemoria />;
      case "aria-aprovacao":
        return <AriaAprovacao />;
      case "aria-voz":
        return <AriaVoz />;
      case "simulacao-cenarios":
        return <SimulacaoCenarios />;
      case "sincronizacao-nuvem":
        return <SincronizacaoNuvem />;
      case "relatorios-avancados":
        return <RelatoriosAvancados />;
      case "sincronizacao-seguranca":
        return <SincronizacaoSeguranca />;
      case "gestao-contratos":
        return <GestaoContratos />;
      case "modulo-fiscal":
        return <FiscalModule />;
      case "app-mobile":
        return <AppMobile />;
      case "bi-studio":
        return <BIStudio />;
      case "relatorios-mensais-ia":
        return <RelatoriosMensaisIA />;
      case "analise-preditiva":
        return <AnalisePreditiva />;
      case "irpf":
        return <IRPF />;
      case "aria-agendamentos":
        return <AriaAgendamentos />;
      case "aria-lote":
        return <AriaLote />;
      case "aria-pastas":
        return <AriaPasstas />;
      case "aria-processamento":
        return <AriaProcessamento />;
      default:
        return <Dashboard />;
    }
  })();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {!isOnline && (
          <div
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/15 border-b border-yellow-500/30 text-yellow-400 text-xs font-medium shrink-0"
            data-ocid="app-mobile.offline.toast"
          >
            <span>⚠️</span>
            <span>
              Você está offline — dados serão sincronizados quando a conexão for
              restaurada
            </span>
          </div>
        )}
        <main className="flex-1 overflow-auto">{page}</main>
      </div>
      <Toaster richColors position="top-right" />
      {/* ARIA floating bubble — always on top */}
      <ARIABubble />
      <AnimatePresence>{isChatOpen && <ARIAChat />}</AnimatePresence>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("loggedIn") === "true";
  });

  useEffect(() => {
    const onStorage = () =>
      setLoggedIn(localStorage.getItem("loggedIn") === "true");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!loggedIn) {
    return (
      <>
        <Login onLogin={() => setLoggedIn(true)} />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <AppProvider>
      <ARIAProvider>
        <AppContent />
      </ARIAProvider>
    </AppProvider>
  );
}
