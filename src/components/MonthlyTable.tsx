import { NumberField } from "./NumberField";
import { brl, type MesInput, type Totais, type FonteSimples } from "@/lib/tax-model";

const COLUNAS: { key: keyof MesInput; label: string }[] = [
  { key: "vendas", label: "Vendas" },
  { key: "servicos", label: "Servicos" },
  { key: "bcIcms", label: "BC ICMS" },
  { key: "bcMonofasico", label: "BC monofasicos" },
  { key: "fopag", label: "FOPAG" },
  { key: "proLabore", label: "Pro-labore" },
  { key: "das", label: "DAS pago" },
  { key: "dasDevido", label: "DAS devido" },
];

export function MonthlyTable({
  meses,
  onChange,
  totais,
  fonteSimples,
  onFonteChange,
}: {
  meses: MesInput[];
  onChange: (i: number, key: keyof MesInput, v: number) => void;
  totais: Totais;
  fonteSimples: FonteSimples;
  onFonteChange: (f: FonteSimples) => void;
}) {
  const total = (k: keyof MesInput) =>
    ({
      vendas: totais.vendas,
      servicos: totais.servicos,
      bcIcms: totais.bcIcms,
      bcMonofasico: totais.bcMonofasico,
      fopag: totais.fopag,
      proLabore: totais.proLabore,
      das: totais.das,
      dasDevido: totais.dasDevido,
    })[k as "vendas"] ?? 0;

  const destaque = (k: keyof MesInput) =>
    (k === "das" && fonteSimples === "pago") || (k === "dasDevido" && fonteSimples === "devido")
      ? "bg-win-soft/50"
      : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-muted/60 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Coluna usada no calculo do Simples Nacional
        </span>
        <div
          role="radiogroup"
          aria-label="Coluna usada no calculo do Simples Nacional"
          className="relative isolate inline-flex items-center rounded-full border border-line bg-card p-1 shadow-inner"
        >
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 -z-10 w-[calc(50%-0.25rem)] rounded-full bg-win shadow-[0_2px_8px_-2px_hsl(0_0%_0%/0.35)] transition-transform duration-300 ease-out"
            style={{
              transform: fonteSimples === "devido" ? "translateX(100%)" : "translateX(0)",
            }}
          />
          {(
            [
              ["pago", "DAS pago"],
              ["devido", "DAS devido"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              onClick={() => onFonteChange(k)}
              aria-checked={fonteSimples === k}
              className={`w-[8.5rem] rounded-full px-4 py-1.5 text-center text-sm font-semibold transition-colors duration-200 ${
                fonteSimples === k
                  ? "text-win-foreground"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1060px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                Mes
              </th>
              {COLUNAS.map((c) => (
                <th
                  key={c.key}
                  className={`px-2 py-2 text-right text-[11px] font-semibold tracking-[0.1em] uppercase ${
                    destaque(c.key) ? "text-win-deep " + destaque(c.key) : "text-muted-foreground"
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meses.map((m, i) => (
              <tr key={m.mes} className="transition-colors hover:bg-muted/60">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-t border-line bg-card px-3 py-1.5 text-left text-sm font-medium text-ink"
                >
                  {m.mes}
                </th>
                {COLUNAS.map((c) => (
                  <td key={c.key} className={`border-t border-line px-1 py-1.5 ${destaque(c.key)}`}>
                    <NumberField
                      ariaLabel={`${c.label} de ${m.mes}`}
                      value={m[c.key] as number}
                      onChange={(v) => onChange(i, c.key, v)}
                      prefix="R$"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-petrol-soft/60">
              <th
                scope="row"
                className="sticky left-0 z-10 border-t border-line bg-petrol-soft px-3 py-2.5 text-left text-sm font-semibold text-petrol"
              >
                Total anual
              </th>
              {COLUNAS.map((c) => (
                <td
                  key={c.key}
                  className={`num border-t border-line px-3 py-2.5 text-right text-sm font-semibold text-petrol ${destaque(c.key)}`}
                >
                  {brl(total(c.key))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
