import { NumberField } from "./NumberField";
import { ANEXOS } from "@/lib/simples-table";
import { brl, type Parametros } from "@/lib/tax-model";

type Campo = { key: keyof Parametros; label: string; tipo: "pct" | "num" };

const GRUPOS: { titulo: string; campos: Campo[] }[] = [
  {
    titulo: "Receita e bases",
    campos: [
      { key: "pctNaoMonofasico", label: "Receita nao sujeita a monofasico", tipo: "pct" },
      { key: "pctBcIcms", label: "Receita media que forma BC de ICMS", tipo: "pct" },
      { key: "pctCmv", label: "CMV sobre a receita bruta", tipo: "pct" },
      { key: "pctEncargos", label: "Encargos sobre a folha", tipo: "pct" },
      { key: "pctDespesasOperacionais", label: "Despesas operacionais s/ receita", tipo: "pct" },
    ],
  },
  {
    titulo: "Aliquotas de tributos",
    campos: [
      { key: "aliqIcms", label: "ICMS", tipo: "pct" },
      { key: "pisNaoCumulativo", label: "PIS nao-cumulativo (Real)", tipo: "pct" },
      { key: "cofinsNaoCumulativo", label: "COFINS nao-cumulativo (Real)", tipo: "pct" },
      { key: "pisCumulativo", label: "PIS cumulativo (Presumido)", tipo: "pct" },
      { key: "cofinsCumulativo", label: "COFINS cumulativo (Presumido)", tipo: "pct" },
      { key: "aliqIpi", label: "IPI", tipo: "pct" },
      { key: "aliqIss", label: "ISS", tipo: "pct" },
    ],
  },
  {
    titulo: "IRPJ e CSLL",
    campos: [
      { key: "aliqIrpj", label: "IRPJ", tipo: "pct" },
      { key: "aliqCsll", label: "CSLL", tipo: "pct" },
      { key: "aliqAdicionalIr", label: "Adicional de IR", tipo: "pct" },
      { key: "presuncaoIrpj", label: "Presuncao IRPJ (mercadorias)", tipo: "pct" },
      { key: "presuncaoCsll", label: "Presuncao CSLL (mercadorias)", tipo: "pct" },
      { key: "baseLimiteAdicionalMensal", label: "Base mensal do adicional (R$)", tipo: "num" },
      { key: "mesesLimiteAdicional", label: "Multiplicador de meses", tipo: "num" },
    ],
  },
];

export function ParamsPanel({
  params,
  onChange,
  compras,
  onComprasChange,
}: {
  params: Parametros;
  onChange: (key: keyof Parametros, v: number) => void;
  compras: number;
  onComprasChange: (v: number) => void;
}) {
  const limite = params.baseLimiteAdicionalMensal * params.mesesLimiteAdicional;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {GRUPOS.map((g) => (
        <section key={g.titulo} className="space-y-3">
          <h3 className="text-sm font-semibold tracking-[0.1em] text-petrol uppercase">
            {g.titulo}
          </h3>
          <div className="space-y-2">
            {g.campos.map((c) => (
              <div key={c.key} className="grid grid-cols-[1fr_130px] items-center gap-3">
                <label className="text-sm text-muted-foreground">{c.label}</label>
                {c.tipo === "pct" ? (
                  <NumberField
                    ariaLabel={c.label}
                    value={Number((((params[c.key] as number) * 100).toFixed(4)))}
                    onChange={(v) => onChange(c.key, v / 100)}
                    suffix="%"
                    step={0.01}
                  />
                ) : (
                  <NumberField
                    ariaLabel={c.label}
                    value={params[c.key] as number}
                    onChange={(v) => onChange(c.key, v)}
                    step={1}
                  />
                )}
              </div>
            ))}
          </div>
          {g.titulo === "IRPJ e CSLL" ? (
            <p className="rounded-lg border border-coral/40 bg-coral-soft/60 p-3 text-xs leading-relaxed text-ink">
              <strong>Ponto a validar:</strong> a planilha usa R$ 20.000 x 6 ={" "}
              <span className="num">{brl(limite)}</span> como limite anual para o adicional de IR.
            </p>
          ) : null}
        </section>
      ))}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-[0.1em] text-petrol uppercase">
          Compras e Simples Nacional
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_130px] items-center gap-3">
            <label className="text-sm text-muted-foreground">Total de compras no ano</label>
            <NumberField
              ariaLabel="Total de compras"
              value={compras}
              onChange={onComprasChange}
              prefix="R$"
            />
          </div>
          <div className="grid grid-cols-[1fr_130px] items-center gap-3">
            <label className="text-sm text-muted-foreground" htmlFor="anexo">
              Anexo do Simples
            </label>
            <select
              id="anexo"
              value={params.anexo}
              onChange={(e) => onChange("anexo", e.target.value as never)}
              className="rounded-md border border-line bg-card px-2 py-1.5 text-sm text-foreground"
            >
              {ANEXOS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_130px] items-center gap-3">
            <label className="text-sm text-muted-foreground" htmlFor="fonte">
              Carga do Simples no comparativo
            </label>
            <select
              id="fonte"
              value={params.fonteSimples}
              onChange={(e) => onChange("fonteSimples", e.target.value as never)}
              className="rounded-md border border-line bg-card px-2 py-1.5 text-sm text-foreground"
            >
              <option value="pago">DAS pago (coluna)</option>
              <option value="devido">DAS devido (coluna)</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
