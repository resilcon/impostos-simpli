import { useEffect, useState } from "react";

function parseBR(s: string) {
  const clean = s.replace(/\s|R\$|%/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

export function NumberField({
  value,
  onChange,
  suffix,
  prefix,
  step = 0.01,
  ariaLabel,
  align = "right",
  decimais,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  prefix?: string;
  step?: number;
  ariaLabel: string;
  align?: "left" | "right";
  decimais?: number;
}) {
  const casas = decimais ?? (prefix === "R$" ? 2 : undefined);
  const formatar = (v: number) =>
    v.toLocaleString("pt-BR", {
      minimumFractionDigits: casas ?? 0,
      maximumFractionDigits: casas ?? 4,
    });
  const bruto = (v: number) => String(v).replace(".", ",");

  const [text, setText] = useState(formatar(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatar(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused, casas]);

  const confirmar = () => {
    const n = parseBR(text);
    if (n !== value) onChange(n);
    return n;
  };

  return (
    <div className="group relative flex items-center rounded-md border border-line bg-card transition-colors focus-within:border-teal hover:border-petrol/30">
      {prefix ? (
        <span className="pl-2 text-[11px] font-medium text-muted-foreground">{prefix}</span>
      ) : null}
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        type="text"
        step={step}
        value={text}
        onFocus={(e) => {
          setFocused(true);
          setText(bruto(value));
          requestAnimationFrame(() => e.target.select?.());
        }}
        onBlur={() => {
          const n = confirmar();
          setFocused(false);
          setText(formatar(n));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const n = confirmar();
            setText(bruto(n));
          }
        }}
        onChange={(e) => setText(e.target.value)}
        className={`num w-full bg-transparent px-2 py-1.5 text-sm text-foreground outline-none ${
          align === "right" ? "text-right" : "text-left"
        }`}
      />
      {suffix ? (
        <span className="pr-2 text-[11px] font-medium text-muted-foreground">{suffix}</span>
      ) : null}
    </div>
  );
}
