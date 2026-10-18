import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, ExternalLink, ImagePlus, Loader2, RefreshCw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { campo, rotulo } from "@/components/admin/comun";
import { supabase } from "@/integrations/supabase/client";
import { areas, modalidades, nivelesExperiencia, provincias, tiposEmpleo } from "@/lib/data";
import type { Borrador } from "@/lib/extraer";
import { AVISO_CORREO, analizarTexto, crearLector, esRepetida, prepararFoto, type Lector, type Modo } from "@/lib/ocr";
import { avisarPublicada, filaDesde, miEmpresa } from "@/lib/publicar";
import { SELECT, rowToVacante, useVacantes, type VacanteRow } from "@/lib/vacantes";
import { useQueryClient } from "@tanstack/react-query";

type Estado = "cola" | "leyendo" | "listo" | "error" | "publicando" | "publicada";

type Item = {
  id: string;
  nombre: string;
  preview: string;
  estado: Estado;
  progreso: number;
  modo: Modo;
  b: Borrador;
  texto: string;
  avisos: string[];
  riesgo: string[];
  error?: string;
  vacanteId?: string;
};

const FUENTES = ["Flyer de la empresa", "Instagram", "WhatsApp", "LinkedIn", "Facebook", "Otra"];

const vacioB = (fuente: string, redes: boolean): Borrador => ({ titulo: "", empresa: "", provincia: "Distrito Nacional", modalidad: "Presencial", tipo: "Tiempo completo", experiencia: "Sin experiencia", area: "Administración", salarioMin: "", salarioMax: "", descripcion: "", requisitos: "", aplicar: "", fuente, fuenteUrl: "", redes });

const completa = (it: Item) => it.estado === "listo" && !!it.b.titulo.trim() && !!it.b.aplicar.trim() && !it.avisos.some((a) => a.startsWith(AVISO_CORREO)) && it.riesgo.filter((r) => !r.startsWith("No trae forma")).length === 0;

