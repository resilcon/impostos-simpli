import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { RegimeCard } from "./RegimeCard";
import { RegularizacaoControl, useRegularizacao } from "./RegularizacaoControl";
import { parametrosDaEmpresa, type Empresa } from "@/lib/store";
import { brl, calcular, calcularPorPercentual, pct } from "@/lib/tax-model";

export interface LinhaGrupo {
  empresa: Empresa;
  fatReal: number;
  fatDeclarado: number;
  dasAtual: number;
}

export function montarLinhas(empresas: Empresa[]): LinhaGrupo[] {
  return empresas.map((empresa) => ({
    empresa,
    fatReal: empresa.faturamentoRealAnual,
    fatDeclarado: empresa.faturamentoDeclaradoAnual,
    dasAtual: empresa.dasAtualAnual,
  }));
}

const soma = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

const CHAVES = ["lucroReal", "lucroPresumido", "simples"] as const;
const NOMES = {
  lucroReal: "Lucro Real",
  lucroPresumido: "Lucro Presumido",
  simples: "Simples Nacional",
} as const;

export function PlacarConsolidado({
  empresas,
  grupoSlug,
}: {
  empresas: Empresa[];
  grupoSlug: string;
}) {
  if (!empresas.length) return <VazioAviso />;

  return (
    <div className="space-y-10">
      {empresas.map((empresa) => (
        <PlacarEmpresa key={empresa.id} empresa={empresa} grupoSlug={grupoSlug} />
      ))}
    </div>
  );
}

