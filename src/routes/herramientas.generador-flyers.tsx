import { createFileRoute, Link } from "@tanstack/react-router";
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertOctagon, ArrowUp, Check, ClipboardCopy, Download, Eye, ImagePlus, Lightbulb, Lock, Palette, Plus, RotateCcw, Share2, Sparkles, Trash2, Type, Wand2, X,
} from "lucide-react";

import { Flyer, type FlyerRef } from "@/components/flyers/Flyer";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { COMPROMISOS, type Compromiso } from "@/lib/inclusion";
import {
  BENEFICIOS, CABECERAS, coloresDelLogo, contraste, cssFuentes, DATOS_EJEMPLO, destinoQR, DISENO_INICIAL, FORMATOS, FUENTES, GOOGLE_FONTS, JORNADAS, leerImagen,
  imagenDeUrl, MODALIDADES, paletaDe, tomarDesdeVacante, PALETAS, PERIODOS, PLANTILLAS, slug, TEXTURAS, textoAlternativo, textoPublicacion, UBICACIONES,
  type Datos, type Diseno, type Mostrar, type PlantillaId,
} from "@/lib/flyers";
import { aplicarSugerencia, revisarFlyer, type Sugerencia } from "@/lib/lenguaje-inclusivo";

export const Route = createFileRoute("/herramientas/generador-flyers")({
  head: () => ({
    meta: [
      { title: "Generador de flyers de vacantes gratis | Enlace Laboral" },
      { name: "description", content: "Crea el flyer de tu vacante en minutos: 12 diseños, tus colores y tu logo, revisión de lenguaje inclusivo y descarga en PNG para Instagram, WhatsApp, LinkedIn o para imprimir. Gratis y sin registro." },
      { property: "og:title", content: "Generador de flyers de vacantes · Gratis" },
      { property: "og:description", content: "Diseños profesionales, lenguaje inclusivo y descarga al instante. Para reclutadores y empresas en RD." },
    ],
    links: [
      { rel: "canonical", href: "https://enlacelaboralrd.com/herramientas/generador-flyers" },
      { rel: "stylesheet", href: GOOGLE_FONTS },
    ],
  }),
  component: Generador,
});

const CLAVE = "enlace:flyer:v1";
const VACIO: Datos = {
  ...DATOS_EJEMPLO, empresa: "", puesto: "", cantidad: "", ubicacion: "", horario: "", salMin: "", salMax: "", beneficios: [], requisitos: ["", "", ""],
  funciones: [], compromisos: [], correo: "", whatsapp: "", enlace: "", extraAplicar: "", fechaLimite: "", logo: null, foto: null,
};

const campo = "mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const rotulo = "text-sm font-semibold";
const chipBase = "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition";
const chip = (on: boolean) => `${chipBase} ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary"}`;

function Seccion({ titulo, icono, children, extra }: { titulo: string; icono: ReactNode; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-extrabold">{icono}{titulo}</h2>
        {extra}
      </div>
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

/** Vista previa a escala: el flyer se dibuja a tamaño real y se achica para que quepa. */
function Escala({ ancho, alto, children, className = "" }: { ancho: number; alto: number; children: ReactNode; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.3);
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / ancho));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ancho]);
  return (
    <div ref={caja} className={`relative w-full overflow-hidden ${className}`} style={{ height: alto * k }}>
      <div style={{ width: ancho, height: alto, transform: `scale(${k})`, transformOrigin: "top left", position: "absolute", left: 0, top: 0 }}>{children}</div>
    </div>
  );
}

const Miniatura = memo(function Miniatura({ d, dis, qr, fl }: { d: Datos; dis: Diseno; qr: string | null; fl: number }) {
  const f = FORMATOS.find((x) => x.id === dis.formato) ?? FORMATOS[0];
  return <Escala ancho={f.w} alto={f.h}><Flyer d={d} dis={dis} qr={qr} fuentesListas={fl} /></Escala>;
});

/** Al elegir una plantilla se usan sus colores y su letra recomendados (salvo que la persona esté usando los colores de su marca). */
const conPlantilla = (dis: Diseno, id: PlantillaId): Diseno => {
  const t = PLANTILLAS.find((x) => x.id === id)!;
  return { ...dis, plantilla: id, fuente: t.fuente, paleta: dis.paleta === "marca" ? "marca" : t.paleta };
};

