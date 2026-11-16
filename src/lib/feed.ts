import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

/**
 * Plantillas del feed editorial de Instagram/Facebook (15 nov 2026): contenido que NO es vacante
 * (frases, consejos, mito o realidad, listas). 1080×1350 (4:5). Cinco paletas que se alternan para que
 * la cuadrícula se vea ordenada y no todo azul. Se generan en GitHub Actions (scripts/contenido.mts).
 * 15 nov 2026 (semana 2): titulares en Unbounded (como el sitio), barra de avance en los carruseles,
 * el eslabón de la marca como marca de agua y cuatro láminas nuevas: dato, cuenta, guion y señal.
 */

export type Paleta = "navy" | "azul" | "crema" | "cielo" | "oro";
export type Lamina =
  | { tipo: "frase"; texto: string; firma?: string; resaltar?: string }
  | { tipo: "portada"; kicker: string; titulo: string; sub?: string; resaltar?: string }
  | { tipo: "punto"; n: number; titulo: string; texto: string }
  | { tipo: "mito"; mito: string; realidad: string }
  | { tipo: "lista"; titulo: string; items: string[] }
  | { tipo: "cierre"; titulo: string; texto?: string }
  // Semana 2 (23 nov 2026): láminas nuevas para que el feed no sea solo texto.
  | { tipo: "dato"; kicker: string; grande: string; texto: string }
  | { tipo: "cuenta"; titulo: string; formula: [string, string]; ejemplos: [string, string][]; nota?: string }
  | { tipo: "guion"; titulo: string; lineas: { rotulo: string; texto: string }[]; nota?: string }
  | { tipo: "senal"; n: number; titulo: string; buena: string; alerta: string };

const P: Record<Paleta, { fondo: string; tinta: string; suave: string; acento: string; deco: string; deco2: string; chip: string; chipTinta: string; marca: [string, string] }> = {
  navy: { fondo: "linear-gradient(160deg, #0d3a70 0%, #0a2f5c 45%, #061a35 100%)", tinta: "#ffffff", suave: "rgba(255,255,255,0.78)", acento: "#8ec1ff", deco: "rgba(29,111,242,0.30)", deco2: "rgba(142,193,255,0.25)", chip: "#8ec1ff", chipTinta: "#0a2f5c", marca: ["#ffffff", "#8ec1ff"] },
  azul: { fondo: "linear-gradient(160deg, #2b7bff 0%, #1d6ff2 50%, #1557c4 100%)", tinta: "#ffffff", suave: "rgba(255,255,255,0.85)", acento: "#ffd166", deco: "rgba(255,255,255,0.14)", deco2: "rgba(255,209,102,0.45)", chip: "#ffd166", chipTinta: "#0a2f5c", marca: ["#ffffff", "#ffd166"] },
  crema: { fondo: "#f7f2e8", tinta: "#0a2f5c", suave: "#4a5b73", acento: "#1d6ff2", deco: "rgba(255,209,102,0.55)", deco2: "rgba(29,111,242,0.18)", chip: "#0a2f5c", chipTinta: "#ffffff", marca: ["#0a2f5c", "#1d6ff2"] },
  cielo: { fondo: "linear-gradient(160deg, #e6f0ff 0%, #d4e6ff 100%)", tinta: "#0a2f5c", suave: "#3d5a80", acento: "#1d6ff2", deco: "rgba(29,111,242,0.16)", deco2: "rgba(10,47,92,0.12)", chip: "#1d6ff2", chipTinta: "#ffffff", marca: ["#0a2f5c", "#1d6ff2"] },
  oro: { fondo: "linear-gradient(160deg, #ffdb7a 0%, #ffd166 60%, #f7c44f 100%)", tinta: "#0a2f5c", suave: "#2c4466", acento: "#1557c4", deco: "rgba(255,255,255,0.45)", deco2: "rgba(10,47,92,0.14)", chip: "#0a2f5c", chipTinta: "#ffd166", marca: ["#0a2f5c", "#1d6ff2"] },
};

