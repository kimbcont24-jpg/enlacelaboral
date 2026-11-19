import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, CheckCircle2, Clock, Landmark, Loader2, Mail, MessageCircle, ShieldCheck, Sunrise } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { provincias } from "@/lib/data";
import { SITIO, type Vacante } from "@/lib/vacantes";

const campo = "w-full min-w-0 rounded-xl border border-white/15 bg-white px-3.5 py-3 text-base text-[#0a2f5c] outline-none placeholder:text-[#5b6b80] focus:border-white focus:ring-2 focus:ring-white/60";

type Estado = "" | "enviando" | "listo" | "error" | "limite";

/** Se guarda en el navegador para no volver a insistir a quien ya activó su alerta. */
const LLAVE = "enlace:alerta-estado";
const yaActiva = () => { try { return localStorage.getItem(LLAVE) === "1"; } catch { return false; } };
const marcarActiva = () => { try { localStorage.setItem(LLAVE, "1"); } catch { /* sin almacenamiento */ } };

const hace = (iso: string) => {
  const h = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 36e5));
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
};

/** Hook compartido: suscribe a la alerta del sector público (colección «sector-publico»). */
function useSuscribirEstado() {
  const [estado, setEstado] = useState<Estado>("");
  const enviar = async (email: string, provincia: string) => {
    setEstado("enviando");
    const { data, error } = await supabase.rpc("suscribir_alerta", { p_email: email.trim(), p_area: null, p_provincia: provincia || null, p_coleccion: "sector-publico" });
    if (error) return setEstado("error");
    if (data === "limite") return setEstado("limite");
    marcarActiva();
    setEstado("listo");
  };
  return { estado, setEstado, enviar };
}

/**
 * «Radar del Estado»: alerta por correo cuando sale una plaza pública.
 * Concursa no avisa a nadie; nosotros revisamos cada mañana y escribimos el mismo día.
 * Muestra en vivo cómo se ve el aviso (con la última plaza real si la hay) para que la persona
 * sepa exactamente qué va a recibir.
 */
