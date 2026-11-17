import { useEffect, useRef, useState } from "react";
import { AnimatedValue } from "./AnimatedValue";
import { brl, pct, type ResultadoRegime } from "@/lib/tax-model";

export function RegimeCard({
  regime,
  vencedor,
  receitaBruta,
  nota,
  economia,
}: {
  regime: ResultadoRegime;
  vencedor: boolean;
  receitaBruta: number;
  nota?: string;
  economia?: { valor: number; nomeSegundo: string };
}) {
  const [aberto, setAberto] = useState(false);
  const [pulso, setPulso] = useState(false);
  const anterior = useRef(vencedor);

  useEffect(() => {
    if (vencedor && !anterior.current) {
      setPulso(true);
      const id = setTimeout(() => setPulso(false), 1500);
      return () => clearTimeout(id);
    }
    anterior.current = vencedor;
  }, [vencedor]);

  return (
    <article
      className={`card-panel card-hover flex flex-col overflow-hidden ${
        vencedor
          ? "border-win/70 shadow-[var(--shadow-win)] ring-2 ring-win/45 lg:-translate-y-1 lg:scale-[1.015]"
          : ""
      } ${pulso ? "winner-glow" : ""}`}
    >
      <div className={`${vencedor ? "h-1.5 bg-win" : "h-1 bg-petrol/15"} w-full`} />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">{regime.nome}</h3>
          {vencedor ? (
            <span className="rounded-full bg-win px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase shadow-sm">
              Mais vantajoso
            </span>
          ) : null}
        </div>

        <div>
          <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Carga tributaria anual
          </p>
          <AnimatedValue
            value={regime.carga}
            format={brl}
            className="num font-display mt-1 block text-4xl leading-none font-semibold text-ink tabular-nums"
          />
          <p className="num mt-2 text-sm text-muted-foreground">
            {receitaBruta ? pct(regime.carga / receitaBruta) : "-"} da receita bruta
          </p>
          {vencedor && economia && economia.valor > 0 ? (
            <span className="mt-3 block w-full rounded-full bg-win px-4 py-2 text-center text-xs font-semibold leading-relaxed tracking-wide text-white uppercase shadow-sm">
              Economia de <span className="num font-semibold">{brl(economia.valor)}</span> em relacao ao{" "}
              {economia.nomeSegundo}
            </span>
          ) : null}
        </div>

        {nota ? <p className="text-xs leading-relaxed text-muted-foreground">{nota}</p> : null}

        <div className="mt-auto space-y-2">
          {regime.extras.map((e) => (
            <div key={e.rotulo} className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{e.rotulo}</span>
              <span className="num font-medium text-ink">
                {e.formato === "percentual" ? pct(e.valor) : brl(e.valor)}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm font-medium text-petrol transition-colors hover:bg-petrol-soft"
        >
          Detalhar impostos
          <span aria-hidden className={`transition-transform ${aberto ? "rotate-180" : ""}`}>
            v
          </span>
        </button>

        {aberto ? (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {regime.linhas.map((l) => {
              const tipo = l.tipo ?? (l.credito ? "credito" : "deducao");
              const ehSubtotal = tipo === "subtotal";
              const ehCredito = tipo === "credito";
              const ehDeducao = tipo === "deducao";
              const sinal = ehCredito ? "+ " : ehDeducao ? "- " : "";
              return (
                <li
                  key={l.rotulo}
                  className={`flex items-center justify-between gap-4 px-3 py-2 text-sm transition-colors ${
                    ehSubtotal
                      ? "border-y border-line/80 bg-muted/60 font-semibold"
                      : "hover:bg-muted"
                  }`}
                >
                  <span
                    className={
                      ehSubtotal
                        ? "text-ink"
                        : ehCredito
                          ? "text-teal"
                          : ehDeducao
                            ? "text-destructive/80"
                            : "text-muted-foreground"
                    }
                  >
                    {l.rotulo}
                  </span>
                  <span
                    className={`num font-medium ${
                      ehSubtotal
                        ? "text-ink"
                        : ehCredito
                          ? "text-teal"
                          : ehDeducao
                            ? "text-destructive/80"
                            : "text-ink"
                    }`}
                  >
                    {sinal}
                    {brl(Math.abs(l.valor))}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
