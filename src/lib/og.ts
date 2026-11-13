import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

/**
 * Imagen de vista previa (1200×630) de una vacante, para WhatsApp, Facebook, Instagram y Google.
 * Se genera en el servidor con satori (HTML → SVG) y resvg (SVG → PNG). Las fuentes y el wasm
 * viven en /public/og y se cargan una sola vez por instancia.
 */
type Datos = { titulo: string; empresa: string; provincia: string; modalidad: string; tipo: string; salario: string; conSalario: boolean; requisito?: string };

const NAVY = "#0a2f5c", AZUL = "#1d6ff2", VERDE = "#0f7a43", GRIS = "#5b6678", TINTA = "#14213a", CIELO = "#8ec1ff";

let fuentes: { name: string; data: ArrayBuffer; weight: 600 | 800; style: "normal" }[] | null = null;
let wasmListo: Promise<void> | null = null;

async function preparar(origen: string) {
  if (!fuentes) {
    const [f600, f800] = await Promise.all([fetch(`${origen}/og/figtree-600.woff`), fetch(`${origen}/og/figtree-800.woff`)]);
    if (!f600.ok || !f800.ok) throw new Error("No se pudieron cargar las fuentes");
    fuentes = [
      { name: "Figtree", data: await f600.arrayBuffer(), weight: 600, style: "normal" },
      { name: "Figtree", data: await f800.arrayBuffer(), weight: 800, style: "normal" },
    ];
  }
  if (!wasmListo) {
    wasmListo = fetch(`${origen}/og/resvg.wasm`).then((r) => { if (!r.ok) throw new Error("No se pudo cargar resvg"); return r.arrayBuffer(); }).then((b) => initWasm(b)).catch((e) => { wasmListo = null; throw e; });
  }
  await wasmListo;
}

type Nodo = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown>, ...children: unknown[]): Nodo => {
  const hijos = children.flat().filter((c) => c !== null && c !== false && c !== undefined);
  const style = type === "div" ? { display: "flex", ...((props["style"] as Record<string, unknown> | undefined) ?? {}) } : props["style"];
  return { type, props: { ...props, style, children: hijos.length === 0 ? undefined : hijos.length === 1 ? hijos[0] : hijos } };
};

