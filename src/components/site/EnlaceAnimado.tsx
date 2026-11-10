import { type ReactNode, useEffect, useRef } from "react";

import { LOGO_BROCHE, LOGO_BROCHE_CENTRO, LOGO_CABEZA, LOGO_CUERPO, LOGO_MALETIN, LOGO_VIEWBOX } from "@/components/site/logo-paths";
import { cn } from "@/lib/utils";

/**
 * El logo «se enlaza» mientras bajas: la persona y el maletín empiezan separados
 * y se juntan a medida que la sección llega al centro de la pantalla.
 * El avance va en la variable CSS --p (0 = separados, 1 = enlazados); no re-renderiza React.
 * Con «reducir movimiento» se muestra enlazado desde el inicio.
 */
export function EnlaceAnimado({ children, ondas = false, className, video, credito }: { children?: ReactNode; ondas?: boolean; className?: string; video?: string; credito?: string }) {
  const ref = useRef<HTMLElement>(null);
  const refVideo = useRef<HTMLVideoElement>(null);

  // Video de fondo. iPhone y Android solo reproducen solos los videos silenciados (atributo «muted» real)
  // y con playsInline. React no escribe «muted» en el HTML, por eso se pone a mano antes de cargar.
  // En celular se usa la versión liviana (960 px). Se pausa fuera de la vista y con «reducir movimiento».
  useEffect(() => {
    const v = refVideo.current;
    if (!v || !video) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const chico = window.matchMedia?.("(max-width: 900px)").matches;
    const fuente = chico ? video.replace(/hd_1280_720/, "sd_960_540") : video;
    const reproducir = () => { if (!quieto) void v.play().catch(() => undefined); };
    if (v.getAttribute("src") !== fuente) { v.src = fuente; v.load(); }
    v.addEventListener("canplay", reproducir);
    if (typeof IntersectionObserver === "undefined") { reproducir(); return () => v.removeEventListener("canplay", reproducir); }
    const o = new IntersectionObserver(([en]) => { if (!en) return; if (en.isIntersecting) reproducir(); else v.pause(); }, { rootMargin: "200px 0px" });
    o.observe(v);
    return () => { o.disconnect(); v.removeEventListener("canplay", reproducir); };
  }, [video]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { el.style.setProperty("--p", "1"); el.dataset.enlazado = ""; return; }
    let raf = 0;
    const medir = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 cuando la sección asoma por abajo; 1 cuando su centro pasa el 55 % de la pantalla.
      const bruto = (vh - r.top) / (vh * 0.45 + r.height * 0.5);
      const p = Math.min(1, Math.max(0, bruto));
      const suave = 1 - Math.pow(1 - p, 3);
      el.style.setProperty("--p", suave.toFixed(4));
      if (suave > 0.97) el.dataset.enlazado = ""; else delete el.dataset.enlazado;
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(medir); };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => { window.removeEventListener("scroll", pedir); window.removeEventListener("resize", pedir); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={ref} aria-label="Enlace Laboral: conectamos talento con oportunidades" className={cn("enl-anim relative isolate overflow-hidden text-white", className)} style={{ "--p": 0 } as React.CSSProperties}>
      {/* Fondo: colores de Enlace mezclados (azul profundo, azul eléctrico, verde y un toque rosado) */}
      {video && <video ref={refVideo} aria-hidden="true" muted autoPlay loop playsInline preload="auto" className="absolute inset-0 -z-30 size-full object-cover object-[50%_65%]" />}
      <div aria-hidden="true" className={cn("enl-fondo absolute inset-0 -z-20", video && "opacity-[0.5] mix-blend-multiply")} />
      {video && <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgb(10_47_92/0.45)_0%,rgb(10_47_92/0.15)_45%,rgb(10_47_92/0.5)_100%)]" />}
      <div aria-hidden="true" className="enl-mancha absolute -left-24 top-1/4 -z-10 size-[28rem] rounded-full bg-[#7ee2a8]/35 blur-3xl" />
      <div aria-hidden="true" className="enl-mancha absolute -right-24 bottom-0 -z-10 size-[30rem] rounded-full bg-[#ff9ccf]/25 blur-3xl" style={{ animationDelay: "-6s" }} />
      <svg aria-hidden="true" className="absolute inset-0 -z-10 size-full opacity-[0.18]" preserveAspectRatio="none">
        <defs><pattern id="enl-puntos" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#fff" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#enl-puntos)" />
      </svg>
      {ondas && (
        <>
          <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-10 w-full sm:h-16"><path d="M0,0 H1440 V28 C1180,70 900,8 640,38 C390,66 170,20 0,44 Z" fill="var(--background)" /></svg>
          <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-10 w-full sm:h-16"><path d="M0,80 H1440 V40 C1200,8 960,64 700,40 C430,14 210,62 0,30 Z" fill="var(--background)" /></svg>
        </>
      )}

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center sm:py-28">
        <div className="relative">
          <span aria-hidden="true" className="enl-halo absolute left-1/2 top-1/2 -z-10 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-2xl sm:size-72" />
          <svg viewBox={LOGO_VIEWBOX} overflow="visible" aria-hidden="true" className="h-36 w-auto drop-shadow-[0_18px_40px_rgb(0_0_0/0.35)] sm:h-48">
            <g className="enl-persona">
              <path d={LOGO_CABEZA} fill="#ffffff" />
              <path d={LOGO_CUERPO} fill="#ffffff" />
            </g>
            <g className="enl-maletin">
              <path d={LOGO_MALETIN} fill="#bfe0ff" />
              <path d={LOGO_BROCHE} fill="#bfe0ff" />
            </g>
            <circle className="enl-onda" cx={LOGO_BROCHE_CENTRO.x} cy={LOGO_BROCHE_CENTRO.y} r="64" fill="none" stroke="#7ee2a8" strokeWidth="9" />
            <circle className="enl-onda enl-onda-2" cx={LOGO_BROCHE_CENTRO.x} cy={LOGO_BROCHE_CENTRO.y} r="64" fill="none" stroke="#ffffff" strokeWidth="6" />
          </svg>
        </div>
        <p className="enl-marca mt-6 font-display text-[2.2rem] font-black leading-none tracking-[-0.03em] sm:text-[3rem]">
          <span>Enlace</span> <span className="text-[#bfe0ff]">Laboral</span>
        </p>
        <div className="enl-texto mt-5 w-full">{children}</div>
      </div>
      {credito && <p className={cn("absolute right-4 text-[10px] text-white/50", ondas ? "bottom-12 sm:bottom-16" : "bottom-3")}>{credito}</p>}
    </section>
  );
}
