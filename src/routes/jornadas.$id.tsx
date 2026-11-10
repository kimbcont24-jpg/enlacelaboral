import { createFileRoute, Link } from "@tanstack/react-router";
import { Consentimiento } from "@/components/site/Consentimiento";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Briefcase, CalendarDays, CalendarPlus, CheckCircle2, ExternalLink, Loader2, Mail, MapPin, MessageCircle, Navigation, Phone, Share2, ShieldCheck, Users } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { supabase } from "@/integrations/supabase/client";
import { cvCompleto, leerCV, textoCV, type CV } from "@/lib/cv";
import { cuandoJornada, enlaceMapa, faltan, icsJornada, organizadorDe, useJornadas } from "@/lib/jornadas";
import { MapaFerias } from "@/components/site/MapaFerias";
import { leerContacto } from "@/components/site/ContactoDirecto";
import { SITIO } from "@/lib/vacantes";

export const Route = createFileRoute("/jornadas/$id")({
  head: () => ({ meta: [{ title: "Feria de empleo | Enlace Laboral" }] }),
  component: DetalleJornada,
});

const K = "enlace-jornadas";
const misJornadas = (): string[] => { try { return JSON.parse(localStorage.getItem(K) ?? "[]") as string[]; } catch { return []; } };
const campo = "w-full rounded-xl border border-border bg-background px-4 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function DetalleJornada() {
  const { id } = Route.useParams();
  const valido = /^[0-9a-f-]{36}$/i.test(id);
  const { data, isLoading, refetch } = useJornadas(valido ? id : "00000000-0000-0000-0000-000000000000", true);
  const j = data?.[0];
  const [cv, setCv] = useState<CV | null>(null);
  const [f, setF] = useState({ nombre: "", contacto: "", puesto: "" });
  const [incluir, setIncluir] = useState(true);
  const [estado, setEstado] = useState<"listo" | "enviando" | "hecho">("listo");
  const [error, setError] = useState("");

  useEffect(() => {
    const c = leerCV();
    if (cvCompleto(c)) { setCv(c); setF((x) => ({ ...x, nombre: x.nombre || c.nombre, contacto: x.contacto || c.telefono || c.correo })); }
    if (misJornadas().includes(id)) setEstado("hecho");
  }, [id]);

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div></div>;
  if (!j) return (
    <div className="min-h-screen bg-background text-foreground"><Header />
      <main className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-extrabold">Esta feria ya no está disponible</h1><Link to="/jornadas" className="btn-aplicar mt-6 inline-grid h-12 place-items-center rounded-xl px-6">Ver otras ferias</Link></main>
      <Footer /></div>
  );

  const lleno = j.cupo !== null && j.inscritos >= j.cupo;
  const org = organizadorDe(j);
  const externa = !j.empresa_id;
  const contacto = leerContacto(j.contacto ?? "");
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (f.nombre.trim().length < 2 || f.contacto.trim().length < 5) return setError("Escribe tu nombre y tu WhatsApp o correo.");
    setEstado("enviando");
    const { error: err } = await supabase.rpc("inscribirse_jornada", { p_jornada: j.id, p_nombre: f.nombre, p_contacto: f.contacto, p_puesto: f.puesto || null, p_mensaje: cv && incluir ? `--- CV ---\n${textoCV(cv)}` : null });
    if (err) { setEstado("listo"); return setError(err.message.includes("ya_inscrito") ? "Ya estás apuntado a esta feria con ese contacto." : err.message.includes("lleno") ? "Se llenó el cupo. Mira otras ferias." : "No pudimos apuntarte. Intenta otra vez."); }
    try { localStorage.setItem(K, JSON.stringify([...new Set([...misJornadas(), j.id])])); } catch { /* sin almacenamiento */ }
    setEstado("hecho");
    void refetch();
  };
  const compartir = `https://wa.me/?text=${encodeURIComponent(`📍 ${j.titulo} (${org})\n🗓 ${cuandoJornada(j)}\n📌 ${j.lugar}, ${j.provincia}\n\nDetalles: ${SITIO}/jornadas/${j.id}`)}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <title>{`${j.titulo} · ${org} | Enlace Laboral`}</title>
      <header className="hero-dark px-4 pb-14 pt-6 sm:px-6 md:pb-20">
        <div className="relative mx-auto max-w-5xl">
          <Link to="/jornadas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white"><ArrowLeft className="size-4" /> Ferias de empleo</Link>
          <div className="mt-6 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#ffd84d] px-3 py-1 text-sm font-extrabold text-[#3d2f00]">{j.pasada ? "Ya pasó" : faltan(j.fecha)}</span>{j.vacantes ? <span className="rounded-full bg-[#7ee2a8]/20 px-3 py-1 text-sm font-bold text-[#c9ffe1]">{j.vacantes.toLocaleString("es-DO")} vacantes</span> : null}{j.inscritos > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"><Users className="size-4" /> {j.inscritos} apuntados{j.cupo ? ` de ${j.cupo}` : ""}</span>}</div>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight md:text-[2.6rem]">{j.titulo}</h1>
          {j.empresa_id ? <Link to="/empresa/$id" params={{ id: j.empresa_id }} className="mt-4 inline-flex items-center gap-2.5 font-semibold text-white/90 hover:text-white"><EmpresaAvatar nombre={org} className="size-9 text-sm" claro />{org}{j.verificada && <BadgeCheck className="size-5 text-[#7ee2a8]" aria-label="Verificada" />}</Link>
            : <p className="mt-4 inline-flex items-center gap-2.5 font-semibold text-white/90"><EmpresaAvatar nombre={org} className="size-9 text-sm" claro />Organiza: {org}</p>}
        </div>
      </header>

      <main className="px-4 pb-20 sm:px-6"><div className="mx-auto -mt-8 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-5 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><CalendarDays className="size-5" /></span><div><p className="text-xs font-bold text-muted-foreground">Cuándo</p><p className="font-semibold first-letter:uppercase">{cuandoJornada(j)}</p></div></div>
            <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><MapPin className="size-5" /></span><div><p className="text-xs font-bold text-muted-foreground">Dónde</p><p className="font-semibold">{j.lugar}, {j.provincia}</p><a href={enlaceMapa(j.lugar, j.provincia)} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold text-primary"><Navigation className="size-3.5" /> Cómo llegar</a></div></div>
          </div>
          {j.puestos.length > 0 && <div><h2 className="text-sm font-extrabold">Puestos que buscan</h2><div className="mt-2 flex flex-wrap gap-2">{j.puestos.map((x) => <span key={x} className="rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold">{x}</span>)}</div></div>}
          {j.descripcion && <div><h2 className="text-sm font-extrabold">Detalles</h2><p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{j.descripcion}</p></div>}
          <div className="rounded-2xl bg-[#ffd84d]/15 p-4"><h2 className="text-sm font-extrabold text-[#6b5000]">Qué llevar</h2><p className="mt-1 whitespace-pre-line text-sm">{j.llevar || "Varias copias de tu CV impreso y tu cédula. Llega temprano y ve vestido como irías a una entrevista."}</p></div>
          <div><h2 className="text-sm font-extrabold">En el mapa</h2><MapaFerias ferias={[j]} oficinas={false} className="mt-2 aspect-[1000/632] w-full" /></div>
          {j.imagen && <div><h2 className="text-sm font-extrabold">Flyer original</h2><img src={j.imagen} alt={`Flyer: ${j.titulo}`} loading="lazy" className="mt-2 w-full max-w-md rounded-2xl border border-border" /></div>}
          {j.fuente && <p className="text-xs text-muted-foreground">Fuente: <span className="font-semibold text-foreground">{j.fuente}</span>{j.fuente_url && <> — <a href={j.fuente_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">ver publicación original <ExternalLink className="size-3" /></a></>}</p>}
          <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Asistir es gratis. Ninguna empresa seria cobra por entrevistarte o contratarte.</p>
        </section>

        <aside className="h-fit rounded-3xl border border-border bg-surface p-6 lg:sticky lg:top-20">
          {j.pasada || externa ? (
            <div>
              <p className="text-lg font-extrabold">{j.pasada ? "Esta feria ya pasó" : "Ve directo con tu CV"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{j.pasada ? "Muchas empresas siguen recibiendo CV después de la feria. Escríbeles:" : "No hace falta apuntarse. Llega con varias copias de tu CV impreso. Si no puedes ir, envíalo:"}</p>
              <div className="mt-4 grid gap-2">
                {contacto.correos.map((c) => <a key={c} href={`mailto:${c}?subject=${encodeURIComponent(`CV para ${j.titulo}`)}`} className="btn-aplicar inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm"><Mail className="size-4" /> Enviar CV a {c}</a>)}
                {contacto.telefonos.map((t) => <a key={t} href={`https://wa.me/${t.replace(/\D/g, "").replace(/^(8[024]9)/, "1$1")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1fa855] text-sm font-bold text-white"><Phone className="size-4" /> {t}</a>)}
                {!j.pasada && <>
                  <button type="button" onClick={() => icsJornada({ ...j, empresa: org })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0a2f5c] text-sm font-bold text-white"><CalendarPlus className="size-4" /> Agregar a mi calendario</button>
                  <a href={enlaceMapa(j.lugar, j.provincia)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold"><Navigation className="size-4" /> Cómo llegar</a>
                </>}
                <a href={compartir} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-[#178a45]"><MessageCircle className="size-4" /> Avisarle a alguien</a>
                <Link to="/cv" className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm font-bold text-primary"><Briefcase className="size-4" /> Prepara tu CV para imprimirlo</Link>
                {j.pasada && <Link to="/jornadas" className="mt-1 text-center text-sm font-bold text-primary">Ver próximas ferias</Link>}
              </div>
            </div>
          ) : estado === "hecho" ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-12 text-success" />
              <p className="mt-3 text-xl font-extrabold">¡Estás apuntado!</p>
              <p className="mt-1 text-sm text-muted-foreground">{org} ya tiene tus datos. Guarda la fecha para que no se te pase.</p>
              <div className="mt-5 grid gap-2">
                <button type="button" onClick={() => icsJornada({ ...j, empresa: org })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0a2f5c] text-sm font-bold text-white"><CalendarPlus className="size-4" /> Agregar a mi calendario</button>
                <a href={enlaceMapa(j.lugar, j.provincia)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold"><Navigation className="size-4" /> Cómo llegar</a>
                <a href={compartir} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold"><Share2 className="size-4" /> Avisarle a un amigo</a>
                <Link to="/cv" className="mt-1 text-sm font-bold text-primary">Prepara tu CV para imprimirlo</Link>
              </div>
            </div>
          ) : lleno ? (
            <div className="text-center"><p className="text-lg font-extrabold">Se llenó el cupo</p><p className="mt-1 text-sm text-muted-foreground">Mira otras ferias o aplica a vacantes abiertas.</p><Link to="/jornadas" className="btn-aplicar mt-4 inline-grid h-11 w-full place-items-center rounded-xl text-sm">Ver otras ferias</Link></div>
          ) : (
            <form onSubmit={(e) => void enviar(e)} className="space-y-3">
              <p className="text-lg font-extrabold">Apúntate gratis</p>
              <p className="-mt-1 text-sm text-muted-foreground">Sin cuenta. La empresa te espera ese día.</p>
              <input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required autoComplete="name" placeholder="Tu nombre completo" aria-label="Tu nombre completo" className={campo} />
              <input value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} required autoComplete="tel" placeholder="Tu WhatsApp o correo" aria-label="Tu WhatsApp o correo" className={campo} />
              {j.puestos.length > 0 && <select value={f.puesto} onChange={(e) => setF({ ...f, puesto: e.target.value })} aria-label="Puesto que te interesa" className={campo}><option value="">¿Qué puesto te interesa?</option>{j.puestos.map((x) => <option key={x}>{x}</option>)}</select>}
              {cv ? <label className="flex items-start gap-2.5 rounded-xl bg-secondary px-4 py-3 text-sm"><input type="checkbox" checked={incluir} onChange={(e) => setIncluir(e.target.checked)} className="mt-0.5 size-4" /> Enviar mi CV ({cv.nombre}) para que me conozcan antes</label>
                : <p className="text-sm text-muted-foreground">¿No tienes CV? <Link to="/cv" className="font-bold text-primary underline">Hazlo gratis</Link> y llévalo impreso.</p>}
              <Consentimiento para="candidato" />
              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={estado === "enviando"} className="btn-aplicar flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-lg">{estado === "enviando" && <Loader2 className="size-5 animate-spin" />} Me apunto</button>
              <p className="text-center text-xs text-muted-foreground">Compartes tu nombre y contacto con {org}.</p>
            </form>
          )}
        </aside>
      </div></main>
      <Footer />
    </div>
  );
}
