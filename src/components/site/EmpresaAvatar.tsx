const COLORES = ["#0a2f5c", "#0f7a43", "#7a3b0f", "#5b2a86", "#0b6e7a", "#a1274a"];

/** Inicial de la empresa sobre un color fijo (siempre el mismo para la misma empresa). */
export function EmpresaAvatar({ nombre, className = "size-12 text-xl", claro = false }: { nombre: string; className?: string; claro?: boolean }) {
  const limpio = nombre.trim();
  const sinDato = !limpio || limpio === "Empresa no indicada";
  const inicial = sinDato ? "?" : (limpio.match(/[\p{L}\p{N}]/u)?.[0] ?? "?").toUpperCase();
  let h = 0;
  for (const ch of limpio) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = sinDato ? "#8a95a6" : COLORES[h % COLORES.length];
  return (
    <span aria-hidden="true" style={claro ? { color } : { backgroundColor: color }} className={`grid shrink-0 place-items-center rounded-2xl font-extrabold ${claro ? "bg-white shadow-lg" : "text-white"} ${className}`}>
      {inicial}
    </span>
  );
}
