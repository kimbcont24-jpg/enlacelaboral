/**
 * Las 12 plantillas del generador de flyers. Se dibujan con HTML y CSS a tamaño real (1080 px de ancho)
 * y el PNG sale del mismo nodo con html-to-image. El texto se ajusta solo para que quepa sin cortarse.
 */
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Banknote, Briefcase, CalendarDays, Check, Clock, Globe, Mail, MapPin, MessageCircle, Users, type LucideIcon } from "lucide-react";

import { COMPROMISOS } from "@/lib/inclusion";
import {
  contraste, enlaceBonito, fechaBonita, FORMATOS, FUENTES, limpiar, mezclar, paletaDe, PLANTILLAS, salarioTexto, textoSobre, whatsappBonito,
  type Datos, type Diseno, type Fuente, type Mostrar, type Paleta, type Textura,
} from "@/lib/flyers";

type Ctx = {
  d: Datos; m: Mostrar; p: Paleta; f: Fuente; qr: string | null; sal: string; req: string[]; fun: string[]; ben: string[];
  comp: { id: string; t: string }[]; wa: string; foto: string | null; tex: CSSProperties; logo: string | null;
};

const ANCHO_LETRA: Record<string, number> = { moderna: 0.78, corporativa: 0.6, fuerte: 0.72, condensada: 0.42, editorial: 0.58, elegante: 0.56, amigable: 0.56, tecnica: 0.62 };

const rgba = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