function PlacarEmpresa({ empresa, grupoSlug }: { empresa: Empresa; grupoSlug: string }) {
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
              meses: empresa.meses,
            },
            params,
          )
        : calcular(empresa.meses, empresa.compras, params),
    [empresa, params, usaPct, pctReg],
  );

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

  return (
    <div className="space-y-5">
      <div className="card-panel overflow-hidden border-win/60 p-0 shadow-[var(--shadow-win)] ring-2 ring-win/35">
        <div className="flex w-full flex-wrap items-center justify-between gap-6 border-l-[6px] border-win bg-win-soft/60 p-7">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-win-deep uppercase">
                Regime mais vantajoso
              </p>
              <Link
                to="/grupo/$grupo/$empresa"
                params={{ grupo: grupoSlug, empresa: empresa.slug }}
                className="rounded-full bg-teal px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase shadow-sm transition-colors hover:bg-petrol"
              >
                Abrir empresa
              </Link>
            </div>
            <p className="font-display mt-1 text-3xl font-semibold text-ink sm:text-4xl">
              {empresa.nome}
            </p>
            <p className="font-display mt-1 text-4xl font-semibold text-win-deep">
              {NOMES[r.melhor]}
            </p>
            <p className="num mt-1 text-sm text-muted-foreground">
              Carga anual de {brl(r[r.melhor].carga)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-4 text-right">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Receita bruta considerada
              </p>
              <p className="num font-display mt-1 text-4xl font-semibold text-win-deep">
                {brl(r.totais.receitaBruta)}
              </p>
            </div>
            {usaPct ? (
              <RegularizacaoControl pct={pctReg} onChange={alterar} nomeEmpresa={empresa.nome} />
            ) : null}
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
          )} - aliquota efetiva de ${pct(r.simples.aliquotaEfetiva)} (Anexo ${
            parametrosDaEmpresa(empresa).anexo
          }).`}
          economia={r.melhor === "simples" ? economia : undefined}
        />
      </div>
    </div>
  );
}

export function Resumo({ linhas }: { linhas: LinhaGrupo[] }) {
  const tReal = soma(linhas.map((l) => l.fatReal));
  const tDecl = soma(linhas.map((l) => l.fatDeclarado));
  const tDas = soma(linhas.map((l) => l.dasAtual));

  if (!linhas.length) return <VazioAviso />;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
          <thead>
            <Cabecalho
              colunas={["Empresa", "Faturamento real", "Faturamento declarado", "DAS atual"]}
            />
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.empresa.id} className="transition-colors hover:bg-muted/60">
                <th
                  scope="row"
                  className="border-t border-line px-3 py-2 text-left font-medium text-ink"
                >
                  {l.empresa.nome}
                </th>
                <Celula>{brl(l.fatReal)}</Celula>
                <Celula>{brl(l.fatDeclarado)}</Celula>
                <Celula>{brl(l.dasAtual)}</Celula>
              </tr>
            ))}
            <tr className="bg-petrol-soft/60">
              <th
                scope="row"
                className="border-t border-line px-3 py-2.5 text-left font-semibold text-petrol"
              >
                Totais
              </th>
              <Celula forte>{brl(tReal)}</Celula>
              <Celula forte>{brl(tDecl)}</Celula>
              <Celula forte>{brl(tDas)}</Celula>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Razao
          titulo="Declarado / Real"
          valor={tReal ? tDecl / tReal : 0}
          detalhe="Quanto do faturamento real chegou a ser declarado"
        />
        <Razao
          titulo="DAS atual / Real"
          valor={tReal ? tDas / tReal : 0}
          detalhe="Carga do DAS pago hoje sobre o faturamento real"
        />
      </div>

      <p className="rounded-lg border border-line bg-muted/70 p-3 text-xs leading-relaxed text-muted-foreground">
        Estes tres numeros sao anuais e editaveis na pagina de cada empresa. Eles so alimentam
        este Resumo - nao entram em nenhuma formula de imposto nem influenciam o placar dos
        regimes.
      </p>
    </div>
  );
}

export function QuadroSocietario({ linhas }: { linhas: LinhaGrupo[] }) {
  const contagem = new Map<string, number>();
  linhas.forEach((l) => l.empresa.socios.forEach((s) => contagem.set(s, (contagem.get(s) ?? 0) + 1)));
  const repetidos = [...contagem.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);

  if (!linhas.length) return <VazioAviso />;

  return (
    <div className="space-y-4">
      {repetidos.length ? (
        <div className="rounded-xl border border-coral/40 bg-coral-soft/50 p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">
            Socios em mais de uma empresa do grupo
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {repetidos.map(([nome, n]) => (
              <li
                key={nome}
                className="rounded-full border border-coral/50 bg-card px-3 py-1 text-sm text-ink"
              >
                {nome}
                <span className="num ml-2 font-semibold text-coral">{n} empresas</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Socios em comum importam para o Simples Nacional: a receita das empresas com mesmo
            quadro societario pode ser somada para efeito de sublimite. A checagem de sublimite
            ainda nao e feita aqui - esta e so a visao da concentracao.
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
          <thead>
            <Cabecalho
              colunas={["Empresa", "Socio(s)", "Faturamento real", "Faturamento declarado"]}
              alinharEsquerda={[0, 1]}
            />
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.empresa.id} className="transition-colors hover:bg-muted/60">
                <th scope="row" className="border-t border-line px-3 py-2 text-left font-medium text-ink">
                  {l.empresa.nome}
                </th>
                <td className="border-t border-line px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {l.empresa.socios.length ? (
                      l.empresa.socios.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            (contagem.get(s) ?? 0) > 1
                              ? "bg-coral-soft font-semibold text-coral"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </td>
                <Celula>{brl(l.fatReal)}</Celula>
                <Celula>{brl(l.fatDeclarado)}</Celula>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cabecalho({
  colunas,
  alinharEsquerda = [0],
}: {
  colunas: string[];
  alinharEsquerda?: number[];
}) {
  return (
    <tr>
      {colunas.map((c, i) => (
        <th
          key={c}
          className={`px-3 py-2 text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase ${
            alinharEsquerda.includes(i) ? "text-left" : "text-right"
          }`}
        >
          {c}
        </th>
      ))}
    </tr>
  );
}

function Celula({
  children,
  forte,
  suave,
  destaque,
}: {
  children: React.ReactNode;
  forte?: boolean;
  suave?: boolean;
  destaque?: boolean;
}) {
  return (
    <td
      className={`num border-t border-line px-3 py-2 text-right ${
        forte ? "font-semibold text-petrol" : suave ? "text-muted-foreground" : "text-ink"
      } ${destaque ? "bg-win-soft/50 font-medium text-win-deep" : ""}`}
    >
      {children}
    </td>
  );
}

function Razao({ titulo, valor, detalhe }: { titulo: string; valor: number; detalhe: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {titulo}
      </p>
      <p className="num font-display mt-1 text-3xl font-semibold text-petrol">{pct(valor)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

function VazioAviso() {
  return (
    <p className="rounded-xl border border-dashed border-line bg-muted/50 p-8 text-center text-sm text-muted-foreground">
      Selecione ao menos uma empresa no filtro acima.
    </p>
  );
}
