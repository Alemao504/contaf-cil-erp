// ARIA RULES — Tabelas Fiscais Brasileiras 2024/2025
// Fonte: Receita Federal do Brasil, MTE, FGTS

export const SALARIO_MINIMO = {
  2024: 1412.0,
  2025: 1518.0,
} as const;

export interface IRPFFaixa {
  limiteInferior: number;
  limiteSuperior: number | null;
  aliquota: number;
  deducao: number;
}

export const IRPF_TABELA_ANUAL_2024: IRPFFaixa[] = [
  { limiteInferior: 0, limiteSuperior: 24511.92, aliquota: 0, deducao: 0 },
  {
    limiteInferior: 24511.93,
    limiteSuperior: 33919.8,
    aliquota: 7.5,
    deducao: 1838.39,
  },
  {
    limiteInferior: 33919.81,
    limiteSuperior: 45012.6,
    aliquota: 15,
    deducao: 4382.38,
  },
  {
    limiteInferior: 45012.61,
    limiteSuperior: 55976.16,
    aliquota: 22.5,
    deducao: 7758.32,
  },
  {
    limiteInferior: 55976.17,
    limiteSuperior: null,
    aliquota: 27.5,
    deducao: 10557.13,
  },
];

export const IRPF_TABELA_MENSAL_2024: IRPFFaixa[] = [
  { limiteInferior: 0, limiteSuperior: 2259.2, aliquota: 0, deducao: 0 },
  {
    limiteInferior: 2259.21,
    limiteSuperior: 2826.65,
    aliquota: 7.5,
    deducao: 169.44,
  },
  {
    limiteInferior: 2826.66,
    limiteSuperior: 3751.05,
    aliquota: 15,
    deducao: 381.44,
  },
  {
    limiteInferior: 3751.06,
    limiteSuperior: 4664.68,
    aliquota: 22.5,
    deducao: 662.77,
  },
  {
    limiteInferior: 4664.69,
    limiteSuperior: null,
    aliquota: 27.5,
    deducao: 896.0,
  },
];

export const IRPF_DEDUCOES = {
  dependenteAnual: 2275.08,
  dependenteMensal: 189.59,
  educacaoAnualLimite: 3561.5,
  previdenciaOficial: "integral",
  previdenciaPrivadaLimite: 0.12,
} as const;

export interface INSSFaixa {
  limiteInferior: number;
  limiteSuperior: number | null;
  aliquota: number;
}

export const INSS_TABELA_2024: INSSFaixa[] = [
  { limiteInferior: 0, limiteSuperior: 1412.0, aliquota: 7.5 },
  { limiteInferior: 1412.01, limiteSuperior: 2666.68, aliquota: 9.0 },
  { limiteInferior: 2666.69, limiteSuperior: 4000.03, aliquota: 12.0 },
  { limiteInferior: 4000.04, limiteSuperior: 7786.02, aliquota: 14.0 },
];

export const INSS_TETO_2024 = 7786.02;
export const INSS_TETO_CONTRIBUICAO_2024 = 908.86;

export const FGTS = {
  aliquotaEmpregado: 0.08,
  aliquotaDomestico: 0.08,
  aliquotaMultaRescisao: 0.4,
  aliquotaMultaRescisaoGoverno: 0.1,
  diaVencimento: 7,
} as const;

export interface SimplesNacionalFaixa {
  limiteInferior: number;
  limiteSuperior: number;
  aliquotaNominal: number;
  valorADescontar: number;
}

export const SIMPLES_ANEXO_I: SimplesNacionalFaixa[] = [
  {
    limiteInferior: 0,
    limiteSuperior: 180000,
    aliquotaNominal: 4.0,
    valorADescontar: 0,
  },
  {
    limiteInferior: 180000.01,
    limiteSuperior: 360000,
    aliquotaNominal: 7.3,
    valorADescontar: 5940,
  },
  {
    limiteInferior: 360000.01,
    limiteSuperior: 720000,
    aliquotaNominal: 9.5,
    valorADescontar: 13860,
  },
  {
    limiteInferior: 720000.01,
    limiteSuperior: 1800000,
    aliquotaNominal: 10.7,
    valorADescontar: 22500,
  },
  {
    limiteInferior: 1800000.01,
    limiteSuperior: 3600000,
    aliquotaNominal: 14.3,
    valorADescontar: 87300,
  },
  {
    limiteInferior: 3600000.01,
    limiteSuperior: 4800000,
    aliquotaNominal: 19.0,
    valorADescontar: 378000,
  },
];

