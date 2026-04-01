import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useARIA } from "../context/ARIAContext";

interface VirtualNode {
  name: string;
  type: "folder" | "file";
  children?: VirtualNode[];
  fileType?: string;
  createdAt?: string;
  size?: string;
}

const INITIAL_TREE: VirtualNode[] = [
  {
    name: "Clientes",
    type: "folder",
    children: [
      {
        name: "Empresa Alfa Ltda",
        type: "folder",
        children: [
          {
            name: "2026",
            type: "folder",
            children: [
              {
                name: "Notas Fiscais",
                type: "folder",
                children: [
                  {
                    name: "NF_0091_EmpresaAlfa.pdf",
                    type: "file",
                    fileType: "pdf",
                    createdAt: "01/04/2026",
                    size: "245 KB",
                  },
                  {
                    name: "NF_0092_EmpresaAlfa.pdf",
                    type: "file",
                    fileType: "pdf",
                    createdAt: "05/04/2026",
                    size: "189 KB",
                  },
                ],
              },
              {
                name: "Contabilidade",
                type: "folder",
                children: [
                  {
                    name: "Balancete_Mar2026.pdf",
                    type: "file",
                    fileType: "pdf",
                    createdAt: "31/03/2026",
                    size: "512 KB",
                  },
                ],
              },
              {
                name: "Imposto de Renda",
                type: "folder",
                children: [
                  {
                    name: "IRPF_2025_RascunhoA.pdf",
                    type: "file",
                    fileType: "pdf",
                    createdAt: "15/03/2026",
                    size: "320 KB",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Construtora Beta Ltda",
        type: "folder",
        children: [
          {
            name: "2026",
            type: "folder",
            children: [
              {
                name: "Folha de Pagamento",
                type: "folder",
                children: [
                  {
                    name: "FOLHA_JUL2026.pdf",
                    type: "file",
                    fileType: "pdf",
                    createdAt: "01/04/2026",
                    size: "378 KB",
                  },
                  {
                    name: "FOLHA_AGO2026.pdf",
                    type: "file",
                    fileType: "pdf",
                    createdAt: "01/04/2026",
                    size: "381 KB",
                  },
                ],
              },
              {
                name: "Contratos",
                type: "folder",
                children: [
                  {
                    name: "Contrato_Obra_2026.docx",
                    type: "file",
                    fileType: "docx",
                    createdAt: "10/01/2026",
                    size: "95 KB",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Tech Solutions SA",
        type: "folder",
        children: [
          {
            name: "2026",
            type: "folder",
            children: [
              {
                name: "Extratos Bancários",
                type: "folder",
                children: [
                  {
                    name: "EXTRATO_BB_JUL2026.ofx",
                    type: "file",
                    fileType: "ofx",
                    createdAt: "01/04/2026",
                    size: "45 KB",
                  },
                ],
              },
              {
                name: "Documentos",
                type: "folder",
                children: [
                  {
                    name: "Contrato_Social.pdf",
                    type: "file",
                    fileType: "pdf",
                    createdAt: "15/01/2026",
                    size: "210 KB",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

function countFiles(nodes: VirtualNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (n.type === "file") count++;
    else if (n.children) count += countFiles(n.children);
  }
  return count;
}

function countFolders(nodes: VirtualNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (n.type === "folder") {
      count++;
      if (n.children) count += countFolders(n.children);
    }
  }
  return count;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "text-red-400",
  docx: "text-blue-400",
  xlsx: "text-green-400",
  ofx: "text-yellow-400",
  xml: "text-purple-400",
  pfx: "text-orange-400",
};

function TreeNode({
  node,
  depth = 0,
}: {
  node: VirtualNode;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 2);

  if (node.type === "file") {
    const colorClass =
      FILE_TYPE_COLORS[node.fileType ?? ""] ?? "text-muted-foreground";
    return (
      <div
        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/30 group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <File size={13} className={colorClass} />
        <span className="text-xs text-foreground/80 flex-1">{node.name}</span>
        {node.size && (
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {node.size}
          </span>
        )}
        {node.createdAt && (
          <span className="text-[10px] text-muted-foreground">
            {node.createdAt}
          </span>
        )}
      </div>
    );
  }

  const childFiles =
    node.children?.filter((c) => c.type === "file").length ?? 0;
  const childFolders =
    node.children?.filter((c) => c.type === "folder").length ?? 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/40 w-full text-left transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {open ? (
          <ChevronDown size={13} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={13} className="shrink-0 text-muted-foreground" />
        )}
        {open ? (
          <FolderOpen size={14} className="shrink-0 text-yellow-400" />
        ) : (
          <Folder size={14} className="shrink-0 text-yellow-300" />
        )}
        <span className="text-xs font-medium text-foreground flex-1">
          {node.name}
        </span>
        {(childFiles > 0 || childFolders > 0) && (
          <span className="text-[10px] text-muted-foreground">
            {childFolders > 0 &&
              `${childFolders} pasta${childFolders > 1 ? "s" : ""}`}
            {childFolders > 0 && childFiles > 0 && ", "}
            {childFiles > 0 && `${childFiles} arq.`}
          </span>
        )}
      </button>
      {open && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode
              key={`${child.name}-${i}`}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AriaPasstas() {
  const { messages, addMessage } = useARIA();
  const [tree, setTree] = useState<VirtualNode[]>(() => {
    try {
      const s = localStorage.getItem("ariaFolderTree");
      if (s) return JSON.parse(s);
    } catch {}
    return INITIAL_TREE;
  });

  useEffect(() => {
    localStorage.setItem("ariaFolderTree", JSON.stringify(tree));
  }, [tree]);

  // Scan messages for folder creation events
  useEffect(() => {
    const folderMsgs = messages.filter(
      (m) =>
        m.filePath && m.type === "success" && m.text.includes("Pasta gerada"),
    );
    if (folderMsgs.length > 0) {
      // Folders from ARIA messages are already reflected in INITIAL_TREE, no-op here
    }
  }, [messages]);

  const handleReset = () => {
    setTree(INITIAL_TREE);
    addMessage({
      type: "info",
      text: "📁 Estrutura de pastas reiniciada ao padrão.",
    });
  };

  const totalFiles = countFiles(tree);
  const totalFolders = countFolders(tree);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pastas ARIA</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Estrutura de pastas organizada automaticamente pela IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw size={14} className="mr-1.5" /> Reiniciar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              addMessage({
                type: "info",
                text: "📁 ARIA organizando novos arquivos detectados...",
              });
            }}
          >
            <FolderPlus size={14} className="mr-1.5" /> Organizar Agora
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {totalFolders}
            </div>
            <div className="text-xs text-muted-foreground">Pastas criadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{totalFiles}</div>
            <div className="text-xs text-muted-foreground">
              Arquivos organizados
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-xs text-muted-foreground">
              Clientes com pastas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Legenda de Tipos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(FILE_TYPE_COLORS).map(([ext, color]) => (
              <div key={ext} className="flex items-center gap-1.5">
                <File size={12} className={color} />
                <span className="text-xs text-muted-foreground uppercase">
                  .{ext}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tree */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Árvore de Pastas</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Simulado — armazenamento visual
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="py-2">
              {tree.map((node, i) => (
                <TreeNode key={`${node.name}-${i}`} node={node} depth={0} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Estrutura padrão */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Estrutura Padrão por Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-xs text-muted-foreground space-y-0.5 leading-relaxed">
            <div>
              /Clientes/
              <span className="text-foreground">[Nome do Cliente]</span>/
            </div>
            <div className="pl-4">
              └── <span className="text-foreground">[Ano]</span>/
            </div>
            <div className="pl-8">
              ├── <span className="text-yellow-300">Imposto de Renda</span>/
            </div>
            <div className="pl-8">
              ├── <span className="text-yellow-300">Notas Fiscais</span>/
            </div>
            <div className="pl-8">
              ├── <span className="text-yellow-300">Documentos</span>/
            </div>
            <div className="pl-8">
              ├── <span className="text-yellow-300">Folha de Pagamento</span>/
            </div>
            <div className="pl-8">
              ├── <span className="text-yellow-300">Contabilidade</span>/
            </div>
            <div className="pl-8">
              ├── <span className="text-yellow-300">Extratos Bancários</span>/
            </div>
            <div className="pl-8">
              └── <span className="text-yellow-300">Contratos</span>/
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            ⚠️ Estrutura visual apenas — navegadores não permitem criar pastas
            reais no computador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
