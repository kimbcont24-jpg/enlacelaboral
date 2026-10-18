import { Info, TriangleAlert } from "lucide-react";

import { useControles } from "@/lib/controles";

/** Barra de aviso que se enciende desde Admin → Control. */
export function AvisoGlobal() {
  const { aviso } = useControles();
  if (!aviso.visible) return null;
  const alerta = aviso.tipo === "alerta";
  return (
    <div role="status" className={alerta ? "bg-[#ffd84d] text-[#4a3000]" : "bg-primary text-primary-foreground"}>
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-sm font-semibold">
        {alerta ? <TriangleAlert className="size-4 shrink-0" aria-hidden="true" /> : <Info className="size-4 shrink-0" aria-hidden="true" />}
        {aviso.texto}
      </p>
    </div>
  );
}