export const SIMPLES_ANEXO_II: SimplesNacionalFaixa[] = [
  {
    limiteInferior: 0,
    limiteSuperior: 180000,
    aliquotaNominal: 4.5,
    valorADescontar: 0,
  },
  {
    limiteInferior: 180000.01,
    limiteSuperior: 360000,
    aliquotaNominal: 7.8,
    valorADescontar: 5940,
  },
  {
    limiteInferior: 360000.01,
    limiteSuperior: 720000,
    aliquotaNominal: 10.0,
    valorADescontar: 13860,
  },
  {
    limiteInferior: 720000.01,
    limiteSuperior: 1800000,
    aliquotaNominal: 11.2,
    valorADescontar: 22500,
  },
  {
    limiteInferior: 1800000.01,
    limiteSuperior: 3600000,
    aliquotaNominal: 14.7,
    valorADescontar: 85500,
  },
  {
    limiteInferior: 3600000.01,
    limiteSuperior: 4800000,
    aliquotaNominal: 30.0,
    valorADescontar: 720000,
  },
];

export const SIMPLES_ANEXO_III: SimplesNacionalFaixa[] = [
  {
    limiteInferior: 0,
    limiteSuperior: 180000,
    aliquotaNominal: 6.0,
    valorADescontar: 0,
  },
  {
    limiteInferior: 180000.01,
    limiteSuperior: 360000,
    aliquotaNominal: 11.2,
    valorADescontar: 9360,
  },
  {
    limiteInferior: 360000.01,
    limiteSuperior: 720000,
    aliquotaNominal: 13.5,
    valorADescontar: 17640,
  },
  {
    limiteInferior: 720000.01,
    limiteSuperior: 1800000,
    aliquotaNominal: 16.0,
    valorADescontar: 35640,
  },
  {
    limiteInferior: 1800000.01,
    limiteSuperior: 3600000,
    aliquotaNominal: 21.0,
    valorADescontar: 125640,
  },
  {
    limiteInferior: 3600000.01,
    limiteSuperior: 4800000,
    aliquotaNominal: 33.0,
    valorADescontar: 648000,
  },
];

export const SIMPLES_ANEXO_IV: SimplesNacionalFaixa[] = [
  {
    limiteInferior: 0,
    limiteSuperior: 180000,
    aliquotaNominal: 4.5,
    valorADescontar: 0,
  },
  {
    limiteInferior: 180000.01,
    limiteSuperior: 360000,
    aliquotaNominal: 9.0,
    valorADescontar: 8100,
  },
  {
    limiteInferior: 360000.01,
    limiteSuperior: 720000,
    aliquotaNominal: 10.2,
    valorADescontar: 12420,
  },
  {
    limiteInferior: 720000.01,
    limiteSuperior: 1800000,
    aliquotaNominal: 14.0,
    valorADescontar: 39780,
  },
  {
    limiteInferior: 1800000.01,
    limiteSuperior: 3600000,
    aliquotaNominal: 22.0,
    valorADescontar: 183780,
  },
  {
    limiteInferior: 3600000.01,
    limiteSuperior: 4800000,
    aliquotaNominal: 33.0,
    valorADescontar: 828000,
  },
];

