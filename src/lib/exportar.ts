/** CSV listo para Excel (con tildes). Neutraliza celdas que empiezan con = + - @ para que Excel no las ejecute. */
const celda = (v: unknown): string => {
  let t = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",\n\r;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export function aCsv(columnas: { clave: string; titulo: string }[], filas: Record<string, unknown>[]): string {
  const cab = columnas.map((c) => celda(c.titulo)).join(",");
  const cuerpo = filas.map((f) => columnas.map((c) => celda(f[c.clave])).join(","));
  return "﻿" + [cab, ...cuerpo].join("\r\n");
}

export function bajarCsv(nombre: string, csv: string) {
  const u = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = u; a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}
