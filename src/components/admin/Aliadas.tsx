import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Camera, ExternalLink, Heart, Loader2, Mail, MessageCircle, Plus, Sparkles, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Kpi, campo, haceDesde } from "@/components/admin/comun";
import { supabase } from "@/integrations/supabase/client";
import { todasLasFilas } from "@/lib/paginar";
import { slug as slugDe } from "@/lib/empleos";
import { empresaDe, leerMeta } from "@/lib/vacantes";

/**
 * Empresas aliadas: las que vinieron a Enlace por su cuenta.
 * Se llena sola leyendo la fuente de cada vacante (no hay que cargar nada a mano):
 *  ⭐ «Publica sola»  → publicó desde el sitio (panel o formulario /empresas).
 *  «Nos envió»        → nos mandó la vacante por correo, WhatsApp o mensaje.
 * El seguimiento (gracias, Instagram) se guarda en contenido_sitio, clave `aliadas_seguimiento`.
 */

const SOLA = ["Publicada por la empresa"];
const ENVIO = ["Texto de la empresa", "Mensaje de WhatsApp de la empresa", "Mensaje de reclutador", "Correo de la empresa a Enlace Laboral", "Correo recibido"];
const CLAVE = "aliadas_seguimiento";
const CONSULTORA = /consult|headhunt|outsourcing|reclutamiento|gesti[oó]n humana|talento humano|manpower/i;

type Nivel = "sola" | "envio" | "mano";
type Fila = { id: string; titulo: string; provincia: string; estado: string; created_at: string; destacada: boolean | null; etiquetas: string[] | null };
type Vac = { id: string; titulo: string; provincia: string; estado: string; creado: string; destacada: boolean; fuente: string; aplicar: string; empresa: string };
type Seg = { gracias?: string; instagram?: string; mano?: boolean };
type Aliada = { clave: string; nombre: string; nivel: Nivel; vacantes: Vac[]; activas: number; primera: string; ultima: string; contacto: string; cuenta: boolean; enRevision: number; consultora: boolean; sinNombre: boolean };

