import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MESES, PARAMETROS_PADRAO, type MesInput, type Parametros } from "./tax-model";

export interface Grupo {
  id: string;
  nome: string;
  slug: string;
}

export interface Empresa {
  id: string;
  grupoId: string | null;
  nome: string;
  slug: string;
  faturamentoRealAnual: number;
  faturamentoDeclaradoAnual: number;
  dasAtualAnual: number;
  pctRegularizacao: number;
  compras: number;
  parametros: Partial<Parametros>;
  socios: string[];
  meses: MesInput[];
}

export interface Banco {
  grupos: Grupo[];
  empresas: Empresa[];
  carregado: boolean;
}

export const BANCO_VAZIO: Banco = { grupos: [], empresas: [], carregado: false };

export const MESES_VAZIOS = (): MesInput[] =>
  MESES.map((mes) => ({
    mes, vendas: 0, servicos: 0, bcIcms: 0, bcMonofasico: 0, fopag: 0, proLabore: 0, das: 0, dasDevido: 0,
  }));

export function parametrosDaEmpresa(e: Empresa | undefined): Parametros {
  return { ...PARAMETROS_PADRAO, ...(e?.parametros ?? {}) };
}

let cache: Banco = BANCO_VAZIO;
let carregando: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

export function lerBanco(): Banco {
  return cache;
}

