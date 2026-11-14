import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Brain, ExternalLink, Eye, Heading2, Heading3, ImageUp, Italic, Lightbulb, Link2, List, ListOrdered, Loader2, Minus, PenLine, Plus, Quote, Save, Send, Star, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Contenido } from "@/components/blog/Contenido";
import { Etiqueta, Tapa } from "@/components/blog/Tapa";
import { CATEGORIAS, categoria, contarPalabras, fechaLarga, fraseDe, hacerSlug, minutosLectura, todosLosArticulos, type Articulo, type Categoria } from "@/lib/blog";
import { campo, rotulo, Tarjeta } from "@/components/admin/comun";

type Form = { id?: string; titulo: string; bajada: string; slug: string; categoria: Categoria; etiquetas: string; portada: string; autor: string; autor_cargo: string; destacado: boolean; contenido: string; estado: "borrador" | "publicado"; publicado_at: string | null };

const AUTORA = { autor: "Kimberly Contreras", autor_cargo: "Psicóloga organizacional · Gestión Humana" };
const vacio = (): Form => ({ titulo: "", bajada: "", slug: "", categoria: "reclutamiento", etiquetas: "", portada: "", ...AUTORA, destacado: false, contenido: "", estado: "borrador", publicado_at: null });
const COPIA = "enlace-blog-borrador";

const deArticulo = (a: Articulo): Form => ({ id: a.id, titulo: a.titulo, bajada: a.bajada, slug: a.slug, categoria: a.categoria, etiquetas: a.etiquetas.join(", "), portada: a.portada ?? "", autor: a.autor, autor_cargo: a.autor_cargo, destacado: a.destacado, contenido: a.contenido, estado: a.estado, publicado_at: a.publicado_at });

