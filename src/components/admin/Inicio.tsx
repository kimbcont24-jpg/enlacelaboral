import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kpi, Tarjeta, haceDesde, type TabId } from "@/components/admin/comun";
import { supabase } from "@/integrations/supabase/client";

export type Panel = {
  vacantes: { publicadas: number; por_vencer: number; vencidas: number; cerradas: number; sin_salario: number; destacadas: number; con_redes: number; hoy: number };
  borradores: { pendientes: number; mas_antiguo_horas: number };
  aplicaciones: { total: number; d7: number; d1: number };
  pedidos: { sin_pagar: number; por_entregar: number; entregados: number; cobrado: number };
  alertas: { activas: number; nuevas_7d: number };
  empresas: { total: number; verificadas: number };
  reportes: { nuevos: number; vacantes_con_3: number };
  hojas: { activas: number; con_error: number };
  ultimas: { correo: string | null; avisos_pedidos: string | null; renovaciones: string | null; hojas: string | null; redes: string | null; alertas: string | null };
  serie: { dia: string; vacantes: number; aplicaciones: number }[];
  top_provincias: { nombre: string; n: number }[];
  top_fuentes: { nombre: string; n: number }[];
};

export function usePanel() {
  return useQuery({
    queryKey: ["panel_admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("panel_admin");
      if (error) throw error;
      return data as unknown as Panel;
    },
    refetchInterval: 60_000,
  });
}

function usePago() {
  return useQuery({
    queryKey: ["pago_config"],
    queryFn: async () => {
      const { data } = await supabase.from("contenido_sitio").select("clave,valor").in("clave", ["pago_datos", "pago_whatsapp"]);
      const m = new Map((data ?? []).map((r) => [r.clave, r.valor]));
      return { datos: (m.get("pago_datos") ?? "").trim().length > 5, whatsapp: (m.get("pago_whatsapp") ?? "").replace(/\D/g, "").length >= 10 };
    },
  });
}

type Aviso = { nivel: "mal" | "ojo" | "info"; texto: string; ir: TabId; boton: string };

function avisos(p: Panel): Aviso[] {
  const a: Aviso[] = [];
  if (p.reportes.nuevos > 0) a.push({ nivel: p.reportes.vacantes_con_3 > 0 ? "mal" : "ojo", texto: `${p.reportes.nuevos} reporte${p.reportes.nuevos === 1 ? "" : "s"} de vacantes sin revisar${p.reportes.vacantes_con_3 > 0 ? ` (${p.reportes.vacantes_con_3} vacante${p.reportes.vacantes_con_3 === 1 ? "" : "s"} con 3 o más)` : ""}`, ir: "reportes", boton: "Revisar" });
  if (p.pedidos.por_entregar > 0) a.push({ nivel: "ojo", texto: `${p.pedidos.por_entregar} pedido${p.pedidos.por_entregar === 1 ? "" : "s"} pagado${p.pedidos.por_entregar === 1 ? "" : "s"} por entregar (la promesa es en menos de 24 horas)`, ir: "pedidos", boton: "Ver pedidos" });
  if (p.pedidos.sin_pagar > 0) a.push({ nivel: "info", texto: `${p.pedidos.sin_pagar} pedido${p.pedidos.sin_pagar === 1 ? "" : "s"} esperando que lleguen el pago`, ir: "pedidos", boton: "Ver pedidos" });
  if (p.borradores.pendientes > 0) a.push({ nivel: p.borradores.mas_antiguo_horas >= 24 ? "mal" : "ojo", texto: `${p.borradores.pendientes} borrador${p.borradores.pendientes === 1 ? "" : "es"} por revisar${p.borradores.mas_antiguo_horas >= 1 ? ` (el más viejo lleva ${p.borradores.mas_antiguo_horas} h)` : ""}`, ir: "borradores", boton: "Revisar" });
  if (p.vacantes.por_vencer > 0) a.push({ nivel: "ojo", texto: `${p.vacantes.por_vencer} vacante${p.vacantes.por_vencer === 1 ? "" : "s"} vence${p.vacantes.por_vencer === 1 ? "" : "n"} en 5 días o menos`, ir: "vacantes", boton: "Ver vacantes" });
  if (p.hojas.con_error > 0) a.push({ nivel: "mal", texto: `${p.hojas.con_error} hoja${p.hojas.con_error === 1 ? "" : "s"} de Google con error en la última sincronización`, ir: "masiva", boton: "Ver hojas" });
  return a;
}

