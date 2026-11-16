import { faixaPara, type AnexoKey } from "./simples-table";

export interface MesInput {
  mes: string;
  vendas: number;
  servicos: number;
  bcIcms: number;
  bcMonofasico: number;
  fopag: number;
  proLabore: number;
  das: number;
  dasDevido: number;
}

export type FonteSimples = "pago" | "devido";

export interface Parametros {
  pctNaoMonofasico: number;
  pctBcIcms: number;
  aliqIcms: number;
  pisNaoCumulativo: number;
  cofinsNaoCumulativo: number;
  pisCumulativo: number;
  cofinsCumulativo: number;
  aliqIpi: number;
  aliqIss: number;
  pctCmv: number;
  pctEncargos: number;
  pctDespesasOperacionais: number;
  aliqCsll: number;
  aliqIrpj: number;
  aliqAdicionalIr: number;
  mesesLimiteAdicional: number;
  baseLimiteAdicionalMensal: number;
  presuncaoIrpj: number;
  presuncaoCsll: number;
  pctFopagAdicional: number;
  presuncaoCsllServicos: number;
  presuncaoIrpjServicos?: number;
  anexo: AnexoKey;
  fonteSimples: FonteSimples;
}

export const PARAMETROS_PADRAO: Parametros = {
  pctNaoMonofasico: 0.35,
  pctBcIcms: 0.8641,
  aliqIcms: 0.18,
  pisNaoCumulativo: 0.0165,
  cofinsNaoCumulativo: 0.076,
  pisCumulativo: 0.0065,
  cofinsCumulativo: 0.03,
  aliqIpi: 0,
  aliqIss: 0,
  pctCmv: 0.633,
  pctEncargos: 0.348,
  pctDespesasOperacionais: 0.15,
  aliqCsll: 0.09,
  aliqIrpj: 0.15,
  aliqAdicionalIr: 0.1,
  mesesLimiteAdicional: 6,
  baseLimiteAdicionalMensal: 20000,
  presuncaoIrpj: 0.08,
  presuncaoCsll: 0.12,
  pctFopagAdicional: 0,
  presuncaoCsllServicos: 0,
  anexo: "I",
  fonteSimples: "pago",
};

export const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const z = (mes: string): MesInput => ({
  mes, vendas: 0, servicos: 0, bcIcms: 0, bcMonofasico: 0, fopag: 0, proLabore: 0, das: 0, dasDevido: 0,
});

export const MESES_PADRAO: MesInput[] = [
  { mes: "Janeiro", vendas: 265033.78, servicos: 0, bcIcms: 94401.15, bcMonofasico: 147366.83, fopag: 29401.21, proLabore: 0, das: 24015.08, dasDevido: 24015.08 },
  { mes: "Fevereiro", vendas: 241851.23, servicos: 0, bcIcms: 75730.7, bcMonofasico: 130650.66, fopag: 27476.71, proLabore: 0, das: 24373.47, dasDevido: 24373.47 },
  { mes: "Março", vendas: 253536.57, servicos: 0, bcIcms: 87405.33, bcMonofasico: 142021.66, fopag: 26922.75, proLabore: 0, das: 26228.28, dasDevido: 26228.28 },
  { mes: "Abril", vendas: 251501.72, servicos: 0, bcIcms: 86804.47, bcMonofasico: 145043.68, fopag: 27560.31, proLabore: 0, das: 28066.25, dasDevido: 28066.25 },
  { mes: "Maio", vendas: 293234.05, servicos: 0, bcIcms: 110621.86, bcMonofasico: 164360.8, fopag: 27274.31, proLabore: 0, das: 20176.01, dasDevido: 20176.01 },
  { mes: "Junho", vendas: 262818.96, servicos: 0, bcIcms: 227094.16, bcMonofasico: 100257.22, fopag: 28428.83, proLabore: 0, das: 31822.86, dasDevido: 31822.86 },
  ...MESES.slice(6).map(z),
];