/** Sitio → Blog: escribir, revisar y publicar artículos de «Entre líneas». */
export function Blog() {
  const [lista, setLista] = useState<Articulo[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const cargar = useCallback(async () => setLista(await todosLosArticulos()), []);
  useEffect(() => { void cargar(); }, [cargar]);

  if (form) return <Editor inicial={form} onCerrar={() => { setForm(null); void cargar(); }} />;

  let copia: Form | null = null;
  try { const t = localStorage.getItem(COPIA); if (t) copia = JSON.parse(t) as Form; } catch { copia = null; }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Blog «Entre líneas»</h2>
          <p className="text-sm text-muted-foreground">Escribe aquí y publica en <a href="/blog" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">enlacelaboralrd.com/blog</a>. Lo que guardas como borrador no lo ve nadie.</p>
        </div>
        <Button onClick={() => setForm(vacio())}><Plus /> Nuevo artículo</Button>
      </div>

      {copia && copia.titulo + copia.contenido !== "" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d97706]/30 bg-[#fff8eb] p-4 text-sm">
          <span>Tienes un texto sin guardar: <b>{copia.titulo || "(sin título)"}</b></span>
          <span className="flex gap-2"><Button size="sm" onClick={() => setForm(copia)}><Undo2 /> Recuperarlo</Button><Button size="sm" variant="ghost" onClick={() => { try { localStorage.removeItem(COPIA); } catch { /* nada */ } void cargar(); }}>Descartar</Button></span>
        </div>
      )}

      {!lista ? <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div> : lista.length === 0 ? (
        <Tarjeta><p className="py-6 text-center text-muted-foreground">Todavía no hay artículos. Toca «Nuevo artículo» para escribir el primero.</p></Tarjeta>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((a, i) => (
            <button key={a.id} type="button" onClick={() => setForm(deArticulo(a))} className="group overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:border-primary">
              <Tapa titulo={a.titulo} cat={a.categoria} portada={a.portada} frase={fraseDe(a.contenido)} variante={i} className="aspect-[16/8]" />
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${a.estado === "publicado" ? "bg-[#e7f6ee] text-success" : "bg-muted text-muted-foreground"}`}>{a.estado === "publicado" ? "Publicado" : "Borrador"}</span>
                  {a.destacado && <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#9a6b00]"><Star className="size-3" /> Portada</span>}
                </div>
                <p className="mt-2 font-extrabold leading-snug">{a.titulo}</p>
                <p className="mt-1 text-xs text-muted-foreground">{categoria(a.categoria).t} · {a.estado === "publicado" ? fechaLarga(a.publicado_at) : `editado ${fechaLarga(a.updated_at)}`} · {minutosLectura(a.contenido)} min</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Tarjeta titulo="Cómo dar formato" ayuda="Escribe normal. Usa los botones de la barra o estas marcas al inicio de la línea:">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {[["## Subtítulo", "Sección (sale en el índice del artículo)"], ["> texto", "Cita grande, para la frase que quieres que se quede"], ["!> texto", "Caja «Dato clave»"], ["?> texto", "Caja «Mirada psicológica»"], ["- texto", "Viñeta"], ["1. texto", "Lista numerada"], ["**texto**", "Negrita"], ["[texto](enlace)", "Enlace"], ["![descripción](enlace)", "Imagen dentro del artículo"], ["---", "Separador"]].map(([m, d]) => (
            <li key={m} className="flex gap-3"><code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{m}</code><span className="text-muted-foreground">{d}</span></li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}

function Editor({ inicial, onCerrar }: { inicial: Form; onCerrar: () => void }) {
  const [f, setF] = useState<Form>(inicial);
  const [slugTocado, setSlugTocado] = useState(!!inicial.id);
  const [vista, setVista] = useState<"escribir" | "ver">("escribir");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const destino = useRef<"portada" | "cuerpo">("portada");
  const cambiado = useRef(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    cambiado.current = true;
    setF((x) => {
      const n = { ...x, [k]: v };
      if (k === "titulo" && !slugTocado) n.slug = hacerSlug(String(v));
      return n;
    });
  };

  // Copia de seguridad en este navegador mientras escribes (por si se cierra la pestaña).
  useEffect(() => {
    if (!cambiado.current) return;
    const t = setTimeout(() => { try { localStorage.setItem(COPIA, JSON.stringify(f)); } catch { /* sin espacio */ } }, 600);
    return () => clearTimeout(t);
  }, [f]);
  useEffect(() => {
    const avisar = (e: BeforeUnloadEvent) => { if (cambiado.current) e.preventDefault(); };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, []);

  const envolver = (antes: string, despues = "", ejemplo = "") => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b) || ejemplo;
    const nuevo = value.slice(0, a) + antes + sel + despues + value.slice(b);
    set("contenido", nuevo);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + antes.length, a + antes.length + sel.length); });
  };
  const linea = (marca: string, ejemplo: string) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const ini = value.lastIndexOf("\n", a - 1) + 1;
    const sel = value.slice(ini, b) || ejemplo;
    const hecho = sel.split("\n").map((l, i) => (marca === "1. " ? `${i + 1}. ` : marca) + l.replace(/^(#{2,3}\s|[?!]?>\s?|-\s|\d+\.\s)/, "")).join("\n");
    const pre = ini > 0 && value[ini - 2] !== undefined && value[ini - 1] === "\n" && value[ini - 2] !== "\n" ? "\n" : "";
    set("contenido", value.slice(0, ini) + pre + hecho + value.slice(Math.max(b, ini)));
    requestAnimationFrame(() => el.focus());
  };

  const subir = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Elige una imagen.");
    if (file.size > 8 * 1024 * 1024) return toast.error("La imagen pesa más de 8 MB.");
    setSubiendo(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const ruta = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("blog").upload(ruta, file, { contentType: file.type, cacheControl: "31536000" });
    setSubiendo(false);
    if (error) return toast.error(`No se pudo subir: ${error.message}`);
    const url = supabase.storage.from("blog").getPublicUrl(ruta).data.publicUrl;
    if (destino.current === "portada") set("portada", url);
    else envolver(`\n\n![`, `](${url})\n\n`, "Descripción de la imagen");
    toast.success("Imagen lista");
  };

  const guardar = async (estado: "borrador" | "publicado") => {
    if (f.titulo.trim().length < 5) return toast.error("Ponle un título.");
    if (contarPalabras(f.contenido) < 30) return toast.error("El artículo está muy corto todavía.");
    const slug = hacerSlug(f.slug || f.titulo);
    if (!slug) return toast.error("Revisa la dirección del artículo.");
    setGuardando(true);
    const fila = {
      titulo: f.titulo.trim(), bajada: f.bajada.trim(), slug, categoria: f.categoria, contenido: f.contenido.trim(),
      etiquetas: f.etiquetas.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 8),
      portada: f.portada.trim() || null, autor: f.autor.trim() || AUTORA.autor, autor_cargo: f.autor_cargo.trim(), destacado: f.destacado, estado,
      publicado_at: estado === "publicado" ? f.publicado_at ?? new Date().toISOString() : f.publicado_at,
    };
    const q = f.id ? supabase.from("blog_articulos").update(fila).eq("id", f.id).select("id").single() : supabase.from("blog_articulos").insert(fila).select("id").single();
    const { data, error } = await q;
    if (!error && f.destacado && data) await supabase.from("blog_articulos").update({ destacado: false }).neq("id", (data as { id: string }).id).eq("destacado", true);
    setGuardando(false);
    if (error) return toast.error(error.code === "23505" ? "Ya hay un artículo con esa dirección. Cambia el título o la dirección." : `No se pudo guardar: ${error.message}`);
    cambiado.current = false;
    try { localStorage.removeItem(COPIA); } catch { /* nada */ }
    setF((x) => ({ ...x, id: (data as { id: string }).id, slug, estado, publicado_at: fila.publicado_at }));
    toast.success(estado === "publicado" ? "¡Publicado! Ya está en el blog." : "Borrador guardado");
  };

  const borrar = async () => {
    if (!f.id) { cambiado.current = false; try { localStorage.removeItem(COPIA); } catch { /* nada */ } return onCerrar(); }
    if (!window.confirm("¿Borrar este artículo para siempre?")) return;
    const { error } = await supabase.from("blog_articulos").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Artículo borrado");
    onCerrar();
  };

  const cerrar = () => {
    if (cambiado.current && !window.confirm("Tienes cambios sin guardar. Se queda una copia en este navegador. ¿Salir?")) return;
    onCerrar();
  };

  const palabras = contarPalabras(f.contenido);
  const c = categoria(f.categoria);
  const herramientas: { I: typeof Bold; t: string; fn: () => void }[] = [
    { I: Heading2, t: "Subtítulo", fn: () => linea("## ", "Subtítulo") },
    { I: Heading3, t: "Subtítulo pequeño", fn: () => linea("### ", "Subtítulo") },
    { I: Bold, t: "Negrita", fn: () => envolver("**", "**", "texto") },
    { I: Italic, t: "Cursiva", fn: () => envolver("*", "*", "texto") },
    { I: Link2, t: "Enlace", fn: () => { const u = window.prompt("Pega el enlace (https://…)"); if (u) envolver("[", `](${u.trim()})`, "texto del enlace"); } },
    { I: List, t: "Viñetas", fn: () => linea("- ", "Punto") },
    { I: ListOrdered, t: "Lista numerada", fn: () => linea("1. ", "Paso") },
    { I: Quote, t: "Cita grande", fn: () => linea("> ", "La frase que quieres que se quede") },
    { I: Lightbulb, t: "Dato clave", fn: () => linea("!> ", "Un dato o consejo práctico") },
    { I: Brain, t: "Mirada psicológica", fn: () => linea("?> ", "Lo que pasa por dentro") },
    { I: Minus, t: "Separador", fn: () => envolver("\n\n---\n\n") },
    { I: ImageUp, t: "Imagen", fn: () => { destino.current = "cuerpo"; archivo.current?.click(); } },
  ];

  return (
    <div className="space-y-5">
      <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={(e) => { const x = e.target.files?.[0]; e.target.value = ""; if (x) void subir(x); }} />
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={cerrar}><X /> Cerrar</Button>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${f.estado === "publicado" ? "bg-[#e7f6ee] text-success" : "bg-muted text-muted-foreground"}`}>{f.estado === "publicado" ? "Publicado" : "Borrador"}</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">{palabras} palabras · {minutosLectura(f.contenido)} min</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {f.id && f.estado === "publicado" && <Button variant="ghost" size="sm" asChild><a href={`/blog/${f.slug}`} target="_blank" rel="noreferrer"><ExternalLink /> Ver</a></Button>}
          <Button variant="outline" size="sm" disabled={guardando} onClick={() => void guardar("borrador")}><Save /> {f.estado === "publicado" ? "Pasar a borrador" : "Guardar borrador"}</Button>
          <Button size="sm" disabled={guardando} onClick={() => void guardar("publicado")}>{guardando ? <Loader2 className="animate-spin" /> : <Send />} {f.estado === "publicado" ? "Guardar cambios" : "Publicar"}</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <input value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Título del artículo" className="w-full bg-transparent font-display text-[1.9rem] font-extrabold leading-tight tracking-tight text-[#0a2f5c] outline-none placeholder:text-muted-foreground/50 md:text-[2.3rem]" />
          <textarea value={f.bajada} onChange={(e) => set("bajada", e.target.value)} rows={2} placeholder="Bajada: una o dos frases que expliquen de qué va (sale debajo del título y en Google)" className="w-full resize-none bg-transparent text-lg leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/50" />

          <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1" role="tablist">
            {(["escribir", "ver"] as const).map((v) => <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => setVista(v)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold ${vista === v ? "bg-[#0a2f5c] text-white" : "text-muted-foreground hover:text-foreground"}`}>{v === "escribir" ? <><PenLine className="size-4" /> Escribir</> : <><Eye className="size-4" /> Cómo se verá</>}</button>)}
          </div>

          {vista === "escribir" ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface focus-within:border-primary">
              <div className="flex flex-wrap gap-0.5 border-b border-border bg-muted/50 p-1.5">
                {herramientas.map((h) => <button key={h.t} type="button" title={h.t} aria-label={h.t} onClick={h.fn} className="grid size-9 place-items-center rounded-lg text-[#0a2f5c] hover:bg-white hover:shadow-sm"><h.I className="size-4" /></button>)}
                {subiendo && <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Subiendo…</span>}
              </div>
              <textarea ref={area} value={f.contenido} onChange={(e) => set("contenido", e.target.value)} placeholder={"Empieza a escribir…\n\nUna línea en blanco separa los párrafos."} className="min-h-[60vh] w-full resize-y bg-transparent p-5 text-[1.05rem] leading-[1.75] outline-none" />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-10">
              <Etiqueta cat={f.categoria} />
              <h1 className="mt-3 font-display text-[2rem] font-extrabold leading-tight text-[#0a2f5c]">{f.titulo || "Sin título"}</h1>
              {f.bajada && <p className="mt-3 text-lg text-muted-foreground">{f.bajada}</p>}
              <div className="mt-8 max-w-[42rem]">{f.contenido.trim() ? <Contenido texto={f.contenido} color={c.color} /> : <p className="text-muted-foreground">Todavía no hay texto.</p>}</div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Tarjeta titulo="Portada">
            <Tapa titulo={f.titulo || "Título del artículo"} cat={f.categoria} portada={f.portada || null} frase={fraseDe(f.contenido)} className="aspect-[16/10] rounded-xl" />
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" disabled={subiendo} onClick={() => { destino.current = "portada"; archivo.current?.click(); }}><ImageUp /> {f.portada ? "Cambiar foto" : "Subir foto"}</Button>
              {f.portada && <Button size="sm" variant="ghost" onClick={() => set("portada", "")}>Quitar</Button>}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Sin foto, se arma una portada con los colores del tema. Usa fotos tuyas o de bancos gratis (Unsplash, Pexels).</p>
          </Tarjeta>

          <Tarjeta titulo="Detalles">
            <label className="block"><span className={rotulo}>Tema</span>
              <select value={f.categoria} onChange={(e) => set("categoria", e.target.value as Categoria)} className={campo}>{CATEGORIAS.map((x) => <option key={x.id} value={x.id}>{x.t}</option>)}</select>
            </label>
            <label className="mt-3 block"><span className={rotulo}>Etiquetas (separadas por coma)</span><input value={f.etiquetas} onChange={(e) => set("etiquetas", e.target.value)} placeholder="entrevista, primer empleo" className={campo} /></label>
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.destacado} onChange={(e) => set("destacado", e.target.checked)} className="size-4 accent-[#1d6ff2]" /> Ponerlo en la portada del blog</label>
          </Tarjeta>

          <Tarjeta titulo="Firma">
            <label className="block"><span className={rotulo}>Autora o autor</span><input value={f.autor} onChange={(e) => set("autor", e.target.value)} className={campo} /></label>
            <label className="mt-3 block"><span className={rotulo}>Cargo o descripción</span><input value={f.autor_cargo} onChange={(e) => set("autor_cargo", e.target.value)} className={campo} /></label>
          </Tarjeta>

          <Tarjeta titulo="Dirección">
            <div className="flex items-center rounded-xl border border-input bg-background text-sm focus-within:border-primary">
              <span className="pl-3 text-muted-foreground">/blog/</span>
              <input value={f.slug} onChange={(e) => { setSlugTocado(true); set("slug", hacerSlug(e.target.value)); }} className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 outline-none" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Si ya lo compartiste, mejor no cambiar la dirección: los enlaces viejos dejarían de funcionar.</p>
          </Tarjeta>

          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => void borrar()}><Trash2 /> {f.id ? "Borrar artículo" : "Descartar"}</Button>
        </aside>
      </div>
    </div>
  );
}