// supabase-js no pone comillas en los arreglos de .overlaps(): se las ponemos para que espacios y comas no rompan el filtro.
const lit = (t: string) => `"${t.replace(/["\\]/g, "\\$&")}"`;
const fecha = (f: string) => new Date(f).toLocaleDateString("es-DO", { timeZone: "America/Santo_Domingo", day: "numeric", month: "short", year: "numeric" });
const esCorreo = (t: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.exec(t)?.[0] ?? "";
const esTelefono = (t: string) => {
  const d = t.replace(/\D/g, "");
  const m = /(?:1)?(8[024]9\d{7})/.exec(d);
  return m ? `1${m[1]}` : "";
};

export function Aliadas() {
  const [vacs, setVacs] = useState<Vac[]>([]);
  const [cuentas, setCuentas] = useState<{ nombre: string; contacto: string }[]>([]);
  const [revision, setRevision] = useState<{ empresa: string; contacto: string }[]>([]);
  const [seg, setSeg] = useState<Record<string, Seg>>({});
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | Nivel | "pendientes">("todas");
  const [nueva, setNueva] = useState("");

  const cargar = useCallback(async () => {
    const tags = [...SOLA, ...ENVIO].map((f) => lit(`m:fuente:${f}`));
    const [v, { data: e }, { data: b }, { data: s }] = await Promise.all([
      todasLasFilas((a, z) => supabase.from("vacantes").select("id,titulo,provincia,estado,created_at,destacada,etiquetas", { count: "exact" }).overlaps("etiquetas", tags).order("created_at", { ascending: false }).order("id").range(a, z)).catch(() => []),
      supabase.from("empresas").select("nombre,contacto_nombre,contacto_email,contacto_telefono").limit(500),
      supabase.from("borradores").select("empresa,contacto_email,contacto_telefono").eq("estado", "pendiente").eq("origen", "empresa").limit(200),
      supabase.from("contenido_sitio").select("valor").eq("clave", CLAVE).maybeSingle(),
    ]);
    let s2: Record<string, Seg> = {};
    try { s2 = JSON.parse(s?.valor || "{}") as Record<string, Seg>; } catch { s2 = {}; }
    // Las añadidas a mano se buscan por su nombre exacto, con cualquier fuente.
    const aMano = Object.entries(s2).filter(([, x]) => x.mano).map(([k]) => k);
    let extra: Fila[] = [];
    if (aMano.length) {
      const { data: m } = await supabase.from("vacantes").select("id,titulo,provincia,estado,created_at,destacada,etiquetas").overlaps("etiquetas", aMano.map((n) => lit(`m:empresa:${n}`))).limit(500);
      extra = (m ?? []) as Fila[];
    }
    const vistas = new Set<string>();
    const lista: Vac[] = [];
    for (const r of [...((v ?? []) as Fila[]), ...extra]) {
      if (vistas.has(r.id)) continue;
      vistas.add(r.id);
      const { meta } = leerMeta(r.etiquetas);
      lista.push({ id: r.id, titulo: r.titulo, provincia: r.provincia, estado: r.estado, creado: r.created_at, destacada: !!r.destacada, fuente: meta["fuente"] ?? "", aplicar: meta["aplicar"] ?? "", empresa: empresaDe(meta["empresa"]) });
    }
    setVacs(lista);
    setCuentas((e ?? []).map((x) => ({ nombre: x.nombre, contacto: [x.contacto_nombre, x.contacto_email, x.contacto_telefono].filter(Boolean).join(" · ") })));
    setRevision((b ?? []).map((x) => ({ empresa: (x.empresa ?? "").trim(), contacto: [x.contacto_email, x.contacto_telefono].filter(Boolean).join(" · ") })));
    setSeg(s2);
    setCargando(false);
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const guardarSeg = async (nuevo: Record<string, Seg>) => {
    setSeg(nuevo);
    const { error } = await supabase.from("contenido_sitio").upsert({ clave: CLAVE, valor: JSON.stringify(nuevo), updated_at: new Date().toISOString() });
    if (error) toast.error("No se pudo guardar. Intenta otra vez.");
  };
  const marcar = (nombre: string, campoSeg: "gracias" | "instagram") => {
    const actual = seg[nombre] ?? {};
    const nuevo = { ...seg, [nombre]: { ...actual, [campoSeg]: actual[campoSeg] ? undefined : new Date().toISOString() } };
    void guardarSeg(nuevo);
  };

  const aliadas = useMemo<Aliada[]>(() => {
    const porEmpresa = new Map<string, Vac[]>();
    for (const v of vacs) {
      const k = v.empresa === "Empresa no indicada" ? `${v.empresa}|${esTelefono(v.aplicar) || esCorreo(v.aplicar) || v.id}` : v.empresa;
      porEmpresa.set(k, [...(porEmpresa.get(k) ?? []), v]);
    }
    const res: Aliada[] = [];
    for (const [clave, lista] of porEmpresa) {
      const nombre = lista[0]!.empresa;
      const sinNombre = nombre === "Empresa no indicada";
      const sola = lista.some((v) => SOLA.includes(v.fuente));
      const envio = lista.some((v) => ENVIO.includes(v.fuente));
      const nivel: Nivel = sola ? "sola" : envio ? "envio" : "mano";
      const cuenta = cuentas.find((c) => slugDe(c.nombre) === slugDe(nombre));
      const fechas = lista.map((v) => v.creado).sort();
      res.push({
        clave, nombre: sinNombre ? "Empresa sin nombre (confidencial)" : nombre, nivel, vacantes: lista,
        activas: lista.filter((v) => v.estado === "publicada").length,
        primera: fechas[0]!, ultima: fechas[fechas.length - 1]!,
        contacto: cuenta?.contacto || lista.map((v) => v.aplicar).find(Boolean) || "",
        cuenta: !!cuenta, enRevision: revision.filter((r) => slugDe(r.empresa) === slugDe(nombre)).length,
        consultora: CONSULTORA.test(nombre), sinNombre,
      });
    }
    // Empresas añadidas a mano que aún no tienen vacantes encontradas.
    for (const [n, x] of Object.entries(seg)) if (x.mano && !res.some((a) => a.clave === n)) res.push({ clave: n, nombre: n, nivel: "mano", vacantes: [], activas: 0, primera: "", ultima: "", contacto: "", cuenta: false, enRevision: 0, consultora: CONSULTORA.test(n), sinNombre: false });
    const orden = { sola: 0, envio: 1, mano: 2 } as const;
    return res.sort((a, b) => orden[a.nivel] - orden[b.nivel] || (b.ultima || "").localeCompare(a.ultima || ""));
  }, [vacs, cuentas, revision, seg]);

  // Las que mandaron vacantes por el formulario y todavía esperan aprobación.
  const esperando = useMemo(() => {
    const m = new Map<string, { empresa: string; contacto: string; n: number }>();
    for (const r of revision) {
      if (!r.empresa || aliadas.some((a) => slugDe(a.nombre) === slugDe(r.empresa))) continue;
      const k = slugDe(r.empresa);
      m.set(k, { empresa: r.empresa, contacto: r.contacto, n: (m.get(k)?.n ?? 0) + 1 });
    }
    return [...m.values()];
  }, [revision, aliadas]);

  const pendiente = (a: Aliada) => !a.sinNombre && (!seg[a.clave]?.gracias || !seg[a.clave]?.instagram);
  const visibles = aliadas.filter((a) => filtro === "todas" || (filtro === "pendientes" ? pendiente(a) : a.nivel === filtro));
  const nuevasSemana = aliadas.filter((a) => a.primera && Date.now() - new Date(a.primera).getTime() < 7 * 864e5).length;

  const destacar = async (a: Aliada, si: boolean) => {
    const ids = a.vacantes.filter((v) => v.estado === "publicada").map((v) => v.id);
    if (!ids.length) return void toast.error("No tiene vacantes publicadas ahora mismo.");
    const { error } = await supabase.from("vacantes").update({ destacada: si }).in("id", ids);
    if (error) return void toast.error("No se pudo cambiar");
    toast.success(si ? `${a.nombre}: sus ${ids.length} vacante(s) salen destacadas en la página` : "Destacado quitado");
    await cargar();
  };

  const agregar = () => {
    const n = nueva.trim();
    if (n.length < 2) return;
    setNueva("");
    void guardarSeg({ ...seg, [n]: { ...(seg[n] ?? {}), mano: true } }).then(() => void cargar());
    toast.success(`${n} agregada. Si tiene vacantes con ese nombre exacto, aparecen solas.`);
  };
  const quitarMano = (n: string) => {
    const { [n]: _fuera, ...resto } = seg;
    void guardarSeg(resto).then(() => void cargar());
  };

  const textoGracias = (a: Aliada) => `Hola, equipo de ${a.nombre}. Le escribimos de Enlace Laboral RD para darles las gracias por publicar con nosotros. Su vacante ya está a la vista de miles de personas en República Dominicana y la vamos a destacar en la página y en nuestro Instagram @enlacelaboralrd. Cuando tengan otra posición abierta, aquí estamos. Equipo de Empleo · enlacelaboralrd.com`;

  if (cargando) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        Las empresas y reclutadores que vinieron a Enlace por su cuenta. <b>Se llena sola</b>: cada vez que una empresa publica desde la página (o nos envía su vacante), aparece aquí. Dales las gracias, destácalas en la página y ponlas primero en Instagram: así vuelven a publicar.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi titulo="⭐ Publican solas" valor={aliadas.filter((a) => a.nivel === "sola").length} tono="bien" onClick={() => setFiltro("sola")} />
        <Kpi titulo="Nos enviaron vacantes" valor={aliadas.filter((a) => a.nivel === "envio").length} onClick={() => setFiltro("envio")} />
        <Kpi titulo="Vacantes activas de aliadas" valor={aliadas.reduce((s, a) => s + a.activas, 0)} />
        <Kpi titulo="Por agradecer o publicar" valor={aliadas.filter(pendiente).length} tono={aliadas.some(pendiente) ? "ojo" : "bien"} nota={nuevasSemana ? `${nuevasSemana} nueva(s) esta semana` : undefined} onClick={() => setFiltro("pendientes")} />
      </div>

      {esperando.length > 0 && (
        <div className="space-y-2 rounded-2xl border-2 border-[#c27803]/40 bg-surface p-4">
          <p className="font-bold">Empresas nuevas esperando tu aprobación ({esperando.length})</p>
          <p className="text-xs text-muted-foreground">Mandaron su vacante por el formulario de /empresas. Apruébala en Vacantes → Borradores y pasa sola a esta lista como ⭐.</p>
          {esperando.map((x) => <p key={x.empresa} className="rounded-xl bg-muted/50 p-3 text-sm"><b>{x.empresa}</b> · {x.n} vacante(s){x.contacto ? ` · ${x.contacto}` : ""}</p>)}
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar aliadas">
        {([["todas", "Todas"], ["sola", "⭐ Publican solas"], ["envio", "Nos enviaron"], ["mano", "Agregadas a mano"], ["pendientes", "Por agradecer o publicar"]] as const).map(([id, t]) => (
          <Button key={id} size="sm" variant={filtro === id ? "secondary" : "ghost"} onClick={() => setFiltro(id)} className={filtro === id ? "font-bold" : ""}>{t}</Button>
        ))}
      </div>

      {visibles.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay empresas en este filtro.</p>}

      {visibles.map((a) => {
        const s = seg[a.clave] ?? {};
        const correo = esCorreo(a.contacto);
        const tel = esTelefono(a.contacto);
        const todasDest = a.activas > 0 && a.vacantes.filter((v) => v.estado === "publicada").every((v) => v.destacada);
        const nueva7 = a.primera && Date.now() - new Date(a.primera).getTime() < 7 * 864e5;
        return (
          <section key={a.clave} className={`rounded-2xl border bg-surface p-5 ${a.nivel === "sola" ? "border-2 border-[#c27803]/50" : "border-border"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-extrabold">
                  {a.nombre}
                  {a.nivel === "sola" && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#fdf3d7] px-2 py-0.5 text-[11px] font-bold text-[#8a5a00]"><Star className="size-3.5" aria-hidden="true" /> Publica sola</span>}
                  {a.nivel === "envio" && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">Nos envió sus vacantes</span>}
                  {a.nivel === "mano" && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Agregada a mano</span>}
                  {a.cuenta && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success"><BadgeCheck className="size-3.5" aria-hidden="true" /> Tiene cuenta</span>}
                  {nueva7 && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive"><Sparkles className="size-3.5" aria-hidden="true" /> Nueva</span>}
                  {a.consultora && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Consultora</span>}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.vacantes.length ? `${a.vacantes.length} vacante(s) · ${a.activas} activa(s) · primera ${fecha(a.primera)} · última ${haceDesde(a.ultima)}` : "Todavía no encontramos vacantes con este nombre exacto."}
                  {a.enRevision ? ` · ${a.enRevision} esperando aprobación` : ""}
                </p>
                {a.contacto && <p className="mt-0.5 text-sm text-muted-foreground">Contacto: {a.contacto}</p>}
                {a.vacantes.length > 0 && <p className="mt-2 text-sm">{a.vacantes.slice(0, 6).map((v) => `${v.titulo} (${v.provincia})`).join(" · ")}{a.vacantes.length > 6 ? ` y ${a.vacantes.length - 6} más` : ""}</p>}
                {a.sinNombre && <p className="mt-2 text-xs font-semibold text-[#9a6b00]">Pregúntale el nombre de la empresa: sin nombre no se puede destacar en la página ni en Instagram.</p>}
              </div>
              {a.nivel === "mano" && <Button size="sm" variant="ghost" onClick={() => quitarMano(a.clave)} aria-label={`Quitar ${a.nombre}`}><X /></Button>}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant={s.gracias ? "secondary" : "default"} onClick={() => marcar(a.clave, "gracias")}><Heart /> {s.gracias ? `Gracias dadas · ${fecha(s.gracias)}` : "Ya le di las gracias"}</Button>
              <Button size="sm" variant={s.instagram ? "secondary" : "default"} onClick={() => marcar(a.clave, "instagram")} disabled={a.sinNombre}><Camera /> {s.instagram ? `Salió en Instagram · ${fecha(s.instagram)}` : "Ya salió en Instagram"}</Button>
              <Button size="sm" variant="outline" onClick={() => void destacar(a, !todasDest)} disabled={a.sinNombre || a.activas === 0}><Star /> {todasDest ? "Destacada en la página · quitar" : "Destacar sus vacantes en la página"}</Button>
              {correo && <Button size="sm" variant="outline" asChild><a href={`mailto:${correo}?subject=${encodeURIComponent("Gracias por publicar en Enlace Laboral RD")}&body=${encodeURIComponent(textoGracias(a))}`}><Mail /> Escribirle</a></Button>}
              {tel && <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${tel}?text=${encodeURIComponent(textoGracias(a))}`} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a></Button>}
              {!a.sinNombre && <Button size="sm" variant="ghost" asChild><a href={`/empresa/${slugDe(a.nombre)}`} target="_blank" rel="noopener noreferrer"><ExternalLink /> Ver su perfil</a></Button>}
            </div>
          </section>
        );
      })}

      <div className="rounded-2xl border border-dashed border-border p-4">
        <p className="text-sm font-bold">Agregar una empresa a mano</p>
        <p className="mt-1 text-xs text-muted-foreground">Para una empresa que te apoya pero cuyas vacantes entraron por otra vía. Escribe el nombre tal como sale en sus vacantes y se juntan solas.</p>
        <div className="mt-2 flex gap-2">
          <input value={nueva} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") agregar(); }} maxLength={120} placeholder="Nombre de la empresa" className={`${campo} mt-0`} />
          <Button onClick={agregar} disabled={nueva.trim().length < 2}><Plus /> Agregar</Button>
        </div>
      </div>
    </div>
  );
}
