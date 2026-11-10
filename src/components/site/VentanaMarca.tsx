import { type ReactNode, useEffect, useRef } from "react";

import { LOGO_BROCHE, LOGO_BROCHE_CENTRO, LOGO_CABEZA, LOGO_CUERPO, LOGO_MALETIN, LOGO_VIEWBOX } from "@/components/site/logo-paths";

/**
 * Ventana de marca: la marca queda fija detrás de la página y se va descubriendo mientras bajas,
 * como si la sección fuera una ventana. Funciona con clip-path, sin mover nada con JavaScript.
 * Encima, la persona y el maletín del logo se juntan a medida que la ventana llega al centro (variable --p).
 * Solo los azules de Enlace. En el celular no hay video y todo va sobre CSS.
 */
export function VentanaMarca({ children, video }: { children?: ReactNode; video?: string }) {
  const ref = useRef<HTMLElement>(null);
  const refVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { el.style.setProperty("--p", "1"); el.dataset.enlazado = ""; return; }
    let raf = 0;
    const medir = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.5 + r.height * 0.45)));
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

  // Video solo en pantallas grandes y cuando la ventana está por verse.
  useEffect(() => {
    const v = refVideo.current;
    const el = ref.current;
    if (!v || !el || !video || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(max-width: 767px)").matches || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const o = new IntersectionObserver(([e]) => {
      if (!e) return;
      if (e.isIntersecting) { if (!v.src) v.src = video; void v.play().catch(() => undefined); } else v.pause();
    }, { rootMargin: "200px 0px" });
    o.observe(el);
    return () => o.disconnect();
  }, [video]);

  return (
    <section ref={ref} aria-label="Enlace Laboral: conectamos talento con oportunidades reales" className="ventana relative h-[86svh] min-h-[560px] text-white md:h-[92vh]" style={{ "--p": 0 } as React.CSSProperties}>
      {/* Capa fija: lo que se ve "a través" de la ventana */}
      <div className="ventana-capa fixed inset-0 grid place-items-center overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,#1d6ff2_0%,#0f4aa8_38%,#0a2f5c_72%,#061c38_100%)]" />
        {video && <video ref={refVideo} aria-hidden="true" muted loop playsInline preload="none" className="absolute inset-0 size-full object-cover opacity-30 mix-blend-luminosity grayscale" />}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(6_28_56/.55)_0%,rgb(10_47_92/.25)_45%,rgb(6_28_56/.7)_100%)]" />
        {/* Red de conexiones */}
        <svg aria-hidden="true" className="ventana-red absolute inset-0 size-full opacity-[0.22]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800">
          <g stroke="#bfe0ff" strokeWidth="1.2" fill="none">
            <path d="M80 640 L300 470 L520 560 L760 360 L980 430 L1140 250" />
            <path d="M60 220 L260 300 L470 180 L700 260 L900 140 L1160 210" />
            <path d="M300 470 L470 180 M760 360 L700 260 M980 430 L900 140 M520 560 L600 760" />
          </g>
          <g fill="#bfe0ff">
            {[[80, 640], [300, 470], [520, 560], [760, 360], [980, 430], [1140, 250], [60, 220], [260, 300], [470, 180], [700, 260], [900, 140], [1160, 210], [600, 760]].map(([x, y], i) => <circle key={i} className="ventana-nodo" style={{ animationDelay: `${(i % 5) * -0.7}s` }} cx={x} cy={y} r="5" />)}
          </g>
        </svg>
        {/* Palabra gigante de fondo que se desliza al bajar */}
        <p aria-hidden="true" className="ventana-gigante pointer-events-none absolute left-0 top-1/2 whitespace-nowrap font-display text-[26vw] font-black leading-none tracking-[-0.05em] text-white/[0.05] md:text-[20vw]">ENLACE LABORAL · ENLACE LABORAL</p>

        <div className="relative flex max-w-3xl flex-col items-center px-6 text-center">
          <div className="relative">
            <span aria-hidden="true" className="ventana-halo absolute left-1/2 top-1/2 -z-10 size-64 rounded-full bg-[#4f9bff]/40 blur-3xl md:size-80" />
            <svg viewBox={LOGO_VIEWBOX} overflow="visible" aria-hidden="true" className="h-32 w-auto drop-shadow-[0_20px_40px_rgb(0_0_0/0.4)] md:h-44">
              <g className="enl-persona">
                <path d={LOGO_CABEZA} fill="#ffffff" />
                <path d={LOGO_CUERPO} fill="#ffffff" />
              </g>
              <g className="enl-maletin">
                <path d={LOGO_MALETIN} fill="#8fc2ff" />
                <path d={LOGO_BROCHE} fill="#8fc2ff" />
              </g>
              <circle className="enl-onda" cx={LOGO_BROCHE_CENTRO.x} cy={LOGO_BROCHE_CENTRO.y} r="64" fill="none" stroke="#8fc2ff" strokeWidth="9" />
              <circle className="enl-onda enl-onda-2" cx={LOGO_BROCHE_CENTRO.x} cy={LOGO_BROCHE_CENTRO.y} r="64" fill="none" stroke="#ffffff" strokeWidth="6" />
            </svg>
          </div>
          <p className="mt-6 font-display text-[2.6rem] font-black leading-none tracking-[-0.03em] md:text-[4rem]">
            Enlace <span className="bg-[linear-gradient(90deg,#8fc2ff,#ffffff)] bg-clip-text text-transparent">Laboral</span>
          </p>
          <span aria-hidden="true" className="mt-4 h-px w-16 bg-white/50" />
          <div className="mt-5 w-full">{children}</div>
        </div>
      </div>

      {/* Ondas arriba y abajo, del color de la página, por encima de la capa fija */}
      <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 -top-px z-10 h-11 w-full md:h-[4.1rem]"><path d="M0,0 H1440 V22 C1180,68 900,6 640,34 C390,62 170,16 0,40 Z" fill="var(--background)" /></svg>
      <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px z-10 h-11 w-full md:h-[4.1rem]"><path d="M0,80 H1440 V44 C1200,10 960,66 700,42 C430,16 210,64 0,32 Z" fill="var(--background)" /></svg>
    </section>
  );
}
