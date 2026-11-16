import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import logoResilcon from "@/assets/resilcon-horizontal.png.asset.json";
import { useBanco } from "@/hooks/useBanco";
import { criarEmpresa, criarGrupo } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Selecao,
});

const NOVA_EMPRESA = "__nova_empresa__";
const NOVO_GRUPO = "__novo_grupo__";

function Selecao() {
  const banco = useBanco();
  const navigate = useNavigate();
  const avulsas = banco.empresas.filter((e) => !e.grupoId);
  const [selecionada, setSelecionada] = useState(() => `grupo:grupo-farmanda`);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  const criandoEmpresa = selecionada === NOVA_EMPRESA;
  const criandoGrupo = selecionada === NOVO_GRUPO;
  const criando = criandoEmpresa || criandoGrupo;

  const irParaGrupo = (grupo: string) => navigate({ to: "/grupo/$grupo", params: { grupo } });
  const irParaEmpresa = (empresa: string) =>
    navigate({ to: "/painel/$empresa", params: { empresa } });

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (criando) {
      const limpo = nome.trim();
      if (limpo.length < 2) return setErro("Informe um nome com pelo menos 2 caracteres.");
      if (limpo.length > 80) return setErro("O nome deve ter ate 80 caracteres.");
      if (criandoGrupo) {
        const g = criarGrupo(limpo);
        return irParaGrupo(g.slug);
      }
      const nova = criarEmpresa(limpo, null);
      return irParaEmpresa(nova.slug);
    }
    const [tipo, slug] = selecionada.split(":");
    if (tipo === "grupo") irParaGrupo(slug);
    else irParaEmpresa(slug);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div className="card-panel relative w-full max-w-md p-8 sm:p-10">
        <img
          src={logoResilcon.url}
          alt="Resilcon Contabilidade Consultiva"
          className="mx-auto h-20 w-auto sm:h-24"
        />
        <h1 className="mt-8 text-center text-2xl font-semibold text-ink">
          Selecione o grupo ou a empresa
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Abra um estudo ja cadastrado ou inicie um novo em branco.
        </p>

        <form onSubmit={entrar} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="empresa"
              className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
            >
              Grupo ou empresa
            </label>
            <select
              id="empresa"
              value={selecionada}
              onChange={(e) => {
                setSelecionada(e.target.value);
                setErro("");
              }}
              className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink"
            >
              {banco.grupos.length ? (
                <optgroup label="Grupos">
                  {banco.grupos.map((g) => (
                    <option key={g.id} value={`grupo:${g.slug}`}>
                      {g.nome} ({banco.empresas.filter((e) => e.grupoId === g.id).length} empresas)
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {avulsas.length ? (
                <optgroup label="Empresas avulsas">
                  {avulsas.map((e) => (
                    <option key={e.id} value={`empresa:${e.slug}`}>
                      {e.nome}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <optgroup label="Cadastrar">
                <option value={NOVA_EMPRESA}>+ Cadastrar nova empresa avulsa</option>
                <option value={NOVO_GRUPO}>+ Cadastrar novo grupo</option>
              </optgroup>
            </select>
          </div>

          {criando ? (
            <div className="space-y-2">
              <label
                htmlFor="nome"
                className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
              >
                {criandoGrupo ? "Nome do novo grupo" : "Nome da nova empresa"}
              </label>
              <input
                id="nome"
                value={nome}
                maxLength={80}
                autoFocus
                onChange={(e) => {
                  setNome(e.target.value);
                  setErro("");
                }}
                className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink"
              />
            </div>
          ) : null}

          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-panel"
          >
            {criando ? "Cadastrar e abrir" : "Abrir painel"}
          </button>
        </form>
      </div>
    </main>
  );
}
