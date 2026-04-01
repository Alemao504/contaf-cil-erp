// Simulador de Regime Tributário — ContaFácil ERP
// Brazilian tax regime calculator (2024 rules)

export interface SimuladorInput {
  faturamentoBrutoAnual: number;
  folhaMensalTotal: number;
  despesasDedutiveisAnual: number;
  cnae: string;
  atividade: "servicos" | "comercio" | "industria";
  estado: string;
}

export interface RegimeCalculo {
  nome: string;
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  cpp: number;
  iss: number; // ISS for services, ICMS/IPI share for commerce/industry within DAS
  total: number;
  aliquotaEfetiva: number; // percentage of faturamento
}

export interface SimulacaoResult {
  id?: string;
  clientId?: string;
  clientNome?: string;
  createdAt?: string;
  input: SimuladorInput;
  simplesNacional: RegimeCalculo;
  lucroPresumido: RegimeCalculo;
  lucroReal: RegimeCalculo;
  recomendado: "simplesNacional" | "lucroPresumido" | "lucroReal";
  economiaMensal: number;
  economiaAnual: number;
  recomendacaoTexto: string;
  snElegivel: boolean;
}

// ─── Simples Nacional Bands ──────────────────────────────────────────────────

interface SNBand {
  max: number;
  aliq: number; // gross aliquot as decimal
  pd: number; // deduction amount R$
}

const SN_BANDS_SERVICOS: SNBand[] = [
  { max: 180000, aliq: 0.06, pd: 0 },
  { max: 360000, aliq: 0.112, pd: 9360 },
  { max: 720000, aliq: 0.135, pd: 17640 },
  { max: 1800000, aliq: 0.16, pd: 35640 },
  { max: 3600000, aliq: 0.21, pd: 125640 },
  { max: 4800000, aliq: 0.33, pd: 648000 },
];

const SN_BANDS_COMERCIO: SNBand[] = [
  { max: 180000, aliq: 0.04, pd: 0 },
  { max: 360000, aliq: 0.073, pd: 5940 },
  { max: 720000, aliq: 0.095, pd: 13860 },
  { max: 1800000, aliq: 0.107, pd: 22500 },
  { max: 3600000, aliq: 0.143, pd: 87300 },
  { max: 4800000, aliq: 0.19, pd: 378000 },
];

const SN_BANDS_INDUSTRIA: SNBand[] = [
  { max: 180000, aliq: 0.045, pd: 0 },
  { max: 360000, aliq: 0.078, pd: 4050 },
  { max: 720000, aliq: 0.1, pd: 13500 },
  { max: 1800000, aliq: 0.112, pd: 22500 },
  { max: 3600000, aliq: 0.147, pd: 85500 },
  { max: 4800000, aliq: 0.3, pd: 720000 },
];

// Approximate DAS distribution (as fraction of total DAS)
interface SNDist {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  cpp: number;
  iss: number;
}

const SN_DIST_SERVICOS: SNDist = {
  irpj: 0.06,
  csll: 0.035,
  pis: 0.0278,
  cofins: 0.1282,
  // biome-ignore lint/suspicious/noApproximativeNumericConstant: tax rate constant from Lei Complementar 123/2006 Anexo III
  cpp: 0.434,
  iss: 0.315,
};

const SN_DIST_COMERCIO: SNDist = {
  irpj: 0.055,
  csll: 0.035,
  pis: 0.0276,
  cofins: 0.1274,
  cpp: 0.415,
  iss: 0.34,
};

const SN_DIST_INDUSTRIA: SNDist = {
  irpj: 0.055,
  csll: 0.035,
  pis: 0.0249,
  cofins: 0.1151,
  cpp: 0.37,
  iss: 0.4,
};

function getSNBands(atividade: SimuladorInput["atividade"]): SNBand[] {
  if (atividade === "comercio") return SN_BANDS_COMERCIO;
  if (atividade === "industria") return SN_BANDS_INDUSTRIA;
  return SN_BANDS_SERVICOS;
}

function getSNDist(atividade: SimuladorInput["atividade"]): SNDist {
  if (atividade === "comercio") return SN_DIST_COMERCIO;
  if (atividade === "industria") return SN_DIST_INDUSTRIA;
  return SN_DIST_SERVICOS;
}

// ─── Calculation Functions ────────────────────────────────────────────────────