let fuentes: { name: string; data: ArrayBuffer; weight: 600 | 700 | 800; style: "normal" }[] | null = null;
let wasmListo: Promise<void> | null = null;
async function preparar(origen: string) {
  if (!fuentes) {
    const [a, b, u] = await Promise.all([fetch(`${origen}/og/figtree-600.woff`), fetch(`${origen}/og/figtree-800.woff`), fetch(`${origen}/og/unbounded-700.woff`)]);
    fuentes = [{ name: "Figtree", data: await a.arrayBuffer(), weight: 600, style: "normal" }, { name: "Figtree", data: await b.arrayBuffer(), weight: 800, style: "normal" }, { name: "Unbounded", data: await u.arrayBuffer(), weight: 700, style: "normal" }];
  }
  if (!wasmListo) wasmListo = fetch(`${origen}/og/resvg.wasm`).then((r) => r.arrayBuffer()).then((b) => initWasm(b));
  await wasmListo;
}

type Nodo = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown>, ...children: unknown[]): Nodo => {
  const hijos = children.flat().filter((c) => c !== null && c !== false && c !== undefined);
  const style = type === "div" ? { display: "flex", ...((props["style"] as Record<string, unknown> | undefined) ?? {}) } : props["style"];
  return { type, props: { ...props, style, children: hijos.length === 0 ? undefined : hijos.length === 1 ? hijos[0] : hijos } };
};

const marca = (tam: number, c1: string, c2: string) =>
  h("svg", { width: Math.round((tam * 684) / 538), height: tam, viewBox: "170 243 684 538" },
    h("path", { d: "M256.5 400.6C231.5 395.8 210.1 375.8 203.4 351.0C201.1 342.4 201.1 326.6 203.3 318.0C212.9 281.2 249.6 259.6 286.4 269.0C315.7 276.5 336.3 303.3 336.3 334.0C336.3 376.2 297.6 408.5 256.5 400.6Z", fill: c1 }),
    h("path", { d: "M278.2 664.9C215.1 656.7 169.6 600.7 175.1 537.8C179.2 490.1 211.1 449.9 256.7 435.1C274.0 429.5 273.4 429.5 364.0 429.5C454.4 429.5 453.8 429.5 471.1 435.1C537.6 456.7 570.9 530.5 543.2 594.8C527.9 630.3 492.4 658.2 455.5 663.8C440.1 666.2 440.2 666.2 438.0 664.0C436.1 662.1 436.0 660.7 436.0 630.2C436.0 593.8 435.4 596.2 445.2 594.1C463.8 590.1 478.8 574.2 482.0 554.9C486.1 530.4 469.4 506.5 444.1 500.7C440.6 499.9 437.4 498.6 436.9 497.9C436.4 497.1 436.0 493.1 436.0 489.0C435.9 477.5 431.7 470.3 422.8 466.6C416.7 464.0 341.1 464.3 335.4 466.9C327.1 470.7 323.0 478.3 323.0 490.1C323.0 499.9 323.3 499.7 300.5 500.2C283.7 500.6 280.8 500.9 275.8 502.9C243.6 515.6 234.7 556.8 259.0 581.1C269.9 592.1 278.9 595.0 302.0 595.0C315.4 595.0 319.0 595.3 320.8 596.6C323.0 598.1 323.0 598.2 323.0 630.4C323.0 660.4 322.9 662.8 321.2 664.3C319.6 665.8 316.8 666.0 301.9 665.9C292.3 665.8 281.7 665.4 278.2 664.9Z", fill: c1 }),
    h("path", { d: "M422.2 775.9C382.5 772.0 350.6 740.9 345.1 700.7C344.5 696.4 344.0 679.6 344.0 663.4C344.0 635.3 344.1 633.9 346.0 632.0C347.9 630.1 349.3 630.0 379.8 630.0C409.1 630.0 411.8 630.1 413.3 631.8C414.7 633.3 415.0 637.7 415.2 664.7C415.5 699.1 415.4 698.2 422.4 703.4C425.1 705.5 425.2 705.5 595.7 705.8C785.7 706.0 770.1 706.6 775.8 699.2L778.5 695.7L778.5 547.6L778.5 399.5L776.1 396.1C774.8 394.3 771.9 391.9 769.6 390.9C765.7 389.1 759.2 389.0 597.0 389.0C434.8 389.0 428.3 389.1 424.4 390.9C419.6 393.1 416.7 396.8 415.1 402.7C414.5 404.9 413.3 407.1 412.4 407.4C411.5 407.7 396.5 408.0 378.9 408.0L347.0 408.0L345.5 405.6C344.1 403.5 344.0 402.0 345.0 395.1C349.2 364.5 367.0 339.7 394.0 327.1C410.3 319.5 409.0 319.7 462.1 319.3L509.8 318.9L510.2 302.2C510.6 288.5 511.1 284.4 512.9 279.6C518.3 264.5 529.4 253.9 544.5 249.3C553.6 246.5 640.4 246.5 649.5 249.3C664.7 253.9 675.7 264.5 681.1 279.6C682.8 284.4 683.3 288.6 683.7 302.2L684.3 318.9L731.9 319.2C778.4 319.6 779.7 319.7 787.0 321.9C817.0 331.2 839.3 354.5 847.3 385.0L849.5 393.5L849.5 547.5C849.5 691.3 849.4 702.0 847.7 708.4C838.9 742.7 815.1 766.5 781.2 774.8C775.1 776.2 757.8 776.4 602.5 776.6C507.9 776.7 426.8 776.4 422.2 775.9ZM625.0 312.5L625.0 306.0L597.0 306.0L569.0 306.0L569.0 312.5L569.0 319.0L597.0 319.0L625.0 319.0L625.0 312.5Z", fill: c2 }),
    h("path", { d: "M345.6 571.8C344.3 569.9 344.0 565.8 344.0 547.5C344.0 529.2 344.3 525.1 345.6 523.2C347.1 521.0 347.2 521.0 379.4 521.0C409.4 521.0 411.8 521.1 413.3 522.8C416.0 525.7 415.8 569.9 413.2 572.3C411.5 573.8 407.7 574.0 379.2 574.0C347.2 574.0 347.1 574.0 345.6 571.8Z", fill: c2 }));