export const SIMPLES_ANEXO_V: SimplesNacionalFaixa[] = [
  {
    limiteInferior: 0,
    limiteSuperior: 180000,
    aliquotaNominal: 15.5,
    valorADescontar: 0,
  },
  {
    limiteInferior: 180000.01,
    limiteSuperior: 360000,
    aliquotaNominal: 18.0,
    valorADescontar: 4500,
  },
  {
    limiteInferior: 360000.01,
    limiteSuperior: 720000,
    aliquotaNominal: 19.5,
    valorADescontar: 9900,
  },
  {
    limiteInferior: 720000.01,
    limiteSuperior: 1800000,
    aliquotaNominal: 20.5,
    valorADescontar: 17100,
  },
  {
    limiteInferior: 1800000.01,
    limiteSuperior: 3600000,
    aliquotaNominal: 23.0,
    valorADescontar: 62100,
  },
  {
    limiteInferior: 3600000.01,
    limiteSuperior: 4800000,
    aliquotaNominal: 30.5,
    valorADescontar: 540000,
  },
];

export type SimplesAnexo = "I" | "II" | "III" | "IV" | "V";

export const SIMPLES_ANEXOS: Record<SimplesAnexo, SimplesNacionalFaixa[]> = {
  I: SIMPLES_ANEXO_I,
  II: SIMPLES_ANEXO_II,
  III: SIMPLES_ANEXO_III,
  IV: SIMPLES_ANEXO_IV,
  V: SIMPLES_ANEXO_V,
};

export const LUCRO_PRESUMIDO_PERCENTUAIS = {
  comercio: { irpj: 0.08, csll: 0.12 },
  industria: { irpj: 0.08, csll: 0.12 },
  servicos: { irpj: 0.32, csll: 0.32 },
  servicosHospitalar: { irpj: 0.08, csll: 0.12 },
  transporteCarga: { irpj: 0.08, csll: 0.12 },
  transportePassageiro: { irpj: 0.16, csll: 0.12 },
  construcaoCivil: { irpj: 0.08, csll: 0.12 },
  revendaGasolina: { irpj: 0.016, csll: 0.12 },
} as const;

export const IRPJ = {
  aliquota: 0.15,
  adicional: 0.1,
  limiteAdicional: 20000,
  limiteAdicionalAnual: 240000,
} as const;

export const CSLL = {
  aliquotaGeral: 0.09,
  aliquotaFinanceiras: 0.15,
} as const;

export const PIS_COFINS = {
  cumulativo: { pis: 0.0065, cofins: 0.03 },
  naoCumulativo: { pis: 0.0165, cofins: 0.076 },
} as const;

export function calcularIRPFAnual(baseCalculo: number): number {
  const faixa = IRPF_TABELA_ANUAL_2024.find(
    (f) =>
      baseCalculo >= f.limiteInferior &&
      (f.limiteSuperior === null || baseCalculo <= f.limiteSuperior),
  );
  if (!faixa || faixa.aliquota === 0) return 0;
  return (baseCalculo * faixa.aliquota) / 100 - faixa.deducao;
}

export function calcularINSS(salarioBruto: number): number {
  let contribuicao = 0;
  let baseRestante = Math.min(salarioBruto, INSS_TETO_2024);
  let limiteAnterior = 0;
  for (const faixa of INSS_TABELA_2024) {
    if (baseRestante <= 0) break;
    const teto = faixa.limiteSuperior ?? INSS_TETO_2024;
    const baseNaFaixa = Math.min(baseRestante, teto - limiteAnterior);
    contribuicao += baseNaFaixa * (faixa.aliquota / 100);
    baseRestante -= baseNaFaixa;
    limiteAnterior = teto;
  }
  return Math.min(contribuicao, INSS_TETO_CONTRIBUICAO_2024);
}

export function calcularSimplesNacional(
  receita12Meses: number,
  receitaMes: number,
  anexo: SimplesAnexo,
): number {
  const tabela = SIMPLES_ANEXOS[anexo];
  const faixa = tabela.find(
    (f) =>
      receita12Meses >= f.limiteInferior && receita12Meses <= f.limiteSuperior,
  );
  if (!faixa) return 0;
  const aliquotaEfetiva =
    (receita12Meses * (faixa.aliquotaNominal / 100) - faixa.valorADescontar) /
    receita12Meses;
  return receitaMes * aliquotaEfetiva;
}