function calcularSimplesNacional(input: SimuladorInput): {
  calc: RegimeCalculo;
  elegivel: boolean;
} {
  const { faturamentoBrutoAnual: fat, atividade } = input;
  const SN_MAX = 4800000;
  const elegivel = fat > 0 && fat <= SN_MAX;

  if (!elegivel) {
    return {
      calc: {
        nome: "Simples Nacional",
        irpj: 0,
        csll: 0,
        pis: 0,
        cofins: 0,
        cpp: 0,
        iss: 0,
        total: 0,
        aliquotaEfetiva: 0,
      },
      elegivel: false,
    };
  }

  const bands = getSNBands(atividade);
  const band = bands.find((b) => fat <= b.max) ?? bands[bands.length - 1];
  // Effective rate = (RBT12 × Aliq - PD) / RBT12
  const effectiveRate = Math.max(0, (fat * band.aliq - band.pd) / fat);
  const das = fat * effectiveRate;
  const dist = getSNDist(atividade);

  return {
    calc: {
      nome: "Simples Nacional",
      irpj: das * dist.irpj,
      csll: das * dist.csll,
      pis: das * dist.pis,
      cofins: das * dist.cofins,
      cpp: das * dist.cpp,
      iss: das * dist.iss,
      total: das,
      aliquotaEfetiva: effectiveRate * 100,
    },
    elegivel: true,
  };
}

function calcularLucroPresumido(input: SimuladorInput): RegimeCalculo {
  const {
    faturamentoBrutoAnual: fat,
    folhaMensalTotal: folha,
    atividade,
  } = input;
  const folhaAnual = folha * 12;

  // Presumed profit base
  const baseIrpj = fat * (atividade === "servicos" ? 0.32 : 0.08);
  const baseCsll = fat * (atividade === "servicos" ? 0.32 : 0.12);

  const adicional = Math.max(0, baseIrpj - 240000);
  const irpj = baseIrpj * 0.15 + adicional * 0.1;
  const csll = baseCsll * 0.09;
  const pis = fat * 0.0065;
  const cofins = fat * 0.03;
  const cpp = folhaAnual * 0.2;
  // ISS only for services (ICMS is state-specific, excluded for commerce/industry)
  const iss = atividade === "servicos" ? fat * 0.05 : 0;

  const total = irpj + csll + pis + cofins + cpp + iss;
  return {
    nome: "Lucro Presumido",
    irpj,
    csll,
    pis,
    cofins,
    cpp,
    iss,
    total,
    aliquotaEfetiva: fat > 0 ? (total / fat) * 100 : 0,
  };
}

function calcularLucroReal(input: SimuladorInput): RegimeCalculo {
  const {
    faturamentoBrutoAnual: fat,
    folhaMensalTotal: folha,
    despesasDedutiveisAnual: desp,
    atividade,
  } = input;
  const folhaAnual = folha * 12;
  // Simplified: lucro = revenue - expenses - payroll
  const lucro = Math.max(0, fat - desp - folhaAnual);

  const adicional = Math.max(0, lucro - 240000);
  const irpj = lucro * 0.15 + adicional * 0.1;
  const csll = lucro * 0.09;
  // Non-cumulative PIS/COFINS
  const pis = fat * 0.0165;
  const cofins = fat * 0.076;
  const cpp = folhaAnual * 0.2;
  const iss = atividade === "servicos" ? fat * 0.05 : 0;

  const total = irpj + csll + pis + cofins + cpp + iss;
  return {
    nome: "Lucro Real",
    irpj,
    csll,
    pis,
    cofins,
    cpp,
    iss,
    total,
    aliquotaEfetiva: fat > 0 ? (total / fat) * 100 : 0,
  };
}