/** Texto con una frase resaltada en el color de acento: palabra por palabra en un contenedor flex que envuelve. */
function conResalte(texto: string, resaltar: string | undefined, color: string, px: number, extra: Record<string, unknown>): Nodo {
  const i = resaltar ? texto.indexOf(resaltar) : -1;
  const trozos: [string, boolean][] = i < 0 ? [[texto, false]] : [[texto.slice(0, i), false], [resaltar!, true], [texto.slice(i + resaltar!.length), false]];
  const items: { w: string; r: boolean }[][] = [];
  for (const [t, r] of trozos) for (const w of t.split(/\s+/).filter(Boolean)) {
    // La puntuación pegada al resaltado («trabajo.») va en el mismo bloque, sin espacio.
    if (/^[.,;:!?»)]/.test(w) && items.length && !t.startsWith(" ") && items[items.length - 1]!.length === 1 && !r) { items[items.length - 1]!.push({ w, r }); continue; }
    items.push([{ w, r }]);
  }
  const palabras = items.map((g) => g.length === 1 ? h("span", { style: g[0]!.r ? { color } : {} }, g[0]!.w) : h("div", {}, ...g.map((x) => h("span", { style: x.r ? { color } : {} }, x.w))));
  return h("div", { style: { flexWrap: "wrap", columnGap: Math.round(px * 0.26), fontSize: px, ...extra } }, ...palabras);
}
const tam = (t: string, cortes: [number, number][], min: number) => { for (const [largo, px] of cortes) if (t.length <= largo) return px; return min; };