const marca = (tam: number, c1 = NAVY, c2 = AZUL) =>
  h("svg", { width: Math.round((tam * 684) / 538), height: tam, viewBox: "170 243 684 538" },
    h("path", { d: "M256.5 400.6C231.5 395.8 210.1 375.8 203.4 351.0C201.1 342.4 201.1 326.6 203.3 318.0C212.9 281.2 249.6 259.6 286.4 269.0C315.7 276.5 336.3 303.3 336.3 334.0C336.3 376.2 297.6 408.5 256.5 400.6Z", fill: c1 }), h("path", { d: "M278.2 664.9C215.1 656.7 169.6 600.7 175.1 537.8C179.2 490.1 211.1 449.9 256.7 435.1C274.0 429.5 273.4 429.5 364.0 429.5C454.4 429.5 453.8 429.5 471.1 435.1C537.6 456.7 570.9 530.5 543.2 594.8C527.9 630.3 492.4 658.2 455.5 663.8C440.1 666.2 440.2 666.2 438.0 664.0C436.1 662.1 436.0 660.7 436.0 630.2C436.0 593.8 435.4 596.2 445.2 594.1C463.8 590.1 478.8 574.2 482.0 554.9C486.1 530.4 469.4 506.5 444.1 500.7C440.6 499.9 437.4 498.6 436.9 497.9C436.4 497.1 436.0 493.1 436.0 489.0C435.9 477.5 431.7 470.3 422.8 466.6C416.7 464.0 341.1 464.3 335.4 466.9C327.1 470.7 323.0 478.3 323.0 490.1C323.0 499.9 323.3 499.7 300.5 500.2C283.7 500.6 280.8 500.9 275.8 502.9C243.6 515.6 234.7 556.8 259.0 581.1C269.9 592.1 278.9 595.0 302.0 595.0C315.4 595.0 319.0 595.3 320.8 596.6C323.0 598.1 323.0 598.2 323.0 630.4C323.0 660.4 322.9 662.8 321.2 664.3C319.6 665.8 316.8 666.0 301.9 665.9C292.3 665.8 281.7 665.4 278.2 664.9Z", fill: c1 }),
    h("path", { d: "M422.2 775.9C382.5 772.0 350.6 740.9 345.1 700.7C344.5 696.4 344.0 679.6 344.0 663.4C344.0 635.3 344.1 633.9 346.0 632.0C347.9 630.1 349.3 630.0 379.8 630.0C409.1 630.0 411.8 630.1 413.3 631.8C414.7 633.3 415.0 637.7 415.2 664.7C415.5 699.1 415.4 698.2 422.4 703.4C425.1 705.5 425.2 705.5 595.7 705.8C785.7 706.0 770.1 706.6 775.8 699.2L778.5 695.7L778.5 547.6L778.5 399.5L776.1 396.1C774.8 394.3 771.9 391.9 769.6 390.9C765.7 389.1 759.2 389.0 597.0 389.0C434.8 389.0 428.3 389.1 424.4 390.9C419.6 393.1 416.7 396.8 415.1 402.7C414.5 404.9 413.3 407.1 412.4 407.4C411.5 407.7 396.5 408.0 378.9 408.0L347.0 408.0L345.5 405.6C344.1 403.5 344.0 402.0 345.0 395.1C349.2 364.5 367.0 339.7 394.0 327.1C410.3 319.5 409.0 319.7 462.1 319.3L509.8 318.9L510.2 302.2C510.6 288.5 511.1 284.4 512.9 279.6C518.3 264.5 529.4 253.9 544.5 249.3C553.6 246.5 640.4 246.5 649.5 249.3C664.7 253.9 675.7 264.5 681.1 279.6C682.8 284.4 683.3 288.6 683.7 302.2L684.3 318.9L731.9 319.2C778.4 319.6 779.7 319.7 787.0 321.9C817.0 331.2 839.3 354.5 847.3 385.0L849.5 393.5L849.5 547.5C849.5 691.3 849.4 702.0 847.7 708.4C838.9 742.7 815.1 766.5 781.2 774.8C775.1 776.2 757.8 776.4 602.5 776.6C507.9 776.7 426.8 776.4 422.2 775.9ZM625.0 312.5L625.0 306.0L597.0 306.0L569.0 306.0L569.0 312.5L569.0 319.0L597.0 319.0L625.0 319.0L625.0 312.5Z", fill: c2 }), h("path", { d: "M345.6 571.8C344.3 569.9 344.0 565.8 344.0 547.5C344.0 529.2 344.3 525.1 345.6 523.2C347.1 521.0 347.2 521.0 379.4 521.0C409.4 521.0 411.8 521.1 413.3 522.8C416.0 525.7 415.8 569.9 413.2 572.3C411.5 573.8 407.7 574.0 379.2 574.0C347.2 574.0 347.1 574.0 345.6 571.8Z", fill: c2 }));

const nombre = (tam: number, c1: string, c2: string) =>
  h("div", { style: { fontSize: tam, fontWeight: 800, letterSpacing: -1 } },
    h("span", { style: { color: c1 } }, "Enlace"), h("span", { style: { color: c2, marginLeft: tam * 0.26 } }, "Laboral"));

const SIN = "Empresa no indicada";
const tamTitulo = (t: string, l1: number, l2: number, g: number, m: number, p: number) => (t.length > l2 ? p : t.length > l1 ? m : g);

