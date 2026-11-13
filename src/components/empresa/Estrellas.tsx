import { Star } from "lucide-react";

const ORO = "#f5a700";

/** Estrellas de solo lectura (admite medias). */
export function Estrellas({ valor, size = 16, className = "" }: { valor: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${valor.toFixed(1)} de 5 estrellas`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const lleno = Math.max(0, Math.min(1, valor - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-[#d9dee8]" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            {lleno > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${lleno * 100}%` }}>
                <Star style={{ width: size, height: size, color: ORO }} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Estrellas para elegir de 1 a 5. */
export function ElegirEstrellas({ valor, onChange, size = 34, etiqueta }: { valor: number; onChange: (n: number) => void; size?: number; etiqueta: string }) {
  const textos = ["", "Muy mal", "Mal", "Regular", "Bien", "Excelente"];
  return (
    <div className="flex items-center gap-3" role="radiogroup" aria-label={etiqueta}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`} onClick={() => onChange(n)}
            className="rounded-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6ff2]">
            <Star style={{ width: size, height: size, color: n <= valor ? ORO : "#d9dee8" }} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
      </div>
      {valor > 0 && <span className="text-sm font-bold text-muted-foreground">{textos[valor]}</span>}
    </div>
  );
}

/** Medio círculo con el promedio (como un medidor). */
export function Medidor({ valor, size = 180 }: { valor: number; size?: number }) {
  const r = 70, c = Math.PI * r, pct = Math.max(0, Math.min(1, (valor - 1) / 4));
  return (
    <svg viewBox="0 0 180 100" width={size} height={(size * 100) / 180} aria-hidden="true">
      <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="#e7ebf2" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke={ORO} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      <text x="90" y="82" textAnchor="middle" className="fill-[#0a2f5c]" style={{ font: "800 34px Figtree, system-ui, sans-serif" }}>{valor.toFixed(1)}</text>
    </svg>
  );
}