const U = { fontFamily: "Unbounded", fontWeight: 700 } as const;
const VERDE = "#0f7a43";
const ROJO = "#ce1126";
const icono = (d: string, color: string, px: number) => h("svg", { width: px, height: px, viewBox: "0 0 24 24" }, h("path", { d, fill: "none", stroke: color, "stroke-width": 3.2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const EQUIS = "M6.5 6.5l11 11M17.5 6.5l-11 11";

function lienzo(p: Paleta, pagina: string | null, ...contenido: unknown[]): Nodo {
  const c = P[p];
  const claro = p === "crema" || p === "cielo" || p === "oro";
  const agua = p === "oro" ? "rgba(10,47,92,0.04)" : claro ? "rgba(10,47,92,0.05)" : "rgba(255,255,255,0.07)";
  const [i, n] = pagina ? pagina.split("/").map(Number) as [number, number] : [0, 0];
  return h("div", { style: { width: 1080, height: 1350, flexDirection: "column", fontFamily: "Figtree", color: c.tinta, background: c.fondo, position: "relative", overflow: "hidden" } },
    // Decoración de marca: el círculo de la persona arriba y el eslabón gigante, cortados por el borde.
    h("div", { style: { position: "absolute", right: -230, top: -230, width: 560, height: 560, borderRadius: 999, background: c.deco } }),
    h("div", { style: { position: "absolute", right: -170, bottom: -150 } }, marca(640, agua, agua)),
    // Arriba: barra de avance del carrusel (o la raya de acento en piezas de una sola lámina).
    n > 1
      ? h("div", { style: { position: "absolute", left: 80, top: 66, width: 920, gap: 10 } }, ...Array.from({ length: n }, (_, k) => h("div", { style: { flex: 1, height: 8, borderRadius: 8, background: k < i ? c.acento : claro ? "rgba(10,47,92,0.14)" : "rgba(255,255,255,0.24)" } })))
      : h("div", { style: { position: "absolute", left: 80, top: 66, width: 120, height: 10, borderRadius: 10, background: c.acento } }),
    h("div", { style: { flexDirection: "column", flex: 1, padding: "120px 80px 0" } }, ...contenido),
    h("div", { style: { alignItems: "center", justifyContent: "space-between", padding: "0 80px 60px" } },
      h("div", { style: { alignItems: "center", gap: 12 } }, marca(40, c.marca[0], c.marca[1]), h("div", { style: { fontSize: 26, fontWeight: 800, color: c.tinta } }, "@enlacelaboralrd")),
      pagina ? h("div", { style: { ...U, fontSize: 20, color: c.suave, letterSpacing: 2 } }, pagina) : h("div", { style: { fontSize: 24, fontWeight: 600, color: c.suave } }, "enlacelaboralrd.com")));
}

function lamina(l: Lamina, p: Paleta, pagina: string | null): Nodo {
  const c = P[p];
  const claro = p === "crema" || p === "cielo" || p === "oro";
  const chip = (t: string) => h("div", { style: { alignSelf: "flex-start", padding: "13px 26px", borderRadius: 999, background: c.chip, color: c.chipTinta, ...U, fontSize: 19, letterSpacing: 2.5 } }, t.toUpperCase());
  const centro = (...x: unknown[]) => h("div", { style: { flexDirection: "column", flex: 1, justifyContent: "center" } }, ...x);
  const tarjeta = { background: "#ffffff", color: "#0a2f5c", borderRadius: 36, boxShadow: "0 26px 60px rgba(6,26,53,0.22)" };
  switch (l.tipo) {
    case "frase": {
      const px = tam(l.texto, [[60, 92], [100, 78], [150, 66], [200, 56]], 50);
      return lienzo(p, pagina, centro(
        h("div", { style: { ...U, fontSize: 230, color: c.acento, lineHeight: 0.8, height: 130 } }, "“"),
        conResalte(l.texto, l.resaltar, c.acento, px, { fontWeight: 800, lineHeight: 1.12, letterSpacing: -1.5 }),
        l.firma ? h("div", { style: { marginTop: 48, alignItems: "center", gap: 18 } }, h("div", { style: { width: 60, height: 6, borderRadius: 6, background: c.acento } }), h("div", { style: { fontSize: 30, fontWeight: 600, color: c.suave } }, l.firma)) : null));
    }
    case "portada": {
      const px = tam(l.titulo, [[22, 98], [36, 84], [52, 72]], 62);
      return lienzo(p, pagina, centro(
        chip(l.kicker),
        conResalte(l.titulo, l.resaltar, c.acento, px, { ...U, marginTop: 44, lineHeight: 1.1, letterSpacing: -2.5 }),
        l.sub ? h("div", { style: { marginTop: 38, fontSize: 38, fontWeight: 600, color: c.suave, lineHeight: 1.35, maxWidth: 860, display: "block" } }, l.sub) : null,
        h("div", { style: { marginTop: 62, alignSelf: "flex-start", alignItems: "center", gap: 16, padding: "18px 30px", borderRadius: 999, border: `3px solid ${c.acento}`, fontSize: 30, fontWeight: 800, color: c.acento } }, "Desliza", h("div", { style: { width: 54, height: 5, borderRadius: 5, background: c.acento } }), "»")));
    }
    case "punto":
      return lienzo(p, pagina, centro(
        h("div", { style: { ...U, fontSize: 190, color: c.acento, lineHeight: 0.95, letterSpacing: -8 } }, String(l.n).padStart(2, "0")),
        h("div", { style: { ...U, marginTop: 40, fontSize: tam(l.titulo, [[20, 64], [32, 54], [46, 46]], 40), lineHeight: 1.14, letterSpacing: -1.5, display: "block" } }, l.titulo),
        h("div", { style: { marginTop: 34, fontSize: tam(l.texto, [[140, 40], [240, 36]], 32), fontWeight: 600, color: c.suave, lineHeight: 1.42, display: "block" } }, l.texto)));
    case "mito":
      return lienzo(p, pagina,
        h("div", { style: { flexDirection: "column", flex: 1, justifyContent: "center", gap: 34 } },
          chip("Mito o realidad"),
          h("div", { style: { flexDirection: "column", padding: "40px 44px", borderRadius: 36, background: "rgba(206,17,38,0.08)", border: "3px solid rgba(206,17,38,0.4)" } },
            h("div", { style: { alignItems: "center", gap: 14 } }, h("div", { style: { width: 44, height: 44, borderRadius: 44, background: ROJO, alignItems: "center", justifyContent: "center" } }, icono(EQUIS, "#ffffff", 26)), h("div", { style: { ...U, fontSize: 22, color: ROJO, letterSpacing: 3 } }, "MITO")),
            h("div", { style: { marginTop: 20, fontSize: tam(l.mito, [[60, 54], [110, 46]], 40), fontWeight: 800, lineHeight: 1.15, display: "block", textDecoration: "line-through", textDecorationColor: "rgba(206,17,38,0.55)" } }, l.mito)),
          h("div", { style: { flexDirection: "column", padding: "40px 44px", ...tarjeta } },
            h("div", { style: { alignItems: "center", gap: 14 } }, h("div", { style: { width: 44, height: 44, borderRadius: 44, background: VERDE, alignItems: "center", justifyContent: "center" } }, icono(CHECK, "#ffffff", 26)), h("div", { style: { ...U, fontSize: 22, color: VERDE, letterSpacing: 3 } }, "REALIDAD")),
            h("div", { style: { marginTop: 20, fontSize: tam(l.realidad, [[90, 46], [160, 40], [230, 35]], 32), fontWeight: 800, lineHeight: 1.25, display: "block" } }, l.realidad))));
    case "lista":
      return lienzo(p, pagina, centro(
        h("div", { style: { ...U, fontSize: tam(l.titulo, [[24, 66], [40, 56], [56, 48]], 42), lineHeight: 1.12, letterSpacing: -1.5, display: "block" } }, l.titulo),
        h("div", { style: { flexDirection: "column", gap: 16, marginTop: 46 } },
          ...l.items.slice(0, 6).map((it, i) => h("div", { style: { alignItems: "center", gap: 22, padding: "24px 28px", borderRadius: 26, background: claro ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.13)" } },
            h("div", { style: { width: 54, height: 54, borderRadius: 16, background: c.chip, color: c.chipTinta, ...U, fontSize: 24, alignItems: "center", justifyContent: "center", flexShrink: 0 } }, String(i + 1)),
            h("div", { style: { fontSize: tam(it, [[30, 42], [44, 38], [60, 33]], 30), fontWeight: 800, lineHeight: 1.25, display: "block", maxWidth: 780 } }, it))))));
    case "cierre":
      return lienzo(p, pagina,
        h("div", { style: { flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center", textAlign: "center" } },
          marca(150, c.marca[0], c.marca[1]),
          h("div", { style: { ...U, marginTop: 54, fontSize: tam(l.titulo, [[22, 68], [36, 58], [50, 50]], 44), lineHeight: 1.14, letterSpacing: -2, display: "block", textAlign: "center", maxWidth: 900 } }, l.titulo),
          l.texto ? h("div", { style: { marginTop: 30, fontSize: 34, fontWeight: 600, color: c.suave, lineHeight: 1.4, maxWidth: 860, textAlign: "center", display: "block" } }, l.texto) : null,
          h("div", { style: { marginTop: 56, gap: 18 } },
            h("div", { style: { padding: "18px 32px", borderRadius: 18, background: c.chip, color: c.chipTinta, fontSize: 28, fontWeight: 800 } }, "Guárdalo"),
            h("div", { style: { padding: "18px 32px", borderRadius: 18, border: `3px solid ${c.chip}`, color: c.tinta, fontSize: 28, fontWeight: 800 } }, "Compártelo"))));
    case "dato":
      return lienzo(p, pagina, centro(
        chip(l.kicker),
        h("div", { style: { ...U, marginTop: 40, fontSize: tam(l.grande, [[5, 250], [7, 200], [10, 150]], 120), color: c.acento, lineHeight: 1, letterSpacing: -8, display: "block" } }, l.grande),
        h("div", { style: { marginTop: 20, width: 140, height: 10, borderRadius: 10, background: c.tinta } }),
        h("div", { style: { marginTop: 40, fontSize: tam(l.texto, [[110, 46], [170, 40]], 36), fontWeight: 800, lineHeight: 1.3, display: "block", maxWidth: 880 } }, l.texto)));
    case "cuenta":
      return lienzo(p, pagina, centro(
        h("div", { style: { ...U, fontSize: tam(l.titulo, [[24, 62], [40, 52]], 44), lineHeight: 1.12, letterSpacing: -1.5, display: "block" } }, l.titulo),
        h("div", { style: { flexDirection: "column", marginTop: 44, padding: "44px 44px 40px", ...tarjeta } },
          h("div", { style: { alignItems: "center", justifyContent: "space-between", gap: 24 } },
            h("div", { style: { fontSize: 36, fontWeight: 800, lineHeight: 1.25, display: "block", maxWidth: 560 } }, l.formula[0]),
            h("div", { style: { ...U, padding: "18px 28px", borderRadius: 22, background: "#0a2f5c", color: "#ffffff", fontSize: 40, flexShrink: 0 } }, l.formula[1])),
          h("div", { style: { margin: "36px 0 8px", height: 3, background: "rgba(10,47,92,0.12)" } }),
          ...l.ejemplos.map(([a, b], k) => h("div", { style: { alignItems: "center", justifyContent: "space-between", gap: 24, padding: "24px 0", borderTop: k ? "2px dashed rgba(10,47,92,0.16)" : "0px solid #fff" } },
            h("div", { style: { fontSize: 31, fontWeight: 600, color: "#4a5b73", lineHeight: 1.3, display: "block", maxWidth: 470 } }, a),
            h("div", { style: { ...U, fontSize: 40, color: VERDE, letterSpacing: -1.5, flexShrink: 0 } }, b)))),
        l.nota ? h("div", { style: { marginTop: 30, fontSize: 27, fontWeight: 600, color: c.suave, lineHeight: 1.4, display: "block" } }, l.nota) : null));
    case "guion":
      return lienzo(p, pagina, centro(
        h("div", { style: { ...U, fontSize: tam(l.titulo, [[24, 62], [40, 52]], 44), lineHeight: 1.12, letterSpacing: -1.5, display: "block" } }, l.titulo),
        h("div", { style: { flexDirection: "column", gap: 22, marginTop: 44 } },
          ...l.lineas.slice(0, 3).map((x, k) => h("div", { style: { flexDirection: "column", gap: 14, padding: "30px 36px", marginLeft: k % 2 ? 50 : 0, marginRight: k % 2 ? 0 : 50, ...tarjeta, borderRadius: 34, borderBottomLeftRadius: k % 2 ? 34 : 8, borderBottomRightRadius: k % 2 ? 8 : 34 } },
            h("div", { style: { alignSelf: "flex-start", padding: "8px 18px", borderRadius: 999, background: "#1d6ff2", color: "#ffffff", ...U, fontSize: 16, letterSpacing: 2 } }, x.rotulo.toUpperCase()),
            h("div", { style: { fontSize: tam(x.texto, [[90, 37], [130, 33]], 30), fontWeight: 600, lineHeight: 1.36, display: "block" } }, x.texto)))),
        l.nota ? h("div", { style: { marginTop: 30, fontSize: 27, fontWeight: 600, color: c.suave, lineHeight: 1.4, display: "block" } }, l.nota) : null));
    case "senal": {
      const fila = (rot: string, color: string, d: string, t: string, fondo: Record<string, unknown>) => h("div", { style: { gap: 26, padding: "44px 40px", borderRadius: 36, ...fondo } },
        h("div", { style: { width: 64, height: 64, borderRadius: 64, background: color, alignItems: "center", justifyContent: "center", flexShrink: 0 } }, icono(d, "#ffffff", 38)),
        h("div", { style: { flexDirection: "column", gap: 10, flex: 1 } },
          h("div", { style: { ...U, fontSize: 21, color: claro || color === VERDE ? color : "#ffffff", letterSpacing: 2.5 } }, rot),
          h("div", { style: { fontSize: tam(t, [[45, 46], [70, 42], [90, 37]], 33), fontWeight: 800, lineHeight: 1.25, display: "block" } }, t)));
      return lienzo(p, pagina, centro(
        h("div", { style: { alignItems: "center", gap: 24 } },
          h("div", { style: { ...U, fontSize: 96, color: c.acento, letterSpacing: -4, lineHeight: 1 } }, String(l.n).padStart(2, "0")),
          h("div", { style: { ...U, fontSize: tam(l.titulo, [[16, 56], [24, 46]], 38), lineHeight: 1.12, letterSpacing: -1.5, display: "block", flex: 1 } }, l.titulo)),
        h("div", { style: { flexDirection: "column", gap: 26, marginTop: 50 } },
          fila("BUENA SEÑAL", VERDE, CHECK, l.buena, tarjeta),
          fila("SEÑAL DE ALERTA", ROJO, EQUIS, l.alerta, { background: claro ? "rgba(206,17,38,0.08)" : "rgba(255,255,255,0.14)", border: `3px solid ${claro ? "rgba(206,17,38,0.4)" : "rgba(255,255,255,0.45)"}`, color: c.tinta }))));
    }
  }
}

const emojiCache = new Map<string, string>();
async function emoji(seg: string): Promise<string> {
  const cp = [...seg].map((x) => x.codePointAt(0)!.toString(16)).filter((x) => x !== "fe0f").join("-");
  if (!emojiCache.has(cp)) { const r = await fetch(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${cp}.svg`).catch(() => null); emojiCache.set(cp, r && r.ok ? await r.text() : "<svg xmlns='http://www.w3.org/2000/svg'/>"); }
  return emojiCache.get(cp)!;
}

export async function imagenLamina(l: Lamina, p: Paleta, pagina: string | null, origen: string): Promise<Uint8Array> {
  await preparar(origen);
  const svg = await satori(lamina(l, p, pagina) as never, { width: 1080, height: 1350, fonts: fuentes!, loadAdditionalAsset: async (code: string, seg: string) => (code === "emoji" ? `data:image/svg+xml;base64,${Buffer.from(await emoji(seg)).toString("base64")}` : seg) });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1080 } }).render().asPng();
}
