import { createFileRoute, Link } from "@tanstack/react-router";
import { PainelEmpresa } from "@/components/PainelEmpresa";
import { useBanco } from "@/hooks/useBanco";

export const Route = createFileRoute("/painel/$empresa")({
  component: Pagina,
});

function Pagina() {
  const { empresa: slug } = Route.useParams();
  const banco = useBanco();
  const empresa = banco.empresas.find((e) => e.slug === slug);

  if (!banco.carregado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      </main>
    );
  }

  if (!empresa) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Empresa nao encontrada</h1>
          <Link to="/" className="mt-3 inline-block text-sm text-teal underline">
            Voltar para a selecao
          </Link>
        </div>
      </main>
    );
  }

  return <PainelEmpresa empresa={empresa} voltarPara="/" voltarLabel="Trocar empresa" />;
}
