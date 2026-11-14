import { categoria, enlaceSeguro } from "@/lib/blog";
import { cn } from "@/lib/utils";

/**
 * Portada de un artículo. Si tiene foto, la muestra con un velo de color;
 * si no, arma una portada de marca: el color del tema + los eslabones del logo, grandes y cortados por el borde.
 */
/** `titulo` queda para el texto alternativo de la portada. */
export function Tapa({ titulo, cat, portada, className, conTexto = false, variante = 0, frase = "", grande = false }: { titulo: string; cat: string; portada?: string | null; className?: string; conTexto?: boolean; variante?: number; frase?: string; grande?: boolean }) {
  const c = categoria(cat);
  const src = portada ? enlaceSeguro(portada) : null;
  const v = Math.abs(variante) % 3;
  return (
    <div role="img" aria-label={`Portada: ${titulo}`} className={cn("relative isolate overflow-hidden", className)} style={{ background: `linear-gradient(135deg, #0a2f5c 0%, ${c.color} 120%)` }}>
      {src ? (
        <>
          <img src={src} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: `linear-gradient(180deg, transparent 30%, ${conTexto ? "rgb(6 22 46 / .92)" : "rgb(6 22 46 / .25)"} 100%)` }} />
        </>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 -z-10 size-full">
          <defs>
            <radialGradient id={`brillo-${c.id}-${v}`} cx="80%" cy="10%" r="80%"><stop offset="0" stopColor="#8ec1ff" stopOpacity=".45" /><stop offset="1" stopColor="#8ec1ff" stopOpacity="0" /></radialGradient>
          </defs>
          <rect width="400" height="300" fill={`url(#brillo-${c.id}-${v})`} />
          {v === 0 && (<>
            <rect x="215" y="-40" width="230" height="170" rx="85" fill="none" stroke="#ffffff" strokeOpacity=".13" strokeWidth="34" />
            <rect x="290" y="70" width="230" height="170" rx="85" fill="none" stroke="#8ec1ff" strokeOpacity=".28" strokeWidth="34" />
          </>)}
          {v === 1 && (<>
            <circle cx="330" cy="40" r="46" fill="#ffffff" fillOpacity=".12" />
            <rect x="250" y="100" width="210" height="230" rx="105" fill="none" stroke="#ffffff" strokeOpacity=".14" strokeWidth="36" />
            <rect x="-60" y="210" width="200" height="140" rx="70" fill="none" stroke="#8ec1ff" strokeOpacity=".22" strokeWidth="28" />
          </>)}
          {v === 2 && (<>
            <rect x="-70" y="-60" width="240" height="170" rx="85" fill="none" stroke="#8ec1ff" strokeOpacity=".22" strokeWidth="30" />
            <rect x="240" y="150" width="240" height="170" rx="85" fill="none" stroke="#ffffff" strokeOpacity=".13" strokeWidth="34" />
            <path d="M300 40 h60 a18 18 0 0 1 18 18 v40 a18 18 0 0 1 -18 18 h-60 a18 18 0 0 1 -18 -18 v-40 a18 18 0 0 1 18 -18 z M318 40 v-12 a10 10 0 0 1 10 -10 h4 a10 10 0 0 1 10 10 v12" fill="none" stroke="#ffffff" strokeOpacity=".2" strokeWidth="9" />
          </>)}
        </svg>
      )}
      {!src && frase && !conTexto && (
        <figure aria-hidden="true" className={cn("absolute inset-0 flex flex-col justify-end", grande ? "p-8 md:p-14" : "p-5")}>
          <span className={cn("font-display font-extrabold leading-none text-[#8ec1ff]", grande ? "text-[5rem] md:text-[7rem]" : "text-[3rem]")}>“</span>
          <p className={cn("blog-tapa-titulo font-display font-extrabold text-white", grande ? "-mt-6 max-w-3xl text-[1.5rem] leading-[1.2] md:-mt-10 md:text-[2.4rem]" : "-mt-4 line-clamp-3 text-[1.02rem] leading-[1.25]")}>{frase}</p>
        </figure>
      )}
    </div>
  );
}

export function Etiqueta({ cat, claro = false, className }: { cat: string; claro?: boolean; className?: string }) {
  const c = categoria(cat);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em]", claro ? "bg-white/12 text-white ring-1 ring-white/20" : "bg-white text-[#0a2f5c] ring-1 ring-border", className)}>
      <span className="size-1.5 rounded-full" style={{ background: claro ? "#8ec1ff" : c.color }} />{c.t}
    </span>
  );
}