const colorNivel = { mal: "border-destructive/40 bg-destructive/5", ojo: "border-[#e0b100]/50 bg-[#fff8dc]", info: "border-border bg-surface" } as const;

function Barras({ serie }: { serie: Panel["serie"] }) {
  const max = Math.max(1, ...serie.flatMap((s) => [s.vacantes, s.aplicaciones]));
  const ancho = 560, alto = 140, margen = 22, paso = (ancho - margen) / serie.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${ancho} ${alto + 22}`} className="w-full" role="img" aria-label={`Vacantes publicadas y aplicaciones por día, últimos ${serie.length} días`}>
        {serie.map((s, i) => {
          const x = margen + i * paso;
          const h1 = (s.vacantes / max) * alto, h2 = (s.aplicaciones / max) * alto;
          return (
            <g key={s.dia}>
              <rect x={x + 2} y={alto - h1} width={paso / 2 - 3} height={h1} rx={2} className="fill-primary"><title>{`${s.dia}: ${s.vacantes} vacantes`}</title></rect>
              <rect x={x + paso / 2} y={alto - h2} width={paso / 2 - 3} height={h2} rx={2} className="fill-cta"><title>{`${s.dia}: ${s.aplicaciones} aplicaciones`}</title></rect>
              {i % 2 === 0 && <text x={x + paso / 2} y={alto + 15} textAnchor="middle" className="fill-muted-foreground text-[10px]">{s.dia.slice(8)}</text>}
            </g>
          );
        })}
        <line x1={margen} x2={ancho} y1={alto} y2={alto} className="stroke-border" />
        <text x={0} y={10} className="fill-muted-foreground text-[10px]">{max}</text>
      </svg>
      <figcaption className="mt-1 flex gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-primary" /> Vacantes publicadas</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-cta" /> Aplicaciones</span></figcaption>
    </figure>
  );
}

function Lista({ items }: { items: { nombre: string; n: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  if (!items.length) return <p className="text-sm text-muted-foreground">Sin datos todavía.</p>;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.nombre} className="text-sm">
          <div className="flex justify-between gap-3"><span className="min-w-0 truncate">{i.nombre}</span><span className="font-bold tabular-nums">{i.n}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(i.n / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function Inicio({ onIr }: { onIr: (t: TabId) => void }) {
  const q = usePanel();
  const pago = usePago();
  if (q.isLoading) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (q.isError || !q.data) return <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">No pude cargar el resumen. <button className="font-bold underline" onClick={() => void q.refetch()}>Intentar de nuevo</button></p>;
  const p = q.data;
  const lista = avisos(p);
  const pctSalario = p.vacantes.publicadas ? Math.round(((p.vacantes.publicadas - p.vacantes.sin_salario) / p.vacantes.publicadas) * 100) : 0;
  const listo = [
    { ok: !!pago.data?.datos, texto: "Datos para pagar escritos (banco, cuenta, titular)", ir: "textos" as TabId },
    { ok: !!pago.data?.whatsapp, texto: "WhatsApp para recibir comprobantes", ir: "textos" as TabId },
    { ok: p.vacantes.publicadas >= 15, texto: `15 o más vacantes publicadas (hay ${p.vacantes.publicadas})`, ir: "publicar" as TabId },
    { ok: p.vacantes.publicadas > 0 && pctSalario >= 50, texto: `La mitad o más con salario visible (hoy ${pctSalario}%)`, ir: "vacantes" as TabId },
    { ok: p.reportes.nuevos === 0, texto: "Sin reportes de vacantes pendientes", ir: "reportes" as TabId },
  ];
  const hechos = listo.filter((l) => l.ok).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Se actualiza solo cada minuto. Hora de República Dominicana.</p>
        <Button variant="outline" size="sm" onClick={() => void q.refetch()} disabled={q.isFetching}><RefreshCw className={q.isFetching ? "animate-spin" : ""} /> Actualizar</Button>
      </div>

      <Tarjeta titulo={lista.length ? "Requiere tu atención" : "Todo al día"}>
        {lista.length === 0 ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="size-5" aria-hidden="true" /> No hay nada pendiente ahora mismo.</p>
        ) : (
          <ul className="space-y-2">
            {lista.map((a) => (
              <li key={a.texto} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${colorNivel[a.nivel]}`}>
                <p className="flex items-start gap-2 text-sm font-semibold">{a.nivel !== "info" && <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${a.nivel === "mal" ? "text-destructive" : "text-[#9a6b00]"}`} aria-hidden="true" />}{a.texto}</p>
                <Button size="sm" variant="outline" onClick={() => onIr(a.ir)}>{a.boton}</Button>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi titulo="Vacantes activas" valor={p.vacantes.publicadas} nota={`${p.vacantes.hoy} nueva${p.vacantes.hoy === 1 ? "" : "s"} en 24 h`} onClick={() => onIr("vacantes")} />
        <Kpi titulo="Con salario visible" valor={`${pctSalario}%`} tono={pctSalario >= 50 ? "bien" : "ojo"} nota={`${p.vacantes.sin_salario} sin salario`} />
        <Kpi titulo="Aplicaciones (7 días)" valor={p.aplicaciones.d7} nota={`${p.aplicaciones.total} en total`} onClick={() => onIr("aplicaciones")} />
        <Kpi titulo="Suscriptores de alertas" valor={p.alertas.activas} nota={`${p.alertas.nuevas_7d} nuevos en 7 días`} />
        <Kpi titulo="Cobrado en CV" valor={`RD$${p.pedidos.cobrado.toLocaleString("es-DO")}`} tono={p.pedidos.cobrado > 0 ? "bien" : "normal"} nota={`${p.pedidos.entregados} entregado${p.pedidos.entregados === 1 ? "" : "s"}`} onClick={() => onIr("pedidos")} />
        <Kpi titulo="Por vencer (5 días)" valor={p.vacantes.por_vencer} tono={p.vacantes.por_vencer ? "ojo" : "normal"} nota="Se avisa a la empresa sola" />
        <Kpi titulo="Empresas" valor={p.empresas.total} nota={`${p.empresas.verificadas} verificada${p.empresas.verificadas === 1 ? "" : "s"}`} onClick={() => onIr("empresas")} />
        <Kpi titulo="Reportes nuevos" valor={p.reportes.nuevos} tono={p.reportes.nuevos ? "mal" : "bien"} onClick={() => onIr("reportes")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta titulo="Últimos 14 días" className="lg:col-span-2"><Barras serie={p.serie} /></Tarjeta>
        <Tarjeta titulo="Lista para lanzar" ayuda={`${hechos} de ${listo.length} listos`}>
          <ul className="space-y-2">
            {listo.map((l) => (
              <li key={l.texto} className="flex items-start gap-2 text-sm">
                {l.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Listo" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Pendiente" />}
                <span className="flex-1">{l.texto}</span>
                {!l.ok && <button type="button" onClick={() => onIr(l.ir)} className="shrink-0 text-xs font-bold text-primary hover:underline">Ir</button>}
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Tarjeta titulo="Vacantes por provincia"><Lista items={p.top_provincias} /></Tarjeta>
        <Tarjeta titulo="De dónde vienen"><Lista items={p.top_fuentes} /></Tarjeta>
        <Tarjeta titulo="Automatizaciones" ayuda="Última actividad registrada.">
          <ul className="space-y-1.5 text-sm">
            {([["Correo → borradores", p.ultimas.correo], ["Aviso de pedidos", p.ultimas.avisos_pedidos], ["Avisos de renovación", p.ultimas.renovaciones], ["Hojas de Google", p.ultimas.hojas], ["Compartir en redes", p.ultimas.redes], ["Alertas a suscriptores", p.ultimas.alertas]] as const).map(([n, f]) => (
              <li key={n} className="flex justify-between gap-3"><span>{n}</span><span className="text-muted-foreground">{haceDesde(f)}</span></li>
            ))}
          </ul>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => onIr("control")}>Abrir control</Button>
        </Tarjeta>
      </div>
    </div>
  );
}