export function assinar(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

function notificar() {
  ouvintes.forEach((f) => f());
}

function definir(b: Banco) {
  cache = b;
  notificar();
}

const num = (v: unknown) => Number(v ?? 0);

export function carregarBanco(forcar = false): Promise<void> {
  iniciarSincronizacao();
  if (!forcar && carregando) return carregando;
  carregando = (async () => {
    const [gr, em, dm, es] = await Promise.all([
      supabase.from("grupos").select("id, nome, slug").order("nome"),
      supabase
        .from("empresas")
        .select(
          "id, grupo_id, nome, slug, faturamento_real_anual, faturamento_declarado_anual, das_atual_anual, pct_regularizacao, compras, parametros, created_at",
        )
        .order("created_at"),
      supabase.from("dados_mensais").select("*").order("ordem"),
      supabase.from("empresa_socios").select("empresa_id, socios(nome)"),
    ]);

    const erro = gr.error ?? em.error ?? dm.error ?? es.error;
    if (erro) throw erro;

    const mesesPorEmpresa = new Map<string, MesInput[]>();
    for (const r of dm.data ?? []) {
      const lista = mesesPorEmpresa.get(r.empresa_id) ?? [];
      lista.push({
        mes: r.mes,
        vendas: num(r.vendas),
        servicos: num(r.servicos),
        bcIcms: num(r.bc_icms),
        bcMonofasico: num(r.bc_monofasico),
        fopag: num(r.fopag),
        proLabore: num(r.pro_labore),
        das: num(r.das),
        dasDevido: num(r.das_devido),
      });
      mesesPorEmpresa.set(r.empresa_id, lista);
    }

    const sociosPorEmpresa = new Map<string, string[]>();
    for (const r of (es.data ?? []) as Array<{
      empresa_id: string;
      socios: { nome: string } | null;
    }>) {
      if (!r.socios) continue;
      const lista = sociosPorEmpresa.get(r.empresa_id) ?? [];
      lista.push(r.socios.nome);
      sociosPorEmpresa.set(r.empresa_id, lista);
    }

    definir({
      carregado: true,
      grupos: (gr.data ?? []).map((g) => ({ id: g.id, nome: g.nome, slug: g.slug })),
      empresas: (em.data ?? []).map((e) => ({
        id: e.id,
        grupoId: e.grupo_id,
        nome: e.nome,
        slug: e.slug,
        faturamentoRealAnual: num(e.faturamento_real_anual),
        faturamentoDeclaradoAnual: num(e.faturamento_declarado_anual),
        dasAtualAnual: num(e.das_atual_anual),
        pctRegularizacao: e.pct_regularizacao == null ? 1 : Number(e.pct_regularizacao),
        compras: num(e.compras),
        parametros: (e.parametros ?? {}) as Partial<Parametros>,
        socios: sociosPorEmpresa.get(e.id) ?? [],
        meses: mesesPorEmpresa.get(e.id) ?? MESES_VAZIOS(),
      })),
    });
  })();
  return carregando;
}

const filas = new Map<string, Promise<void>>();
let pendentes = 0;

function enfileirar(chave: string, gravar: () => PromiseLike<{ error: unknown } | void>) {
  pendentes++;
  const anterior = filas.get(chave) ?? Promise.resolve();
  const proxima = anterior
    .then(async () => {
      const res = await gravar();
      if (res && res.error) throw res.error;
    })
    .catch((err) => {
      console.error("[store] falha ao gravar " + chave, err);
      toast.error("Nao foi possivel salvar a alteracao", {
        description: "Verifique a conexao e tente novamente.",
      });
    })
    .finally(() => {
      pendentes--;
      if (filas.get(chave) === proxima) filas.delete(chave);
    });
  filas.set(chave, proxima);
}

const COLUNA_DB: Record<Exclude<keyof MesInput, "mes">, string> = {
  vendas: "vendas",
  servicos: "servicos",
  bcIcms: "bc_icms",
  bcMonofasico: "bc_monofasico",
  fopag: "fopag",
  proLabore: "pro_labore",
  das: "das",
  dasDevido: "das_devido",
};

type ColunaMes = Exclude<keyof MesInput, "mes">;

function gravarCelula(empresaId: string, mes: string, coluna: ColunaMes, valor: number) {
  enfileirar("mes:" + empresaId + ":" + mes + ":" + coluna, () =>
    supabase
      .from("dados_mensais")
      .update({ [COLUNA_DB[coluna]]: valor } as never)
      .eq("empresa_id", empresaId)
      .eq("mes", mes)
      .then((r) => ({ error: r.error })),
  );
}

export function atualizarCelulaMensal(
  empresaId: string,
  mes: string,
  coluna: ColunaMes,
  valor: number,
) {
  const emp = cache.empresas.find((e) => e.id === empresaId);
  if (!emp) return;
  const atual = emp.meses.find((m) => m.mes === mes);
  if (!atual || atual[coluna] === valor) return;
  definir({
    ...cache,
    empresas: cache.empresas.map((e) =>
      e.id === empresaId
        ? { ...e, meses: e.meses.map((m) => (m.mes === mes ? { ...m, [coluna]: valor } : m)) }
        : e,
    ),
  });
  gravarCelula(empresaId, mes, coluna, valor);
}

export function atualizarParametro<K extends keyof Parametros>(
  empresaId: string,
  chave: K,
  valor: Parametros[K],
) {
  const emp = cache.empresas.find((e) => e.id === empresaId);
  if (!emp) return;
  definir({
    ...cache,
    empresas: cache.empresas.map((e) =>
      e.id === empresaId ? { ...e, parametros: { ...e.parametros, [chave]: valor } } : e,
    ),
  });
  enfileirar("param:" + empresaId, async () => {
    const { data, error } = await supabase
      .from("empresas")
      .select("parametros")
      .eq("id", empresaId)
      .single();
    if (error) return { error };
    const atual = (data?.parametros ?? {}) as Record<string, unknown>;
    const r = await supabase
      .from("empresas")
      .update({ parametros: { ...atual, [chave]: valor } } as never)
      .eq("id", empresaId);
    return { error: r.error };
  });
}

export function atualizarEmpresa(id: string, patch: Partial<Empresa>) {
  const anterior = cache.empresas.find((e) => e.id === id);
  if (!anterior) return;
  definir({
    ...cache,
    empresas: cache.empresas.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  });

  const campos: Record<string, unknown> = {};
  if (patch.nome !== undefined) campos.nome = patch.nome;
  if (patch.faturamentoRealAnual !== undefined)
    campos.faturamento_real_anual = patch.faturamentoRealAnual;
  if (patch.faturamentoDeclaradoAnual !== undefined)
    campos.faturamento_declarado_anual = patch.faturamentoDeclaradoAnual;
  if (patch.dasAtualAnual !== undefined) campos.das_atual_anual = patch.dasAtualAnual;
  if (patch.pctRegularizacao !== undefined) campos.pct_regularizacao = patch.pctRegularizacao;
  if (patch.compras !== undefined) campos.compras = patch.compras;

  for (const [col, val] of Object.entries(campos)) {
    enfileirar("emp:" + id + ":" + col, () =>
      supabase
        .from("empresas")
        .update({ [col]: val } as never)
        .eq("id", id)
        .then((r) => ({ error: r.error })),
    );
  }

  if (patch.parametros !== undefined) {
    for (const [k, v] of Object.entries(patch.parametros)) {
      if ((anterior.parametros as Record<string, unknown>)[k] !== v) {
        enfileirar("param:" + id, async () => {
          const { data, error } = await supabase
            .from("empresas")
            .select("parametros")
            .eq("id", id)
            .single();
          if (error) return { error };
          const atual = (data?.parametros ?? {}) as Record<string, unknown>;
          const r = await supabase
            .from("empresas")
            .update({ parametros: { ...atual, [k]: v } } as never)
            .eq("id", id);
          return { error: r.error };
        });
      }
    }
  }

  if (patch.meses) {
    for (const novo of patch.meses) {
      const velho = anterior.meses.find((m) => m.mes === novo.mes);
      for (const col of Object.keys(COLUNA_DB) as ColunaMes[]) {
        if (!velho || velho[col] !== novo[col]) gravarCelula(id, novo.mes, col, novo[col]);
      }
    }
  }
}

let sincronizando = false;

type LinhaMes = {
  empresa_id: string;
  mes: string;
  vendas: number;
  servicos: number;
  bc_icms: number;
  bc_monofasico: number;
  fopag: number;
  pro_labore: number;
  das: number;
  das_devido: number;
};

function aplicarMesRemoto(r: LinhaMes) {
  const emp = cache.empresas.find((e) => e.id === r.empresa_id);
  if (!emp) return;
  const novo: MesInput = {
    mes: r.mes,
    vendas: num(r.vendas),
    servicos: num(r.servicos),
    bcIcms: num(r.bc_icms),
    bcMonofasico: num(r.bc_monofasico),
    fopag: num(r.fopag),
    proLabore: num(r.pro_labore),
    das: num(r.das),
    dasDevido: num(r.das_devido),
  };
  definir({
    ...cache,
    empresas: cache.empresas.map((e) =>
      e.id === r.empresa_id
        ? { ...e, meses: e.meses.map((m) => (m.mes === r.mes ? novo : m)) }
        : e,
    ),
  });
}

function aplicarEmpresaRemota(r: Record<string, unknown>) {
  const id = r.id as string;
  if (!cache.empresas.some((e) => e.id === id)) return;
  definir({
    ...cache,
    empresas: cache.empresas.map((e) =>
      e.id === id
        ? {
            ...e,
            nome: (r.nome as string) ?? e.nome,
            faturamentoRealAnual: num(r.faturamento_real_anual),
            faturamentoDeclaradoAnual: num(r.faturamento_declarado_anual),
            dasAtualAnual: num(r.das_atual_anual),
            pctRegularizacao: r.pct_regularizacao == null ? 1 : Number(r.pct_regularizacao),
            compras: num(r.compras),
            parametros: (r.parametros ?? {}) as Partial<Parametros>,
          }
        : e,
    ),
  });
}

function iniciarSincronizacao() {
  if (sincronizando || typeof window === "undefined") return;
  sincronizando = true;

  supabase
    .channel("store-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "dados_mensais" }, (p) => {
      if (p.eventType === "DELETE") return;
      aplicarMesRemoto(p.new as LinhaMes);
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "empresas" }, (p) =>
      aplicarEmpresaRemota(p.new as Record<string, unknown>),
    )
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "empresas" }, () => {
      if (pendentes === 0) void carregarBanco(true).catch(console.error);
    })
    .subscribe();

  const recarregar = () => {
    if (document.visibilityState !== "visible" || pendentes > 0) return;
    void carregarBanco(true).catch(console.error);
  };
  document.addEventListener("visibilitychange", recarregar);
  window.addEventListener("focus", recarregar);
}

