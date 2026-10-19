import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Building2, Calculator, FileText, Laptop, Lightbulb, MessageCircle, Search, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";

import { useVacantes, CANAL_WHATSAPP } from "@/lib/vacantes";
import { LOGO_BROCHE, LOGO_CABEZA, LOGO_CUERPO, LOGO_MALETIN, LOGO_VIEWBOX } from "@/components/site/logo-paths";

/** Páginas donde el robot no aparece (zonas de trabajo). */
const SIN_ROBOT = /^\/(admin|panel|auth|baja|renovar)/;

const fila = "flex items-center gap-3 rounded-2xl bg-secondary px-3.5 py-2.5 text-sm font-bold text-foreground transition hover:bg-[#dbe6f6] hover:text-primary";
const icono = "size-[18px] shrink-0 text-cta";

/** Nexa: el robot de Enlace Laboral. Dibujo propio, con el logo en el pecho. */
function DibujoRobot({ ojos }: { ojos: React.Ref<SVGGElement> }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 150" aria-hidden="true" focusable="false" className="robot-dibujo block h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`rc-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a97ff" /><stop offset="1" stopColor="#1d6ff2" /></linearGradient>
        <linearGradient id={`rb-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d6ff2" /><stop offset="1" stopColor="#155fd4" /></linearGradient>
      </defs>
      <ellipse className="robot-sombra" cx="60" cy="145" rx="27" ry="4.5" fill="#0a2f5c" opacity="0.22" />
      <g className="robot-flota">
        {/* antena */}
        <line x1="60" y1="26" x2="60" y2="11" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <line x1="60" y1="26" x2="60" y2="11" stroke="#0a2f5c" strokeWidth="3.6" strokeLinecap="round" />
        <circle className="robot-antena" cx="60" cy="8" r="6.5" fill="#ffd84d" stroke="#ffffff" strokeWidth="2.5" />
        {/* brazo izquierdo */}
        <rect x="20" y="96" width="12" height="28" rx="6" fill={`url(#rb-${id})`} stroke="#ffffff" strokeWidth="2.5" />
        {/* brazo derecho: saluda */}
        <g className="robot-brazo"><rect x="88" y="96" width="12" height="28" rx="6" fill={`url(#rb-${id})`} stroke="#ffffff" strokeWidth="2.5" /></g>
        {/* cuerpo */}
        <rect x="32" y="90" width="56" height="42" rx="17" fill={`url(#rb-${id})`} stroke="#ffffff" strokeWidth="2.5" />
        <rect x="42" y="98" width="36" height="26" rx="9" fill="#0a2f5c" />
        <svg x="47" y="102" width="26" height="20.5" viewBox={LOGO_VIEWBOX} overflow="visible">
          <path fill="#ffffff" d={LOGO_CABEZA} /><path fill="#ffffff" d={LOGO_CUERPO} /><path fill="#8ec1ff" d={LOGO_MALETIN} /><path fill="#8ec1ff" d={LOGO_BROCHE} />
        </svg>
        {/* orejas */}
        <rect x="10" y="44" width="14" height="24" rx="7" fill="#0a2f5c" stroke="#ffffff" strokeWidth="2.5" />
        <rect x="96" y="44" width="14" height="24" rx="7" fill="#0a2f5c" stroke="#ffffff" strokeWidth="2.5" />
        {/* cabeza */}
        <rect x="19" y="24" width="82" height="62" rx="25" fill={`url(#rc-${id})`} stroke="#ffffff" strokeWidth="2.5" />
        <rect x="28" y="33" width="64" height="44" rx="17" fill="#0a2f5c" />
        <g ref={ojos} className="robot-ojos">
          <rect className="robot-ojo" x="42" y="44" width="12" height="17" rx="6" fill="#8ec1ff" />
          <rect className="robot-ojo" x="66" y="44" width="12" height="17" rx="6" fill="#8ec1ff" />
          <path d="M52 67 Q60 73 68 67" fill="none" stroke="#8ec1ff" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export function RobotNexa() {
  const navigate = useNavigate();
  const ruta = useRouterState({ select: (s) => s.location.pathname });
  const { jobs } = useVacantes();
  const [visible, setVisible] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [saludo, setSaludo] = useState(false);
  const [texto, setTexto] = useState("");
  const ojos = useRef<SVGGElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // Llega después de la entrada del logo (si la hay) y se deja ver con calma.
  useEffect(() => {
    const html = document.documentElement;
    let t = 0;
    const mostrar = (ms: number) => { t = window.setTimeout(() => setVisible(true), ms); };
    if (html.getAttribute("data-entrada") === "1") {
      const mo = new MutationObserver(() => { if (!html.hasAttribute("data-entrada")) { mo.disconnect(); mostrar(500); } });
      mo.observe(html, { attributes: true, attributeFilter: ["data-entrada"] });
      return () => { mo.disconnect(); window.clearTimeout(t); };
    }
    mostrar(1200);
    return () => window.clearTimeout(t);
  }, []);

  // Saludo en burbuja: una sola vez por sesión.
  useEffect(() => {
    if (!visible) return;
    let ya = false;
    try { ya = sessionStorage.getItem("el_nexa_saludo") === "1"; } catch { /* sin almacenamiento */ }
    if (ya) return;
    const a = window.setTimeout(() => { setSaludo(true); try { sessionStorage.setItem("el_nexa_saludo", "1"); } catch { /* nada */ } }, 1600);
    const b = window.setTimeout(() => setSaludo(false), 9000);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [visible]);

  // Los ojos siguen el cursor (o el último toque).
  useEffect(() => {
    if (!visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const mover = (e: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const b = boton.current?.getBoundingClientRect();
        const o = ojos.current;
        if (!b || !o) return;
        const dx = e.clientX - (b.left + b.width / 2);
        const dy = e.clientY - (b.top + b.height * 0.35);
        const d = Math.max(1, Math.hypot(dx, dy));
        const f = Math.min(1, d / 220);
        o.style.transform = `translate(${(dx / d) * 4 * f}px, ${(dy / d) * 3 * f}px)`;
      });
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => { window.removeEventListener("pointermove", mover); if (frame) window.cancelAnimationFrame(frame); };
  }, [visible]);

  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setAbierto(false); boton.current?.focus(); } };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto]);

  if (!visible || SIN_ROBOT.test(ruta)) return null;

  // En celular, la página de una vacante tiene una barra fija abajo: el robot sube para no taparla.
  const enVacante = /^\/vacantes\/[^/]+/.test(ruta);
  const cerrar = () => setAbierto(false);
  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const q = texto.trim();
    if (!q) return;
    cerrar();
    setTexto("");
    void navigate({ to: "/vacantes", search: { q } });
  };

  return (
    <div className={`fixed right-3 z-40 flex flex-col items-end gap-2 sm:right-5 ${enVacante ? "bottom-24 lg:bottom-6" : "bottom-4 sm:bottom-6"}`}>
      {abierto && (
        <div role="dialog" aria-label="Nexa, tu guía en Enlace Laboral" className="robot-panel flex max-h-[calc(100dvh-9rem)] w-[min(21.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_24px_60px_-20px_rgb(10_47_92/0.55)]">
          <div className="hero-dark flex items-start gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold leading-tight">Hola, soy Nexa</p>
              <p className="mt-0.5 text-[13px] leading-snug text-white/80">Te llevo directo a lo que necesitas.{jobs.length > 0 ? ` Hay ${jobs.length} ${jobs.length === 1 ? "vacante activa" : "vacantes activas"} ahora.` : ""}</p>
            </div>
            <button type="button" onClick={cerrar} aria-label="Cerrar ayuda" className="grid size-8 shrink-0 place-items-center rounded-full bg-white/12 hover:bg-white/25"><X className="size-4" /></button>
          </div>
          <div className="space-y-2 overflow-y-auto p-3.5">
            <form onSubmit={buscar} className="flex items-center gap-2 rounded-2xl border border-border bg-background py-1 pl-3.5 pr-1 focus-within:border-cta focus-within:ring-2 focus-within:ring-cta/30">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Qué puesto buscas?" aria-label="Puesto que buscas" className="h-10 w-full min-w-0 bg-transparent text-sm outline-none" />
              <button type="submit" className="btn-aplicar h-10 shrink-0 rounded-xl px-4 text-sm">Buscar</button>
            </form>
            <p className="px-1 pt-1 text-xs font-bold text-muted-foreground">¿Qué quieres hacer?</p>
            <Link to="/vacantes" search={{ experiencia: "Sin experiencia" }} onClick={cerrar} className={fila}><UserRound className={icono} aria-hidden="true" /> Encontrar mi primer empleo</Link>
            <Link to="/vacantes" search={{ modalidad: "Remoto" }} onClick={cerrar} className={fila}><Laptop className={icono} aria-hidden="true" /> Trabajar desde casa</Link>
            <Link to="/cv" onClick={cerrar} className={fila}><FileText className={icono} aria-hidden="true" /> Crear mi CV gratis</Link>
            <Link to="/herramientas/salario-neto" onClick={cerrar} className={fila}><Calculator className={icono} aria-hidden="true" /> Calcular cuánto me llega de sueldo</Link>
            <Link to="/empresas" onClick={cerrar} className={fila}><Building2 className={icono} aria-hidden="true" /> Publicar una vacante</Link>
            <Link to="/recursos" onClick={cerrar} className={fila}><Lightbulb className={icono} aria-hidden="true" /> Consejos para mi búsqueda</Link>
            <a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" onClick={cerrar} className={`${fila} !bg-[#e9f8ef] hover:!bg-[#d9f1e2]`}><MessageCircle className="size-[18px] shrink-0 text-[#1fa855]" aria-hidden="true" /> Recibir vacantes por WhatsApp</a>
            <p className="flex items-start gap-2 rounded-2xl bg-[#fff8dc] px-3 py-2.5 text-xs leading-snug text-[#5c4700]"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Ninguna empresa seria te cobra por entrevistarte o contratarte.</p>
            <p className="flex items-center gap-2 px-1 pb-0.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 shrink-0" aria-hidden="true" /> Próximamente: chat con IA para mejorar tu CV y practicar entrevistas.</p>
          </div>
        </div>
      )}
      {!abierto && saludo && (
        <button type="button" onClick={() => { setSaludo(false); setAbierto(true); }} className="robot-burbuja relative mr-1 max-w-[15rem] rounded-2xl rounded-br-md bg-surface px-4 py-3 text-left text-sm font-bold leading-snug text-foreground shadow-[0_14px_34px_-14px_rgb(10_47_92/0.5)] ring-1 ring-border">
          ¿Buscas empleo o quieres publicar una vacante? Te ayudo.
        </button>
      )}
      <button
        ref={boton}
        type="button"
        onClick={() => { setSaludo(false); setAbierto((v) => !v); }}
        aria-label={abierto ? "Cerrar ayuda de Nexa" : "Abrir ayuda de Nexa"}
        aria-expanded={abierto}
        className="robot w-[4.25rem] cursor-pointer rounded-full outline-offset-4 sm:w-[5.25rem]"
      >
        <DibujoRobot ojos={ojos} />
      </button>
    </div>
  );
}
