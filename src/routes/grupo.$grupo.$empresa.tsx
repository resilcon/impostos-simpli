import { createFileRoute, Link } from "@tanstack/react-router";
import { PainelEmpresa } from "@/components/PainelEmpresa";
import { useBanco } from "@/hooks/useBanco";

export const Route = createFileRoute("/grupo/$grupo/$empresa")({
  component: Pagina,
});

function Pagina() {
  const { grupo: slugGrupo, empresa: slugEmpresa } = Route.useParams();
  const banco = useBanco();
  const grupo = banco.grupos.find((g) => g.slug === slugGrupo);
  const empresa = banco.empresas.find((e) => e.slug === slugEmpresa && e.grupoId === grupo?.id);

  if (!banco.carregado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      </main>
    );
  }

  if (!grupo || !empresa) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Empresa nao encontrada neste grupo</h1>
          <Link to="/" className="mt-3 inline-block text-sm text-teal underline">
            Voltar para a selecao
          </Link>
        </div>
      </main>
    );
  }

  return (
    <PainelEmpresa
      empresa={empresa}
      voltarPara={`/grupo/${grupo.slug}`}
      voltarLabel={`Voltar ao ${grupo.nome}`}
      contexto={`${grupo.nome} - cenario de regularizacao`}
    />
  );
}
