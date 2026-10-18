import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TabId = "inicio" | "fotos" | "publicar" | "borradores" | "masiva" | "vacantes" | "reportes" | "aplicaciones" | "pedidos" | "empresas" | "control" | "actividad" | "usuarios" | "estudio" | "exportar" | "textos";

export const campo = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
export const rotulo = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function Tarjeta({ titulo, ayuda, children, className }: { titulo?: string; ayuda?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-surface p-5", className)}>
      {titulo && <h2 className="text-base font-extrabold">{titulo}</h2>}
      {ayuda && <p className="mt-1 text-sm text-muted-foreground">{ayuda}</p>}
      <div className={titulo || ayuda ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function Kpi({ valor, titulo, nota, tono = "normal", onClick }: { valor: ReactNode; titulo: string; nota?: string; tono?: "normal" | "bien" | "ojo" | "mal"; onClick?: () => void }) {
  const color = { normal: "text-foreground", bien: "text-success", ojo: "text-[#9a6b00]", mal: "text-destructive" }[tono];
  const contenido = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className={cn("mt-1 text-3xl font-extrabold tabular-nums", color)}>{valor}</p>
      {nota && <p className="mt-1 text-xs text-muted-foreground">{nota}</p>}
    </>
  );
  const clases = "rounded-2xl border border-border bg-surface p-4 text-left";
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(clases, "lift transition hover:border-primary")}>{contenido}</button>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}

export function haceDesde(fecha: string | null | undefined): string {
  if (!fecha) return "nunca";
  const min = Math.max(1, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  const d = Math.round(min / 1440);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

export function fechaRD(fecha: string): string {
  return new Date(fecha).toLocaleString("es-DO", { timeZone: "America/Santo_Domingo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function Interruptor({ activo, onCambio, etiqueta, deshabilitado }: { activo: boolean; onCambio: (v: boolean) => void; etiqueta: string; deshabilitado?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={() => onCambio(!activo)}
      className={cn("relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50", activo ? "border-success bg-success" : "border-border bg-muted")}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", activo ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}
