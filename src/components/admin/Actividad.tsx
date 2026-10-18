import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { fechaRD } from "@/components/admin/comun";
import { CONTROLES } from "@/lib/controles";
import { supabase } from "@/integrations/supabase/client";

type Fila = { id: number; at: string; usuario: string | null; tabla: string; accion: string; detalle: Record<string, unknown> | null };

const s = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const estadoPedido: Record<string, string> = { pendiente_pago: "falta el pago", pagado: "pagado", entregado: "entregado" };
const etiquetaControl = Object.fromEntries(CONTROLES.map((c) => [c.clave, c.titulo]));

export function describir(f: Fila): string {
  const d = f.detalle ?? {};
  switch (f.tabla) {
    case "vacantes":
      if (f.accion === "INSERT") return `Publicó la vacante «${s(d["titulo"])}»`;
      if (f.accion === "DELETE") return `Eliminó la vacante «${s(d["titulo"])}»`;
      if (d["renovada"] === true) return `Renovó 30 días la vacante «${s(d["titulo"])}»`;
      if (d["de"] !== d["a"]) return `Cambió «${s(d["titulo"])}» de ${s(d["de"])} a ${s(d["a"])}`;
      return `Editó la vacante «${s(d["titulo"])}»`;
    case "pedidos_servicios":
      if (f.accion === "INSERT") return `Pedido nuevo ${s(d["codigo"])} (${s(d["paquete"])})`;
      if (f.accion === "DELETE") return `Eliminó el pedido ${s(d["codigo"])}`;
      return `Pedido ${s(d["codigo"])}: ${estadoPedido[s(d["a"])] ?? s(d["a"])}`;
    case "contenido_sitio": {
      const clave = s(d["clave"]);
      if (clave.startsWith("ctl_") && clave !== "ctl_aviso") return `${s(d["valor"]) === "off" ? "Pausó" : "Encendió"}: ${etiquetaControl[clave] ?? clave}`;
      if (clave === "ctl_aviso") return s(d["valor"]) === "on" ? "Publicó el aviso del sitio" : "Quitó el aviso del sitio";
      if (clave.startsWith("aviso_")) return "Editó el aviso del sitio";
      return `Editó el texto «${clave}»`;
    }
    case "hojas_vacantes":
      if (f.accion === "INSERT") return `Conectó la hoja «${s(d["nombre"])}»`;
      if (f.accion === "DELETE") return `Quitó la hoja «${s(d["nombre"])}»`;
      return `${d["activa"] === true ? "Reactivó" : "Pausó"} la hoja «${s(d["nombre"])}»`;
    case "user_roles":
      return f.accion === "INSERT" ? "Dio acceso de administrador a una cuenta" : "Quitó acceso de administrador a una cuenta";
    case "borradores":
      return `Borrador «${s(d["titulo"]) || "sin título"}»: ${s(d["de"])} → ${s(d["a"])}`;
    case "empresas":
      return `${d["verificada"] === true ? "Verificó" : "Quitó la verificación de"} la empresa ${s(d["nombre"])}`;
    case "reportes":
      return `Reporte de vacante: ${s(d["a"])}`;
    default:
      return `${f.accion} en ${f.tabla}`;
  }
}

const SECCIONES: Record<string, string> = { todo: "Todo", vacantes: "Vacantes", pedidos_servicios: "Pedidos", contenido_sitio: "Textos y controles", borradores: "Borradores", empresas: "Empresas", reportes: "Reportes", user_roles: "Accesos", hojas_vacantes: "Hojas" };

export function Actividad() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [quien, setQuien] = useState<Record<string, string>>({});
  const [seccion, setSeccion] = useState("todo");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      const [{ data }, { data: us }] = await Promise.all([supabase.from("registro_actividad").select("*").order("at", { ascending: false }).limit(300), supabase.rpc("usuarios_admin")]);
      setFilas((data ?? []) as Fila[]);
      setQuien(Object.fromEntries((us ?? []).map((u) => [u.id, u.nombre || u.email])));
      setCargando(false);
    })();
  }, []);

  const lista = useMemo(() => filas.filter((f) => seccion === "todo" || f.tabla === seccion), [filas, seccion]);
  if (cargando) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">Aquí queda anotado quién cambió qué y cuándo (últimos 300 movimientos). «Sistema o visitante» son cambios hechos por automatizaciones o por personas sin cuenta, como un pedido nuevo.</p>
      <select value={seccion} onChange={(e) => setSeccion(e.target.value)} aria-label="Filtrar" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
        {Object.entries(SECCIONES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
      </select>
      {lista.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no hay movimientos.</p>}
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {lista.map((f) => (
          <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <span className="min-w-0 flex-1 font-medium">{describir(f)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{f.usuario ? quien[f.usuario] ?? "Administración" : "Sistema o visitante"} · {fechaRD(f.at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