function Generador() {
  const [d, setD] = useState<Datos>(DATOS_EJEMPLO);
  const [dis, setDis] = useState<Diseno>(DISENO_INICIAL);
  const [listo, setListo] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [fl, setFl] = useState(0);
  const [lento, setLento] = useState<Datos>(DATOS_EJEMPLO);
  const [ocupado, setOcupado] = useState<"" | "png" | "compartir" | "copiar">("");
  const [aviso, setAviso] = useState("");
  const [nuevoBen, setNuevoBen] = useState("");
  const [cabOtra, setCabOtra] = useState(false);
  const [copiado, setCopiado] = useState("");
  const flyer = useRef<FlyerRef>(null);
  const vista = useRef<HTMLDivElement>(null);

  const formato = FORMATOS.find((x) => x.id === dis.formato) ?? FORMATOS[0];
  const fuente = FUENTES.find((x) => x.id === dis.fuente) ?? FUENTES[0];
  const paleta = paletaDe(dis);
  const sug = useMemo(() => revisarFlyer(d), [d]);
  const excluye = sug.filter((s) => s.tipo === "excluye");
  const lenguaje = sug.filter((s) => s.tipo === "lenguaje");
  const claridad = sug.filter((s) => s.tipo === "claridad");

  const [desde, setDesde] = useState("");
  // Cargar lo que la persona dejó a medias (solo en su navegador), o la vacante que abrió desde su panel.
  useEffect(() => {
    const v = tomarDesdeVacante();
    if (v) {
      setD({ ...VACIO, ...v.datos, requisitos: v.datos.requisitos?.length ? v.datos.requisitos : VACIO.requisitos });
      setDesde(v.vacante);
      setListo(true);
      void (async () => {
        const [logo, foto] = await Promise.all([v.logoUrl ? imagenDeUrl(v.logoUrl, 900) : null, v.fotoUrl ? imagenDeUrl(v.fotoUrl, 1600) : null]);
        if (logo || foto) setD((x) => ({ ...x, logo: logo ?? x.logo, foto: foto ?? x.foto }));
      })();
      return;
    }
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE) ?? "null");
      if (g?.d && g?.dis) {
        setD({ ...VACIO, ...g.d });
        setDis({ ...DISENO_INICIAL, ...g.dis, mostrar: { ...DISENO_INICIAL.mostrar, ...g.dis.mostrar } });
        setCabOtra(!CABECERAS.includes(g.d.cabecera));
      }
    } catch { /* sin almacenamiento */ }
    setListo(true);
  }, []);
  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(CLAVE, JSON.stringify({ d, dis })); } catch {
        try { localStorage.setItem(CLAVE, JSON.stringify({ d: { ...d, logo: null, foto: null }, dis })); } catch { /* lleno */ }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [d, dis, listo]);

  // Miniaturas: se actualizan con calma para no trabar mientras se escribe.
  useEffect(() => { const t = setTimeout(() => setLento(d), 700); return () => clearTimeout(t); }, [d]);

  // Fuentes: cuando terminan de cargar, el texto se vuelve a ajustar.
  useEffect(() => {
    const sube = () => setFl((n) => n + 1);
    void document.fonts?.ready.then(sube);
    document.fonts?.addEventListener?.("loadingdone", sube);
    return () => document.fonts?.removeEventListener?.("loadingdone", sube);
  }, []);
  useEffect(() => {
    void Promise.all([document.fonts?.load(`${fuente.peso} 60px "${fuente.titulo}"`), document.fonts?.load(`600 30px "${fuente.texto}"`), document.fonts?.load(`800 30px "${fuente.texto}"`)])
      .then(() => setFl((n) => n + 1)).catch(() => {});
    void cssFuentes(fuente).catch(() => {}); // se prepara para la descarga
  }, [fuente]);

  // Código QR (se genera en el navegador).
  const destino = destinoQR(d);
  useEffect(() => {
    let vivo = true;
    if (!destino) { setQr(null); return; }
    void import("qrcode").then(({ default: QR }) => QR.toDataURL(destino, { margin: 0, width: 520, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } }))
      .then((u) => { if (vivo) setQr(u); }).catch(() => setQr(null));
    return () => { vivo = false; };
  }, [destino]);

  const set = <K extends keyof Datos>(k: K, v: Datos[K]) => setD((x) => ({ ...x, [k]: v }));
  const setM = (k: keyof Mostrar, v: boolean) => setDis((x) => ({ ...x, mostrar: { ...x.mostrar, [k]: v } }));
  const setLista = (k: "requisitos" | "funciones", i: number, v: string) => setD((x) => { const l = [...x[k]]; l[i] = v; return { ...x, [k]: l }; });
  const quitar = (k: "requisitos" | "funciones", i: number) => setD((x) => ({ ...x, [k]: x[k].filter((_, j) => j !== i) }));
  const toggleBen = (b: string) => setD((x) => ({ ...x, beneficios: x.beneficios.includes(b) ? x.beneficios.filter((y) => y !== b) : [...x.beneficios, b] }));
  const toggleComp = (c: Compromiso) => setD((x) => ({ ...x, compromisos: x.compromisos.includes(c) ? x.compromisos.filter((y) => y !== c) : [...x.compromisos, c] }));

  const subir = async (k: "logo" | "foto", file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAviso("Sube una imagen (PNG, JPG, SVG o WEBP)."); return; }
    try {
      const src = await leerImagen(file, k === "logo" ? 900 : 1600);
      set(k, src);
      if (k === "foto") setM("foto", true);
      if (k === "logo") setM("logo", true);
    } catch { setAviso("No pudimos leer esa imagen. Prueba con otra."); }
  };
  const coloresLogo = async () => {
    if (!d.logo) return;
    const c = await coloresDelLogo(d.logo);
    if (!c) { setAviso("No encontramos colores claros en el logo. Elígelos a mano abajo."); return; }
    setDis((x) => ({ ...x, paleta: "marca", marcaPri: c[0], marcaAcc: c[1] }));
  };

  const irA = (s: Sugerencia) => {
    const [campoId, i] = s.campo.split(".");
    const id = campoId === "requisitos" ? `f-req-${i ?? 0}` : campoId === "funciones" ? `f-fun-${i ?? 0}` : campoId === "beneficios" ? "f-ben" : `f-${campoId}`;
    const el = document.getElementById(id) as HTMLInputElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el?.focus(), 350);
  };

  const generar = async (): Promise<string | null> => {
    const nodo = flyer.current?.nodo;
    if (!nodo) return null;
    const { toPng } = await import("html-to-image");
    const fontEmbedCSS = await cssFuentes(fuente).catch(() => undefined);
    const opts = { pixelRatio: formato.escala, cacheBust: false, width: formato.w, height: formato.h, fontEmbedCSS, style: { transform: "none" } };
    await toPng(nodo, opts).catch(() => null); // Safari necesita una primera pasada para cargar las imágenes
    return toPng(nodo, opts);
  };
  const nombre = `flyer-${slug(d.puesto)}-${formato.id}.png`;

  const descargar = async () => {
    if (excluye.length) return;
    setOcupado("png");
    setAviso("");
    try {
      const url = await generar();
      if (!url) throw new Error();
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setAviso("Listo: tu flyer se descargó.");
    } catch { setAviso("No se pudo crear la imagen. Intenta de nuevo o prueba otro navegador."); }
    setOcupado("");
  };
  const compartir = async () => {
    if (excluye.length) return;
    setOcupado("compartir");
    try {
      const url = await generar();
      if (!url) throw new Error();
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], nombre, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: textoPublicacion(d, "whatsapp") });
      else setAviso("Tu navegador no permite compartir directo. Descárgalo y súbelo desde la galería.");
    } catch { /* la persona canceló */ }
    setOcupado("");
  };
  const copiarImagen = async () => {
    if (excluye.length) return;
    setOcupado("copiar");
    try {
      const url = await generar();
      if (!url) throw new Error();
      const blob = await (await fetch(url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setAviso("Imagen copiada. Pégala en WhatsApp Web, LinkedIn o un correo.");
    } catch { setAviso("Tu navegador no permite copiar imágenes. Usa «Descargar»."); }
    setOcupado("");
  };
  const copiarTexto = async (k: string, t: string) => {
    try { await navigator.clipboard.writeText(t); setCopiado(k); setTimeout(() => setCopiado(""), 2200); } catch { setAviso("No se pudo copiar. Selecciona el texto y cópialo a mano."); }
  };

  const contrasteMalo = contraste(paleta.ink, paleta.bg) < 4.5 || contraste(paleta.onPri, paleta.pri) < 3;
  const [puede, setPuede] = useState({ compartir: false, copiar: false });
  useEffect(() => { setPuede({ compartir: "share" in navigator && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent), copiar: "ClipboardItem" in window }); }, []);
  const puedeCompartir = puede.compartir;
  const puedeCopiar = puede.copiar;

  const acciones = (
    <div className="grid gap-2">
      {excluye.length > 0 && (
        <p className="flex items-start gap-2 rounded-2xl bg-[#fdecea] p-3 text-sm font-semibold text-[#8a1c12]"><Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Para descargar, quita las frases que excluyen a personas. Están marcadas en rojo en la revisión.</p>
      )}
      <button type="button" onClick={() => void descargar()} disabled={!!ocupado || excluye.length > 0} className="btn-aplicar inline-flex h-13 min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-base disabled:opacity-50">
        <Download className="size-5" aria-hidden="true" />{ocupado === "png" ? "Creando imagen…" : `Descargar PNG · ${formato.nombre}`}
      </button>
      <div className="grid grid-cols-2 gap-2">
        {puedeCompartir && <button type="button" onClick={() => void compartir()} disabled={!!ocupado || excluye.length > 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-3 text-sm font-bold text-white hover:bg-[#178c46] disabled:opacity-50"><Share2 className="size-4" aria-hidden="true" />{ocupado === "compartir" ? "Preparando…" : "Compartir"}</button>}
        {puedeCopiar && <button type="button" onClick={() => void copiarImagen()} disabled={!!ocupado || excluye.length > 0} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-bold hover:border-primary disabled:opacity-50 ${puedeCompartir ? "" : "col-span-2"}`}><ClipboardCopy className="size-4" aria-hidden="true" />{ocupado === "copiar" ? "Copiando…" : "Copiar imagen"}</button>}
      </div>
      {aviso && <p className="text-sm font-semibold text-primary" role="status">{aviso}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="mx-auto max-w-7xl px-6 pb-6 pt-10 md:pt-14">
        <Link to="/herramientas" className="text-sm font-semibold text-primary hover:underline">← Herramientas gratis</Link>
        <h1 className="mt-3 max-w-4xl text-balance text-4xl font-extrabold tracking-tight md:text-5xl">El flyer de tu vacante, <span className="text-primary">listo en minutos.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">Llena los datos, elige uno de los 12 diseños y descárgalo para Instagram, WhatsApp, LinkedIn o para imprimir. Revisamos el lenguaje para que ninguna persona se sienta fuera. Gratis, sin registro y sin subir nada: todo se hace en tu navegador.</p>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 pb-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:pb-20">
        {/* Vista previa: arriba en el celular, fija a la derecha en computadora */}
        <aside ref={vista} className="scroll-mt-20 lg:sticky lg:top-20 lg:order-2 lg:self-start" aria-label="Vista previa del flyer">
          <div className="rounded-3xl border border-border bg-[#e9eef5] p-4 dark:bg-[#131c2b]">
            <div className="mx-auto overflow-hidden rounded-xl shadow-[0_18px_50px_-18px_rgba(10,47,92,.45)]" style={{ maxWidth: formato.h > 1500 ? 300 : 430 }}>
              <Escala ancho={formato.w} alto={formato.h}>
                <Flyer ref={flyer} d={d} dis={dis} qr={qr} fuentesListas={fl} />
              </Escala>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{formato.nombre} · {formato.w * formato.escala} × {Math.round(formato.h * formato.escala)} px · {PLANTILLAS.find((x) => x.id === dis.plantilla)?.nombre}</p>
          </div>
          <div className="mt-4">{acciones}</div>

          {/* Revisión inclusiva */}
          <section className="mt-5 rounded-3xl border border-border bg-surface p-5" aria-labelledby="rev-t">
            <h2 id="rev-t" className="flex items-center gap-2 text-lg font-extrabold"><Wand2 className="size-5 text-primary" aria-hidden="true" />Revisión de lenguaje inclusivo</h2>
            {sug.length === 0 ? (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[#e7f6ee] p-3 text-sm font-semibold text-[#0f5c35]"><Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Todo bien: tu flyer es claro e invita a cualquier persona a aplicar.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {[...excluye, ...lenguaje, ...claridad].map((s) => {
                  const est = s.tipo === "excluye" ? "border-[#f3b8b2] bg-[#fdecea] text-[#7a1810]" : s.tipo === "lenguaje" ? "border-[#cfe0fb] bg-[#eef4fd] text-[#0a2f5c]" : "border-[#f5dfae] bg-[#fff6e3] text-[#6b4300]";
                  const etiqueta = s.tipo === "excluye" ? "Excluye" : s.tipo === "lenguaje" ? "Lenguaje" : "Claridad";
                  return (
                    <li key={s.id} className={`rounded-2xl border p-3 text-sm ${est}`}>
                      <p><b>{etiqueta}:</b> «{s.frase}»{s.cambio ? <> → <b>«{s.cambio}»</b></> : null}</p>
                      <p className="mt-1 opacity-90">{s.motivo}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {s.cambio !== null && <button type="button" onClick={() => setD((x) => aplicarSugerencia(x, s))} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-white/80 px-3 font-bold hover:bg-white">{s.tipo === "excluye" ? <><Trash2 className="size-3.5" aria-hidden="true" />Quitar</> : <><Check className="size-3.5" aria-hidden="true" />Cambiar</>}</button>}
                        <button type="button" onClick={() => irA(s)} className="inline-flex min-h-9 items-center rounded-lg px-2 font-semibold underline-offset-2 hover:underline">Ir al campo</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {lenguaje.length > 1 && <button type="button" onClick={() => setD((x) => lenguaje.reduce((acc, s) => aplicarSugerencia(acc, s), x))} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground"><Sparkles className="size-4" aria-hidden="true" />Aplicar todos los cambios de lenguaje</button>}
            {contrasteMalo && <p className="mt-3 rounded-2xl bg-[#fff6e3] p-3 text-sm text-[#6b4300]"><b>Contraste bajo:</b> con estos colores el texto cuesta leerlo, sobre todo a personas con baja visión o en pantallas con poco brillo. Prueba un color principal más oscuro.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Revisión automática con reglas fijas, sin inteligencia artificial. Se basa en el Principio VII del Código de Trabajo, que prohíbe discriminar por sexo, edad, raza, religión u otras condiciones.</p>
          </section>
        </aside>

        <div className="grid gap-6 lg:order-1">
          {desde && (
            <p className="flex items-start gap-2 rounded-2xl border border-[#b7e4c7] bg-[#e7f6ee] p-4 text-sm text-[#0f5c35]">
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Cargamos los datos de tu vacante <b>«{desde}»</b>. El código QR lleva directo a ella en Enlace Laboral, así las aplicaciones te llegan al panel. Revisa los textos y elige el diseño.</span>
            </p>
          )}
          {listo && JSON.stringify(d) === JSON.stringify(DATOS_EJEMPLO) && (
            <p className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-4 text-sm">
              <span>Estos datos son un <b>ejemplo</b>. Cámbialos por los de tu vacante o empieza en blanco.</span>
              <button type="button" onClick={() => { setD(VACIO); setCabOtra(false); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 font-bold text-primary-foreground"><RotateCcw className="size-4" aria-hidden="true" />Empezar en blanco</button>
            </p>
          )}

          <Seccion titulo="Tu empresa" icono={<ImagePlus className="size-5 text-primary" aria-hidden="true" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={rotulo}>Nombre de la empresa</span><input id="f-empresa" className={campo} value={d.empresa} onChange={(e) => set("empresa", e.target.value.slice(0, 60))} placeholder="Ej.: Distribuidora del Cibao" /></label>
              <div>
                <span className={rotulo}>Logo (opcional)</span>
                <div className="mt-1 flex items-center gap-3">
                  {d.logo ? (
                    <>
                      <span className="flex h-12 w-24 items-center justify-center rounded-xl border border-border bg-white p-1.5"><img src={d.logo} alt="Tu logo" className="max-h-full max-w-full object-contain" /></span>
                      <button type="button" onClick={() => set("logo", null)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"><X className="size-4" aria-hidden="true" />Quitar</button>
                    </>
                  ) : (
                    <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 text-sm font-bold hover:border-primary">
                      <ImagePlus className="size-4" aria-hidden="true" />Subir logo
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void subir("logo", e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
            {d.logo && <button type="button" onClick={() => void coloresLogo()} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold hover:border-primary"><Palette className="size-4 text-primary" aria-hidden="true" />Usar los colores de mi logo</button>}
            <div>
              <span className={rotulo}>Foto del lugar o del equipo (opcional)</span>
              <p className="text-sm text-muted-foreground">Se ve en los diseños «Editorial» y «Arco». Una foto real genera más confianza que una imagen genérica.</p>
              <div className="mt-2 flex items-center gap-3">
                {d.foto ? (
                  <>
                    <img src={d.foto} alt="Tu foto" className="h-16 w-24 rounded-xl object-cover" />
                    <button type="button" onClick={() => set("foto", null)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"><X className="size-4" aria-hidden="true" />Quitar</button>
                    {!PLANTILLAS.find((x) => x.id === dis.plantilla)?.foto && <button type="button" onClick={() => setDis((x) => conPlantilla(x, "editorial"))} className="text-sm font-bold text-primary hover:underline">Ver con diseño Editorial</button>}
                  </>
                ) : (
                  <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 text-sm font-bold hover:border-primary">
                    <ImagePlus className="size-4" aria-hidden="true" />Subir foto
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void subir("foto", e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            </div>
          </Seccion>

          <Seccion titulo="La vacante" icono={<Type className="size-5 text-primary" aria-hidden="true" />}>
            <div>
              <span className={rotulo}>Frase de arriba</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {CABECERAS.map((c) => <button key={c} type="button" onClick={() => { set("cabecera", c); setCabOtra(false); }} className={chip(!cabOtra && d.cabecera === c)} aria-pressed={!cabOtra && d.cabecera === c}>{c}</button>)}
                <button type="button" onClick={() => setCabOtra(true)} className={chip(cabOtra)} aria-pressed={cabOtra}>Otra…</button>
              </div>
              {cabOtra && <input id="f-cabecera" className={campo} value={d.cabecera} onChange={(e) => set("cabecera", e.target.value.slice(0, 32))} placeholder="Escribe tu frase (corta)" autoFocus />}
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
              <label className="block"><span className={rotulo}>Puesto</span><input id="f-puesto" className={campo} value={d.puesto} onChange={(e) => set("puesto", e.target.value.slice(0, 70))} placeholder="Ej.: Auxiliar de almacén" /></label>
              <label className="block"><span className={rotulo}>Cantidad (opcional)</span><input className={campo} value={d.cantidad} onChange={(e) => set("cantidad", e.target.value.slice(0, 24))} placeholder="Ej.: 3 posiciones" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={rotulo}>Ubicación</span><input className={campo} list="lista-ubic" value={d.ubicacion} onChange={(e) => set("ubicacion", e.target.value.slice(0, 50))} placeholder="Ej.: Santiago, zona franca" /><datalist id="lista-ubic">{UBICACIONES.map((u) => <option key={u} value={u} />)}</datalist></label>
              <label className="block"><span className={rotulo}>Horario (opcional)</span><input className={campo} value={d.horario} onChange={(e) => set("horario", e.target.value.slice(0, 60))} placeholder="Ej.: Lunes a sábado, 8:00 a. m. a 5:00 p. m." /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><span className={rotulo}>Modalidad</span><div className="mt-2 flex flex-wrap gap-2">{MODALIDADES.map((m) => <button key={m} type="button" onClick={() => set("modalidad", d.modalidad === m ? "" : m)} className={chip(d.modalidad === m)} aria-pressed={d.modalidad === m}>{m}</button>)}</div></div>
              <label className="block"><span className={rotulo}>Jornada</span><select className={campo} value={d.jornada} onChange={(e) => set("jornada", e.target.value)}><option value="">No indicar</option>{[...JORNADAS, ...(d.jornada && !JORNADAS.includes(d.jornada) ? [d.jornada] : [])].map((j) => <option key={j}>{j}</option>)}</select></label>
            </div>
            <div>
              <span className={rotulo}>Salario</span>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px]">
                <label className="block"><span className="sr-only">Desde</span><input id="f-salMin" inputMode="numeric" className={campo} value={d.salMin} onChange={(e) => set("salMin", e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))} placeholder="Desde RD$" /></label>
                <label className="block"><span className="sr-only">Hasta</span><input inputMode="numeric" className={campo} value={d.salMax} onChange={(e) => set("salMax", e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))} placeholder="Hasta RD$ (opcional)" /></label>
                <label className="col-span-2 block sm:col-span-1"><span className="sr-only">Periodo</span><select className={campo} value={d.periodo} onChange={(e) => set("periodo", e.target.value)}>{PERIODOS.map((p) => <option key={p}>{p}</option>)}</select></label>
              </div>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground"><Lightbulb className="mt-0.5 size-4 shrink-0 text-[#b45309]" aria-hidden="true" />El salario es lo primero que pregunta casi todo candidato. Ponerlo te ahorra mensajes y atrae a quien de verdad encaja.</p>
            </div>
            <label className="block w-full sm:w-64"><span className={rotulo}>Fecha límite para aplicar (opcional)</span><input type="date" className={campo} value={d.fechaLimite} onChange={(e) => set("fechaLimite", e.target.value)} /></label>
          </Seccion>

          <Seccion titulo="Requisitos y funciones" icono={<Check className="size-5 text-primary" aria-hidden="true" />}>
            <div>
              <span className={rotulo}>Requisitos</span>
              <p className="text-sm text-muted-foreground">Pide solo lo indispensable. Mucha gente, sobre todo mujeres, no aplica si no cumple el 100 % de la lista.</p>
              <div className="mt-2 grid gap-2">
                {d.requisitos.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <input id={`f-req-${i}`} className={`${campo} mt-0`} value={r} onChange={(e) => setLista("requisitos", i, e.target.value.slice(0, 90))} placeholder={["Ej.: Bachiller terminado", "Ej.: Manejo de Excel básico", "Ej.: Licencia de conducir al día"][i] ?? "Otro requisito"} />
                    <button type="button" onClick={() => quitar("requisitos", i)} className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-background hover:text-foreground" aria-label={`Quitar requisito ${i + 1}`}><Trash2 className="size-4" /></button>
                  </div>
                ))}
                {d.requisitos.length < 6 && <button type="button" onClick={() => set("requisitos", [...d.requisitos, ""])} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-2 text-sm font-bold text-primary hover:underline"><Plus className="size-4" aria-hidden="true" />Agregar requisito</button>}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className={rotulo}>Lo que hará la persona (opcional)</span><Interruptor on={dis.mostrar.funciones} cambiar={(v) => setM("funciones", v)} texto="Mostrar" /></div>
              <div className="mt-2 grid gap-2">
                {d.funciones.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <input id={`f-fun-${i}`} className={`${campo} mt-0`} value={r} onChange={(e) => setLista("funciones", i, e.target.value.slice(0, 90))} placeholder="Ej.: Recibir y despachar mercancía" />
                    <button type="button" onClick={() => quitar("funciones", i)} className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-background hover:text-foreground" aria-label={`Quitar función ${i + 1}`}><Trash2 className="size-4" /></button>
                  </div>
                ))}
                {d.funciones.length < 4 && <button type="button" onClick={() => set("funciones", [...d.funciones, ""])} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-2 text-sm font-bold text-primary hover:underline"><Plus className="size-4" aria-hidden="true" />Agregar función</button>}
              </div>
            </div>
          </Seccion>

          <Seccion titulo="Lo que ofreces" icono={<Sparkles className="size-5 text-primary" aria-hidden="true" />} extra={<Interruptor on={dis.mostrar.beneficios} cambiar={(v) => setM("beneficios", v)} texto="Mostrar" />}>
            <div className="flex flex-wrap gap-2">
              {[...BENEFICIOS, ...d.beneficios.filter((b) => !BENEFICIOS.includes(b))].map((b) => <button key={b} type="button" onClick={() => toggleBen(b)} className={chip(d.beneficios.includes(b))} aria-pressed={d.beneficios.includes(b)}>{d.beneficios.includes(b) && <Check className="size-3.5" aria-hidden="true" />}{b}</button>)}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const b = nuevoBen.trim(); if (b && !d.beneficios.includes(b)) set("beneficios", [...d.beneficios, b.slice(0, 32)]); setNuevoBen(""); }}>
              <input id="f-ben" className={`${campo} mt-0`} value={nuevoBen} onChange={(e) => setNuevoBen(e.target.value)} placeholder="Otro beneficio (ej.: Bono de puntualidad)" />
              <button type="submit" className="inline-flex min-h-12 shrink-0 items-center gap-1 rounded-xl border border-border px-4 text-sm font-bold hover:border-primary"><Plus className="size-4" aria-hidden="true" />Agregar</button>
            </form>
            {d.beneficios.length > 5 && <p className="text-sm text-muted-foreground">Tip: con 3 a 5 beneficios el flyer se lee mejor.</p>}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className={rotulo}>Compromisos de inclusión</span><Interruptor on={dis.mostrar.compromisos} cambiar={(v) => setM("compromisos", v)} texto="Mostrar" /></div>
              <p className="text-sm text-muted-foreground">Márcalos solo si de verdad los cumples. Le dicen a la persona: «aquí también hay espacio para ti».</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMPROMISOS.map((c) => <button key={c.id} type="button" onClick={() => toggleComp(c.id)} className={chip(d.compromisos.includes(c.id))} aria-pressed={d.compromisos.includes(c.id)} title={c.d}>{d.compromisos.includes(c.id) && <Check className="size-3.5" aria-hidden="true" />}{c.t}</button>)}
              </div>
            </div>
          </Seccion>

          <Seccion titulo="Cómo aplicar" icono={<Share2 className="size-5 text-primary" aria-hidden="true" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={rotulo}>Correo</span><input id="f-correo" type="email" className={campo} value={d.correo} onChange={(e) => set("correo", e.target.value.trim().slice(0, 60))} placeholder="empleos@tuempresa.com" /></label>
              <label className="block"><span className={rotulo}>WhatsApp</span><input inputMode="tel" className={campo} value={d.whatsapp} onChange={(e) => set("whatsapp", e.target.value.slice(0, 16))} placeholder="809-000-0000" /></label>
            </div>
            <label className="block"><span className={rotulo}>Enlace para aplicar (opcional)</span><input className={campo} value={d.enlace} onChange={(e) => set("enlace", e.target.value.trim().slice(0, 120))} placeholder="Ej.: el enlace de tu vacante en enlacelaboralrd.com" /></label>
            <label className="block"><span className={rotulo}>Otra indicación (opcional)</span><input id="f-extraAplicar" className={campo} value={d.extraAplicar} onChange={(e) => set("extraAplicar", e.target.value.slice(0, 80))} placeholder="Ej.: O ven con tu CV a la Av. 27 de Febrero #100" /></label>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-background p-3 text-sm">
              <Interruptor on={dis.mostrar.qr} cambiar={(v) => setM("qr", v)} texto="Código QR" />
              <span className="text-muted-foreground">{destino ? (d.enlace.trim() ? "Lleva al enlace." : d.whatsapp.replace(/\D/g, "").length >= 10 ? "Abre WhatsApp con un mensaje listo para la vacante." : "Abre un correo para aplicar.") : "Agrega un correo, WhatsApp o enlace para crear el código."}</span>
            </div>
          </Seccion>

          <Seccion titulo="Diseño" icono={<Palette className="size-5 text-primary" aria-hidden="true" />}>
            <div>
              <span className={rotulo}>Formato</span>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {FORMATOS.map((f) => (
                  <button key={f.id} type="button" onClick={() => setDis((x) => ({ ...x, formato: f.id }))} aria-pressed={dis.formato === f.id} className={`flex min-h-11 flex-col items-start rounded-2xl border p-3 text-left transition ${dis.formato === f.id ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary"}`}>
                    <span className="flex items-center gap-2 text-sm font-bold"><span className="inline-block rounded-[3px] border-2 border-current" style={{ width: 12, height: (12 * f.h) / f.w }} />{f.nombre}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{f.uso}</span>
                  </button>
                ))}
              </div>
            </div>

            {dis.formato === "cuadrado" && (d.funciones.length > 0 || d.requisitos.length > 4) && dis.mostrar.funciones && <p className="-mt-2 text-sm text-muted-foreground">En el formato cuadrado cabe menos texto. Si la letra se ve pequeña, oculta «Lo que hará la persona» o deja menos requisitos.</p>}
            <div>
              <span className={rotulo}>Plantilla</span>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {PLANTILLAS.map((t) => {
                  const on = dis.plantilla === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => setDis((x) => conPlantilla(x, t.id))} aria-pressed={on} aria-label={`Plantilla ${t.nombre}: ${t.ideal}`} className={`group rounded-2xl border p-2 text-left transition ${on ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary"}`}>
                      <div className="pointer-events-none overflow-hidden rounded-lg" aria-hidden="true">
                        <Miniatura d={lento} dis={conPlantilla(dis, t.id)} qr={qr} fl={fl} />
                      </div>
                      <span className="mt-2 flex items-center gap-1.5 px-1 text-sm font-bold">{on && <Check className="size-4 text-primary" aria-hidden="true" />}{t.nombre}</span>
                      <span className="block px-1 text-xs leading-snug text-muted-foreground">{t.ideal}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className={rotulo}>Colores</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PALETAS.map((p) => {
                  const on = dis.paleta === p.id;
                  const pp = p.id === "marca" ? paletaDe({ ...dis, paleta: "marca" }) : p;
                  return (
                    <button key={p.id} type="button" onClick={() => setDis((x) => ({ ...x, paleta: p.id }))} aria-pressed={on} className={`flex min-h-11 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-semibold transition ${on ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"}`}>
                      <span className="flex overflow-hidden rounded-full border border-black/10"><span className="size-6" style={{ background: pp.pri }} /><span className="size-6" style={{ background: pp.acc }} /><span className="size-6" style={{ background: pp.bg }} /></span>{p.nombre}
                    </button>
                  );
                })}
              </div>
              {dis.paleta === "marca" && (
                <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl bg-background p-3">
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="color" value={dis.marcaPri} onChange={(e) => setDis((x) => ({ ...x, marcaPri: e.target.value }))} className="size-11 cursor-pointer rounded-lg border border-border bg-transparent" />Color principal</label>
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="color" value={dis.marcaAcc} onChange={(e) => setDis((x) => ({ ...x, marcaAcc: e.target.value }))} className="size-11 cursor-pointer rounded-lg border border-border bg-transparent" />Color de acento</label>
                  {d.logo && <button type="button" onClick={() => void coloresLogo()} className="text-sm font-bold text-primary hover:underline">Tomar del logo</button>}
                </div>
              )}
            </div>

            <div>
              <span className={rotulo}>Letra</span>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FUENTES.map((f) => (
                  <button key={f.id} type="button" onClick={() => setDis((x) => ({ ...x, fuente: f.id }))} aria-pressed={dis.fuente === f.id} className={`min-h-11 rounded-2xl border p-3 text-left transition ${dis.fuente === f.id ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary"}`}>
                    <span className="block truncate text-2xl leading-tight" style={{ fontFamily: `"${f.titulo}", sans-serif`, fontWeight: f.peso, textTransform: f.mayus ? "uppercase" : "none" }}>Vacante</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{f.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className={rotulo}>Textura del fondo</span>
              <div className="mt-2 flex flex-wrap gap-2">{TEXTURAS.map((t) => <button key={t.id} type="button" onClick={() => setDis((x) => ({ ...x, textura: t.id }))} className={chip(dis.textura === t.id)} aria-pressed={dis.textura === t.id}>{t.nombre}</button>)}</div>
            </div>

            <div>
              <span className={rotulo}>Mostrar en el flyer</span>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-3">
                <Interruptor on={dis.mostrar.logo} cambiar={(v) => setM("logo", v)} texto="Logo" />
                <Interruptor on={dis.mostrar.foto} cambiar={(v) => setM("foto", v)} texto="Foto" />
                <Interruptor on={dis.mostrar.antiestafa} cambiar={(v) => setM("antiestafa", v)} texto="«Aplicar es gratis»" />
                <Interruptor on={dis.mostrar.marca} cambiar={(v) => setM("marca", v)} texto="Hecho en Enlace Laboral" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">«Aplicar es gratis. Nunca pagues por un empleo.» le da confianza a quien lee y protege a la gente de las estafas.</p>
            </div>
          </Seccion>

          <Seccion titulo="Texto para acompañar el flyer" icono={<ClipboardCopy className="size-5 text-primary" aria-hidden="true" />}>
            <TextoCopiable titulo="Pie de foto para Instagram, Facebook o LinkedIn" texto={textoPublicacion(d, "redes")} copiado={copiado === "redes"} copiar={() => void copiarTexto("redes", textoPublicacion(d, "redes"))} />
            <TextoCopiable titulo="Mensaje para WhatsApp" texto={textoPublicacion(d, "whatsapp")} copiado={copiado === "wa"} copiar={() => void copiarTexto("wa", textoPublicacion(d, "whatsapp"))} />
            <TextoCopiable titulo="Texto alternativo (para personas ciegas o con baja visión)" nota="Pégalo en «Texto alternativo» o «Accesibilidad» al subir la imagen. Así los lectores de pantalla pueden leer tu vacante." texto={textoAlternativo(d)} copiado={copiado === "alt"} copiar={() => void copiarTexto("alt", textoAlternativo(d))} />
          </Seccion>

          <section className="rounded-3xl bg-[#0a2f5c] p-6 text-white md:p-8">
            <h2 className="text-2xl font-extrabold">¿Quieres que la vea más gente?</h2>
            <p className="mt-2 max-w-2xl text-white/80">Publica la vacante gratis en Enlace Laboral. La revisamos, recibes las aplicaciones en un panel y te damos el enlace para ponerlo en el código QR de tu flyer.</p>
            <Link to="/empresas" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#ffd84d] px-5 font-bold text-[#0a2f5c] hover:bg-[#ffe27a]">Publicar vacante gratis</Link>
          </section>

          <div className="flex flex-wrap gap-3 text-sm">
            <button type="button" onClick={() => { setD(VACIO); setCabOtra(false); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 font-semibold hover:border-primary"><RotateCcw className="size-4" aria-hidden="true" />Empezar en blanco</button>
            <button type="button" onClick={() => { setD(DATOS_EJEMPLO); setDis(DISENO_INICIAL); setCabOtra(false); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold text-muted-foreground hover:text-foreground">Cargar el ejemplo</button>
            <span className="self-center text-muted-foreground">Tus datos se guardan solo en este navegador para que no pierdas el trabajo.</span>
          </div>
        </div>
      </main>

      {/* Barra del celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => vista.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface font-bold"><Eye className="size-4" aria-hidden="true" />Ver flyer<ArrowUp className="size-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => void descargar()} disabled={!!ocupado || excluye.length > 0} className="btn-aplicar inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl font-bold disabled:opacity-50">{excluye.length ? <AlertOctagon className="size-4" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}{ocupado === "png" ? "Creando…" : excluye.length ? "Revisa el texto" : "Descargar"}</button>
      </div>
      <Footer />
    </div>
  );
}

function Interruptor({ on, cambiar, texto }: { on: boolean; cambiar: (v: boolean) => void; texto: string }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer select-none items-center gap-2.5 text-sm font-semibold">
      <input type="checkbox" checked={on} onChange={(e) => cambiar(e.target.checked)} className="peer sr-only" />
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${on ? "bg-primary" : "bg-border"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} /></span>
      {texto}
    </label>
  );
}

function TextoCopiable({ titulo, texto, nota, copiado, copiar }: { titulo: string; texto: string; nota?: string; copiado: boolean; copiar: () => void }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={rotulo}>{titulo}</span>
        <button type="button" onClick={copiar} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-bold hover:border-primary">{copiado ? <Check className="size-4 text-success" aria-hidden="true" /> : <ClipboardCopy className="size-4" aria-hidden="true" />}{copiado ? "Copiado" : "Copiar"}</button>
      </div>
      {nota && <p className="text-sm text-muted-foreground">{nota}</p>}
      <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-background p-4 font-sans text-sm leading-relaxed">{texto}</pre>
    </div>
  );
}
