import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatedValue } from "./AnimatedValue";
import { MonthlyTable } from "./MonthlyTable";
import { NumberField } from "./NumberField";
import { ParamsPanel } from "./ParamsPanel";
import { RegimeCard } from "./RegimeCard";
import { RegularizacaoControl, useRegularizacao } from "./RegularizacaoControl";
import logoResilcon from "@/assets/resilcon-horizontal.png.asset.json";
import {
  atualizarCelulaMensal,
  atualizarEmpresa,
  atualizarParametro,
  parametrosDaEmpresa,
  type Empresa,
} from "@/lib/store";
import {
  brl,
  calcular,
  calcularPorPercentual,
  pct,
  type MesInput,
  type Parametros,
} from "@/lib/tax-model";

const CHAVES = ["lucroReal", "lucroPresumido", "simples"] as const;
const NOMES = {
  lucroReal: "Lucro Real",
  lucroPresumido: "Lucro Presumido",
  simples: "Simples Nacional",
} as const;

export function PainelEmpresa({
  empresa,
  voltarPara,
  voltarLabel,
  contexto,
}: {
  empresa: Empresa;
  voltarPara: string;
  voltarLabel: string;
  contexto?: string;
}) {
  const [aba, setAba] = useState<"mensal" | "premissas">("mensal");
  const [regimeAtual, setRegimeAtual] = useState<(typeof CHAVES)[number]>("simples");

  const meses = empresa.meses;
  const compras = empresa.compras;
  const params = useMemo(() => parametrosDaEmpresa(empresa), [empresa]);

  const usaPct = Boolean(empresa.grupoId) && empresa.faturamentoRealAnual > 0;
  const { pct: pctReg, alterar } = useRegularizacao(empresa);

  const r = useMemo(
    () =>
      usaPct
        ? calcularPorPercentual(
            {
              faturamentoRealAnual: empresa.faturamentoRealAnual,
              pctRegularizacao: pctReg,
              meses,
            },
            params,
          )
        : calcular(meses, compras, params),
    [meses, compras, params, usaPct, pctReg, empresa.faturamentoRealAnual],
  );
  const diferenca = r.cargaPorRegime[regimeAtual] - r.cargaPorRegime[r.melhor];

  const economia = useMemo(() => {
    const ordenado = CHAVES.map((k) => ({ chave: k, carga: r.cargaPorRegime[k] })).sort(
      (a, b) => a.carga - b.carga,
    );
    const vencedor = ordenado[0];
    const segundo = ordenado[1];
    if (!vencedor || !segundo || segundo.carga <= vencedor.carga) return undefined;
    return {
      valor: segundo.carga - vencedor.carga,
      nomeSegundo: NOMES[segundo.chave],
    };
  }, [r]);

  const atualizarMes = (i: number, key: keyof MesInput, v: number) => {
    const m = meses[i];
    if (!m || key === "mes") return;
    atualizarCelulaMensal(empresa.id, m.mes, key, v);
  };

  const atualizarParam = (key: keyof Parametros, v: number) =>
    atualizarParametro(empresa.id, key, v);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-6 py-8">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <img
                src={logoResilcon.url}
                alt="Resilcon Contabilidade Consultiva"
                className="h-10 w-auto sm:h-12"
              />
              <Link
                to={voltarPara}
                className="inline-flex items-center gap-1.5 rounded-full border border-petrol/25 bg-petrol-soft/70 px-3 py-1.5 text-xs font-semibold text-petrol shadow-sm hover:border-petrol/50 hover:bg-petrol hover:text-white"
              >
                <span aria-hidden="true">&larr;</span> {voltarLabel}
              </Link>
            </div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-teal uppercase">
              {contexto ?? "Planilha comparativa tributaria - 2026"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">{empresa.nome}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Comparacao anual entre Lucro Real, Lucro Presumido e Simples Nacional a partir da
              tabela mensal da empresa. Tudo recalcula em tempo real e fica salvo.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                Receita bruta
              </dt>
              <dd className="num text-lg font-semibold text-ink">{brl(r.totais.receitaBruta)}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                Compras
              </dt>
              <dd className="num text-lg font-semibold text-ink">{brl(compras)}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                FOPAG
              </dt>
              <dd className="num text-lg font-semibold text-ink">{brl(r.totais.fopag)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section aria-labelledby="placar" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="placar" className="text-xl font-semibold text-ink">
              Placar dos regimes
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="atual" className="text-muted-foreground">
                Regime atual
              </label>
              <select
                id="atual"
                value={regimeAtual}
                onChange={(e) => setRegimeAtual(e.target.value as (typeof CHAVES)[number])}
                className="rounded-md border border-line bg-card px-2 py-1.5 text-sm"
              >
                {CHAVES.map((k) => (
                  <option key={k} value={k}>
                    {NOMES[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card-panel flex flex-wrap items-center justify-between gap-6 overflow-hidden border-win/60 p-0 shadow-[var(--shadow-win)] ring-2 ring-win/35">
            <div className="flex w-full flex-wrap items-center justify-between gap-6 border-l-[6px] border-win bg-win-soft/60 p-7">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-win-deep uppercase">
                  Regime mais vantajoso
                </p>
                <p className="font-display mt-1 text-4xl font-semibold text-win-deep">
                  {NOMES[r.melhor]}
                </p>
                <p className="num mt-1 text-sm text-muted-foreground">
                  Carga anual de {brl(r[r.melhor].carga)}
                </p>
                {usaPct ? (
                  <div className="mt-4">
                    <p className="num text-sm text-muted-foreground">
                      Receita bruta considerada{" "}
                      <span className="font-semibold text-ink">{brl(r.totais.receitaBruta)}</span>
                    </p>
                    <div className="mt-2">
                      <RegularizacaoControl
                        pct={pctReg}
                        onChange={alterar}
                        nomeEmpresa={empresa.nome}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Economia frente ao regime atual ({NOMES[regimeAtual]})
                </p>
                <AnimatedValue
                  value={Math.max(0, diferenca)}
                  format={brl}
                  className="num font-display mt-1 block text-4xl font-semibold text-win-deep"
                />
                <p className="num text-xs text-muted-foreground">
                  {r.totais.receitaBruta
                    ? `${pct(Math.max(0, diferenca) / r.totais.receitaBruta)} da receita bruta`
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <RegimeCard
              regime={r.lucroReal}
              vencedor={r.melhor === "lucroReal"}
              receitaBruta={r.totais.receitaBruta}
              economia={r.melhor === "lucroReal" ? economia : undefined}
            />
            <RegimeCard
              regime={r.lucroPresumido}
              vencedor={r.melhor === "lucroPresumido"}
              receitaBruta={r.totais.receitaBruta}
              nota="O ICMS e o credito de ICMS sao os mesmos apurados no Lucro Real."
              economia={r.melhor === "lucroPresumido" ? economia : undefined}
            />
            <RegimeCard
              regime={r.simples}
              vencedor={r.melhor === "simples"}
              receitaBruta={r.totais.receitaBruta}
              nota={`Faixa de RBT12 de ${brl(r.simples.faixaDe)} a ${brl(
                r.simples.faixaAte,
              )} - aliquota efetiva de ${pct(r.simples.aliquotaEfetiva)} (Anexo ${params.anexo}).`}
              economia={r.melhor === "simples" ? economia : undefined}
            />
          </div>

          {Math.abs(r.simples.dasPago - r.simples.dasDevido) > 0.01 ? (
            <p className="rounded-xl border border-line bg-card p-4 text-sm text-muted-foreground">
              DAS pago <span className="num font-medium text-ink">{brl(r.simples.dasPago)}</span> -
              DAS devido{" "}
              <span className="num font-medium text-ink">{brl(r.simples.dasDevido)}</span> -
              diferenca{" "}
              <span className="num font-medium text-ink">
                {brl(r.simples.dasPago - r.simples.dasDevido)}
              </span>
              .
            </p>
          ) : null}
        </section>

        <section aria-labelledby="dados" className="card-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 id="dados" className="text-lg font-semibold text-ink">
              Dados de entrada
            </h2>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(
                [
                  ["mensal", "Tabela mensal"],
                  ["premissas", "Premissas e aliquotas"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAba(k)}
                  aria-pressed={aba === k}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    aba === k
                      ? "bg-card text-petrol shadow-sm"
                      : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            {aba === "mensal" ? (
              <MonthlyTable
                meses={meses}
                onChange={atualizarMes}
                totais={r.totais}
                fonteSimples={params.fonteSimples}
                onFonteChange={(f) => atualizarParametro(empresa.id, "fonteSimples", f)}
              />
            ) : (
              <ParamsPanel
                params={params}
                onChange={atualizarParam}
                compras={compras}
                onComprasChange={(v) => atualizarEmpresa(empresa.id, { compras: v })}
              />
            )}
          </div>
        </section>

        <section aria-labelledby="anuais" className="card-panel p-6">
          <h2 id="anuais" className="text-lg font-semibold text-ink">
            Numeros anuais para o Resumo do grupo
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Estes tres valores sao do historico ja declarado e servem apenas ao relatorio Resumo
            do grupo. Eles nao entram em nenhuma conta de imposto e nao mudam a comparacao de
            regimes desta empresa.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {(
              [
                ["faturamentoRealAnual", "Faturamento real anual"],
                ["faturamentoDeclaradoAnual", "Faturamento declarado anual"],
                ["dasAtualAnual", "DAS atual anual"],
              ] as const
            ).map(([campo, label]) => (
              <label key={campo} className="block">
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {label}
                </span>
                <div className="mt-1.5">
                  <NumberField
                    ariaLabel={`${label} de ${empresa.nome}`}
                    value={empresa[campo]}
                    onChange={(v) => atualizarEmpresa(empresa.id, { [campo]: v })}
                    prefix="R$"
                  />
                </div>
              </label>
            ))}
          </div>
        </section>

        <footer className="pb-6 text-xs leading-relaxed text-muted-foreground">
          Os percentuais de CMV, BC de ICMS, encargos e despesas sao premissas da empresa e podem
          ser editados por empresa. Simulacao para apoio a decisao, nao substitui parecer contabil.
        </footer>
      </div>
    </main>
  );
}
