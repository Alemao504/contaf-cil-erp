import { cn } from "@/lib/utils";
import {
  BarChart2,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Building2,
  Calculator,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Camera,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudUpload,
  Database,
  FileSearch,
  FileSignature,
  FileText,
  FolderTree,
  Globe,
  Layers,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mic,
  Network,
  PenTool,
  Receipt,
  Scale,
  Scissors,
  Search,
  Settings,
  ShieldAlert,
  Smartphone,
  StickyNote,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { getAllRecords } from "../lib/db";
import type { FraudeAlerta } from "../lib/fraudeService";
import type { WorkflowItem } from "../lib/workflowService";
import type { Contrato } from "../pages/GestaoContratos";
import type { NotifLembrete } from "../pages/Notificacoes";
import type { LancamentoOrcamento } from "../pages/Orcamento";
import type { LixeiraItem } from "../pages/SincronizacaoNuvem";

type NavItem =
  | {
      id: string;
      label: string;
      icon: React.ElementType;
      badge?: number;
      isSeparator?: never;
    }
  | {
      id: string;
      label: string;
      isSeparator: true;
      icon?: never;
      badge?: never;
    };

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } =
    useAppContext();
  const [workflowBadge, setWorkflowBadge] = useState<number | undefined>(
    undefined,
  );
  const [fraudeBadge, setFraudeBadge] = useState<number | undefined>(undefined);
  const [assinaturaBadge, setAssinaturaBadge] = useState<number | undefined>(
    undefined,
  );
  const [orcamentoBadge, setOrcamentoBadge] = useState<number | undefined>(
    undefined,
  );
  const [lixeiraBadge, setLixeiraBadge] = useState<number | undefined>(
    undefined,
  );
  const [notifBadge, setNotifBadge] = useState<number | undefined>(undefined);
  const [contratosBadge, setContratosBadge] = useState<number | undefined>(
    undefined,
  );

  const loadWorkflowBadge = useCallback(() => {
    getAllRecords<WorkflowItem>("workflow_items")
      .then((items) => {
        const count = items.filter(
          (i) =>
            i.status_atual === "pendente" || i.status_atual === "em_revisao",
        ).length;
        setWorkflowBadge(count > 0 ? count : undefined);
      })
      .catch(() => {});
  }, []);

  const loadAssinaturaBadge = useCallback(() => {
    getAllRecords<{ id: string; status: string }>("documentos_assinados")
      .then((items) => {
        const count = items.filter((i) => i.status === "pendente").length;
        setAssinaturaBadge(count > 0 ? count : undefined);
      })
      .catch(() => {});
  }, []);

  const loadOrcamentoBadge = useCallback(() => {
    getAllRecords<LancamentoOrcamento>("orcamento_lancamentos")
      .then((items) => {
        const threshold = Number(
          localStorage.getItem("orcamento_threshold") || "20",
        );
        const byCenter: Record<string, { orc: number; real: number }> = {};
        for (const l of items) {
          if (!byCenter[l.centroId]) byCenter[l.centroId] = { orc: 0, real: 0 };
          byCenter[l.centroId].orc += l.orcado;
          byCenter[l.centroId].real += l.realizado;
        }
        const count = Object.values(byCenter).filter((v) => {
          if (v.real === 0) return false;
          return Math.abs(((v.real - v.orc) / v.orc) * 100) >= threshold;
        }).length;
        setOrcamentoBadge(count > 0 ? count : undefined);
      })
      .catch(() => {});
  }, []);

  const loadFraudeBadge = useCallback(() => {
    getAllRecords<FraudeAlerta>("fraude_alertas")
      .then((items) => {
        const count = items.filter(
          (i) =>
            i.status === "aberto" &&
            (i.nivel === "alto" || i.nivel === "medio"),
        ).length;
        setFraudeBadge(count > 0 ? count : undefined);
      })
      .catch(() => {});
  }, []);

  const loadLixeiraBadge = useCallback(() => {
    getAllRecords<LixeiraItem>("lixeira_itens")
      .then((items) => {
        setLixeiraBadge(items.length > 0 ? items.length : undefined);
      })
      .catch(() => {});
  }, []);

  const loadNotifBadge = useCallback(() => {
    getAllRecords<NotifLembrete>("notificacoes_lembretes")
      .then((items) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const count = items.filter((l) => {
          if (l.status === "enviado") return false;
          const d = new Date(l.dataVencimento);
          d.setHours(0, 0, 0, 0);
          const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
          return diff <= 7;
        }).length;
        setNotifBadge(count > 0 ? count : undefined);
      })
      .catch(() => {});
  }, []);

  const loadContratosBadge = useCallback(() => {
    getAllRecords<Contrato>("contratos")
      .then((items) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const count = items.filter((c) => {
          if (c.status !== "ativo" || !c.dataRenovacao) return false;
          const d = new Date(c.dataRenovacao);
          d.setHours(0, 0, 0, 0);
          const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
          return diff <= 30;
        }).length;
        setContratosBadge(count > 0 ? count : undefined);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadWorkflowBadge();
    loadFraudeBadge();
    loadAssinaturaBadge();
    loadOrcamentoBadge();
    loadLixeiraBadge();
    loadNotifBadge();
    loadContratosBadge();
    const interval = setInterval(() => {
      loadWorkflowBadge();
      loadFraudeBadge();
      loadAssinaturaBadge();
      loadOrcamentoBadge();
      loadLixeiraBadge();
      loadNotifBadge();
      loadContratosBadge();
    }, 30000);
    return () => clearInterval(interval);
  }, [
    loadWorkflowBadge,
    loadFraudeBadge,
    loadAssinaturaBadge,
    loadOrcamentoBadge,
    loadLixeiraBadge,
    loadNotifBadge,
    loadContratosBadge,
  ]);

  const NAV_ITEMS: NavItem[] = [
    // ── GROUP 1: TOP ─────────────────────────────────────────────────────
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },

    // ── GROUP 2: OPERACIONAL ─────────────────────────────────────────────
    { id: "__sep_op__", label: "OPERACIONAL", isSeparator: true },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "clientes-cadastro", label: "Gestão de Clientes", icon: Users },
    { id: "agenda", label: "Agenda / Prazos", icon: CalendarDays },
    {
      id: "notificacoes",
      label: "Notificações",
      icon: Bell,
      badge: notifBadge,
    },
    { id: "portal-cliente", label: "Portal do Cliente", icon: Globe },
    {
      id: "gestao-contratos",
      label: "Gestão de Contratos",
      icon: FileSignature,
      badge: contratosBadge,
    },
    {
      id: "workflow-aprovacao",
      label: "Workflow Aprovação",
      icon: CheckSquare,
      badge: workflowBadge,
    },

    // ── GROUP 3: DOCUMENTOS & FERRAMENTAS ─────────────────────────────────
    { id: "__sep_doc__", label: "DOCUMENTOS & FERRAMENTAS", isSeparator: true },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "digitalizacao", label: "Digitalização", icon: Camera },
    { id: "notas-livres", label: "Notas", icon: StickyNote },
    { id: "busca-imagens", label: "Busca em Imagens", icon: Search },
    { id: "web-clipper", label: "Web Clipper", icon: Scissors },
    {
      id: "assinatura-digital",
      label: "Assinatura Digital",
      icon: PenTool,
      badge: assinaturaBadge,
    },
    { id: "app-mobile", label: "App Mobile", icon: Smartphone },

    // ── GROUP 4: CONTABILIDADE ─────────────────────────────────────────────
    { id: "__sep_cont__", label: "CONTABILIDADE", isSeparator: true },
    { id: "lancamentos", label: "Lançamentos", icon: BookOpen },
    { id: "notas-fiscais", label: "Notas Fiscais", icon: Receipt },
    {
      id: "modulo-fiscal",
      label: "Módulo Fiscal",
      icon: FileText,
      badge: 3 as number | undefined,
    },
    { id: "irpf", label: "IRPF - Pessoa Física", icon: FileSearch },
    { id: "simulador-tributario", label: "Simulador Tributário", icon: Scale },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
    { id: "relatorios-gerenciais", label: "Rel. Gerenciais", icon: BarChart3 },
    {
      id: "relatorios-avancados",
      label: "Relatórios Avançados",
      icon: TrendingUp,
    },
    { id: "bi-studio", label: "BI Studio", icon: LineChart },
    {
      id: "relatorios-mensais-ia",
      label: "Relat. Mensais IA",
      icon: CalendarCheck,
    },
    {
      id: "analise-preditiva",
      label: "Análise Preditiva",
      icon: TrendingUp,
      badge: 3 as number | undefined,
    },
    { id: "patrimonio", label: "Patrimônio", icon: Building2 },
    {
      id: "orcamento",
      label: "Orçamento & Previsão",
      icon: BarChart2,
      badge: orcamentoBadge,
    },
    {
      id: "deteccao-fraudes",
      label: "Detecção de Fraudes",
      icon: ShieldAlert,
      badge: fraudeBadge,
    },
    { id: "apis-governamentais", label: "APIs Governamentais", icon: Network },
    {
      id: "sincronizacao-seguranca",
      label: "Sync & Segurança",
      icon: CloudUpload,
    },
    {
      id: "sincronizacao-nuvem",
      label: "Sync Nuvem & Lixeira",
      icon: Cloud,
      badge: lixeiraBadge,
    },
    {
      id: "simulacao-cenarios",
      label: "Simulação de Cenários",
      icon: BarChart3,
    },

    // ── GROUP 5: ARIA & IA ────────────────────────────────────────────────
    { id: "__sep_aria__", label: "ARIA & IA", isSeparator: true },
    { id: "aria-memoria", label: "Memória ARIA", icon: Database },
    { id: "aria-aprendizado", label: "Aprendizado ARIA", icon: Brain },
    { id: "aria-aprovacao", label: "Aprovação ARIA", icon: CheckCircle2 },
    { id: "aria-voz", label: "Voz & Comandos", icon: Mic },
    {
      id: "aria-agendamentos",
      label: "Automações Agendadas",
      icon: CalendarClock,
    },
    { id: "aria-lote", label: "Processamento em Lote", icon: Layers },
    { id: "aria-pastas", label: "Pastas ARIA", icon: FolderTree },

    // ── GROUP 6: SISTEMA ──────────────────────────────────────────────────
    { id: "__sep_sys__", label: "SISTEMA", isSeparator: true },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("masterUser");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    window.location.reload();
  };

  return (
    <aside
      data-ocid="sidebar.panel"
      className={cn(
        "flex flex-col h-full transition-all duration-300 flex-shrink-0",
        sidebarOpen ? "w-56" : "w-16",
      )}
      style={{
        background:
          "linear-gradient(180deg, oklch(0.22 0.055 240), oklch(0.26 0.065 240))",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "oklch(var(--accent))" }}
        >
          <Calculator className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <span className="text-white font-semibold text-sm tracking-wide">
            ContaFácil
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if ("isSeparator" in item && item.isSeparator) {
            return sidebarOpen ? (
              <div key={item.id} className="px-3 pt-4 pb-1">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  {item.label}
                </p>
              </div>
            ) : (
              <div
                key={item.id}
                className="border-t border-white/10 mx-2 my-2"
              />
            );
          }

          const Icon = item.icon as React.ElementType;
          const active = currentPage === item.id;
          return (
            <button
              type="button"
              key={`${item.id}-nav`}
              data-ocid={`nav.${item.id}.link`}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-white/12 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/8",
              )}
            >
              <div className="relative flex-shrink-0">
                <Icon className={cn("w-4 h-4", active ? "text-accent" : "")} />
                {"badge" in item && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && "badge" in item && item.badge !== undefined && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: logout + toggle */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          type="button"
          data-ocid="sidebar.logout.button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-red-300 hover:bg-white/8 transition-colors"
        >
          <LogOut className="flex-shrink-0 w-4 h-4" />
          {sidebarOpen && <span className="text-xs font-medium">Sair</span>}
        </button>
        <button
          type="button"
          data-ocid="sidebar.toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
