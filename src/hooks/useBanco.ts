import { useEffect, useState } from "react";
import { assinar, BANCO_VAZIO, carregarBanco, lerBanco, type Banco } from "@/lib/store";

export function useBanco(): Banco {
  const [banco, setBanco] = useState<Banco>(BANCO_VAZIO);

  useEffect(() => {
    const sincronizar = () => setBanco({ ...lerBanco() });
    const cancelar = assinar(sincronizar);
    void carregarBanco().then(sincronizar).catch(console.error);
    sincronizar();
    return () => {
      cancelar();
    };
  }, []);

  return banco;
}
