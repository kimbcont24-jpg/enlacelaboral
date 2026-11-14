import { Fragment, type CSSProperties, type ReactNode } from "react";
import { Brain, Lightbulb, Quote } from "lucide-react";

import { analizar, enLinea, enlaceSeguro, type Bloque, type Trozo } from "@/lib/blog";

function Linea({ trozos }: { trozos: Trozo[] }): ReactNode {
  return trozos.map((x, i) => {
    if (x.t === "txt") return <Fragment key={i}>{x.v}</Fragment>;
    if (x.t === "b") return <strong key={i} className="font-extrabold text-[#0a2f5c]"><Linea trozos={x.v} /></strong>;
    if (x.t === "i") return <em key={i}><Linea trozos={x.v} /></em>;
    const href = enlaceSeguro(x.href);
    if (!href) return <Fragment key={i}>{x.v}</Fragment>;
    const fuera = /^https?:/.test(href) && !href.includes("enlacelaboralrd.com");
    return <a key={i} href={href} {...(fuera ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-semibold text-[#1557c4] underline decoration-[#8ec1ff] decoration-2 underline-offset-4 hover:decoration-[#1d6ff2]">{x.v}</a>;
  });
}

const L = ({ s }: { s: string }) => <Linea trozos={enLinea(s)} />;

export function Contenido({ texto, bloques: dados, color = "#1d6ff2" }: { texto?: string; bloques?: Bloque[]; color?: string }) {
  const bloques = dados ?? analizar(texto ?? "");
  let primerP = true;
  return (
    <div className="blog-cuerpo text-[1.13rem] leading-[1.8] text-[#1f2b40] md:text-[1.2rem]">
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case "p": {
            const capital = primerP;
            primerP = false;
            return <p key={i} className={capital ? "blog-capital" : undefined} style={capital ? ({ "--cap": color } as CSSProperties) : undefined}><L s={b.texto} /></p>;
          }
          case "h2":
            return <h2 key={i} id={b.id} className="scroll-mt-28 pt-6 font-display text-[1.5rem] font-extrabold leading-tight tracking-tight text-[#0a2f5c] md:text-[1.85rem]"><L s={b.texto} /></h2>;
          case "h3":
            return <h3 key={i} id={b.id} className="scroll-mt-28 pt-2 text-[1.25rem] font-extrabold text-[#0a2f5c]"><L s={b.texto} /></h3>;
          case "cita":
            return (
              <blockquote key={i} className="relative my-10 border-l-0 py-2 pl-0 md:-mx-10">
                <Quote aria-hidden="true" className="mb-3 size-10" style={{ color }} />
                <p className="text-balance font-display text-[1.45rem] font-extrabold leading-[1.3] tracking-tight text-[#0a2f5c] md:text-[1.9rem]"><L s={b.texto} /></p>
                <span aria-hidden="true" className="mt-5 block h-1.5 w-20 rounded-full" style={{ background: color }} />
              </blockquote>
            );
          case "dato":
            return (
              <aside key={i} className="my-8 flex gap-4 rounded-3xl border border-[#1d6ff2]/20 bg-[#f3f7fd] p-5 md:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#1d6ff2] text-white"><Lightbulb className="size-5" aria-hidden="true" /></span>
                <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1557c4]">Dato clave</p><p className="mt-1 text-[1.05rem] leading-relaxed text-[#14213a]"><L s={b.texto} /></p></div>
              </aside>
            );
          case "mirada":
            return (
              <aside key={i} className="relative my-10 overflow-hidden rounded-3xl bg-[#0a2f5c] p-6 text-white md:p-8">
                <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full border-[18px] border-white/[0.06]" />
                <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#8ec1ff]"><Brain className="size-4" aria-hidden="true" /> Mirada psicológica</p>
                <p className="relative mt-3 text-[1.08rem] leading-relaxed text-white/90 md:text-[1.15rem]"><L s={b.texto} /></p>
              </aside>
            );
          case "ul":
          case "ol": {
            const Tag = b.tipo;
            return (
              <Tag key={i} className="my-2 space-y-3">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    {b.tipo === "ol" ? <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full font-display text-xs font-extrabold text-white" style={{ background: color }}>{j + 1}</span> : <span aria-hidden="true" className="mt-[0.72em] size-2 shrink-0 rotate-45 rounded-[2px]" style={{ background: color }} />}
                    <span><L s={it} /></span>
                  </li>
                ))}
              </Tag>
            );
          }
          case "img": {
            const src = enlaceSeguro(b.src);
            if (!src) return null;
            return (
              <figure key={i} className="my-10 md:-mx-10">
                <img src={src} alt={b.alt} loading="lazy" className="w-full rounded-3xl object-cover shadow-[0_30px_60px_-40px_rgb(10_47_92/0.7)]" />
                {b.alt && <figcaption className="mt-3 text-center text-sm text-muted-foreground">{b.alt}</figcaption>}
              </figure>
            );
          }
          case "hr":
            return <div key={i} aria-hidden="true" className="flex justify-center gap-3 py-6">{[0, 1, 2].map((k) => <span key={k} className="size-1.5 rounded-full" style={{ background: color }} />)}</div>;
        }
      })}
    </div>
  );
}