function gerarRecomendacaoTexto(
  sn: RegimeCalculo,
  lp: RegimeCalculo,
  lr: RegimeCalculo,
  recomendado: SimulacaoResult["recomendado"],
  economiaAnual: number,
  snElegivel: boolean,
): string {
  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
  const nomes = {
    simplesNacional: "Simples Nacional",
    lucroPresumido: "Lucro Presumido",
    lucroReal: "Lucro Real",
  };
  const totais = {
    simplesNacional: sn.total,
    lucroPresumido: lp.total,
    lucroReal: lr.total,
  };
  const worst = Object.entries(totais).sort((a, b) => b[1] - a[1])[0];
  const piorNome = nomes[worst[0] as keyof typeof nomes];
  const recomCalc =
    recomendado === "simplesNacional"
      ? sn
      : recomendado === "lucroPresumido"
        ? lp
        : lr;

  let t = "";
  if (!snElegivel)
    t += "Simples Nacional não disponível (faturamento > R$ 4.800.000/ano). ";
  t += `Com base nos dados informados, o ${nomes[recomendado]} é o regime mais vantajoso, `;
  t += `com carga tributária estimada de ${brl(recomCalc.total)}/ano `;
  t += `(alíquota efetiva ${recomCalc.aliquotaEfetiva.toFixed(1)}%). `;
  t += `Comparado ao ${piorNome}, a economia é de ${brl(economiaAnual)}/ano `;
  t += `(${brl(economiaAnual / 12)}/mês).`;
  if (recomendado === "simplesNacional")
    t +=
      " Simples Nacional simplifica a gestão com um único documento de arrecadação (DAS).";
  else if (recomendado === "lucroReal")
    t +=
      " Lucro Real é indicado quando despesas dedutíveis elevadas reduzem a base de cálculo.";
  else
    t +=
      " Lucro Presumido oferece previsibilidade com bases de cálculo fixas definidas pela Receita Federal.";
  return t;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function calcularRegimes(input: SimuladorInput): SimulacaoResult {
  const { calc: sn, elegivel: snElegivel } = calcularSimplesNacional(input);
  const lp = calcularLucroPresumido(input);
  const lr = calcularLucroReal(input);

  const candidates: Array<[SimulacaoResult["recomendado"], number]> = [];
  if (snElegivel) candidates.push(["simplesNacional", sn.total]);
  candidates.push(["lucroPresumido", lp.total]);
  candidates.push(["lucroReal", lr.total]);
  candidates.sort((a, b) => a[1] - b[1]);
  const recomendado = candidates[0][0];

  const allTotals = [snElegivel ? sn.total : 0, lp.total, lr.total].filter(
    (t) => t > 0,
  );
  const economiaAnual =
    allTotals.length > 1 ? Math.max(...allTotals) - Math.min(...allTotals) : 0;
  const economiaMensal = economiaAnual / 12;

  const recomendacaoTexto = gerarRecomendacaoTexto(
    sn,
    lp,
    lr,
    recomendado,
    economiaAnual,
    snElegivel,
  );

  return {
    input,
    simplesNacional: sn,
    lucroPresumido: lp,
    lucroReal: lr,
    recomendado,
    economiaMensal,
    economiaAnual,
    recomendacaoTexto,
    snElegivel,
  };
}

// ─── Export Helpers ───────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getRows(result: SimulacaoResult): [string, number, number, number][] {
  const { simplesNacional: sn, lucroPresumido: lp, lucroReal: lr } = result;
  return [
    ["IRPJ", sn.irpj, lp.irpj, lr.irpj],
    ["CSLL", sn.csll, lp.csll, lr.csll],
    ["PIS", sn.pis, lp.pis, lr.pis],
    ["COFINS", sn.cofins, lp.cofins, lr.cofins],
    ["CPP (Patronal)", sn.cpp, lp.cpp, lr.cpp],
    ["ISS/ICMS", sn.iss, lp.iss, lr.iss],
  ];
}

export function exportCSV(result: SimulacaoResult) {
  const { simplesNacional: sn, lucroPresumido: lp, lucroReal: lr } = result;
  const rows = [
    ["Componente", "Simples Nacional", "Lucro Presumido", "Lucro Real"],
    ...getRows(result).map(([label, a, b, c]) => [
      label,
      a.toFixed(2),
      b.toFixed(2),
      c.toFixed(2),
    ]),
    [
      "TOTAL ANUAL",
      sn.total.toFixed(2),
      lp.total.toFixed(2),
      lr.total.toFixed(2),
    ],
    [
      "Alíquota Efetiva",
      `${sn.aliquotaEfetiva.toFixed(2)}%`,
      `${lp.aliquotaEfetiva.toFixed(2)}%`,
      `${lr.aliquotaEfetiva.toFixed(2)}%`,
    ],
    [
      "Recomendado",
      result.recomendado === "simplesNacional" ? "SIM" : "",
      result.recomendado === "lucroPresumido" ? "SIM" : "",
      result.recomendado === "lucroReal" ? "SIM" : "",
    ],
    ["", "", "", ""],
    [
      "Faturamento Anual",
      result.input.faturamentoBrutoAnual.toFixed(2),
      "",
      "",
    ],
    ["Folha Mensal", result.input.folhaMensalTotal.toFixed(2), "", ""],
    [
      "Despesas Dedutíveis",
      result.input.despesasDedutiveisAnual.toFixed(2),
      "",
      "",
    ],
    ["Atividade", result.input.atividade, "", ""],
    ["Economia Anual", result.economiaAnual.toFixed(2), "", ""],
  ];
  const csv = rows.map((r) => r.join(";")).join("\n");
  downloadBlob(csv, "text/csv;charset=utf-8", "simulacao-tributaria.csv");
}

export function exportPDF(result: SimulacaoResult) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(generateHTML(result));
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 600);
}

