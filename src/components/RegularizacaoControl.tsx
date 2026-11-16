import { useEffect, useRef, useState } from "react";
import { atualizarEmpresa, type Empresa } from "@/lib/store";

export function useRegularizacao(empresa: Empresa) {
  const [pct, setPct] = useState(empresa.pctRegularizacao);
  const idRef = useRef(empresa.id);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Resync local state whenever the stored value changes for this empresa
    // (realtime update, fresh load, company switch) - but never while a
    // debounced write from this control is still pending, so we don't
    // clobber it mid-flight with a stale prop value.
    idRef.current = empresa.id;
    if (!timer.current) setPct(empresa.pctRegularizacao);
  }, [empresa.id, empresa.pctRegularizacao]);

  const alterar = (v: number) => {
    const limpo = Math.min(1.5, Math.max(0, v));
    setPct(limpo);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      const ativos = empresa.meses.filter((m) => m.fopag > 0).length;
      const rb = empresa.faturamentoRealAnual * limpo;
      const porMes = ativos > 0 ? rb / ativos : 0;
      const meses = empresa.meses.map((m) => ({
        ...m,
        vendas: m.fopag > 0 ? porMes : 0,
        servicos: 0,
      }));
      atualizarEmpresa(idRef.current, { pctRegularizacao: limpo, meses });
    }, 350);
  };

  return { pct, alterar };
}

const mostrar = (pct: number) =>
  (pct * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function RegularizacaoControl({
  pct,
  onChange,
  nomeEmpresa,
}: {
  pct: number;
  onChange: (v: number) => void;
  nomeEmpresa: string;
}) {
  const [texto, setTexto] = useState(mostrar(pct));
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!editando) setTexto(mostrar(pct));
  }, [pct, editando]);

  const confirmar = (bruto: string) => {
    const n = Number(bruto.replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(n)) onChange(n / 100);
  };

  return (
    <div className="w-full max-w-xs">
      <label
        htmlFor={`pct-${nomeEmpresa}`}
        className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
      >
        % Regularizacao
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={`pct-${nomeEmpresa}`}
          inputMode="decimal"
          value={texto}
          aria-label={`Percentual de regularizacao de ${nomeEmpresa}`}
          onFocus={() => setEditando(true)}
          onChange={(e) => {
            setTexto(e.target.value);
            confirmar(e.target.value);
          }}
          onBlur={() => {
            setEditando(false);
            setTexto(mostrar(pct));
          }}
          className="num w-24 rounded-md border border-line bg-card px-2 py-1.5 text-right text-sm font-semibold text-ink focus:border-teal focus:outline-none"
        />
        <span className="text-sm font-semibold text-muted-foreground">%</span>
      </div>
      <input
        type="range"
        min={0}
        max={150}
        step={0.5}
        value={Math.round(pct * 1000) / 10}
        aria-label={`Ajustar percentual de regularizacao de ${nomeEmpresa}`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-petrol/15 accent-teal"
      />
    </div>
  );
}