export const COMPRAS_PADRAO = 840336.33;

export interface Totais {
  vendas: number;
  servicos: number;
  receitaBruta: number;
  bcIcms: number;
  bcMonofasico: number;
  fopag: number;
  proLabore: number;
  das: number;
  dasDevido: number;
}

export function somarMeses(meses: MesInput[]): Totais {
  const s = (k: keyof MesInput) => meses.reduce((a, m) => a + (Number(m[k]) || 0), 0);
  const vendas = s("vendas");
  const servicos = s("servicos");
  return {
    vendas, servicos, receitaBruta: vendas + servicos,
    bcIcms: s("bcIcms"), bcMonofasico: s("bcMonofasico"),
    fopag: s("fopag"), proLabore: s("proLabore"),
    das: s("das"), dasDevido: s("dasDevido"),
  };
}

export interface LinhaImposto {
  rotulo: string;
  valor: number;
  credito?: boolean;
}

export interface ResultadoRegime {
  nome: string;
  carga: number;
  linhas: LinhaImposto[];
  extras: { rotulo: string; valor: number; formato?: "moeda" | "percentual" }[];
}

export interface Resultado {
  totais: Totais;
  lucroReal: ResultadoRegime;
  lucroPresumido: ResultadoRegime;
  simples: ResultadoRegime & {
    aliquotaEfetiva: number;
    faixaDe: number;
    faixaAte: number;
    dasDevido: number;
    dasPago: number;
  };
  melhor: "lucroReal" | "lucroPresumido" | "simples";
  cargaPorRegime: Record<"lucroReal" | "lucroPresumido" | "simples", number>;
}

export const INSS_PRO_LABORE = 0.2;

export function apurar(
  rb: number,
  vendas: number,
  fopag: number,
  p: Parametros,
  proLabore = 0,
  servicos = 0,
) {
  const baseNaoMono = rb * p.pctNaoMonofasico;
  const baseIcms = vendas * p.pctBcIcms;
  const cmv = rb * p.pctCmv;
  const fopagExtra = fopag * (p.pctFopagAdicional ?? 0);
  const encargos = (fopag + fopagExtra) * p.pctEncargos + proLabore * INSS_PRO_LABORE;
  const despesasOperacionais = rb * p.pctDespesasOperacionais;

  const icms = baseIcms * p.aliqIcms;
  const pis = baseNaoMono * p.pisNaoCumulativo;
  const cofins = baseNaoMono * p.cofinsNaoCumulativo;
  const ipi = rb * p.aliqIpi;
  const iss = servicos * p.aliqIss;

  const credIcms = cmv * p.pctBcIcms * p.aliqIcms;
  const credIpi = cmv * p.pctNaoMonofasico * p.aliqIpi;
  const credPis = cmv * p.pctNaoMonofasico * p.pisNaoCumulativo;
  const credCofins = cmv * p.pctNaoMonofasico * p.cofinsNaoCumulativo;
  const creditos = credIcms + credIpi + credPis + credCofins;

  const receitaLiquida = rb - icms - pis - cofins - ipi - iss + creditos;
  const margemBruta = receitaLiquida - cmv;
  const lucroLiquido = margemBruta - fopag - fopagExtra - encargos - despesasOperacionais;

  const limiteAdicional = p.baseLimiteAdicionalMensal * p.mesesLimiteAdicional;
  const csll = lucroLiquido > 0 ? lucroLiquido * p.aliqCsll : 0;
  const irpj = lucroLiquido > 0 ? lucroLiquido * p.aliqIrpj : 0;
  const adicional =
    lucroLiquido > limiteAdicional ? (lucroLiquido - limiteAdicional) * p.aliqAdicionalIr : 0;

  const cargaReal = icms + pis + cofins + ipi + iss + encargos + csll + irpj + adicional - creditos;

  const pisP = baseNaoMono * p.pisCumulativo;
  const cofinsP = baseNaoMono * p.cofinsCumulativo;
  const receitaLiquidaP = rb - icms - pisP - cofinsP - ipi - iss + credIcms;
  const margemBrutaP = receitaLiquidaP - cmv;
  const lucroContabilP = margemBrutaP - fopag - fopagExtra - encargos - despesasOperacionais;

  const baseCsllP =
    vendas > 0
      ? vendas * p.presuncaoCsll + servicos * (p.presuncaoCsllServicos ?? 0)
      : rb * p.presuncaoCsll;
  const presIrpjServ = p.presuncaoIrpjServicos ?? p.presuncaoIrpj;
  const baseIrpjP = vendas * p.presuncaoIrpj + servicos * presIrpjServ;
  const csllP = baseCsllP * p.aliqCsll;
  const irpjP = baseIrpjP * p.aliqIrpj;
  const adicionalP =
    baseIrpjP > limiteAdicional ? (baseIrpjP - limiteAdicional) * p.aliqAdicionalIr : 0;

  const cargaPresumido =
    icms - credIcms + pisP + cofinsP + ipi + iss + encargos + csllP + irpjP + adicionalP;

  return {
    cmv, encargos, despesasOperacionais, icms, pis, cofins, ipi, iss,
    credIcms, credIpi, credPis, credCofins, creditos,
    receitaLiquida, margemBruta, lucroLiquido, csll, irpj, adicional, cargaReal,
    pisP, cofinsP, receitaLiquidaP, margemBrutaP, lucroContabilP,
    baseCsllP, baseIrpjP, csllP, irpjP, adicionalP, cargaPresumido,
  };
}