export function exportWord(result: SimulacaoResult) {
  downloadBlob(
    generateHTML(result),
    "application/msword",
    "simulacao-tributaria.doc",
  );
}

export function exportExcel(result: SimulacaoResult) {
  exportCSV(result); // reuse CSV, rename to xlsx-like for Excel compatibility
}

function generateHTML(result: SimulacaoResult): string {
  const { simplesNacional: sn, lucroPresumido: lp, lucroReal: lr } = result;
  const nomes = {
    simplesNacional: "Simples Nacional",
    lucroPresumido: "Lucro Presumido",
    lucroReal: "Lucro Real",
  };
  const recSN = result.recomendado === "simplesNacional";
  const recLP = result.recomendado === "lucroPresumido";
  const recLR = result.recomendado === "lucroReal";
  const hl = (v: boolean) => (v ? "background:#d4edda;font-weight:bold;" : "");
  const rows = getRows(result);

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Simulação Tributária — ContaFácil ERP</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11pt;padding:30px;color:#1a1f24;}
  h1{font-size:18pt;color:#163A5A;margin-bottom:4px;}
  .sub{color:#666;font-size:9pt;margin-bottom:18px;}
  .info{margin:3px 0;font-size:10pt;}
  .aria{background:#e8f8f5;border:1px solid #00b09b;padding:14px;border-radius:6px;margin:18px 0;}
  .aria-label{font-weight:bold;color:#00b09b;margin-bottom:4px;}
  table{width:100%;border-collapse:collapse;margin-top:18px;font-size:10pt;}
  th{background:#163A5A;color:white;padding:8px 10px;text-align:left;}
  td{padding:6px 10px;border-bottom:1px solid #e0e0e0;}
  .total td{font-weight:bold;border-top:2px solid #163A5A;background:#f5f7fa;}
  .eco{margin-top:12px;color:#27ae60;font-weight:bold;}
  @media print{body{padding:10px;}}
</style></head><body>
<h1>Simulação de Regime Tributário</h1>
<p class="sub">ContaFácil ERP — ${new Date().toLocaleDateString("pt-BR")}${result.clientNome ? ` — Cliente: ${result.clientNome}` : ""}</p>
<div class="info"><b>Faturamento Anual:</b> ${fmtBRL(result.input.faturamentoBrutoAnual)}</div>
<div class="info"><b>Folha Mensal:</b> ${fmtBRL(result.input.folhaMensalTotal)}</div>
<div class="info"><b>Despesas Dedutíveis:</b> ${fmtBRL(result.input.despesasDedutiveisAnual)}</div>
<div class="info"><b>Atividade:</b> ${result.input.atividade.charAt(0).toUpperCase() + result.input.atividade.slice(1)}</div>
<div class="aria"><div class="aria-label">🤖 ARIA — Recomendação</div>
<p>${result.recomendacaoTexto}</p>
<p class="eco">Regime Recomendado: ${nomes[result.recomendado]} | Economia: ${fmtBRL(result.economiaAnual)}/ano</p></div>
<table><thead><tr>
  <th>Componente</th>
  <th style="${recSN ? "background:#27ae60;" : ""}">Simples Nacional${recSN ? " ✓" : ""}</th>
  <th style="${recLP ? "background:#27ae60;" : ""}">Lucro Presumido${recLP ? " ✓" : ""}</th>
  <th style="${recLR ? "background:#27ae60;" : ""}">Lucro Real${recLR ? " ✓" : ""}</th>
</tr></thead><tbody>
${rows.map(([label, a, b, c]) => `<tr><td>${label}</td><td style="${hl(recSN)}">${fmtBRL(a)}</td><td style="${hl(recLP)}">${fmtBRL(b)}</td><td style="${hl(recLR)}">${fmtBRL(c)}</td></tr>`).join("")}
<tr class="total"><td>TOTAL ANUAL</td><td style="${hl(recSN)}">${fmtBRL(sn.total)}</td><td style="${hl(recLP)}">${fmtBRL(lp.total)}</td><td style="${hl(recLR)}">${fmtBRL(lr.total)}</td></tr>
<tr><td>Alíquota Efetiva</td><td style="${hl(recSN)}">${sn.aliquotaEfetiva.toFixed(2)}%</td><td style="${hl(recLP)}">${lp.aliquotaEfetiva.toFixed(2)}%</td><td style="${hl(recLR)}">${lr.aliquotaEfetiva.toFixed(2)}%</td></tr>
</tbody></table>
<p style="margin-top:24px;font-size:8pt;color:#999;">Simulação estimativa para fins de planejamento. Consulte seu contador para decisões definitivas.</p>
</body></html>`;
}
