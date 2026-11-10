import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Briefcase, Building2, CalendarDays, CalendarPlus, ChevronRight, Clock, FileText, Landmark, Loader2, MapPin, MessageCircle, Navigation, Shirt, Sparkles, Users } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { MapaFerias } from "@/components/site/MapaFerias";
import { cuandoJornada, cuentaRegresiva, diaNum, enlaceMapa, faltan, icsJornada, mesCorto, OFICINAS_EMPLEO, organizadorDe, useJornadas, type Jornada } from "@/lib/jornadas";
import { SITIO } from "@/lib/vacantes";

export const Route = createFileRoute("/jornadas/")({
  head: () => ({
    meta: [
      { title: "Ferias de empleo en República Dominicana | Enlace Laboral" },
      { name: "description", content: "Mapa de ferias y jornadas de empleo en todo el país: fecha, lugar, empresas y puestos. Llega con tu CV y sal con una entrevista hecha." },
      { property: "og:title", content: "Ferias de empleo en República Dominicana · Enlace Laboral" },
      { property: "og:description", content: "Todas las ferias de empleo en un mapa: dónde, cuándo y qué puestos ofrecen." },
    ],
  }),
  component: Ferias,
});

const compartir = (j: Jornada) => `https://wa.me/?text=${encodeURIComponent(`📍 ${j.titulo}\n${organizadorDe(j)}\n🗓 ${cuandoJornada(j)}\n📌 ${j.lugar}, ${j.provincia}\n\nDetalles y cómo llegar: ${SITIO}/jornadas/${j.id}`)}`;