export function montarResultado(
  t: Totais,
  p: Parametros,
  simplesPelaTabela = false,
): Resultado {
  const rb = t.receitaBruta;
  const fopag = t.fopag;
  const a = apurar(rb, t.vendas, fopag, p, t.proLabore, t.servicos);

  const {
    cmv, encargos, icms, pis, cofins, ipi, iss,
    credIcms, credIpi, credPis, credCofins,
    receitaLiquida, margemBruta, lucroLiquido, csll, irpj, adicional, cargaReal,
    pisP, cofinsP, receitaLiquidaP, margemBrutaP, lucroContabilP,
    baseCsllP, baseIrpjP, csllP, irpjP, adicionalP, cargaPresumido,
  } = a;

  const faixa = faixaPara(rb, p.anexo);
  const dasTabela = rb * faixa.aliquota;
  const dasPago = t.das;
  const dasInformado = t.dasDevido;
  const dasDevido = dasInformado;
  const cargaSimples = simplesPelaTabela
    ? dasTabela
    : p.fonteSimples === "pago"
      ? dasPago
      : dasInformado;

  const cargaPorRegime = {
    lucroReal: cargaReal,
    lucroPresumido: cargaPresumido,
    simples: cargaSimples,
  };
  const melhor = (Object.keys(cargaPorRegime) as (keyof typeof cargaPorRegime)[]).reduce((x, y) =>
    cargaPorRegime[x] <= cargaPorRegime[y] ? x : y,
  );

  return {
    totais: t,
    lucroReal: {
      nome: "Lucro Real",
      carga: cargaReal,
      linhas: [
        { rotulo: "ICMS", valor: icms },
        { rotulo: "Credito de ICMS sobre compras", valor: credIcms, credito: true },
        { rotulo: "PIS nao-cumulativo", valor: pis },
        { rotulo: "Credito de PIS", valor: credPis, credito: true },
        { rotulo: "COFINS nao-cumulativo", valor: cofins },
        { rotulo: "Credito de COFINS", valor: credCofins, credito: true },
        { rotulo: "IPI", valor: ipi },
        { rotulo: "Credito de IPI", valor: credIpi, credito: true },
        { rotulo: "ISS", valor: iss },
        { rotulo: "IRPJ (15%)", valor: irpj },
        { rotulo: "Adicional de IR (10%)", valor: adicional },
        { rotulo: "CSLL (9%)", valor: csll },
        { rotulo: "Encargos sobre a folha", valor: encargos },
      ],
      extras: [
        { rotulo: "Receita liquida", valor: receitaLiquida },
        { rotulo: "CMV estimado", valor: cmv },
        { rotulo: "Margem bruta", valor: margemBruta },
        { rotulo: "Lucro antes de IR/CSLL", valor: lucroLiquido },
        { rotulo: "Carga sobre a receita", valor: rb ? cargaReal / rb : 0, formato: "percentual" },
      ],
    },
    lucroPresumido: {
      nome: "Lucro Presumido",
      carga: cargaPresumido,
      linhas: [
        { rotulo: "ICMS", valor: icms },
        { rotulo: "Credito de ICMS sobre compras", valor: credIcms, credito: true },
        { rotulo: "PIS cumulativo", valor: pisP },
        { rotulo: "COFINS cumulativo", valor: cofinsP },
        { rotulo: "IPI", valor: ipi },
        { rotulo: "ISS", valor: iss },
        { rotulo: "IRPJ (15% sobre presuncao)", valor: irpjP },
        { rotulo: "Adicional de IR (10%)", valor: adicionalP },
        { rotulo: "CSLL (9% sobre presuncao)", valor: csllP },
        { rotulo: "Encargos sobre a folha", valor: encargos },
      ],
      extras: [
        { rotulo: "Base presumida IRPJ (8%)", valor: baseIrpjP },
        { rotulo: "Base presumida CSLL (12%)", valor: baseCsllP },
        { rotulo: "Receita liquida", valor: receitaLiquidaP },
        { rotulo: "Margem bruta", valor: margemBrutaP },
        { rotulo: "Lucro contabil estimado", valor: lucroContabilP },
        { rotulo: "Carga sobre a receita", valor: rb ? cargaPresumido / rb : 0, formato: "percentual" as const },
      ],
    },
    simples: {
      nome: "Simples Nacional",
      carga: cargaSimples,
      aliquotaEfetiva: faixa.aliquota,
      faixaDe: faixa.de,
      faixaAte: faixa.ate,
      dasDevido,
      dasPago,
      linhas: simplesPelaTabela
        ? [{ rotulo: "DAS pela aliquota efetiva do Anexo", valor: dasTabela }]
        : [
            { rotulo: "Referencia: DAS pela tabela do Anexo (informativo)", valor: dasTabela },
            { rotulo: "DAS devido informado", valor: dasInformado },
            { rotulo: "DAS efetivamente pago", valor: dasPago },
            { rotulo: "Diferenca (pago menos devido)", valor: dasPago - dasDevido },
          ],
      extras: [
        { rotulo: "Aliquota efetiva da faixa", valor: faixa.aliquota, formato: "percentual" },
        { rotulo: "RBT12 considerado", valor: rb },
        { rotulo: "Carga sobre a receita", valor: rb ? cargaSimples / rb : 0, formato: "percentual" as const },
      ],
    },
    melhor,
    cargaPorRegime,
  };
}

export function calcular(meses: MesInput[], _compras: number, p: Parametros): Resultado {
  return montarResultado(somarMeses(meses), p);
}

export interface EmpresaPercentual {
  faturamentoRealAnual: number;
  pctRegularizacao: number;
  meses: MesInput[];
}

export function calcularPorPercentual(e: EmpresaPercentual, p: Parametros): Resultado {
  const base = somarMeses(e.meses);
  const rb = e.faturamentoRealAnual * e.pctRegularizacao;
  return montarResultado({ ...base, vendas: rb, servicos: 0, receitaBruta: rb }, p);
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export const pct = (v: number) =>
  (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + "%";
