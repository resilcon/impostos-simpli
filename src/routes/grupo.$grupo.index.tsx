import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import logoResilcon from "@/assets/resilcon-horizontal.png.asset.json";
import {
  montarLinhas,
  PlacarConsolidado,
  QuadroSocietario,
  Resumo,
} from "@/components/GrupoRelatorios";
import { useBanco } from "@/hooks/useBanco";
import { criarEmpresa } from "@/lib/store";
import { brl } from "@/lib/tax-model";

export const Route = createFileRoute("/grupo/$grupo/")({
  component: Pagina,
});

const ABAS = [
  ["placar", "Placar por empresa"],
  ["resumo", "Resumo"],
  ["qsa", "Quadro societario"],
] as const;

function Pagina() {
  const { grupo: slug } = Route.useParams();
  const banco = useBanco();
  const grupo = banco.grupos.find((g) => g.slug === slug);
  const empresas = useMemo(
    () => banco.empresas.filter((e) => e.grupoId === grupo?.id),
    [banco, grupo],
  );

  const [aba, setAba] = useState<(typeof ABAS)[number][0]>("placar");
  const [desmarcadas, setDesmarcadas] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState("");

  const selecionadas = empresas.filter((e) => !desmarcadas.includes(e.id));
  const linhas = useMemo(() => montarLinhas(selecionadas), [selecionadas]);

  if (!banco.carregado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      </main>
    );
  }

  if (!grupo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Grupo nao encontrado</h1>
          <a href="/" className="mt-3 inline-block text-sm text-teal underline">
            Voltar para a selecao
          </a>
        </div>
      </main>
    );
  }

  const totalReal = linhas.reduce((a, l) => a + l.fatReal, 0);
  const totalDas = linhas.reduce((a, l) => a + l.dasAtual, 0);

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
              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-petrol/25 bg-petrol-soft/70 px-3 py-1.5 text-xs font-semibold text-petrol shadow-sm hover:border-petrol/50 hover:bg-petrol hover:text-white"
              >
                <span aria-hidden="true">←</span> Trocar grupo
              </a>
            </div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-teal uppercase">
              Planejamento tributario do grupo - 2026
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">{grupo.nome}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Placar dos regimes de cada empresa marcada, resumo do historico declarado e quadro
              societario cruzado. Tudo recalcula ao vivo.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                Faturamento real
              </dt>
              <dd className="num text-lg font-semibold text-ink">{brl(totalReal)}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                DAS atual
              </dt>
              <dd className="num text-lg font-semibold text-win-deep">{brl(totalDas)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section aria-labelledby="filtro" className="card-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="filtro" className="text-sm font-semibold text-ink">
              Empresas no calculo
              <span className="num ml-2 text-muted-foreground">
                {selecionadas.length}/{empresas.length}
              </span>
            </h2>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDesmarcadas([])}
                className="rounded-md border border-line px-3 py-1.5 font-medium text-ink hover:bg-muted"
              >
                Marcar todas
              </button>
              <button
                type="button"
                onClick={() => setDesmarcadas(empresas.map((e) => e.id))}
                className="rounded-md border border-line px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted"
              >
                Desmarcar todas
              </button>
            </div>
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {empresas.map((e) => {
              const marcada = !desmarcadas.includes(e.id);
              return (
                <li key={e.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      marcada ? "border-win/50 bg-win-soft/40 text-ink" : "border-line text-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() =>
                        setDesmarcadas((d) =>
                          marcada ? [...d, e.id] : d.filter((id) => id !== e.id),
                        )
                      }
                      className="size-4 accent-[var(--win)]"
                    />
                    <span className="flex-1 truncate">{e.nome}</span>
                    <a
                      href={`/grupo/${grupo.slug}/${e.slug}`}
                      onClick={(ev) => ev.stopPropagation()}
                      className="text-xs font-medium text-teal underline-offset-2 hover:underline"
                    >
                      abrir
                    </a>
                  </label>
                </li>
              );
            })}
          </ul>

          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              const limpo = novoNome.trim();
              if (limpo.length < 2) return;
              criarEmpresa(limpo, grupo.id);
              setNovoNome("");
            }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <input
              value={novoNome}
              maxLength={80}
              onChange={(ev) => setNovoNome(ev.target.value)}
              placeholder="Adicionar empresa ao grupo"
              className="min-w-[220px] flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Adicionar
            </button>
          </form>
        </section>

        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {ABAS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setAba(k)}
              aria-pressed={aba === k}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                aba === k ? "bg-card text-petrol shadow-sm" : "text-muted-foreground hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="card-panel p-6">
          {aba === "placar" ? <PlacarConsolidado empresas={selecionadas} grupoSlug={grupo.slug} /> : null}
          {aba === "resumo" ? <Resumo linhas={linhas} /> : null}
          {aba === "qsa" ? <QuadroSocietario linhas={linhas} /> : null}
        </section>

        <footer className="pb-6 text-xs leading-relaxed text-muted-foreground">
          Os dados ficam salvos no banco do sistema. Simulacao para apoio a decisao, nao substitui
          parecer contabil.
        </footer>
      </div>
    </main>
  );
}
