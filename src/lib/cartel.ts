import { SITIO, type Vacante } from "@/lib/vacantes";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Cartel "Estamos contratando" con código QR que lleva directo a la vacante. Para la puerta, la caja o el mural. */
export async function imprimirCartel(v: Vacante, empresa: string) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const QR = (await import("qrcode")).default;
  const url = `${SITIO}/vacantes/${v.id}?utm_source=cartel`;
  const qr = await QR.toDataURL(url, { margin: 1, width: 640, color: { dark: "#0a2f5c", light: "#ffffff" } });
  const req = v.requisitos.slice(0, 4).map((r) => `<li>${esc(r)}</li>`).join("");
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Cartel · ${esc(v.titulo)}</title>
<style>
@page{size:letter;margin:0}*{box-sizing:border-box;margin:0}body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0a2f5c;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hoja{width:8.5in;height:11in;padding:.6in;display:flex;flex-direction:column}
.top{background:#0a2f5c;color:#fff;border-radius:28px;padding:.45in .5in}
.top p{font-size:20px;font-weight:700;color:#8ec1ff}.top h1{font-size:64px;line-height:1;margin-top:10px;letter-spacing:-.02em}
.puesto{font-size:46px;font-weight:800;line-height:1.05;margin-top:.4in}.emp{font-size:22px;margin-top:8px;color:#3d5677}
.sal{display:inline-block;margin-top:.22in;background:#ffd84d;color:#3d2f00;font-weight:800;font-size:28px;padding:10px 20px;border-radius:14px}
ul{margin-top:.25in;padding-left:28px;font-size:21px;line-height:1.5}
.qr{margin-top:auto;display:flex;align-items:center;gap:.4in;border:3px solid #0a2f5c;border-radius:28px;padding:.3in}
.qr img{width:2.6in;height:2.6in}.qr h2{font-size:34px;line-height:1.1}.qr p{font-size:18px;margin-top:10px;color:#3d5677}
.pie{margin-top:.2in;font-size:14px;color:#3d5677;text-align:center}
@media screen{body{background:#e9eef5}.hoja{background:#fff;margin:20px auto;box-shadow:0 10px 40px rgba(0,0,0,.15)}}
</style></head><body><div class="hoja">
<div class="top"><p>${esc(empresa)}</p><h1>Estamos contratando</h1></div>
<div class="puesto">${esc(v.titulo)}</div><div class="emp">${esc(v.provincia)} · ${esc(v.modalidad)} · ${esc(v.tipo)}</div>
${v.salario ? `<div><span class="sal">${esc(v.salario)} al mes</span></div>` : ""}
${req ? `<ul>${req}</ul>` : ""}
<div class="qr"><img src="${qr}" alt="Código QR de la vacante"><div><h2>Escanea con tu celular y aplica en 1 minuto</h2><p>Sin crear cuenta. Tu aplicación nos llega directo.</p><p style="font-weight:700;color:#0a2f5c;margin-top:14px">enlace-rd.vercel.app</p></div></div>
<div class="pie">Publicado en Enlace Laboral · Aplicar es gratis. Nunca pagues por un empleo.</div>
</div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
  return true;
}