/* ───────── Modelo A · Noche ───────── */
function modeloA(d: Datos): Nodo {
  const tt = tamTitulo(d.titulo, 28, 50, 78, 62, 50);
  const pill = (t: string) => h("div", { style: { padding: "10px 22px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.35)", color: "#fff", fontSize: 25, fontWeight: 600 } }, t);
  return h("div", { style: { width: 1200, height: 630, flexDirection: "column", background: "linear-gradient(135deg, #0d3a70 0%, #071f3d 100%)", fontFamily: "Figtree", color: "#fff", position: "relative", overflow: "hidden" } },
    h("div", { style: { position: "absolute", right: -250, top: -330, width: 560, height: 560, borderRadius: 999, background: "rgba(29,111,242,0.30)" } }),
    h("div", { style: { position: "absolute", right: -90, top: 170, width: 300, height: 300, borderRadius: 999, border: "3px solid rgba(142,193,255,0.25)" } }),
    h("div", { style: { position: "absolute", left: 0, top: 0, width: 14, height: 630, background: AZUL } }),
    h("div", { style: { alignItems: "center", justifyContent: "space-between", padding: "44px 64px 0 72px" } },
      h("div", { style: { alignItems: "center", gap: 12 } }, marca(54, "#ffffff", CIELO), nombre(34, "#fff", CIELO)),
      h("div", { style: { padding: "9px 20px", borderRadius: 999, background: AZUL, fontSize: 20, fontWeight: 800, letterSpacing: 3 } }, "NUEVA VACANTE"),
    ),
    h("div", { style: { flexDirection: "column", flex: 1, padding: "34px 64px 0 72px" } },
      d.empresa !== SIN ? h("div", { style: { fontSize: 28, fontWeight: 600, color: CIELO } }, d.empresa) : null,
      h("div", { style: { marginTop: 10, fontSize: tt, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.5, display: "block", lineClamp: 2, maxWidth: 1000 } }, d.titulo),
      h("div", { style: { gap: 12, marginTop: 24, flexWrap: "wrap" } }, pill(d.provincia), pill(d.modalidad), pill(d.tipo)),
    ),
    h("div", { style: { alignItems: "flex-end", justifyContent: "space-between", padding: "0 64px 44px 72px" } },
      d.conSalario
        ? h("div", { style: { flexDirection: "column" } },
            h("div", { style: { fontSize: 19, fontWeight: 800, color: CIELO, letterSpacing: 3 } }, "SALARIO"),
            h("div", { style: { fontSize: 46, fontWeight: 800, color: "#6ee7a0", marginTop: 2 } }, d.salario))
        : h("div", { style: { flexDirection: "column" } },
            h("div", { style: { fontSize: 28, fontWeight: 800 } }, "Aplica gratis, sin crear cuenta"),
            h("div", { style: { fontSize: 23, fontWeight: 600, color: CIELO, marginTop: 4 } }, "enlacelaboralrd.com")),
      h("div", { style: { flexDirection: "column", alignItems: "flex-end", gap: 10 } },
        h("div", { style: { padding: "16px 30px", borderRadius: 16, background: "#fff", color: NAVY, fontSize: 27, fontWeight: 800 } }, "Ver y aplicar »"),
        d.conSalario ? h("div", { style: { fontSize: 22, fontWeight: 600, color: CIELO } }, "enlacelaboralrd.com") : null),
    ),
  );
}

/* ───────── Modelo B · Dividida ───────── */
function modeloB(d: Datos): Nodo {
  const tt = tamTitulo(d.titulo, 30, 60, 68, 56, 46);
  const pill = (t: string) => h("div", { style: { padding: "10px 20px", borderRadius: 999, background: "#e8eef6", color: NAVY, fontSize: 24, fontWeight: 600 } }, t);
  const punto = (t: string) => h("div", { style: { alignItems: "center", gap: 12, fontSize: 24, fontWeight: 600, color: "#fff" } },
    h("div", { style: { width: 10, height: 10, borderRadius: 99, background: CIELO } }), t);
  return h("div", { style: { width: 1200, height: 630, fontFamily: "Figtree", color: TINTA, background: "#fff" } },
    h("div", { style: { width: 800, flexDirection: "column", padding: "52px 48px 48px 60px" } },
      h("div", { style: { alignItems: "center", gap: 12 } },
        h("div", { style: { width: 8, height: 30, background: AZUL, borderRadius: 4 } }),
        h("div", { style: { fontSize: 21, fontWeight: 800, color: AZUL, letterSpacing: 4 } }, "VACANTE")),
      h("div", { style: { marginTop: 26, fontSize: tt, fontWeight: 800, color: NAVY, lineHeight: 1.06, letterSpacing: -1.5, display: "block", lineClamp: 3 } }, d.titulo),
      d.empresa !== SIN ? h("div", { style: { marginTop: 14, fontSize: 28, fontWeight: 600, color: GRIS } }, d.empresa) : null,
      h("div", { style: { gap: 10, marginTop: 24, flexWrap: "wrap" } }, pill(d.provincia), pill(d.modalidad), pill(d.tipo)),
      d.conSalario
        ? h("div", { style: { marginTop: "auto", alignItems: "center", gap: 16, padding: "14px 22px", borderRadius: 18, background: "#e7f6ee", alignSelf: "flex-start" } },
            h("div", { style: { fontSize: 19, fontWeight: 800, color: VERDE, letterSpacing: 2 } }, "SALARIO"),
            h("div", { style: { fontSize: 36, fontWeight: 800, color: VERDE } }, d.salario))
        : h("div", { style: { marginTop: "auto", fontSize: 24, fontWeight: 600, color: GRIS } }, "Requisitos y cómo aplicar, claros y en un solo lugar."),
    ),
    h("div", { style: { width: 400, flexDirection: "column", alignItems: "center", background: "linear-gradient(160deg, #0d3a70 0%, #071f3d 100%)", padding: "50px 36px 40px", position: "relative", overflow: "hidden" } },
      h("div", { style: { position: "absolute", right: -130, top: -130, width: 240, height: 240, borderRadius: 999, background: "rgba(29,111,242,0.35)" } }),
      marca(104, "#ffffff", CIELO),
      h("div", { style: { marginTop: 12 } }, nombre(36, "#fff", CIELO)),
      h("div", { style: { flexDirection: "column", gap: 12, marginTop: 36, alignSelf: "flex-start", paddingLeft: 14 } }, punto("Aplica en 1 minuto"), punto("Sin crear cuenta"), punto("Gratis")),
      h("div", { style: { marginTop: "auto", padding: "15px 30px", borderRadius: 16, background: AZUL, color: "#fff", fontSize: 26, fontWeight: 800 } }, "Ver vacante »"),
      h("div", { style: { marginTop: 14, fontSize: 22, fontWeight: 600, color: CIELO } }, "enlacelaboralrd.com"),
    ),
  );
}