function texturaCSS(t: Textura, color: string): CSSProperties {
  const c = rgba(color, 0.16);
  switch (t) {
    case "puntos": return { backgroundImage: `radial-gradient(${c} 2.4px, transparent 2.8px)`, backgroundSize: "30px 30px" };
    case "lineas": return { backgroundImage: `repeating-linear-gradient(135deg, ${c} 0 2px, transparent 2px 20px)` };
    case "cuadricula": return { backgroundImage: `linear-gradient(${c} 1.5px, transparent 1.5px), linear-gradient(90deg, ${c} 1.5px, transparent 1.5px)`, backgroundSize: "54px 54px" };
    case "ondas": {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='36'><path d='M0 18 Q30 2 60 18 T120 18' fill='none' stroke='${c}' stroke-width='2.5'/></svg>`;
      return { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundSize: "120px 36px" };
    }
    default: return {};
  }
}

const tamTitulo = (s: string) => {
  const n = s.trim().length;
  return n <= 12 ? 128 : n <= 20 ? 108 : n <= 30 ? 92 : n <= 42 ? 78 : n <= 60 ? 66 : 56;
};

// ---------- Piezas comunes ----------
function filas(c: Ctx): { I: LucideIcon; v: string; sal?: boolean }[] {
  const { d } = c;
  return [
    c.sal ? { I: Banknote, v: c.sal, sal: true } : null,
    d.ubicacion.trim() ? { I: MapPin, v: d.ubicacion.trim() } : null,
    d.modalidad || d.jornada ? { I: Briefcase, v: [d.modalidad, d.jornada].filter(Boolean).join(" · ") } : null,
    d.horario.trim() ? { I: Clock, v: d.horario.trim() } : null,
    d.cantidad.trim() ? { I: Users, v: d.cantidad.trim() } : null,
    d.fechaLimite ? { I: CalendarDays, v: `Aplica hasta el ${fechaBonita(d.fechaLimite)}` } : null,
  ].filter(Boolean) as { I: LucideIcon; v: string; sal?: boolean }[];
}

function Filas({ c, cls = "", salCls = "fx-sal" }: { c: Ctx; cls?: string; salCls?: string }) {
  const f = filas(c);
  if (!f.length) return null;
  return (
    <div className={`fx-filas ${cls}`}>
      {f.map((x) => (
        <div key={x.v} className="fx-fila"><x.I className="fx-i" aria-hidden="true" /><span className={x.sal ? salCls : ""}>{x.v}</span></div>
      ))}
    </div>
  );
}

function Logo({ c, cls = "" }: { c: Ctx; cls?: string }) {
  if (c.logo) return <img src={c.logo} alt="" className={`fx-logo ${cls}`} />;
  if (!c.d.empresa.trim()) return null;
  return <span className={`fx-marca ${cls}`}>{c.d.empresa.trim()}</span>;
}

function Lista({ items, titulo, mk = "punto", cls = "" }: { items: string[]; titulo?: string; mk?: "punto" | "check" | "raya" | "caja"; cls?: string }) {
  if (!items.length) return null;
  return (
    <section className={cls}>
      {titulo && <h3 className="fx-sec">{titulo}</h3>}
      <ul className="fx-lista">
        {items.map((r, i) => (
          <li key={`${i}-${r}`}>
            {mk === "check" || mk === "caja" ? <span className={`fx-mk-${mk}`}><Check aria-hidden="true" /></span> : <span className={`fx-mk-${mk}`} />}
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chips({ items, cls = "" }: { items: string[]; cls?: string }) {
  if (!items.length) return null;
  return <div className={`fx-chips ${cls}`}>{items.map((b) => <span key={b} className="fx-chip">{b}</span>)}</div>;
}

function Compromisos({ c, cls = "" }: { c: Ctx; cls?: string }) {
  if (!c.comp.length) return null;
  return <div className={`fx-chips ${cls}`}>{c.comp.map((x) => <span key={x.id} className="fx-comp"><Check className="fx-i-s" aria-hidden="true" />{x.t}</span>)}</div>;
}

function Aplicar({ c, titulo = "Cómo aplicar", cls = "" }: { c: Ctx; titulo?: string | null; cls?: string }) {
  const { d } = c;
  const l: { I: LucideIcon | null; v: string }[] = [];
  if (d.correo.trim()) l.push({ I: Mail, v: d.correo.trim() });
  if (c.wa) l.push({ I: MessageCircle, v: c.wa });
  if (d.enlace.trim()) l.push({ I: Globe, v: enlaceBonito(d.enlace) });
  if (d.extraAplicar.trim()) l.push({ I: null, v: d.extraAplicar.trim() });
  if (!l.length) return null;
  return (
    <div className={`fx-ap ${cls}`}>
      {titulo && <h3 className="fx-sec">{titulo}</h3>}
      {l.map((x) => <div key={x.v} className="fx-ap-l">{x.I && <x.I className="fx-i" aria-hidden="true" />}<span>{x.v}</span></div>)}
    </div>
  );
}

function QR({ c, cls = "", texto = "Escanea para aplicar" }: { c: Ctx; cls?: string; texto?: string }) {
  if (!c.m.qr || !c.qr) return null;
  return <div className={`fx-qr ${cls}`}><img src={c.qr} alt="" /><span>{texto}</span></div>;
}

function Pie({ c, cls = "" }: { c: Ctx; cls?: string }) {
  if (!c.m.antiestafa && !c.m.marca) return null;
  return (
    <div className={`fx-pie ${cls}`}>
      {c.m.antiestafa ? <span>Aplicar es gratis. Nunca pagues por un empleo.</span> : <span />}
      {c.m.marca && <span className="fx-pie-m">Hecho en <b>enlacelaboralrd.com</b></span>}
    </div>
  );
}

function Eslabon({ cls = "", style }: { cls?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="160 240 700 545" className={cls} style={style} aria-hidden="true">
      <path fill="currentColor" d="M256.5 400.6C231.5 395.8 210.1 375.8 203.4 351.0C201.1 342.4 201.1 326.6 203.3 318.0C212.9 281.2 249.6 259.6 286.4 269.0C315.7 276.5 336.3 303.3 336.3 334.0C336.3 376.2 297.6 408.5 256.5 400.6Z" />
      <path fill="currentColor" d="M278.2 664.9C215.1 656.7 169.6 600.7 175.1 537.8C179.2 490.1 211.1 449.9 256.7 435.1C274.0 429.5 273.4 429.5 364.0 429.5C454.4 429.5 453.8 429.5 471.1 435.1C537.6 456.7 570.9 530.5 543.2 594.8C527.9 630.3 492.4 658.2 455.5 663.8C440.1 666.2 440.2 666.2 438.0 664.0C436.1 662.1 436.0 660.7 436.0 630.2C436.0 593.8 435.4 596.2 445.2 594.1C463.8 590.1 478.8 574.2 482.0 554.9C486.1 530.4 469.4 506.5 444.1 500.7C440.6 499.9 437.4 498.6 436.9 497.9C436.4 497.1 436.0 493.1 436.0 489.0C435.9 477.5 431.7 470.3 422.8 466.6C416.7 464.0 341.1 464.3 335.4 466.9C327.1 470.7 323.0 478.3 323.0 490.1C323.0 499.9 323.3 499.7 300.5 500.2C283.7 500.6 280.8 500.9 275.8 502.9C243.6 515.6 234.7 556.8 259.0 581.1C269.9 592.1 278.9 595.0 302.0 595.0C315.4 595.0 319.0 595.3 320.8 596.6C323.0 598.1 323.0 598.2 323.0 630.4C323.0 660.4 322.9 662.8 321.2 664.3C319.6 665.8 316.8 666.0 301.9 665.9C292.3 665.8 281.7 665.4 278.2 664.9Z" />
      <path fill="currentColor" opacity=".6" d="M422.2 775.9C382.5 772.0 350.6 740.9 345.1 700.7C344.5 696.4 344.0 679.6 344.0 663.4C344.0 635.3 344.1 633.9 346.0 632.0C347.9 630.1 349.3 630.0 379.8 630.0C409.1 630.0 411.8 630.1 413.3 631.8C414.7 633.3 415.0 637.7 415.2 664.7C415.5 699.1 415.4 698.2 422.4 703.4C425.1 705.5 425.2 705.5 595.7 705.8C785.7 706.0 770.1 706.6 775.8 699.2L778.5 695.7L778.5 547.6L778.5 399.5L776.1 396.1C774.8 394.3 771.9 391.9 769.6 390.9C765.7 389.1 759.2 389.0 597.0 389.0C434.8 389.0 428.3 389.1 424.4 390.9C419.6 393.1 416.7 396.8 415.1 402.7C414.5 404.9 413.3 407.1 412.4 407.4C411.5 407.7 396.5 408.0 378.9 408.0L347.0 408.0L345.5 405.6C344.1 403.5 344.0 402.0 345.0 395.1C349.2 364.5 367.0 339.7 394.0 327.1C410.3 319.5 409.0 319.7 462.1 319.3L509.8 318.9L510.2 302.2C510.6 288.5 511.1 284.4 512.9 279.6C518.3 264.5 529.4 253.9 544.5 249.3C553.6 246.5 640.4 246.5 649.5 249.3C664.7 253.9 675.7 264.5 681.1 279.6C682.8 284.4 683.3 288.6 683.7 302.2L684.3 318.9L731.9 319.2C778.4 319.6 779.7 319.7 787.0 321.9C817.0 331.2 839.3 354.5 847.3 385.0L849.5 393.5L849.5 547.5C849.5 691.3 849.4 702.0 847.7 708.4C838.9 742.7 815.1 766.5 781.2 774.8C775.1 776.2 757.8 776.4 602.5 776.6C507.9 776.7 426.8 776.4 422.2 775.9ZM625.0 312.5L625.0 306.0L597.0 306.0L569.0 306.0L569.0 312.5L569.0 319.0L597.0 319.0L625.0 319.0L625.0 312.5Z" />
      <path fill="currentColor" opacity=".6" d="M345.6 571.8C344.3 569.9 344.0 565.8 344.0 547.5C344.0 529.2 344.3 525.1 345.6 523.2C347.1 521.0 347.2 521.0 379.4 521.0C409.4 521.0 411.8 521.1 413.3 522.8C416.0 525.7 415.8 569.9 413.2 572.3C411.5 573.8 407.7 574.0 379.2 574.0C347.2 574.0 347.1 574.0 345.6 571.8Z" />
    </svg>
  );
}

const Puesto = ({ c, cls = "", tm }: { c: Ctx; cls?: string; tm?: number }) => (
  <h1 className={`fx-h ${cls}`} style={tm ? ({ "--tm": tm } as CSSProperties) : undefined}>{c.d.puesto.trim() || "Nombre del puesto"}</h1>
);

// ---------- Plantillas ----------
const T: Record<string, (c: Ctx) => ReactNode> = {
  bloque: (c) => (
    <>
      <div className="b-top" style={c.tex}>
        <div className="b-head"><span className="b-cab">{c.d.cabecera}</span>{(c.logo || c.d.empresa) && <span className="b-chip"><Logo c={c} /></span>}</div>
        <Puesto c={c} cls="b-puesto" />
      </div>
      <div className="fx-fit b-body" data-fit>
        <Filas c={c} />
        <Lista items={c.req} titulo="Requisitos" />
        <Lista items={c.fun} titulo="Lo que harás" mk="raya" />
        <Chips items={c.ben} />
        <Compromisos c={c} />
      </div>
      <div className="b-foot">
        <div className="b-foot-r"><Aplicar c={c} /><QR c={c} /></div>
        <Pie c={c} />
      </div>
    </>
  ),

  editorial: (c) => (
    <>
      {c.foto ? <div className="e-foto"><img src={c.foto} alt="" /></div> : <div className="e-regla" style={c.tex} />}
      <div className="e-mast"><Logo c={c} /><span className="e-cab">{c.d.cabecera}</span></div>
      <div className="fx-fit e-main" data-fit>
        <Puesto c={c} cls="e-puesto" tm={1.08} />
        <Filas c={c} cls="e-filas" />
        <div className="e-cols">
          <div><Lista items={c.req} titulo="Requisitos" mk="raya" /><Lista items={c.fun} titulo="Lo que harás" mk="raya" cls="e-sep" /></div>
          {(c.ben.length > 0 || c.comp.length > 0) && <div className="e-col2"><Lista items={c.ben} titulo="Ofrecemos" mk="raya" /><Compromisos c={c} cls="e-sep" /></div>}
        </div>
      </div>
      <div className="e-foot"><Aplicar c={c} /><QR c={c} /></div>
      <Pie c={c} cls="e-pie" />
    </>
  ),

  ticket: (c) => (
    <div className="t-wrap" style={c.tex}>
      <div className="t-card">
        <div className="fx-fit t-top" data-fit>
          <div className="t-head"><span className="t-cab">{c.d.cabecera}</span><Logo c={c} /></div>
          <Puesto c={c} cls="t-puesto" tm={0.95} />
          <Filas c={c} cls="t-filas" />
          <Lista items={c.req} titulo="Requisitos" mk="check" />
          <Lista items={c.fun} titulo="Lo que harás" />
          <Chips items={c.ben} />
          <Compromisos c={c} />
        </div>
        <div className="t-corte"><i /><b /><i /></div>
        <div className="t-stub"><Aplicar c={c} titulo="Aplica aquí" /><QR c={c} /></div>
      </div>
      <Pie c={c} cls="t-pie" />
    </div>
  ),

  afiche: (c) => {
    const palabras = c.d.cabecera.trim().split(/\s+/).filter(Boolean);
    const larga = Math.max(4, ...palabras.map((w) => w.length));
    const px = Math.min(210, 940 / (larga * (ANCHO_LETRA[c.f.id] ?? 0.6)));
    return (
      <>
        <div className="a-top" style={c.tex}>
          <div className="a-logo"><Logo c={c} /></div>
          <div className="a-grito" data-cabe="ancho" style={{ fontSize: `calc(var(--u) * ${px.toFixed(0)} * var(--ga, 1))` }}>
            {palabras.map((w, i) => <span key={i} className={i % 2 ? "a-hueco" : ""}>{w}</span>)}
          </div>
        </div>
        <div className="a-panel">
          <div className="fx-fit a-main" data-fit>
            <Puesto c={c} cls="a-puesto" tm={0.88} />
            <Filas c={c} />
            <Lista items={c.req} titulo="Requisitos" mk="caja" />
            <Lista items={c.fun} titulo="Lo que harás" />
            <Chips items={c.ben} />
            <Compromisos c={c} />
          </div>
          <div className="a-foot"><Aplicar c={c} /><QR c={c} /></div>
          <Pie c={c} />
        </div>
      </>
    );
  },

  lateral: (c) => (
    <div className="l-row">
      <div className="l-band" data-cabe="ambos" style={c.tex}><span className="l-vert">{c.d.cabecera}</span></div>
      <div className="l-main">
        <Logo c={c} cls="l-logo" />
        <div className="fx-fit l-fit" data-fit>
          <Puesto c={c} cls="l-puesto" tm={0.9} />
          <Filas c={c} />
          <Lista items={c.req} titulo="Requisitos" />
          <Lista items={c.fun} titulo="Lo que harás" mk="raya" />
          <Chips items={c.ben} />
          <Compromisos c={c} />
        </div>
        <div className="l-ap"><Aplicar c={c} /><QR c={c} /></div>
        <Pie c={c} />
      </div>
    </div>
  ),

  minimal: (c) => (
    <>
      <div className="m-top"><Logo c={c} /><span className="m-cab">{c.d.cabecera}</span></div>
      <div className="fx-fit m-main" data-fit>
        <Puesto c={c} cls="m-puesto" tm={0.82} />
        <span className="m-linea" />
        <Filas c={c} cls="m-filas" salCls="m-sal" />
        <Lista items={c.req} titulo="Requisitos" mk="raya" />
        <Lista items={c.fun} titulo="Lo que harás" mk="raya" />
        {c.ben.length > 0 && <p className="m-ben"><b>Ofrecemos:</b> {c.ben.join(" · ")}</p>}
        <Compromisos c={c} />
      </div>
      <div className="m-foot"><Aplicar c={c} /><QR c={c} /></div>
      <Pie c={c} />
    </>
  ),

  arco: (c) => (
    <>
      <div className={`r-arco ${c.foto ? "r-con-foto" : ""}`} style={c.foto ? undefined : c.tex}>
        {c.foto ? <img src={c.foto} alt="" /> : (
          <div className="r-dentro"><Logo c={c} cls="r-logo" /><span className="r-cab">{c.d.cabecera}</span></div>
        )}
      </div>
      <div className="fx-fit r-main" data-fit>
        {c.foto && <div className="r-fila-logo"><Logo c={c} /><span className="r-cab2">{c.d.cabecera}</span></div>}
        <Puesto c={c} cls="r-puesto" tm={0.9} />
        <Filas c={c} cls="r-filas" />
        <Lista items={c.req} titulo="Requisitos" />
        <Lista items={c.fun} titulo="Lo que harás" />
        <Chips items={c.ben} cls="r-centro" />
        <Compromisos c={c} cls="r-centro" />
      </div>
      <div className="r-foot"><Aplicar c={c} titulo={null} /><QR c={c} /></div>
      <Pie c={c} />
    </>
  ),

  industrial: (c) => (
    <>
      <div className="i-franja" />
      <div className="i-top"><span className="i-cab">{c.d.cabecera}</span><span className="i-logo"><Logo c={c} /></span></div>
      <div className="fx-fit i-main" data-fit>
        <Puesto c={c} cls="i-puesto" tm={0.96} />
        <Filas c={c} cls="i-filas" />
        <Lista items={c.req} titulo="Requisitos" mk="caja" />
        <Lista items={c.fun} titulo="Lo que harás" mk="raya" />
        <Chips items={c.ben} />
        <Compromisos c={c} />
      </div>
      <div className="i-foot"><Aplicar c={c} /><QR c={c} /></div>
      <Pie c={c} cls="i-pie" />
      <div className="i-franja" />
    </>
  ),

  suave: (c) => (
    <>
      <div className="fx-deco"><span className="s-circ1" style={c.tex} /><span className="s-circ2" /></div>
      <div className="s-top"><span className="s-cab">{c.d.cabecera}</span>{(c.logo || c.d.empresa) && <span className="s-logo"><Logo c={c} /></span>}</div>
      <div className="fx-fit s-main" data-fit>
        <Puesto c={c} cls="s-puesto" tm={0.92} />
        <div className="s-card"><Filas c={c} /></div>
        {(c.req.length > 0 || c.fun.length > 0) && <div className="s-card"><Lista items={c.req} titulo="Requisitos" mk="check" /><Lista items={c.fun} titulo="Lo que harás" cls="s-sep" /></div>}
        <Chips items={c.ben} />
        <Compromisos c={c} />
      </div>
      <div className="s-card s-ap"><Aplicar c={c} /><QR c={c} /></div>
      <Pie c={c} cls="s-pie" />
    </>
  ),

  lista: (c) => (
    <>
      <div className="li-top" style={c.tex}><Logo c={c} /><span className="li-cab">{c.d.cabecera}</span></div>
      <div className="fx-fit li-main" data-fit>
        <Puesto c={c} cls="li-puesto" tm={0.88} />
        <Filas c={c} cls="li-filas" />
        {c.req.length > 0 && (
          <div className="li-hoja">
            <Lista items={c.req} titulo="¿Cumples con esto?" mk="caja" />
            <p className="li-nota">No necesitas cumplir todo para aplicar. Si te identificas con la mayoría, escríbenos.</p>
          </div>
        )}
        <Lista items={c.fun} titulo="Lo que harás" mk="raya" />
        <Chips items={c.ben} />
        <Compromisos c={c} />
      </div>
      <div className="li-foot"><Aplicar c={c} /><QR c={c} /></div>
      <Pie c={c} />
    </>
  ),

  marco: (c) => (
    <div className="k-marco" style={c.tex}>
      <div className="k-hoja">
        <div className="k-filete">
          <Logo c={c} cls="k-logo" />
          <span className="k-cab">{c.d.cabecera}</span>
          <div className="fx-fit k-main" data-fit>
            <Puesto c={c} cls="k-puesto" tm={0.86} />
            <div className="k-orn"><i /><b /><i /></div>
            <Filas c={c} cls="k-filas" />
            <Lista items={c.req} titulo="Requisitos" />
            <Lista items={c.fun} titulo="Lo que harás" />
            <Chips items={c.ben} cls="k-centro" />
            <Compromisos c={c} cls="k-centro" />
          </div>
          <div className="k-foot"><Aplicar c={c} titulo={null} /><QR c={c} /></div>
          <Pie c={c} cls="k-pie" />
        </div>
      </div>
    </div>
  ),

  enlace: (c) => (
    <>
      <div className="fx-deco"><Eslabon cls="n-eslabon" /></div>
      <div className="n-top"><span className="n-cab">{c.d.cabecera}</span>{(c.logo || c.d.empresa) && <span className="n-logo"><Logo c={c} /></span>}</div>
      <div className="fx-fit n-main" data-fit>
        <Puesto c={c} cls="n-puesto" tm={0.86} />
        <Filas c={c} cls="n-filas" />
        <Lista items={c.req} titulo="Requisitos" mk="check" />
        <Lista items={c.fun} titulo="Lo que harás" />
        <Chips items={c.ben} />
        <Compromisos c={c} />
      </div>
      <div className="n-foot"><Aplicar c={c} /><QR c={c} /></div>
      <Pie c={c} cls="n-pie" />
    </>
  ),
};

export type FlyerRef = { nodo: HTMLDivElement | null; ajustar: () => void };

/** Un flyer a tamaño real. El que lo muestra decide la escala con un contenedor. */
export const Flyer = forwardRef<FlyerRef, { d: Datos; dis: Diseno; qr: string | null; fuentesListas?: number }>(function Flyer({ d, dis, qr, fuentesListas = 0 }, ref) {
  const raiz = useRef<HTMLDivElement>(null);
  const formato = FORMATOS.find((x) => x.id === dis.formato) ?? FORMATOS[0];
  const p0 = paletaDe(dis);
  const f = FUENTES.find((x) => x.id === dis.fuente) ?? FUENTES[0];
  const m = dis.mostrar;

  // Industrial: siempre oscuro, con el acento que mejor se vea sobre el fondo.
  let p = p0;
  if (dis.plantilla === "industrial") {
    const fondo = luminanciaOscura(p0);
    const acc = [p0.acc, p0.pri, "#ffcf3f"].find((x) => contraste(x, fondo) >= 3.2) ?? "#ffcf3f";
    p = { ...p0, bg: fondo, ink: "#f5f3ee", muted: "#c9c6bf", soft: mezclar(fondo, "#ffffff", 0.1), acc, onAcc: textoSobre(acc), pri: acc, onPri: textoSobre(acc) };
  }
  if (dis.plantilla === "enlace") {
    // El fondo es el color principal: el texto va encima en claro.
    p = { ...p0, bg: p0.pri, ink: p0.onPri, muted: mezclar(p0.onPri, p0.pri, 0.3), soft: mezclar(p0.pri, p0.onPri, 0.12) };
  }

  const c: Ctx = {
    d, m, p, f, qr,
    sal: salarioTexto(d),
    req: limpiar(d.requisitos),
    fun: m.funciones ? limpiar(d.funciones) : [],
    ben: m.beneficios ? limpiar(d.beneficios) : [],
    comp: m.compromisos ? COMPROMISOS.filter((x) => d.compromisos.includes(x.id)).map((x) => ({ id: x.id, t: x.t })) : [],
    wa: d.whatsapp.replace(/\D/g, "").length >= 10 ? whatsappBonito(d.whatsapp) : "",
    foto: m.foto && PLANTILLAS.find((x) => x.id === dis.plantilla)?.foto ? d.foto : null,
    logo: m.logo ? d.logo : null,
    tex: texturaCSS(dis.textura, dis.plantilla === "industrial" ? "#ffffff" : p.onPri),
  };

  const estilo = {
    width: formato.w,
    height: formato.h,
    "--bg": p.bg, "--ink": p.ink, "--pri": p.pri, "--onpri": p.onPri, "--acc": p.acc, "--onacc": p.onAcc, "--soft": p.soft, "--muted": p.muted,
    "--fh": `"${f.titulo}"`, "--ft": `"${f.texto}"`, "--fw": f.peso, "--tt": f.mayus ? "uppercase" : "none", "--ls": f.espacio ?? "0",
    "--aj": f.ajuste ?? 1, "--tp": tamTitulo(d.puesto),
    "--accl": contraste(p.acc, p.bg) >= 2.4 ? p.acc : p.pri,
  } as CSSProperties;

  const ajustar = () => {
    const r = raiz.current;
    if (!r) return;
    ajustarGrandes();
    const nodos = [...r.querySelectorAll<HTMLElement>("[data-fit]")];
    const sobra = () => r.scrollHeight > r.clientHeight + 1 || nodos.some((n) => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1);
    let lo = 0.45;
    let hi = Math.min(1.5, Math.max(1.05, (formato.h / 1350) * 1.12));
    r.style.setProperty("--k", String(hi));
    if (!sobra()) { ajustarGrandes(); return; }
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      r.style.setProperty("--k", String(mid));
      if (sobra()) hi = mid; else lo = mid;
    }
    r.style.setProperty("--k", lo.toFixed(4));
    ajustarGrandes();
  };
  // Frases grandes (afiche, franja): si no caben a lo ancho o a lo alto, se achican solas.
  const ajustarGrandes = () => {
    const r = raiz.current;
    if (!r) return;
    for (const el of r.querySelectorAll<HTMLElement>("[data-cabe]")) {
      const no = () => el.scrollWidth > el.clientWidth + 1 || (el.dataset.cabe === "ambos" && el.scrollHeight > el.clientHeight + 1);
      let g = 1;
      el.style.setProperty("--ga", "1");
      while (no() && g > 0.3) { g -= 0.04; el.style.setProperty("--ga", g.toFixed(2)); }
    }
  };

  useImperativeHandle(ref, () => ({ get nodo() { return raiz.current; }, ajustar }));

  const huella = JSON.stringify([d, dis, qr ? qr.length : 0, fuentesListas]);
  useLayoutEffect(() => {
    ajustar();
    // Las imágenes (logo, foto, QR) cambian el alto cuando terminan de cargar.
    const imgs = [...(raiz.current?.querySelectorAll("img") ?? [])].filter((i) => !i.complete);
    imgs.forEach((i) => i.addEventListener("load", ajustar, { once: true }));
    return () => imgs.forEach((i) => i.removeEventListener("load", ajustar));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huella]);

  return (
    <div ref={raiz} className={`fx fx-t-${dis.plantilla} fx-f-${formato.id}`} style={estilo}>
      <style>{CSS}</style>
      {T[dis.plantilla](c)}
    </div>
  );
});

function luminanciaOscura(p: Paleta): string {
  // Toma el color más oscuro de la paleta y lo lleva casi a negro, para que se lea bien y siga teniendo su tono.
  const base = [p.ink, p.pri].sort((a, b) => contraste(b, "#ffffff") - contraste(a, "#ffffff"))[0];
  return mezclar(base, "#0b0b0b", 0.55);
}

// ---------- Estilos ----------
const CSS = `
.fx{position:relative;overflow:hidden;background:var(--bg);color:var(--ink);font-family:var(--ft),"Figtree",system-ui,sans-serif;--u:calc(var(--k,1) * 1px);display:flex;flex-direction:column;line-height:1.28;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.fx *{box-sizing:border-box;margin:0;padding:0}
.fx-deco{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.fx img{display:block}
.fx-h{font-family:var(--fh),var(--ft),sans-serif;font-weight:var(--fw);text-transform:var(--tt);letter-spacing:var(--ls);line-height:1.02;font-size:calc(var(--u) * var(--tp) * var(--aj) * var(--tm,1));text-wrap:balance;overflow-wrap:break-word;hyphens:manual}
.fx-fit{flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:calc(var(--u) * 30)}
.fx-fit>*{flex:none}
.fx-i{width:calc(var(--u) * 32);height:calc(var(--u) * 32);flex:none;stroke-width:2.2}
.fx-i-s{width:calc(var(--u) * 22);height:calc(var(--u) * 22);flex:none;stroke-width:3}
.fx-filas{display:flex;flex-direction:column;gap:calc(var(--u) * 14)}
.fx-fila{display:flex;align-items:center;gap:calc(var(--u) * 16);font-size:calc(var(--u) * 30);font-weight:600;line-height:1.2}
.fx-fila .fx-i{color:var(--accl)}
.fx-sal{font-weight:800;background:var(--acc);color:var(--onacc);padding:calc(var(--u) * 5) calc(var(--u) * 16);border-radius:calc(var(--u) * 10);margin-left:calc(var(--u) * -4)}
.fx-sec{font-size:calc(var(--u) * 24);font-weight:800;margin-bottom:calc(var(--u) * 12);color:var(--muted)}
.fx-lista{list-style:none;display:flex;flex-direction:column;gap:calc(var(--u) * 11);font-size:calc(var(--u) * 29);line-height:1.25}
.fx-lista li{display:flex;gap:calc(var(--u) * 16);align-items:flex-start}
.fx-mk-punto{flex:none;width:calc(var(--u) * 13);height:calc(var(--u) * 13);border-radius:50%;background:var(--accl);margin-top:calc(var(--u) * 11)}
.fx-mk-raya{flex:none;width:calc(var(--u) * 22);height:calc(var(--u) * 4);background:var(--accl);margin-top:calc(var(--u) * 17)}
.fx-mk-check,.fx-mk-caja{flex:none;display:flex;align-items:center;justify-content:center;width:calc(var(--u) * 34);height:calc(var(--u) * 34);margin-top:calc(var(--u) * 1)}
.fx-mk-check{border-radius:50%;background:var(--pri);color:var(--onpri)}
.fx-mk-caja{border:calc(var(--u) * 3.5) solid var(--accl);border-radius:calc(var(--u) * 7);color:var(--accl)}
.fx-mk-check svg,.fx-mk-caja svg{width:68%;height:68%;stroke-width:3.4}
.fx-chips{display:flex;flex-wrap:wrap;gap:calc(var(--u) * 10)}
.fx-chip{font-size:calc(var(--u) * 23);font-weight:700;padding:calc(var(--u) * 9) calc(var(--u) * 20);border-radius:999px;background:var(--soft);color:var(--ink);line-height:1.15}
.fx-comp{display:inline-flex;align-items:center;gap:calc(var(--u) * 8);font-size:calc(var(--u) * 21);font-weight:700;padding:calc(var(--u) * 8) calc(var(--u) * 18);border-radius:999px;border:calc(var(--u) * 2.5) solid var(--accl);line-height:1.15}
.fx-ap{display:flex;flex-direction:column;gap:calc(var(--u) * 8);font-size:calc(var(--u) * 28);font-weight:700;min-width:0}
.fx-ap .fx-sec{margin-bottom:calc(var(--u) * 4)}
.fx-ap-l{display:flex;gap:calc(var(--u) * 12);align-items:center;overflow-wrap:anywhere;line-height:1.2}
.fx-qr{flex:none;display:flex;flex-direction:column;align-items:center;gap:calc(var(--u) * 8)}
.fx-qr img{width:calc(var(--u) * 196);height:calc(var(--u) * 196);background:#fff;padding:calc(var(--u) * 12);border-radius:calc(var(--u) * 16)}
.fx-qr span{font-size:calc(var(--u) * 18);font-weight:700}
.fx-pie{display:flex;justify-content:space-between;align-items:center;gap:12px 24px;flex-wrap:wrap;font-size:calc(var(--u) * 19);line-height:1.2;opacity:.82}
.fx-pie b{font-weight:800}
.fx-logo{max-height:calc(var(--u) * 92);max-width:340px;width:auto;height:auto;object-fit:contain}
.fx-marca{font-family:var(--fh),var(--ft),sans-serif;font-weight:var(--fw);font-size:calc(var(--u) * 32);line-height:1.05;letter-spacing:var(--ls)}

/* Bloque */
.fx-t-bloque .b-top{background-color:var(--pri);color:var(--onpri);padding:68px 72px 60px;display:flex;flex-direction:column;gap:calc(var(--u) * 34)}
.fx-t-bloque .b-head{display:flex;justify-content:space-between;align-items:center;gap:24px}
.fx-t-bloque .b-cab{font-size:calc(var(--u) * 32);font-weight:800;opacity:.92}
.fx-t-bloque .b-chip{background:#fff;color:#111;border-radius:calc(var(--u) * 18);padding:calc(var(--u) * 14) calc(var(--u) * 22);display:flex;align-items:center}
.fx-t-bloque .b-chip .fx-logo{max-height:calc(var(--u) * 70)}
.fx-t-bloque .b-chip .fx-marca{font-size:calc(var(--u) * 26)}
.fx-t-bloque .b-body{padding:52px 72px 36px}
.fx-t-bloque .b-foot{background:var(--soft);padding:40px 72px 36px;display:flex;flex-direction:column;gap:24px}
.fx-t-bloque .b-foot-r{display:flex;justify-content:space-between;align-items:center;gap:32px}
.fx-t-bloque .b-foot .fx-qr img{width:calc(var(--u) * 170);height:calc(var(--u) * 170)}

/* Editorial */
.fx-t-editorial .e-foto{height:34%;flex:none;overflow:hidden}
.fx-t-editorial .e-foto img{width:100%;height:100%;object-fit:cover}
.fx-t-editorial .e-regla{height:28px;flex:none;background-color:var(--pri)}
.fx-t-editorial .e-mast{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:40px 72px 24px;margin:0 72px;padding-left:0;padding-right:0;border-bottom:3px solid var(--ink)}
.fx-t-editorial .e-cab{font-family:var(--fh),serif;font-size:calc(var(--u) * 34);font-style:italic;font-weight:600;color:var(--accl)}
.fx-t-editorial .e-main{padding:36px 72px 24px;gap:calc(var(--u) * 28)}
.fx-t-editorial .e-filas{flex-direction:row;flex-wrap:wrap;gap:calc(var(--u) * 12) calc(var(--u) * 34)}
.fx-t-editorial .e-filas .fx-fila{font-size:calc(var(--u) * 27)}
.fx-t-editorial .e-cols{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:44px;border-top:1.5px solid var(--ink);padding-top:calc(var(--u) * 26)}
.fx-t-editorial .e-cols>div:only-child{grid-column:1 / -1}
.fx-t-editorial .e-col2{border-left:1.5px solid var(--ink);padding-left:44px}
.fx-t-editorial .e-sep{margin-top:calc(var(--u) * 26)}
.fx-t-editorial .fx-lista{font-size:calc(var(--u) * 27)}
.fx-t-editorial .e-foot{margin:0 72px;padding:28px 0 24px;border-top:3px solid var(--ink);display:flex;justify-content:space-between;align-items:center;gap:32px}
.fx-t-editorial .e-pie{padding:0 72px 40px}
.fx-t-editorial .fx-sal{background:none;color:var(--ink);padding:0;margin:0;box-shadow:inset 0 calc(var(--u) * -12) 0 var(--soft)}

/* Boleto */
.fx-t-ticket .t-wrap{flex:1;display:flex;flex-direction:column;background-color:var(--pri);padding:64px 64px 40px;gap:26px;min-height:0}
.fx-t-ticket .t-card{flex:1;min-height:0;background:var(--bg);border-radius:40px;display:flex;flex-direction:column}
.fx-t-ticket .t-top{padding:52px 60px 36px;gap:calc(var(--u) * 26)}
.fx-t-ticket .t-head{display:flex;justify-content:space-between;align-items:center;gap:24px}
.fx-t-ticket .t-cab{font-size:calc(var(--u) * 28);font-weight:800;color:var(--pri);background:var(--soft);padding:calc(var(--u) * 8) calc(var(--u) * 20);border-radius:999px}
.fx-t-ticket .t-filas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:calc(var(--u) * 16) calc(var(--u) * 24)}
.fx-t-ticket .t-filas .fx-fila{font-size:calc(var(--u) * 26);align-items:flex-start}
.fx-t-ticket .t-corte{position:relative;display:flex;align-items:center;height:64px;flex:none}
.fx-t-ticket .t-corte i{position:absolute;width:64px;height:64px;border-radius:50%;background:var(--pri);top:0}
.fx-t-ticket .t-corte i:first-child{left:-32px}.fx-t-ticket .t-corte i:last-child{right:-32px}
.fx-t-ticket .t-corte b{flex:1;margin:0 52px;border-top:4px dashed var(--soft);height:0}
.fx-t-ticket .t-stub{padding:20px 60px 44px;display:flex;justify-content:space-between;align-items:center;gap:32px}
.fx-t-ticket .t-stub .fx-sec{color:var(--pri)}
.fx-t-ticket .t-pie{color:var(--onpri)}

/* Afiche */
.fx-t-afiche .a-top{background-color:var(--pri);color:var(--onpri);padding:56px 64px 48px;position:relative}
.fx-t-afiche .a-logo{position:absolute;top:56px;right:64px;max-width:40%}
.fx-t-afiche .a-logo .fx-marca{font-size:calc(var(--u) * 26)}
.fx-t-afiche .a-grito{display:flex;flex-direction:column;font-family:var(--fh),sans-serif;font-weight:var(--fw);text-transform:var(--tt);letter-spacing:var(--ls);line-height:.9;padding-top:calc(var(--u) * 76)}
.fx-t-afiche .a-hueco{color:transparent;-webkit-text-stroke:calc(var(--u) * 3.5) var(--onpri)}
.fx-t-afiche .a-panel{flex:1;min-height:0;display:flex;flex-direction:column;padding:48px 64px 36px;gap:26px}
.fx-t-afiche .a-main{gap:calc(var(--u) * 26)}
.fx-t-afiche .a-foot{display:flex;justify-content:space-between;align-items:center;gap:32px;border-top:4px solid var(--ink);padding-top:26px}

/* Franja */
.fx-t-lateral .l-row{flex:1;display:flex;min-height:0}
.fx-t-lateral .l-band{overflow:hidden;width:200px;flex:none;background-color:var(--pri);color:var(--onpri);display:flex;align-items:flex-end;justify-content:center;padding:64px 0}
.fx-t-lateral .l-vert{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--fh),sans-serif;font-weight:var(--fw);text-transform:var(--tt);letter-spacing:var(--ls);font-size:calc(var(--u) * 84 * var(--ga, 1));line-height:1;white-space:nowrap}
.fx-t-lateral .l-main{flex:1;min-width:0;display:flex;flex-direction:column;padding:64px 64px 40px 64px;gap:30px}
.fx-t-lateral .l-logo{align-self:flex-start}
.fx-t-lateral .l-ap{display:flex;justify-content:space-between;align-items:center;gap:28px;background:var(--soft);border-radius:28px;padding:30px 34px}

/* Mínima */
.fx-t-minimal{padding:88px 88px 56px}
.fx-t-minimal .m-top{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-bottom:56px}
.fx-t-minimal .m-cab{font-size:calc(var(--u) * 26);color:var(--muted);font-weight:600}
.fx-t-minimal .m-main{gap:calc(var(--u) * 32)}
.fx-t-minimal .m-puesto{font-family:var(--ft),sans-serif;font-weight:700;text-transform:none;letter-spacing:-0.03em}
.fx-t-minimal .m-linea{width:120px;height:7px;background:var(--accl)}
.fx-t-minimal .m-filas .fx-fila{font-weight:500}
.fx-t-minimal .m-filas .fx-i{color:var(--muted)}
.fx-t-minimal .m-sal{font-weight:800;color:var(--ink)}
.fx-t-minimal .fx-sec{font-weight:700}
.fx-t-minimal .m-ben{font-size:calc(var(--u) * 27)}
.fx-t-minimal .m-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;padding:32px 0 28px;border-top:1.5px solid var(--ink)}
.fx-t-minimal .fx-qr img{width:calc(var(--u) * 160);height:calc(var(--u) * 160);border:1.5px solid var(--soft)}

/* Arco */
.fx-t-arco{align-items:center;text-align:center;padding:56px 64px 36px}
.fx-t-arco .r-arco{width:700px;height:26%;flex:none;border-radius:370px 370px 0 0;background-color:var(--pri);color:var(--onpri);overflow:hidden;display:flex;align-items:flex-end;justify-content:center}
.fx-t-arco .r-arco img{width:100%;height:100%;object-fit:cover}
.fx-t-arco .r-dentro{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u) * 18);padding:0 60px 48px}
.fx-t-arco .r-logo.fx-logo,.fx-t-afiche .a-logo .fx-logo{background:#fff;padding:calc(var(--u) * 12) calc(var(--u) * 18);border-radius:calc(var(--u) * 14)}
.fx-t-arco .r-cab{font-family:var(--fh),serif;font-size:calc(var(--u) * 54);font-weight:var(--fw);line-height:1.05;text-transform:var(--tt)}
.fx-t-arco .r-main{width:100%;align-items:center;padding-top:32px;gap:calc(var(--u) * 20)}
.fx-t-arco .r-fila-logo{display:flex;align-items:center;gap:20px;justify-content:center}
.fx-t-arco .r-cab2{font-size:calc(var(--u) * 28);font-weight:700;color:var(--accl)}
.fx-t-arco .r-filas{flex-direction:row;flex-wrap:wrap;justify-content:center;gap:calc(var(--u) * 10) calc(var(--u) * 30)}
.fx-t-arco .r-filas .fx-fila{font-size:calc(var(--u) * 27)}
.fx-t-arco .fx-lista{align-items:center}
.fx-t-arco .fx-lista li{justify-content:center}
.fx-t-arco .fx-sec{text-align:center}
.fx-t-arco .r-centro{justify-content:center}
.fx-t-arco .r-foot{display:flex;align-items:center;justify-content:center;gap:40px;padding:30px 0 26px;text-align:left;border-top:2px solid var(--soft);width:100%}
.fx-t-arco .fx-pie{width:100%}

/* Industrial */
.fx-t-industrial .i-franja{height:34px;flex:none;background:repeating-linear-gradient(-45deg,var(--acc) 0 30px,transparent 30px 60px)}
.fx-t-industrial .i-top{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:48px 72px 0}
.fx-t-industrial .i-cab{background:var(--acc);color:var(--onacc);font-family:var(--fh),sans-serif;font-weight:var(--fw);text-transform:uppercase;font-size:calc(var(--u) * 30);padding:calc(var(--u) * 10) calc(var(--u) * 20);letter-spacing:.01em}
.fx-t-industrial .i-logo{background:#fff;color:#111;padding:calc(var(--u) * 12) calc(var(--u) * 18);border-radius:calc(var(--u) * 10);display:flex}
.fx-t-industrial .i-logo .fx-logo{max-height:calc(var(--u) * 66)}
.fx-t-industrial .i-logo .fx-marca{font-size:calc(var(--u) * 24)}
.fx-t-industrial .i-main{padding:40px 72px 24px;gap:calc(var(--u) * 28)}
.fx-t-industrial .i-puesto{text-transform:uppercase}
.fx-t-industrial .i-filas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;border-top:2px solid rgba(255,255,255,.22)}
.fx-t-industrial .i-filas .fx-fila{padding:calc(var(--u) * 16) 0;border-bottom:2px solid rgba(255,255,255,.22);font-size:calc(var(--u) * 26);align-items:flex-start}
.fx-t-industrial .i-filas .fx-fila:nth-child(odd){padding-right:20px}
.fx-t-industrial .fx-chip{background:rgba(255,255,255,.1);color:var(--ink)}
.fx-t-industrial .i-foot{display:flex;justify-content:space-between;align-items:center;gap:32px;padding:26px 72px;background:rgba(255,255,255,.06)}
.fx-t-industrial .i-pie{padding:20px 72px 22px}

/* Cercana */
.fx-t-suave{background:var(--soft);padding:64px 64px 36px;gap:26px}
.fx-t-suave .s-circ1{position:absolute;width:430px;height:430px;border-radius:50%;background-color:var(--pri);right:-170px;top:-250px}
.fx-t-suave .s-circ2{position:absolute;width:300px;height:300px;border-radius:50%;background:var(--acc);left:-150px;bottom:-150px;opacity:.85}
.fx-t-suave .s-top{position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
.fx-t-suave .s-cab{background:var(--bg);color:var(--pri);font-weight:800;font-size:calc(var(--u) * 27);padding:calc(var(--u) * 10) calc(var(--u) * 24);border-radius:999px}
.fx-t-suave .s-logo{background:#fff;color:#111;border-radius:calc(var(--u) * 24);padding:calc(var(--u) * 16) calc(var(--u) * 22);display:flex;box-shadow:0 10px 30px rgba(0,0,0,.12)}
.fx-t-suave .s-logo .fx-logo{max-height:calc(var(--u) * 72)}
.fx-t-suave .s-logo .fx-marca{font-size:calc(var(--u) * 26)}
.fx-t-suave .s-main{position:relative;gap:calc(var(--u) * 22)}
.fx-t-suave .s-puesto{padding-right:120px}
.fx-t-suave .s-card{background:var(--bg);border-radius:30px;padding:calc(var(--u) * 30) 34px;position:relative}
.fx-t-suave .s-sep{margin-top:calc(var(--u) * 22)}
.fx-t-suave .fx-chip{background:var(--bg)}
.fx-t-suave .s-ap{display:flex;justify-content:space-between;align-items:center;gap:28px;flex:none}
.fx-t-suave .s-pie{position:relative}

/* Lista */
.fx-t-lista .li-top{background-color:var(--pri);color:var(--onpri);padding:44px 72px;display:flex;justify-content:space-between;align-items:center;gap:24px}
.fx-t-lista .li-top .fx-logo{background:#fff;padding:calc(var(--u) * 10) calc(var(--u) * 16);border-radius:calc(var(--u) * 12);max-height:calc(var(--u) * 84)}
.fx-t-lista .li-cab{font-size:calc(var(--u) * 30);font-weight:800}
.fx-t-lista .li-main{padding:48px 72px 24px;gap:calc(var(--u) * 28)}
.fx-t-lista .li-filas{flex-direction:row;flex-wrap:wrap;gap:calc(var(--u) * 12) calc(var(--u) * 32)}
.fx-t-lista .li-filas .fx-fila{font-size:calc(var(--u) * 27)}
.fx-t-lista .li-hoja{border:4px solid var(--ink);border-radius:26px;padding:calc(var(--u) * 30) 36px}
.fx-t-lista .li-hoja .fx-sec{color:var(--ink);font-size:calc(var(--u) * 30)}
.fx-t-lista .li-hoja .fx-lista{gap:calc(var(--u) * 16)}
.fx-t-lista .li-nota{margin-top:calc(var(--u) * 20);font-size:calc(var(--u) * 23);color:var(--muted);font-style:italic}
.fx-t-lista .li-foot{display:flex;justify-content:space-between;align-items:center;gap:32px;padding:26px 72px;border-top:4px solid var(--ink);margin:0}
.fx-t-lista>.fx-pie{padding:0 72px 36px}

/* Marco */
.fx-t-marco .k-marco{flex:1;min-height:0;background-color:var(--pri);padding:44px;display:flex}
.fx-t-marco .k-hoja{flex:1;min-width:0;background:var(--bg);padding:20px;display:flex}
.fx-t-marco .k-filete{flex:1;min-width:0;border:2.5px solid var(--pri);display:flex;flex-direction:column;align-items:center;text-align:center;padding:52px 56px 30px;gap:22px}
.fx-t-marco .k-cab{font-family:var(--fh),serif;font-style:italic;font-size:calc(var(--u) * 36);color:var(--accl);font-weight:600}
.fx-t-marco .k-main{width:100%;align-items:center;gap:calc(var(--u) * 24)}
.fx-t-marco .k-orn{display:flex;align-items:center;gap:16px;width:260px}
.fx-t-marco .k-orn i{flex:1;height:2px;background:var(--pri)}
.fx-t-marco .k-orn b{width:14px;height:14px;background:var(--accl);transform:rotate(45deg)}
.fx-t-marco .k-filas{align-items:center}
.fx-t-marco .fx-lista{align-items:center}
.fx-t-marco .fx-sec{text-align:center}
.fx-t-marco .k-centro{justify-content:center}
.fx-t-marco .k-foot{display:flex;align-items:center;justify-content:center;gap:36px;text-align:left;padding-top:22px;border-top:1.5px solid var(--pri);width:100%}
.fx-t-marco .k-pie{width:100%}

/* Enlace */
.fx-t-enlace{padding:64px 72px 36px;gap:26px}
.fx-t-enlace .n-eslabon{position:absolute;width:900px;right:-360px;top:40px;color:var(--onpri);opacity:.09}
.fx-t-enlace .n-top{position:relative;display:flex;justify-content:space-between;align-items:center;gap:24px}
.fx-t-enlace .n-cab{background:var(--acc);color:var(--onacc);font-weight:800;font-size:calc(var(--u) * 28);padding:calc(var(--u) * 10) calc(var(--u) * 24);border-radius:999px}
.fx-t-enlace .n-logo{background:#fff;color:#111;border-radius:calc(var(--u) * 18);padding:calc(var(--u) * 14) calc(var(--u) * 20);display:flex}
.fx-t-enlace .n-logo .fx-logo{max-height:calc(var(--u) * 70)}
.fx-t-enlace .n-logo .fx-marca{font-size:calc(var(--u) * 26)}
.fx-t-enlace .n-main{position:relative;gap:calc(var(--u) * 28)}
.fx-t-enlace .fx-sec{color:var(--muted)}
.fx-t-enlace .fx-chip{background:var(--soft);color:var(--ink)}
.fx-t-enlace .fx-mk-check{background:var(--acc);color:var(--onacc)}
.fx-t-enlace .n-foot{position:relative;display:flex;justify-content:space-between;align-items:center;gap:28px;background:#fff;color:#0f1d33;border-radius:30px;padding:30px 34px}
.fx-t-enlace .n-foot .fx-i{color:var(--pri)}
.fx-t-enlace .n-foot .fx-sec{color:#55657d}
.fx-t-enlace .n-foot .fx-qr img{padding:0;width:calc(var(--u) * 170);height:calc(var(--u) * 170)}
.fx-t-enlace .n-pie{position:relative}

/* Formatos */
.fx-f-cuadrado .fx-qr img{width:calc(var(--u) * 150) !important;height:calc(var(--u) * 150) !important}
.fx-f-historia .fx-fit{justify-content:center}
`;
