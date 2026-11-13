import { BadgeCheck, Calculator, FileSpreadsheet, Headset, PenLine, Star } from "lucide-react";
import { NIVEL_TXT, PERFILA, infoPrueba, type Insignia, type Nivel, type PruebaInsignia } from "@/lib/insignias-datos";

const ICONO: Record<PruebaInsignia, typeof Headset> = {
  servicio_cliente: Headset,
  excel_word: FileSpreadsheet,
  ortografia_redaccion: PenLine,
  calculo_caja: Calculator,
};

/** Marca de Perfila: cuadro amarillo con la P y el punto violeta (igual que en Perfila). */
export function MarcaPerfila({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`relative inline-grid shrink-0 place-items-center rounded-[28%] font-extrabold ${className}`}
      style={{ width: size, height: size, backgroundColor: PERFILA.amarillo, color: PERFILA.azul, fontSize: size * 0.5, fontFamily: "Manrope, Figtree, system-ui, sans-serif" }}>
      P
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2" style={{ width: size * 0.32, height: size * 0.32, backgroundColor: PERFILA.violeta, borderColor: PERFILA.azul }} />
    </span>
  );
}

/** Medalla de la insignia: hexágono con el color de la prueba y estrella si es Destacado. */
export function Medalla({ prueba, nivel, size = 72, apagada = false }: { prueba: PruebaInsignia; nivel?: Nivel | null; size?: number; apagada?: boolean }) {
  const info = infoPrueba(prueba);
  const I = ICONO[prueba];
  const color = apagada ? "#c9c5e3" : info?.color ?? PERFILA.violeta;
  const id = `g-${prueba}-${apagada ? "o" : nivel ?? "n"}`;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={apagada ? "#a9a4cf" : PERFILA.azul} />
          </linearGradient>
        </defs>
        <polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5" fill={`url(#${id})`} />
        <polygon points="50,12 83,31 83,69 50,88 17,69 17,31" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="2" />
      </svg>
      <I className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white" style={{ width: size * 0.38, height: size * 0.38 }} strokeWidth={2.2} />
      {nivel === "destacado" && !apagada && (
        <span className="absolute -right-1 -top-1 grid place-items-center rounded-full shadow" style={{ width: size * 0.34, height: size * 0.34, backgroundColor: PERFILA.amarillo }}>
          <Star className="fill-current" style={{ width: size * 0.2, height: size * 0.2, color: PERFILA.azul }} />
        </span>
      )}
    </span>
  );
}

/** Insignia compacta para el CV y las listas: medalla + nombre + nivel + «Verificada por Perfila». */
export function InsigniaFila({ i, impresa = false }: { i: Insignia; impresa?: boolean }) {
  const info = infoPrueba(i.prueba);
  return (
    <span className="inline-flex items-center gap-2.5">
      <Medalla prueba={i.prueba} nivel={i.nivel} size={impresa ? 30 : 38} />
      <span className="leading-tight">
        <span className="block font-bold">{info?.nombre}</span>
        <span className={`flex items-center gap-1 ${impresa ? "text-[11px]" : "text-xs"} text-[#5b6678]`}>
          Nivel {NIVEL_TXT[i.nivel]} · <BadgeCheck className="size-3.5" style={{ color: PERFILA.violeta }} /> Verificada por Perfila
        </span>
      </span>
    </span>
  );
}