/* ───────── Modelo C · Ficha ───────── */
function modeloC(d: Datos): Nodo {
  const tt = tamTitulo(d.titulo, 30, 48, 74, 60, 48);
  const fv = d.conSalario ? 23 : 27;
  const dato = (rot: string, val: string, color = NAVY, flex = 1) => h("div", { style: { flex, gap: 18 } },
    h("div", { style: { width: 2, background: "#e3e9f2", borderRadius: 2 } }),
    h("div", { style: { flexDirection: "column" } },
      h("div", { style: { fontSize: 17, fontWeight: 800, color: GRIS, letterSpacing: 2.5 } }, rot),
      h("div", { style: { fontSize: fv, fontWeight: 800, color, marginTop: 4, whiteSpace: "nowrap" } }, val)));
  return h("div", { style: { width: 1200, height: 630, flexDirection: "column", fontFamily: "Figtree", color: TINTA, background: "linear-gradient(135deg, #dfeafc 0%, #f4f7fb 60%)", position: "relative", overflow: "hidden" } },
    h("div", { style: { position: "absolute", right: -150, top: -200, width: 300, height: 300, borderRadius: 999, background: "rgba(29,111,242,0.16)" } }),
    h("div", { style: { alignItems: "center", justifyContent: "space-between", padding: "34px 56px 0" } },
      h("div", { style: { alignItems: "center", gap: 10 } }, marca(48), nombre(31, NAVY, AZUL)),
      h("div", { style: { fontSize: 24, fontWeight: 800, color: NAVY } }, "enlacelaboralrd.com"),
    ),
    h("div", { style: { flexDirection: "column", flex: 1, margin: "24px 56px 0", padding: "34px 40px 30px", borderRadius: 32, background: "#fff", boxShadow: "0 18px 40px rgba(10,47,92,0.14)" } },
      h("div", { style: { alignItems: "center", gap: 16 } },
        h("div", { style: { width: 58, height: 58, borderRadius: 16, background: NAVY, color: "#fff", fontSize: 30, fontWeight: 800, alignItems: "center", justifyContent: "center" } }, d.empresa.trim().charAt(0).toUpperCase()),
        h("div", { style: { flexDirection: "column" } },
          h("div", { style: { fontSize: 17, fontWeight: 800, color: AZUL, letterSpacing: 3 } }, "ESTÁ CONTRATANDO"),
          h("div", { style: { fontSize: 27, fontWeight: 800, color: TINTA } }, d.empresa)),
      ),
      h("div", { style: { marginTop: 20, fontSize: tt, fontWeight: 800, color: NAVY, lineHeight: 1.06, letterSpacing: -1.5, display: "block", lineClamp: 2 } }, d.titulo),
      h("div", { style: { marginTop: "auto", gap: 18 } },
        dato("UBICACIÓN", d.provincia), dato("MODALIDAD", d.modalidad), dato("JORNADA", d.tipo),
        d.conSalario ? dato("SALARIO", d.salario, VERDE, 1.5) : null),
    ),
    h("div", { style: { alignItems: "center", justifyContent: "center", gap: 14, height: 76, marginTop: 26, background: AZUL, color: "#fff", fontSize: 27, fontWeight: 800 } },
      "Toca para ver los requisitos y aplicar gratis »"),
  );
}

/**
 * Cada vacante usa un modelo según lo que trae:
 *  · con salario publicado → Noche (el salario resalta en verde);
 *  · sin salario y con empresa → Ficha («Está contratando»);
 *  · sin salario y sin empresa → Dividida (la marca llena el espacio).
 */
function plantilla(d: Datos): Nodo {
  if (d.conSalario) return modeloA(d);
  return d.empresa === SIN ? modeloB(d) : modeloC(d);
}

export async function imagenVacante(d: Datos, origen: string): Promise<Uint8Array> {
  await preparar(origen);
  const svg = await satori(plantilla(d) as never, { width: 1200, height: 630, fonts: fuentes! });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return png;
}