export function DesdeFotos({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const { jobs } = useVacantes();
  const [items, setItems] = useState<Item[]>([]);
  const [fuente, setFuente] = useState(FUENTES[0]!);
  const [redes, setRedes] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const lector = useRef<Lector | null>(null);
  const ocupado = useRef(false);
  const blobs = useRef(new Map<string, Blob>());
  const archivos = useRef(new Map<string, File>());
  const entrada = useRef<HTMLInputElement | null>(null);
  const camara = useRef<HTMLInputElement | null>(null);

  const cambiar = useCallback((id: string, f: (i: Item) => Item) => setItems((xs) => xs.map((x) => (x.id === id ? f(x) : x))), []);

  const agregar = useCallback((lista: File[]) => {
    const imgs = lista.filter((f) => f.type.startsWith("image/"));
    if (imgs.length < lista.length) toast.error("Solo se aceptan imágenes (JPG, PNG o WebP).");
    if (!imgs.length) return;
    if (imgs.length > 40) toast.message("Son muchas fotos: las leo de una en una, puede tardar unos minutos.");
    const nuevos: Item[] = imgs.map((f) => {
      const id = crypto.randomUUID();
      archivos.current.set(id, f);
      return { id, nombre: f.name || "foto", preview: URL.createObjectURL(f), estado: "cola", progreso: 0, modo: "auto", b: vacioB(fuente, redes), texto: "", avisos: [], riesgo: [] };
    });
    setItems((xs) => [...xs, ...nuevos]);
  }, [fuente, redes]);

  // pegar imágenes con Ctrl+V desde cualquier parte de la pantalla
  useEffect(() => {
    const alPegar = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).filter((x) => x.type.startsWith("image/"));
      if (f.length) { e.preventDefault(); agregar(f); }
    };
    window.addEventListener("paste", alPegar);
    return () => window.removeEventListener("paste", alPegar);
  }, [agregar]);

  // procesa la cola de una en una
  useEffect(() => {
    const siguiente = items.find((i) => i.estado === "cola");
    if (!siguiente || ocupado.current) return;
    ocupado.current = true;
    void (async () => {
      const id = siguiente.id;
      cambiar(id, (i) => ({ ...i, estado: "leyendo", progreso: 0 }));
      try {
        const file = archivos.current.get(id)!;
        const { lectura, subir } = await prepararFoto(file);
        blobs.current.set(id, subir);
        lector.current ??= await crearLector();
        const crudo = await lector.current.leer(lectura, siguiente.modo, (p) => cambiar(id, (i) => ({ ...i, progreso: Math.round(p * 100) })));
        const a = analizarTexto(crudo);
        if (a.texto.replace(/\s/g, "").length < 25) throw new Error("No encontré texto legible. Prueba con una foto más clara o con «Releer modo flyer».");
        cambiar(id, (i) => ({ ...i, estado: "listo", progreso: 100, b: { ...a.b, fuente: i.b.fuente, redes: i.b.redes }, texto: a.texto, avisos: a.avisos, riesgo: a.riesgo }));
      } catch (e) {
        cambiar(id, (i) => ({ ...i, estado: "error", error: e instanceof Error ? e.message : "No pude leer la imagen." }));
      } finally {
        ocupado.current = false;
        setItems((xs) => [...xs]);
      }
    })();
  }, [items, cambiar]);

  useEffect(() => () => { void lector.current?.cerrar(); }, []);

  const releer = (id: string) => cambiar(id, (i) => ({ ...i, estado: "cola", modo: "flyer", error: undefined }));
  const quitar = (id: string) => {
    setItems((xs) => { const x = xs.find((i) => i.id === id); if (x) URL.revokeObjectURL(x.preview); return xs.filter((i) => i.id !== id); });
    blobs.current.delete(id); archivos.current.delete(id);
  };
  const campoB = (id: string, k: keyof Borrador, v: string | boolean) => cambiar(id, (i) => {
    const b = { ...i.b, [k]: v } as Borrador;
    return { ...i, b, avisos: k === "aplicar" ? i.avisos.filter((a) => !a.startsWith(AVISO_CORREO)) : i.avisos, riesgo: k === "aplicar" ? i.riesgo.filter((r) => !r.startsWith("No trae forma")).concat(String(v).trim() ? [] : ["No trae forma de contacto ni de aplicar"]) : i.riesgo };
  });

  const publicar = useCallback(async (it: Item, silencioso = false): Promise<boolean> => {
    if (!it.b.titulo.trim()) { if (!silencioso) toast.error("Falta el puesto."); return false; }
    if (!it.b.fuente.trim()) { if (!silencioso) toast.error("Falta la fuente."); return false; }
    cambiar(it.id, (i) => ({ ...i, estado: "publicando" }));
    try {
      let imagen = "";
      const blob = blobs.current.get(it.id);
      if (blob) {
        const ruta = `${new Date().getFullYear()}/${crypto.randomUUID()}.jpg`;
        const { error: eSub } = await supabase.storage.from("flyers").upload(ruta, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (eSub) toast.error("No pude guardar la imagen. La vacante se publica sin ella.");
        else imagen = supabase.storage.from("flyers").getPublicUrl(ruta).data.publicUrl;
      }
      const fila = filaDesde({ ...it.b, imagen });
      const empresaId = await miEmpresa(uid);
      const { data, error } = await supabase.from("vacantes").insert({ ...fila, empresa_id: empresaId, owner_id: uid, estado: "publicada" }).select(SELECT).single();
      if (error || !data) throw error ?? new Error("no se guardó");
      const v = rowToVacante(data as unknown as VacanteRow);
      avisarPublicada(v);
      cambiar(it.id, (i) => ({ ...i, estado: "publicada", vacanteId: v.id }));
      return true;
    } catch {
      cambiar(it.id, (i) => ({ ...i, estado: "listo" }));
      if (!silencioso) toast.error("No se pudo publicar. Intenta otra vez.");
      return false;
    }
  }, [cambiar, uid]);

  const publicarUna = async (it: Item) => {
    if (await publicar(it)) { toast.success("¡Publicada!"); await qc.invalidateQueries({ queryKey: ["vacantes"] }); }
  };

  const listas = useMemo(() => items.filter(completa), [items]);
  const publicarListas = async () => {
    let ok = 0;
    for (const it of listas) if (await publicar(it, true)) ok++;
    await qc.invalidateQueries({ queryKey: ["vacantes"] });
    toast[ok === listas.length ? "success" : "message"](`${ok} de ${listas.length} publicadas.`);
  };

  const pendientes = items.filter((i) => i.estado === "cola" || i.estado === "leyendo").length;

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); agregar(Array.from(e.dataTransfer.files)); }}
        className={`rounded-3xl border-2 border-dashed p-6 text-center transition-colors sm:p-10 ${arrastrando ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
      >
        <ImagePlus className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-extrabold">Sube las fotos de las vacantes</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">Puedes elegir muchas a la vez, arrastrarlas aquí o pegarlas con Ctrl+V. Leo el texto de cada una, armo la vacante y tú solo revisas y publicas. La imagen original se guarda y se muestra en la vacante.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={() => entrada.current?.click()}><ImagePlus /> Elegir fotos</Button>
          <Button variant="outline" onClick={() => camara.current?.click()}><Camera /> Tomar foto</Button>
        </div>
        <input ref={entrada} type="file" accept="image/*" multiple className="hidden" aria-label="Elegir fotos" onChange={(e) => { agregar(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        <input ref={camara} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Tomar foto" onChange={(e) => { agregar(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        <div className="mx-auto mt-5 grid max-w-xl gap-3 text-left sm:grid-cols-2">
          <label className="block"><span className={rotulo}>Fuente de estas fotos</span><select className={campo} value={fuente} onChange={(e) => { setFuente(e.target.value); setItems((xs) => xs.map((i) => (i.estado === "listo" || i.estado === "cola" ? { ...i, b: { ...i.b, fuente: e.target.value } } : i))); }}>{FUENTES.map((f) => (<option key={f}>{f}</option>))}</select></label>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" className="size-4" checked={redes} onChange={(e) => { setRedes(e.target.checked); setItems((xs) => xs.map((i) => (i.estado === "listo" || i.estado === "cola" ? { ...i, b: { ...i.b, redes: e.target.checked } } : i))); }} /><span>Autorizaron compartirlas en redes</span></label>
        </div>
        <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground">Sube solo flyers que la empresa te envió o que ella misma publica para que se difundan.</p>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm"><strong>{items.length}</strong> foto{items.length === 1 ? "" : "s"} · {items.filter((i) => i.estado === "listo").length} por revisar · {items.filter((i) => i.estado === "publicada").length} publicadas{pendientes > 0 && <> · <Loader2 className="inline size-3.5 animate-spin" /> leyendo {pendientes}</>}</p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={listas.length === 0} onClick={() => void publicarListas()}><Send /> Publicar las {listas.length} completas</Button>
            <Button variant="outline" onClick={() => setItems((xs) => xs.filter((i) => { if (i.estado === "publicada") { URL.revokeObjectURL(i.preview); return false; } return true; }))}>Limpiar publicadas</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((it) => (
          <Tarjeta key={it.id} it={it} repetida={it.estado === "listo" && esRepetida(it.b, jobs)} onCampo={(k, v) => campoB(it.id, k, v)} onPublicar={() => void publicarUna(it)} onQuitar={() => quitar(it.id)} onReleer={() => releer(it.id)} />
        ))}
      </div>
    </div>
  );
}

function Tarjeta({ it, repetida, onCampo, onPublicar, onQuitar, onReleer }: { it: Item; repetida: boolean; onCampo: (k: keyof Borrador, v: string | boolean) => void; onPublicar: () => void; onQuitar: () => void; onReleer: () => void }) {
  const hecha = it.estado === "publicada";
  return (
    <article className={`grid gap-4 rounded-2xl border bg-surface p-4 sm:grid-cols-[180px_1fr] ${hecha ? "border-success/40 opacity-80" : "border-border"}`}>
      <a href={it.preview} target="_blank" rel="noopener noreferrer" className="block self-start overflow-hidden rounded-xl border border-border bg-muted" aria-label={`Ver foto ${it.nombre}`}>
        <img src={it.preview} alt={`Foto de la vacante ${it.nombre}`} className="max-h-72 w-full object-contain" />
      </a>
      <div className="min-w-0">
        {(it.estado === "cola" || it.estado === "leyendo") && (
          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {it.estado === "cola" ? "En espera…" : `Leyendo la imagen… ${it.progreso}%`}{it.modo === "flyer" && " (modo flyer)"}</p>
        )}
        {it.estado === "error" && (
          <div className="space-y-3">
            <p className="flex items-start gap-2 text-sm font-semibold text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> {it.error}</p>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={onReleer}><RefreshCw /> Releer modo flyer</Button><Button size="sm" variant="ghost" onClick={onQuitar}><Trash2 /> Quitar</Button></div>
          </div>
        )}
        {hecha && (
          <p className="flex flex-wrap items-center gap-3 text-sm font-semibold text-success"><CheckCircle2 className="size-5" /> Publicada: {it.b.titulo}
            {it.vacanteId && <a href={`/vacantes/${it.vacanteId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Ver vacante <ExternalLink className="size-3.5" /></a>}
          </p>
        )}
        {(it.estado === "listo" || it.estado === "publicando") && (
          <div className="space-y-3">
            {repetida && <p className="rounded-lg border border-[#e0b100]/50 bg-[#fff8dc] px-3 py-2 text-sm font-semibold text-[#6b4a00]">Ya hay una vacante publicada con este puesto y empresa. Revisa que no sea repetida.</p>}
            {it.riesgo.filter((r) => !r.startsWith("No trae forma")).map((r) => (<p key={r} className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive">Ojo: {r}. Revísala bien antes de publicar.</p>))}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2"><span className={rotulo}>Puesto *</span><input className={campo} value={it.b.titulo} onChange={(e) => onCampo("titulo", e.target.value)} maxLength={120} /></label>
              <label className="block"><span className={rotulo}>Empresa</span><input className={campo} value={it.b.empresa} onChange={(e) => onCampo("empresa", e.target.value)} placeholder="Vacío si no la dicen" /></label>
              <label className="block"><span className={rotulo}>Provincia</span><select className={campo} value={it.b.provincia} onChange={(e) => onCampo("provincia", e.target.value)}>{provincias.slice(1).map((p) => (<option key={p}>{p}</option>))}</select></label>
              <label className="block"><span className={rotulo}>Salario desde (RD$)</span><input className={campo} inputMode="numeric" value={it.b.salarioMin} onChange={(e) => onCampo("salarioMin", e.target.value.replace(/\D/g, ""))} placeholder="Vacío si no lo dicen" /></label>
              <label className="block"><span className={rotulo}>Salario hasta</span><input className={campo} inputMode="numeric" value={it.b.salarioMax} onChange={(e) => onCampo("salarioMax", e.target.value.replace(/\D/g, ""))} /></label>
              <label className="block sm:col-span-2"><span className={rotulo}>Cómo aplicar (correo, WhatsApp o enlace) *</span><input className={campo} value={it.b.aplicar} onChange={(e) => onCampo("aplicar", e.target.value)} /></label>
            </div>
            {it.avisos.length > 0 && <ul className="space-y-1 text-xs text-muted-foreground">{it.avisos.map((a) => (<li key={a}>• {a}</li>))}</ul>}
            <details className="rounded-xl border border-border p-3 text-sm">
              <summary className="cursor-pointer font-semibold">Más detalles y texto leído</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block"><span className={rotulo}>Tipo</span><select className={campo} value={it.b.tipo} onChange={(e) => onCampo("tipo", e.target.value)}>{tiposEmpleo.map((t) => (<option key={t}>{t}</option>))}</select></label>
                <label className="block"><span className={rotulo}>Modalidad</span><select className={campo} value={it.b.modalidad} onChange={(e) => onCampo("modalidad", e.target.value)}>{modalidades.map((t) => (<option key={t}>{t}</option>))}</select></label>
                <label className="block"><span className={rotulo}>Experiencia</span><select className={campo} value={it.b.experiencia} onChange={(e) => onCampo("experiencia", e.target.value)}>{nivelesExperiencia.map((t) => (<option key={t}>{t}</option>))}</select></label>
                <label className="block"><span className={rotulo}>Área</span><select className={campo} value={it.b.area} onChange={(e) => onCampo("area", e.target.value)}>{areas.map((t) => (<option key={t}>{t}</option>))}</select></label>
                <label className="block sm:col-span-2"><span className={rotulo}>Requisitos (uno por línea)</span><textarea className={campo} rows={4} value={it.b.requisitos} onChange={(e) => onCampo("requisitos", e.target.value)} /></label>
                <label className="block sm:col-span-2"><span className={rotulo}>Funciones, beneficios y horario</span><textarea className={campo} rows={4} value={it.b.descripcion} onChange={(e) => onCampo("descripcion", e.target.value)} /></label>
                <label className="block"><span className={rotulo}>Fuente *</span><input className={campo} value={it.b.fuente} onChange={(e) => onCampo("fuente", e.target.value)} /></label>
                <label className="flex items-end gap-2 pb-2"><input type="checkbox" className="size-4" checked={!!it.b.redes} onChange={(e) => onCampo("redes", e.target.checked)} /><span>Autorizó compartir en redes</span></label>
              </div>
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{it.texto}</pre>
            </details>
            <div className="flex flex-wrap gap-2">
              <Button disabled={it.estado === "publicando"} onClick={onPublicar}>{it.estado === "publicando" ? <Loader2 className="animate-spin" /> : <Send />} Publicar esta</Button>
              <Button variant="outline" size="sm" onClick={onReleer} disabled={it.estado === "publicando"}><RefreshCw /> Releer modo flyer</Button>
              <Button variant="ghost" size="sm" onClick={onQuitar} disabled={it.estado === "publicando"}><Trash2 /> Quitar</Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