export function criarEmpresa(nome: string, grupoId: string | null): Empresa {
  const base = slugify(nome) || ("empresa-" + Date.now());
  let slug = base;
  let n = 2;
  while (cache.empresas.some((e) => e.slug === slug)) slug = base + "-" + (n++);
  const nova: Empresa = {
    id: "e-" + slug + "-" + Date.now(),
    grupoId,
    nome: nome.trim(),
    slug,
    faturamentoRealAnual: 0,
    faturamentoDeclaradoAnual: 0,
    dasAtualAnual: 0,
    pctRegularizacao: 1,
    compras: 0,
    parametros: {},
    socios: [],
    meses: MESES_VAZIOS(),
  };
  definir({ ...cache, empresas: [...cache.empresas, nova] });

  void (async () => {
    await supabase.from("empresas").insert({
      id: nova.id,
      grupo_id: grupoId,
      nome: nova.nome,
      slug: nova.slug,
      faturamento_real_anual: 0,
      faturamento_declarado_anual: 0,
      das_atual_anual: 0,
      pct_regularizacao: 1,
      compras: 0,
      parametros: nova.parametros,
    });
    await supabase.from("dados_mensais").insert(
      nova.meses.map((m, i) => ({
        empresa_id: nova.id,
        mes: m.mes,
        ordem: i,
        vendas: 0,
        servicos: 0,
        bc_icms: 0,
        bc_monofasico: 0,
        fopag: 0,
        pro_labore: 0,
        das: 0,
        das_devido: 0,
      })),
    );
  })();

  return nova;
}

export function criarGrupo(nome: string): Grupo {
  const base = slugify(nome) || ("grupo-" + Date.now());
  let slug = base;
  let n = 2;
  while (cache.grupos.some((g) => g.slug === slug)) slug = base + "-" + (n++);
  const novo: Grupo = { id: "g-" + slug + "-" + Date.now(), nome: nome.trim(), slug };
  definir({ ...cache, grupos: [...cache.grupos, novo] });
  void supabase.from("grupos").insert({ id: novo.id, nome: novo.nome, slug: novo.slug });
  return novo;
}

export function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