export function AlertaEstado({ jobs, id = "alerta-estado" }: { jobs: Vacante[]; id?: string }) {
  const [email, setEmail] = useState("");
  const [provincia, setProvincia] = useState("");
  const { estado, setEstado, enviar } = useSuscribirEstado();
  const [seguidores, setSeguidores] = useState<number | null>(null);

  useEffect(() => {
    void supabase.rpc("total_alertas_estado").then(({ data }) => { if (typeof data === "number") setSeguidores(data); });
  }, []);

  const ultima = useMemo(() => [...jobs].sort((a, b) => +new Date(b.creado) - +new Date(a.creado))[0], [jobs]);
  const nuevasSemana = useMemo(() => jobs.filter((j) => Date.now() - new Date(j.creado).getTime() < 7 * 864e5).length, [jobs]);

  const compartir = `https://wa.me/?text=${encodeURIComponent(`¿Quieres trabajar en el Estado? En Enlace Laboral te avisan por correo el mismo día que sale una plaza pública. Gratis: ${SITIO}/empleos/sector-publico#alerta-estado`)}`;

  return (
    <section id={id} aria-labelledby={`${id}-t`} className="relative mt-6 scroll-mt-24 overflow-hidden rounded-[2rem] bg-[#061a35] text-white shadow-[0_30px_70px_-30px_rgb(6_26_53/0.8)]">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#c8102e]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-32 size-96 rounded-full bg-[#1d6ff2]/25 blur-3xl" />
      <div aria-hidden="true" className="estado-rejilla pointer-events-none absolute inset-0 opacity-[0.07]" />

      <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10">
        {/* Mensaje + formulario */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-white/20">
            <span className="relative flex size-2"><span className="estado-latido absolute inline-flex size-full rounded-full bg-[#ff5a6e]" /><span className="relative inline-flex size-2 rounded-full bg-[#ff5a6e]" /></span>
            Alerta del Estado
          </p>
          <h2 id={`${id}-t`} className="mt-4 text-balance font-display text-[1.75rem] font-extrabold leading-[1.1] sm:text-[2.3rem]">
            Que ninguna plaza del Estado te agarre tarde.
          </h2>
          <p className="mt-3 max-w-xl text-white/80">
            Concursa no te manda avisos y los plazos son cortos. Nosotros revisamos cada mañana Concursa, portales de transparencia, ayuntamientos, hospitales, bancos y empresas públicas, y <b className="text-white">te escribimos el mismo día que sale una plaza.</b>
          </p>

          {estado === "listo" ? (
            <div className="estado-listo mt-6 rounded-2xl bg-white/[0.08] p-5 ring-1 ring-white/15">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[#7ee2a8]" aria-hidden="true" />
                <div>
                  <p className="text-lg font-extrabold">Tu alerta del Estado está activa.</p>
                  <p className="mt-1 text-sm text-white/75">Cuando salga una plaza {provincia ? `en ${provincia} o para todo el país` : "en cualquier provincia"}, te llega un correo de <b className="text-white">info@enlacelaboralrd.com</b>. Si no lo ves, búscalo en «Promociones» o «Spam» y márcalo como seguro.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <a href={compartir} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 font-bold text-[#061a35]">
                  <MessageCircle className="size-4" aria-hidden="true" /> Avísale a alguien que quiere entrar al Estado
                </a>
                <button type="button" onClick={() => { setEstado(""); setEmail(""); }} className="h-11 rounded-xl px-4 text-sm font-semibold text-white/80 underline-offset-4 hover:underline">Activar otro correo</button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void enviar(email, provincia); }} className="mt-6">
              <div className="grid gap-2.5 sm:grid-cols-[1.5fr_1fr]">
                <label className="block">
                  <span className="sr-only">Tu correo</span>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu correo electrónico" autoComplete="email" className={campo} />
                </label>
                <label className="block">
                  <span className="sr-only">Provincia</span>
                  <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className={campo}>
                    <option value="">Todo el país</option>
                    {provincias.slice(1).map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <button type="submit" disabled={estado === "enviando"} className="estado-boton mt-2.5 inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-6 text-base font-extrabold text-white shadow-[0_14px_30px_-12px_rgba(200,16,46,.9)] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                {estado === "enviando" ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <BellRing className="estado-campana size-5" aria-hidden="true" />}
                <span className="sm:hidden">Activar mi alerta del Estado</span><span className="hidden sm:inline">Avísame cuando salga una plaza del Estado</span>
              </button>
              {estado === "error" && <p className="mt-2 text-sm font-semibold text-[#ffb3bd]">No pudimos activar tu alerta. Revisa el correo e intenta de nuevo.</p>}
              {estado === "limite" && <p className="mt-2 text-sm font-semibold text-[#ffb3bd]">Ese correo ya tiene 5 alertas. Da de baja alguna desde tus correos para activar esta.</p>}
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/75">
                <li className="flex items-center gap-1.5"><Mail className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Gratis y sin cuenta</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Baja con un toque</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Nunca pedimos dinero por una plaza</li>
              </ul>
              {seguidores !== null && seguidores >= 10 && <p className="mt-3 text-sm font-semibold text-white">{seguidores.toLocaleString("es-DO")} personas ya reciben este aviso.</p>}
            </form>
          )}
        </div>

        {/* Así te llega: vista previa animada del aviso */}
        <div aria-hidden="true" className="relative mx-auto w-full max-w-sm">
          <div className="rounded-[1.75rem] bg-white/[0.06] p-3 ring-1 ring-white/15 backdrop-blur">
            <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-semibold text-white/60">
              <span className="inline-flex items-center gap-1"><Sunrise className="size-3.5" /> Cada mañana</span>
              <span>Así te llega</span>
            </div>
            <div className="estado-aviso rounded-2xl bg-white p-4 text-[#0b1f44] shadow-xl">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#061a35] text-white"><Landmark className="size-4" /></span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1d6ff2]">Enlace Laboral · Alerta del Estado</p>
                  <p className="truncate text-[11px] text-[#5b6b80]">info@enlacelaboralrd.com</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-extrabold leading-snug">{ultima ? ultima.titulo : "Analista de Recursos Humanos"}</p>
              <p className="mt-0.5 truncate text-xs text-[#4a5a75]">{ultima ? `${ultima.empresa} · ${ultima.provincia}` : "Institución pública · Distrito Nacional"}</p>
              {ultima && ultima.salarioMin > 0 && <p className="mt-1 text-xs font-bold text-[#0f7a43]">RD${ultima.salarioMin.toLocaleString("es-DO")} al mes</p>}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fdecef] px-2 py-0.5 text-[11px] font-bold text-[#a50d26]"><Clock className="size-3" /> Aplica antes del cierre</span>
                <span className="rounded-lg bg-[#1d6ff2] px-2.5 py-1 text-[11px] font-bold text-white">Ver plaza</span>
              </div>
            </div>
            <div className="estado-aviso-2 mt-2 rounded-2xl bg-white/90 px-4 py-3 text-[#0b1f44]">
              <p className="text-xs font-bold">{nuevasSemana > 0 ? `+${nuevasSemana} ${nuevasSemana === 1 ? "plaza nueva" : "plazas nuevas"} esta semana` : "Rastreo diario de plazas públicas"}</p>
              <p className="text-[11px] text-[#5b6b80]">{ultima ? `Última publicada ${hace(ultima.creado)}` : "Te escribimos solo cuando hay algo nuevo"}</p>
            </div>
          </div>
          <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-white/75">
            {["Sale la plaza", "La detectamos esa mañana", "Te llega y aplicas a tiempo"].map((t, i) => (
              <li key={t} className="estado-paso rounded-xl bg-white/[0.06] px-2 py-2 ring-1 ring-white/10" style={{ animationDelay: `${i * 0.9}s` }}>
                <span className="mx-auto mb-1 grid size-5 place-items-center rounded-full bg-[#c8102e] text-[10px] font-extrabold text-white">{i + 1}</span>{t}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/**
 * Botón flotante en la página del sector público: aparece al bajar, lleva a la alerta y
 * se esconde cuando la alerta está a la vista o si la persona ya la activó.
 */
export function AlertaEstadoFlotante({ destino = "alerta-estado" }: { destino?: string }) {
  const [ver, setVer] = useState(false);
  const enVista = useRef(true);
  useEffect(() => {
    if (yaActiva()) return;
    const el = document.getElementById(destino);
    const obs = el ? new IntersectionObserver(([e]) => { enVista.current = !!e?.isIntersecting; setVer(!enVista.current && window.scrollY > 500); }) : null;
    if (el && obs) obs.observe(el);
    const alBajar = () => setVer(!enVista.current && window.scrollY > 500 && !yaActiva());
    window.addEventListener("scroll", alBajar, { passive: true });
    return () => { obs?.disconnect(); window.removeEventListener("scroll", alBajar); };
  }, [destino]);
  if (!ver) return null;
  return (
    <a href={`#${destino}`} className="estado-flotante fixed bottom-5 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#061a35] py-2.5 pl-3 pr-5 text-sm font-bold text-white shadow-[0_18px_40px_-12px_rgba(6,26,53,.8)] ring-1 ring-white/15">
      <span className="grid size-8 place-items-center rounded-full bg-[#c8102e]"><BellRing className="estado-campana size-4" aria-hidden="true" /></span>
      <span className="sm:hidden">Alerta del Estado</span><span className="hidden sm:inline">Avísame de las plazas del Estado</span>
    </a>
  );
}
