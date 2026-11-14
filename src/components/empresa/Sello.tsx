import { Award } from "lucide-react";

import { NOMBRE_SELLO, type Sello } from "@/lib/motivar-empresas";

/** Sello «Empresa que publica claro» (Bronce, Plata u Oro). */
export function SelloEmpresa({ s, tam = "chico", className = "" }: { s: Sello; tam?: "chico" | "grande"; className?: string }) {
  if (tam === "grande") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="relative grid size-16 shrink-0 place-items-center rounded-full shadow-[0_10px_25px_-10px_rgb(0_0_0/0.45)]" style={{ background: s.fondo, border: `3px solid ${s.borde}` }}>
          <Award className="size-8" style={{ color: s.color }} strokeWidth={2.3} />
          <span aria-hidden="true" className="absolute inset-1 rounded-full border border-white/60" />
        </span>
        <span>
          <span className="block text-[11px] font-extrabold uppercase tracking-wider" style={{ color: s.color }}>Sello {s.t}</span>
          <span className="block font-display text-lg font-bold leading-tight">{NOMBRE_SELLO}</span>
        </span>
      </div>
    );
  }
  return (
    <span title={`Sello ${s.t}: sus vacantes traen sueldo, requisitos, funciones y cómo aplicar. Mide la información que da, no la empresa.`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-xs font-extrabold ${className}`}
      style={{ background: s.fondo, color: s.color, boxShadow: `inset 0 0 0 1px ${s.borde}` }}>
      <Award className="size-3.5" strokeWidth={2.6} /> Sello {s.t}
    </span>
  );
}

const COLORES_PNG: Record<Sello["nivel"], [string, string, string]> = {
  oro: ["#fff3c4", "#ffd84d", "#f5a700"],
  plata: ["#f6f8fb", "#d9dfe8", "#b6c0cf"],
  bronce: ["#fde7d3", "#e8a46b", "#c9763a"],
};

/** Insignia cuadrada (1080 × 1080) para Instagram, LinkedIn o WhatsApp. Se dibuja en el navegador. */
export async function descargarInsignia(s: Sello, empresa: string, puntaje: number) {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1080;
  const g = c.getContext("2d");
  if (!g) return;
  const [a, b, d] = COLORES_PNG[s.nivel];
  // Fondo azul Enlace
  g.fillStyle = "#0a2f5c"; g.fillRect(0, 0, 1080, 1080);
  const halo = g.createRadialGradient(540, 430, 60, 540, 430, 620);
  halo.addColorStop(0, "rgba(29,111,242,0.55)"); halo.addColorStop(1, "rgba(10,47,92,0)");
  g.fillStyle = halo; g.fillRect(0, 0, 1080, 1080);
  g.fillStyle = "rgba(255,255,255,0.08)";
  for (let x = 18; x < 1080; x += 36) for (let y = 18; y < 1080; y += 36) { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }

  // Medalla
  const med = g.createLinearGradient(380, 230, 700, 590);
  med.addColorStop(0, a); med.addColorStop(0.55, b); med.addColorStop(1, d);
  g.save(); g.shadowColor = "rgba(0,0,0,0.45)"; g.shadowBlur = 50; g.shadowOffsetY = 18;
  g.beginPath(); g.arc(540, 410, 170, 0, Math.PI * 2); g.fillStyle = med; g.fill(); g.restore();
  g.lineWidth = 10; g.strokeStyle = s.borde; g.beginPath(); g.arc(540, 410, 170, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.arc(540, 410, 148, 0, Math.PI * 2); g.stroke();
  g.fillStyle = s.color; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "800 112px Figtree, system-ui, sans-serif"; g.fillText(String(puntaje), 540, 395);
  g.font = "800 30px Figtree, system-ui, sans-serif"; g.fillText("DE 100", 540, 470);

  // Textos
  g.fillStyle = b; g.font = "800 40px Figtree, system-ui, sans-serif"; g.fillText(`SELLO ${s.t.toUpperCase()}`, 540, 660);
  g.fillStyle = "#ffffff"; g.font = "700 64px Figtree, system-ui, sans-serif"; g.fillText(NOMBRE_SELLO, 540, 738);
  let nombre = empresa;
  g.font = "600 44px Figtree, system-ui, sans-serif";
  while (g.measureText(nombre).width > 900 && nombre.length > 4) nombre = `${nombre.slice(0, -2).trimEnd()}…`;
  g.fillStyle = "rgba(255,255,255,0.85)"; g.fillText(nombre, 540, 815);
  g.fillStyle = "rgba(255,255,255,0.6)"; g.font = "500 30px Figtree, system-ui, sans-serif";
  g.fillText("Vacantes con sueldo, requisitos y funciones claras", 540, 900);
  g.fillStyle = "#ffffff"; g.font = "800 34px Figtree, system-ui, sans-serif"; g.fillText("enlacelaboralrd.com", 540, 990);

  const enlace = document.createElement("a");
  enlace.href = c.toDataURL("image/png");
  enlace.download = `sello-${s.nivel}-${empresa.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`;
  enlace.click();
}

/** HTML del sello para la firma del correo o la web (sin imágenes externas: funciona en cualquier correo). */
export function htmlSello(s: Sello, url: string): string {
  return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-block;padding:6px 12px;border-radius:999px;background:${COLORES_PNG[s.nivel][1]};color:${s.color};font:800 12px Arial,sans-serif;text-decoration:none;border:1px solid ${s.borde}">&#9733; Sello ${s.t} &middot; ${NOMBRE_SELLO} &middot; Enlace Laboral</a>`;
}
