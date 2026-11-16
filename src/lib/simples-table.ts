export type AnexoKey = "I" | "II" | "III" | "IV" | "V";

export const ANEXOS: { key: AnexoKey; label: string }[] = [
  { key: "I", label: "Anexo I — Comércio" },
  { key: "II", label: "Anexo II — Indústria" },
  { key: "III", label: "Anexo III — Serviços" },
  { key: "IV", label: "Anexo IV — Serviços" },
  { key: "V", label: "Anexo V — Serviços" },
];

export interface FaixaSimples {
  ate: number;
  aliquotas: Record<AnexoKey, number>;
}

export const FAIXAS_SIMPLES: FaixaSimples[] = [
  { ate: 180000, aliquotas: { I: 0.04, II: 0.045, III: 0.06, IV: 0.045, V: 0.1693 } },
  { ate: 360000, aliquotas: { I: 0.0547, II: 0.0597, III: 0.0821, IV: 0.0654, V: 0.1772 } },
  { ate: 540000, aliquotas: { I: 0.0684, II: 0.0734, III: 0.1026, IV: 0.077, V: 0.1843 } },
  { ate: 720000, aliquotas: { I: 0.0754, II: 0.0804, III: 0.1131, IV: 0.0849, V: 0.1877 } },
  { ate: 900000, aliquotas: { I: 0.076, II: 0.081, III: 0.114, IV: 0.0897, V: 0.1904 } },
  { ate: 1080000, aliquotas: { I: 0.0828, II: 0.0878, III: 0.1242, IV: 0.0978, V: 0.1994 } },
  { ate: 1260000, aliquotas: { I: 0.0836, II: 0.0886, III: 0.1254, IV: 0.1026, V: 0.2034 } },
  { ate: 1440000, aliquotas: { I: 0.0845, II: 0.0895, III: 0.1268, IV: 0.1076, V: 0.2066 } },
  { ate: 1620000, aliquotas: { I: 0.0903, II: 0.0953, III: 0.1355, IV: 0.1151, V: 0.2117 } },
  { ate: 1800000, aliquotas: { I: 0.0912, II: 0.0962, III: 0.1368, IV: 0.12, V: 0.2138 } },
  { ate: 1980000, aliquotas: { I: 0.0995, II: 0.1045, III: 0.1493, IV: 0.128, V: 0.2186 } },
  { ate: 2160000, aliquotas: { I: 0.1004, II: 0.1054, III: 0.1506, IV: 0.1325, V: 0.2197 } },
  { ate: 2340000, aliquotas: { I: 0.1013, II: 0.1063, III: 0.152, IV: 0.137, V: 0.2206 } },
  { ate: 2520000, aliquotas: { I: 0.1023, II: 0.1073, III: 0.1535, IV: 0.1415, V: 0.2214 } },
  { ate: 2700000, aliquotas: { I: 0.1032, II: 0.1082, III: 0.1548, IV: 0.146, V: 0.2221 } },
  { ate: 2880000, aliquotas: { I: 0.1123, II: 0.1173, III: 0.1685, IV: 0.1505, V: 0.2221 } },
  { ate: 3060000, aliquotas: { I: 0.1132, II: 0.1182, III: 0.1698, IV: 0.155, V: 0.2232 } },
  { ate: 3240000, aliquotas: { I: 0.1142, II: 0.1192, III: 0.1713, IV: 0.1595, V: 0.2237 } },
  { ate: 3420000, aliquotas: { I: 0.1151, II: 0.1201, III: 0.1727, IV: 0.164, V: 0.2241 } },
  { ate: 3600000, aliquotas: { I: 0.1161, II: 0.1211, III: 0.1742, IV: 0.1685, V: 0.2245 } },
];

export function faixaPara(rbt12: number, anexo: AnexoKey) {
  const idx = FAIXAS_SIMPLES.findIndex((f) => rbt12 <= f.ate);
  const i = idx === -1 ? FAIXAS_SIMPLES.length - 1 : idx;
  const faixa = FAIXAS_SIMPLES[i];
  const de = i === 0 ? 0 : FAIXAS_SIMPLES[i - 1].ate;
  return { indice: i, de, ate: faixa.ate, aliquota: faixa.aliquotas[anexo], acima: idx === -1 };
}
