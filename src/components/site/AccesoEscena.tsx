import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bell, CloudCheck, MessageCircle, ShieldCheck, Sparkles, Star } from "lucide-react";

import { Logo } from "@/components/site/Logo";
import { useVacantes } from "@/lib/vacantes";

/**
 * Lado visual de las pantallas de acceso: luces que se mueven, tarjetas que flotan y siguen el cursor,
 * y una cifra real que cuenta (empresas que ya publican / vacantes abiertas).
 * Empresa y candidato comparten la escena; cambia el mensaje y las tarjetas.
 */
export function AccesoEscena({ para }: { para: "empresa" | "candidato" }) {
  const { jobs } = useVacantes();
  const ref = useRef<HTMLDivElement>(null);
  const cifra = useMemo(() => (para === "empresa" ? new Set(jobs.map((j) => j.empresa.trim().toLowerCase()).filter(Boolean)).size : jobs.length), [jobs, para]);
  const n = useContar(cifra);

  // Profundidad con el cursor (solo con mouse).
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mover = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3)); el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3)); };
    el.addEventListener("pointermove", mover);
    return () => el.removeEventListener("pointermove", mover);
  }, []);

  const empresa = para === "empresa";
  return (
    <div ref={ref} className="relative flex min-h-full flex-col overflow-hidden bg-[#06204a] px-7 py-8 text-white sm:px-10 lg:px-12 lg:py-10">
      {/* Luces */}
      <div aria-hidden="true" className="fx-depth-back pointer-events-none absolute inset-0">
        <span className="fx-blob absolute -left-24 -top-24 size-[26rem] rounded-full bg-[#1d6ff2] opacity-50 blur-[110px]" />
        <span className="fx-blob absolute -bottom-32 right-[-6rem] size-[24rem] rounded-full bg-[#00b4d8] opacity-30 blur-[110px] [animation-delay:-6s]" />
        <span className="fx-blob absolute left-1/3 top-1/2 size-64 rounded-full bg-[#ffd84d] opacity-15 blur-[100px] [animation-delay:-11s]" />
        <svg className="absolute inset-0 size-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="acc-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0v32" fill="none" stroke="#fff" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#acc-grid)" /></svg>
      </div>

      <div className="relative">
        <Link to="/" aria-label="Enlace Laboral, inicio"><Logo invertido tamano="text-[20px]" /></Link>
      </div>

      <div className="relative mt-10 lg:mt-14">
        <p className="fx-up inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#8fc0ff] ring-1 ring-white/15">{empresa ? "Para empresas · gratis" : "Para quien busca empleo · gratis"}</p>
        <h1 className="fx-up mt-5 max-w-lg text-balance font-display text-[2.2rem] font-extrabold leading-[1.05] tracking-tight [animation-delay:.1s] sm:text-5xl">
          {empresa ? <>El talento que buscas <span className="bg-gradient-to-r from-[#8fc0ff] to-[#ffd84d] bg-clip-text text-transparent">ya está aquí.</span></> : <>Tu próximo empleo <span className="bg-gradient-to-r from-[#8fc0ff] to-[#ffd84d] bg-clip-text text-transparent">te está buscando.</span></>}
        </h1>
        <p className="fx-up mt-4 max-w-md text-[1.05rem] leading-relaxed text-white/75 [animation-delay:.25s]">
          {empresa ? "Publica gratis, recibe candidatos con su CV en tu panel y escríbeles por WhatsApp en un toque." : "Guarda tu CV, recibe vacantes que encajan contigo y deja que las empresas te encuentren. Sin contraseña."}
        </p>
        {cifra > 0 && (
          <p className="fx-up mt-7 flex items-baseline gap-2 [animation-delay:.4s]">
            <span className="font-display text-4xl font-extrabold tabular-nums">{n.toLocaleString("es-DO")}</span>
            <span className="text-sm text-white/70">{empresa ? "empresas con vacantes abiertas en Enlace" : "vacantes abiertas en todo el país"}</span>
          </p>
        )}
      </div>

      {/* Tarjetas que flotan */}
      <div aria-hidden="true" className="fx-depth-front relative mt-10 hidden h-64 sm:block lg:mt-auto">
        {empresa ? (
          <>
            <Tarjeta className="left-0 top-2 w-72 [animation-delay:.7s,1.4s]">
              <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#1d6ff2]"><Bell className="size-5" /><span className="fx-onda absolute inset-0 rounded-full bg-[#1d6ff2]" /></span>
              <span className="min-w-0"><span className="block text-sm font-extrabold text-[#0a2f5c]">Nuevo candidato</span><span className="block text-xs text-[#556275]">María P. · Auxiliar contable</span><span className="mt-1 inline-flex rounded-full bg-[#0f7a43]/12 px-2 py-0.5 text-[10px] font-extrabold text-[#0f7a43]">5 de 6 requisitos</span></span>
            </Tarjeta>
            <Tarjeta className="right-0 top-24 w-60 [animation-delay:.95s,2.1s]">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#0f7a43]"><ShieldCheck className="size-5" /></span>
              <span><span className="block text-sm font-extrabold text-[#0a2f5c]">Empresa verificada</span><span className="block text-xs text-[#556275]">RNC confirmado</span></span>
            </Tarjeta>
            <Tarjeta className="bottom-0 left-10 w-64 [animation-delay:1.2s,2.8s]">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1fa855]"><MessageCircle className="size-5" /></span>
              <span><span className="block text-sm font-extrabold text-[#0a2f5c]">Mensaje listo</span><span className="block text-xs text-[#556275]">«Hola María, nos gustó tu perfil…»</span></span>
            </Tarjeta>
          </>
        ) : (
          <>
            <Tarjeta className="left-0 top-2 w-72 [animation-delay:.7s,1.4s]">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1d6ff2]"><Sparkles className="size-5" /></span>
              <span><span className="block text-sm font-extrabold text-[#0a2f5c]">23 vacantes encajan contigo</span><span className="block text-xs text-[#556275]">Cajero · Santo Domingo</span></span>
            </Tarjeta>
            <Tarjeta className="right-0 top-24 w-64 [animation-delay:.95s,2.1s]">
              <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#c27803]"><Star className="size-5" /><span className="fx-onda absolute inset-0 rounded-full bg-[#c27803]" /></span>
              <span><span className="block text-sm font-extrabold text-[#0a2f5c]">Una empresa te invitó</span><span className="block text-xs text-[#556275]">a aplicar a su vacante</span></span>
            </Tarjeta>
            <Tarjeta className="bottom-0 left-10 w-60 [animation-delay:1.2s,2.8s]">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#0f7a43]"><CloudCheck className="size-5" /></span>
              <span><span className="block text-sm font-extrabold text-[#0a2f5c]">CV guardado</span><span className="block text-xs text-[#556275]">Igual en todos tus teléfonos</span></span>
            </Tarjeta>
          </>
        )}
      </div>

      <ul className="relative mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
        {(empresa ? ["Sin contratos ni tarjeta", "Vacantes ilimitadas", "Sello de empresa verificada"] : ["Sin contraseña", "Tus datos no se muestran", "Gratis siempre"]).map((t) => <li key={t} className="flex items-center gap-1.5"><BadgeCheck className="size-4 text-[#8fc0ff]" />{t}</li>)}
      </ul>
    </div>
  );
}

function Tarjeta({ className, children }: { className: string; children: React.ReactNode }) {
  return <div className={`fx-pop absolute flex items-center gap-3 rounded-2xl bg-white/95 p-3.5 shadow-[0_24px_50px_-20px_rgb(0_0_0/0.55)] ring-1 ring-white/50 backdrop-blur ${className}`}>{children}</div>;
}

/** Número que cuenta desde 0 hasta la cifra (1.4 s, desacelerando). */
function useContar(meta: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!meta) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(meta); return; }
    const t0 = performance.now(); let raf = 0;
    const paso = (t: number) => { const k = Math.min(1, Math.max(0, (t - t0) / 1400)); setN(Math.round(meta * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(paso); };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [meta]);
  return n;
}