function Ferias() {
  const { data: proximas = [], isLoading } = useJornadas();
  const { data: todas = [] } = useJornadas(undefined, true);
  const recientes = useMemo(() => todas.filter((j) => j.pasada).sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha)), [todas]);
  const [verRecientes, setVerRecientes] = useState(false);
  const [provincia, setProvincia] = useState("");
  const [activa, setActiva] = useState<string | null>(null);
  const mapaRef = useRef<HTMLDivElement>(null);

  const enMapa = useMemo(() => {
    const base = verRecientes || !proximas.length ? [...proximas, ...recientes] : proximas;
    return base.filter((j) => !provincia || j.provincia === provincia);
  }, [proximas, recientes, verRecientes, provincia]);
  const lista = proximas.filter((j) => !provincia || j.provincia === provincia);
  const provinciasCon = useMemo(() => [...new Set([...proximas, ...recientes].map((j) => j.provincia))].sort(), [proximas, recientes]);
  const vacantes = proximas.reduce((s, j) => s + (j.vacantes ?? 0), 0);
  const siguiente = proximas[0];

  const verEnMapa = (id: string) => {
    setActiva(null);
    requestAnimationFrame(() => setActiva(id));
    mapaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-44 pt-10 sm:px-6 md:pb-52 md:pt-14">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-[#ffd84d]/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-24 size-80 rounded-full bg-[#7ee2a8]/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className="entra inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90 ring-1 ring-white/15"><CalendarDays className="size-4 text-[#ffd84d]" aria-hidden="true" /> Ferias de empleo</p>
          <h1 className="entra mt-4 max-w-3xl text-balance font-display text-[2.1rem] font-extrabold leading-[1.08] tracking-tight md:text-[3rem]">
            Todas las ferias de empleo del país, <span className="bg-gradient-to-r from-[#ffd84d] via-[#8ec1ff] to-[#7ee2a8] bg-clip-text text-transparent">en un mapa</span>
          </h1>
          <p className="entra mt-4 max-w-2xl text-lg text-white/85">Dónde, cuándo, qué empresas van y qué puestos buscan. Llega con tu CV impreso y sal con una entrevista hecha.</p>
          <dl className="entra mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [isLoading ? "…" : String(proximas.length), proximas.length === 1 ? "feria próxima" : "ferias próximas"],
              [isLoading ? "…" : String(new Set(proximas.map((j) => j.provincia)).size), "provincias"],
              [isLoading ? "…" : vacantes ? vacantes.toLocaleString("es-DO") : "—", "vacantes anunciadas"],
              [String(OFICINAS_EMPLEO.length), "oficinas abiertas todo el año"],
            ].map(([n, t]) => (
              <div key={t} className="vidrio rounded-2xl px-3.5 py-3">
                <dd className="text-2xl font-extrabold tabular-nums">{n}</dd>
                <dt className="text-[11px] font-semibold leading-tight text-white/75">{t}</dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="px-4 pb-16 sm:px-6"><div className="mx-auto max-w-6xl">
        {/* ---------- Mapa ---------- */}
        <section ref={mapaRef} aria-labelledby="t-mapa" className="relative -mt-36 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_30px_70px_-30px_rgb(10_47_92/0.6)] md:-mt-40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <h2 id="t-mapa" className="flex items-center gap-2 text-lg font-extrabold"><MapPin className="size-5 text-[#1d6ff2]" aria-hidden="true" /> Mapa de ferias</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <Leyenda color="bg-[#ffd84d] rounded-full">Próxima</Leyenda>
              <Leyenda color="bg-[#34c77b] rounded-full">Hoy</Leyenda>
              <Leyenda color="bg-[#9aa7b8] rounded-full">Ya pasó</Leyenda>
              <Leyenda color="bg-[#ffd84d] rotate-45 !size-2.5">Oficina de empleo</Leyenda>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-5 pt-4 sm:px-6">
            <Chip activo={!provincia} onClick={() => setProvincia("")}>Todo el país</Chip>
            {provinciasCon.map((p) => <Chip key={p} activo={provincia === p} onClick={() => setProvincia(provincia === p ? "" : p)}>{p}</Chip>)}
            {recientes.length > 0 && proximas.length > 0 && (
              <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground">
                <input type="checkbox" checked={verRecientes} onChange={(e) => setVerRecientes(e.target.checked)} className="size-4 accent-[#1d6ff2]" /> Ver también las recientes
              </label>
            )}
          </div>
          <div className="p-3 sm:p-4">
            <MapaFerias ferias={enMapa} activa={activa} className="aspect-[1000/632] w-full" />
          </div>
          <p className="px-6 pb-4 text-xs text-muted-foreground">Toca un faro para ver la feria; el mapa se acerca. Las líneas salen de Enlace hacia cada feria. Si una feria no trae dirección exacta, la ubicamos en su provincia. Los rombos son oficinas de empleo del Ministerio de Trabajo (ubicación aproximada; confirma antes de ir).</p>
        </section>

        {/* ---------- Próxima feria con cuenta regresiva ---------- */}
        {siguiente && <Siguiente j={siguiente} onMapa={() => verEnMapa(siguiente.id)} />}

        {/* ---------- Lista ---------- */}
        <section aria-labelledby="t-lista" className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="t-lista" className="font-display text-[1.7rem] font-extrabold leading-tight">Próximas ferias {provincia && <span className="text-[#1d6ff2]">en {provincia}</span>}</h2>
              <p className="mt-1 text-muted-foreground">Ordenadas por fecha. Toca «Ver en el mapa» para ubicarla.</p>
            </div>
          </div>
          {isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : lista.length ? (
            <ol className="mt-6 space-y-4">{lista.map((j) => <TarjetaFeria key={j.id} j={j} onMapa={() => verEnMapa(j.id)} />)}</ol>
          ) : (
            <div className="mt-6 grid gap-5 rounded-[2rem] border border-dashed border-border bg-surface p-7 md:grid-cols-[1.2fr_1fr] md:p-9">
              <div>
                <p className="text-xl font-extrabold">{provincia ? `No hay ferias próximas en ${provincia}` : "No hay ferias confirmadas para los próximos días"}</p>
                <p className="mt-2 text-muted-foreground">Las publicamos aquí apenas se anuncian. Mientras tanto, las oficinas de empleo del Ministerio de Trabajo reciben tu CV todo el año, gratis, y en Enlace hay vacantes abiertas hoy.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/vacantes" className="btn-aplicar inline-flex h-12 items-center rounded-xl px-6">Ver vacantes abiertas</Link>
                  {provincia && <button type="button" onClick={() => setProvincia("")} className="inline-flex h-12 items-center rounded-xl border border-border px-5 font-bold hover:border-primary">Ver todo el país</button>}
                </div>
              </div>
              <ul className="space-y-2.5">
                {OFICINAS_EMPLEO.map((o) => (
                  <li key={o.nombre} className="flex gap-3 rounded-2xl bg-secondary/60 p-3.5 text-sm">
                    <Landmark className="mt-0.5 size-5 shrink-0 text-[#1d6ff2]" aria-hidden="true" />
                    <span><span className="font-bold">{o.nombre}</span><br /><span className="text-muted-foreground">{o.direccion}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ---------- Consejos ---------- */}
        <section aria-labelledby="t-consejos" className="mt-16 rounded-[2rem] bg-[linear-gradient(135deg,#0a2f5c_0%,#0f4aa8_100%)] p-7 text-white sm:p-10">
          <h2 id="t-consejos" className="flex items-center gap-2 font-display text-[1.6rem] font-extrabold"><Sparkles className="size-6 text-[#ffd84d]" aria-hidden="true" /> Cómo sacarle provecho a una feria</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [FileText, "Lleva varias copias de tu CV", "Impresas y actualizadas. Una por cada empresa que te interese.", "/cv", "Haz tu CV gratis"],
              [Clock, "Llega temprano", "Las filas crecen rápido. Llegar a primera hora te da más tiempo con cada empresa."],
              [Shirt, "Ve como irías a la entrevista", "Ropa limpia y cómoda, acorde al puesto. Puede que te entrevisten ahí mismo."],
              [Briefcase, "Prepara tu presentación", "En un minuto: quién eres, qué sabes hacer y qué puesto buscas.", "/cv?h=entrevista", "Practicar entrevista"],
            ].map(([I, t, d, href, cta]) => {
              const Icono = I as typeof Clock;
              return (
                <li key={t as string} className="rounded-2xl bg-white/[0.08] p-5 ring-1 ring-white/15">
                  <Icono className="size-6 text-[#8ec1ff]" aria-hidden="true" />
                  <p className="mt-3 font-extrabold">{t as string}</p>
                  <p className="mt-1 text-sm text-white/80">{d as string}</p>
                  {href && <a href={href as string} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#ffd84d] hover:underline">{cta as string} <ChevronRight className="size-4" aria-hidden="true" /></a>}
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---------- Recientes ---------- */}
        {recientes.length > 0 && (
          <section aria-labelledby="t-recientes" className="mt-16">
            <h2 id="t-recientes" className="font-display text-xl font-extrabold">Ferias recientes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ya pasaron, pero muchas empresas siguen recibiendo CV por correo o teléfono.</p>
            <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recientes.slice(0, 9).map((j) => (
                <li key={j.id}>
                  <Link to="/jornadas/$id" params={{ id: j.id }} className="flex h-full gap-3 rounded-2xl border border-border bg-surface p-4 opacity-90 transition hover:opacity-100 hover:shadow-[var(--shadow-soft)]">
                    <FechaBloque iso={j.fecha} pasada />
                    <span className="min-w-0">
                      <span className="block font-bold leading-snug">{j.titulo}</span>
                      <span className="block text-sm text-muted-foreground">{organizadorDe(j)} · {j.provincia}</span>
                      {j.contacto && <span className="mt-1 block truncate text-xs font-semibold text-[#1d6ff2]">{j.contacto}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Avisos y empresas ---------- */}
        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <div className="lift relative overflow-hidden rounded-[2rem] border border-border bg-surface p-7">
            <span aria-hidden="true" className="absolute -right-8 -top-8 size-32 rounded-full bg-[#1d6ff2]/10" />
            <span className="relative grid size-12 place-items-center rounded-2xl bg-[#e8f0fe] text-[#1d6ff2]"><Building2 className="size-6" aria-hidden="true" /></span>
            <h2 className="relative mt-4 font-display text-xl font-extrabold">¿Tu empresa hace una feria o jornada?</h2>
            <p className="relative mt-2 text-muted-foreground">Publícala gratis: sale en este mapa, la gente se apunta con su CV y te llegan los inscritos a tu panel.</p>
            <Link to="/empresas" className="relative mt-5 inline-flex items-center gap-1.5 font-bold text-primary">Publicar mi feria <ChevronRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <div className="rounded-[2rem] border border-border bg-surface p-7">
            <p className="flex items-center gap-2 font-display text-xl font-extrabold"><MessageCircle className="size-6 text-[#178a45]" aria-hidden="true" /> Entérate primero</p>
            <p className="mt-2 text-muted-foreground">Avisamos de cada feria nueva en nuestro canal. ¿Viste una que no está aquí? Mándanos el flyer y la publicamos.</p>
            <div className="mt-4"><CanalWhatsApp variante="boton" /></div>
          </div>
        </section>
      </div></main>
      <Footer />
    </div>
  );
}

function Leyenda({ color, children }: { color: string; children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1"><span className={`size-3 rounded-[4px] ${color}`} aria-hidden="true" />{children}</span>;
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={activo} onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors ${activo ? "border-[#1d6ff2] bg-[#1d6ff2] text-white" : "border-border bg-background hover:border-[#1d6ff2] hover:text-[#1d6ff2]"}`}>{children}</button>;
}

function FechaBloque({ iso, pasada = false, grande = false }: { iso: string; pasada?: boolean; grande?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl text-white ${grande ? "size-20" : "size-14"} ${pasada ? "bg-gradient-to-br from-[#9aa7b8] to-[#5d6b7e]" : "bg-gradient-to-br from-[#2b7cff] to-[#0a2f5c]"}`}>
      <span className="flex flex-col items-center leading-none">
        <span className={`${grande ? "text-3xl" : "text-xl"} font-extrabold`}>{diaNum(iso)}</span>
        <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wide opacity-90">{mesCorto(iso)}</span>
      </span>
    </span>
  );
}

function Acciones({ j, onMapa }: { j: Jornada; onMapa: () => void }) {
  const b = "inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 text-sm font-bold hover:border-[#1d6ff2] hover:text-[#1d6ff2]";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onMapa} className={b}><MapPin className="size-4" aria-hidden="true" /> Ver en el mapa</button>
      <a href={enlaceMapa(j.lugar, j.provincia)} target="_blank" rel="noopener noreferrer" className={b}><Navigation className="size-4" aria-hidden="true" /> Cómo llegar</a>
      <button type="button" onClick={() => icsJornada({ ...j, empresa: organizadorDe(j) })} className={b}><CalendarPlus className="size-4" aria-hidden="true" /> Calendario</button>
      <a href={compartir(j)} target="_blank" rel="noopener noreferrer" className={`${b} text-[#178a45]`}><MessageCircle className="size-4" aria-hidden="true" /> Compartir</a>
    </div>
  );
}

function TarjetaFeria({ j, onMapa }: { j: Jornada; onMapa: () => void }) {
  const lleno = j.cupo !== null && j.inscritos >= j.cupo;
  return (
    <li className="lift rounded-[1.6rem] border border-border bg-surface p-5 sm:p-6">
      <div className="flex gap-4">
        <FechaBloque iso={j.fecha} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${faltan(j.fecha) === "Hoy" ? "bg-[#0f7a43] text-white" : "bg-[#ffd84d] text-[#3d2f00]"}`}>{faltan(j.fecha)}</span>
            {j.vacantes ? <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">{j.vacantes.toLocaleString("es-DO")} vacantes</span> : null}
            {lleno ? <span className="text-xs font-bold text-destructive">Cupo lleno</span> : j.inscritos > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Users className="size-3.5" aria-hidden="true" /> {j.inscritos} apuntados</span>}
          </div>
          <h3 className="mt-2 text-lg font-extrabold leading-snug sm:text-xl"><Link to="/jornadas/$id" params={{ id: j.id }} className="hover:text-[#1d6ff2]">{j.titulo}</Link></h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">{organizadorDe(j)}{j.verificada && j.empresa_id && <BadgeCheck className="size-4 text-success" aria-label="Empresa verificada" />}</p>
          <div className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            <p className="flex items-start gap-2 first-letter:uppercase"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#1d6ff2]" aria-hidden="true" />{cuandoJornada(j)}</p>
            <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-[#1d6ff2]" aria-hidden="true" />{j.lugar}, {j.provincia}</p>
          </div>
          {j.puestos.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{j.puestos.slice(0, 8).map((x) => <span key={x} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{x}</span>)}{j.puestos.length > 8 && <span className="px-1 text-xs text-muted-foreground">+{j.puestos.length - 8}</span>}</div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Acciones j={j} onMapa={onMapa} />
            <Link to="/jornadas/$id" params={{ id: j.id }} className="btn-aplicar inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm">{j.empresa_id && !lleno ? "Apuntarme gratis" : "Ver detalles"} <ChevronRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </li>
  );
}

/** La feria más cercana, con cuenta regresiva en vivo. */
function Siguiente({ j, onMapa }: { j: Jornada; onMapa: () => void }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 30_000); return () => clearInterval(t); }, []);
  const c = cuentaRegresiva(j.fecha, ahora);
  return (
    <section aria-label="La próxima feria" className="mt-8 grid items-center gap-6 rounded-[2rem] border border-[#ffd84d]/60 bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_60%)] p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
      <div className="flex gap-4">
        <FechaBloque iso={j.fecha} grande />
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#9a6b00]">La próxima feria</p>
          <h2 className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">{j.titulo}</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{organizadorDe(j)} · {j.lugar}, {j.provincia}</p>
          <div className="mt-4"><Acciones j={j} onMapa={onMapa} /></div>
        </div>
      </div>
      <div className="flex gap-2" aria-label={`Faltan ${c.dias} días, ${c.horas} horas y ${c.minutos} minutos`}>
        {c.listo ? <p className="rounded-2xl bg-[#0f7a43] px-5 py-4 text-lg font-extrabold text-white">¡Es ahora!</p> : (
          [[c.dias, "días"], [c.horas, "horas"], [c.minutos, "min"]].map(([n, t]) => (
            <div key={t as string} className="grid w-20 place-items-center rounded-2xl bg-[#0a2f5c] py-3 text-white shadow-lg">
              <span className="text-3xl font-extrabold tabular-nums leading-none">{String(n).padStart(2, "0")}</span>
              <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#8ec1ff]">{t as string}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
