import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Columns3, Download, List, MessageCircle, Search, X } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { btnLinea, Coincide, Estrellas, EtapaPill, Persona, Titulo, Vacio } from "@/components/panel/comun";
import { claveContacto, coincidencia, descargarCsv, ETAPAS, etapaDe, horaCorta, partirMensaje, type Candidato, type Etapa } from "@/lib/panel";
import { hace } from "@/lib/vacantes";

type Orden = "recientes" | "coincidencia" | "puntaje";

export function Candidatos() {
  const p = usePanel();
  const [vista, setVista] = useState<"tablero" | "lista">(() => {
    const porDefecto = typeof window !== "undefined" && window.innerWidth < 900 ? "lista" : "tablero";
    try { return (localStorage.getItem("panel-vista") as "tablero" | "lista") || porDefecto; } catch { return porDefecto; }
  });
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [sel, setSel] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Etapa | null>(null);
  useEffect(() => { try { localStorage.setItem("panel-vista", vista); } catch { /* sin almacenamiento */ } }, [vista]);

  const { vacante: vacanteSel, etapa: etapaSel } = p.filtro;

  // Coincidencia y "también aplicó a", calculados una vez por candidato.
  const extra = useMemo(() => {
    const por = new Map<string, Set<string>>();
    for (const c of p.candidatos) { const k = claveContacto(c.contacto); if (k) { if (!por.has(k)) por.set(k, new Set()); por.get(k)!.add(c.vacante_id); } }
    return new Map(p.candidatos.map((c) => {
      const v = p.vacante(c.vacante_id);
      const m = partirMensaje(c.mensaje);
      return [c.id, { k: v ? coincidencia(`${m.mensaje}\n${m.cv}`, v.requisitos) : null, otras: [...(por.get(claveContacto(c.contacto)) ?? [])].filter((id) => id !== c.vacante_id).length, cv: !!m.cv }];
    }));
  }, [p]);

  const base = p.candidatos.filter((c) => (!vacanteSel || c.vacante_id === vacanteSel) && (!q || `${c.nombre} ${c.contacto} ${c.mensaje ?? ""} ${c.nota ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const ordenar = (xs: Candidato[]) => {
    if (orden === "puntaje") return [...xs].sort((a, b) => (b.puntaje ?? 0) - (a.puntaje ?? 0) || b.created_at.localeCompare(a.created_at));
    if (orden === "coincidencia") { const r = (c: Candidato) => { const k = extra.get(c.id)?.k; return k ? k.ok.length / k.total : -1; }; return [...xs].sort((a, b) => r(b) - r(a)); }
    return xs;
  };
  const lista = ordenar(base.filter((c) => !etapaSel || c.etapa === etapaSel));

  const exportar = (cs: Candidato[]) => descargarCsv(`candidatos-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Nombre", "Contacto", "Vacante", "Etapa", "Valoración", "Aplicó", "Entrevista", "Nota", "Mensaje y CV"],
    ...cs.map((c) => [c.nombre, c.contacto, p.puesto(c.vacante_id), etapaDe(c.etapa).corto, c.puntaje ?? "", new Date(c.created_at).toLocaleDateString("es-DO"), c.entrevista_at ? new Date(c.entrevista_at).toLocaleString("es-DO") : "", c.nota ?? "", c.mensaje ?? ""]),
  ]);

  const moverGrupo = async (etapa: Etapa) => {
    const cs = p.candidatos.filter((c) => sel.includes(c.id));
    for (const c of cs) await p.mover(c, etapa, { silencioso: true });
    toast.success(`${cs.length} ${cs.length === 1 ? "persona movida" : "personas movidas"} a ${etapaDe(etapa).label}.`);
    setSel([]);
  };

  const soltar = (etapa: Etapa) => {
    const c = p.candidatos.find((x) => x.id === arrastrando);
    setArrastrando(null); setSobre(null);
    if (!c || c.etapa === etapa) return;
    if (etapa === "entrevista") p.agendar(c); else void p.mover(c, etapa);
  };

  if (!p.candidatos.length) {
    return (
      <>
        <Titulo titulo="Candidatos" />
        <Vacio titulo="Aquí te llegan las personas que aplican" texto="Cuando alguien aplique a tus vacantes lo verás aquí con su contacto y su CV. Comparte tu vacante para que llegue más gente.">
          <button type="button" onClick={() => p.ir("vacantes")} className="btn-aplicar h-11 rounded-xl px-5">Ir a mis vacantes</button>
        </Vacio>
      </>
    );
  }

  return (
    <>
      <Titulo titulo="Candidatos" sub={`${p.candidatos.length} en total · ${p.candidatos.filter((c) => c.etapa === "nuevo").length} sin revisar`}>
        <div className="flex gap-2">
          <div className="inline-flex rounded-xl border border-border bg-surface p-1" role="group" aria-label="Vista">
            <button type="button" aria-pressed={vista === "tablero"} onClick={() => setVista("tablero")} className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${vista === "tablero" ? "bg-[#0a2f5c] text-white" : "text-muted-foreground"}`}><Columns3 className="size-4" /> Tablero</button>
            <button type="button" aria-pressed={vista === "lista"} onClick={() => setVista("lista")} className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${vista === "lista" ? "bg-[#0a2f5c] text-white" : "text-muted-foreground"}`}><List className="size-4" /> Lista</button>
          </div>
          <button type="button" onClick={() => exportar(lista)} className={btnLinea} title="Descargar para abrir en Excel"><Download className="size-4" /><span className="hidden sm:inline">Excel</span></button>
        </div>
      </Titulo>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,16rem)_1fr_auto]">
        <select value={vacanteSel} onChange={(e) => p.ir("candidatos", { vacante: e.target.value, etapa: etapaSel })} aria-label="Vacante" className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold">
          <option value="">Todas las vacantes</option>
          {p.vacantes.filter((v) => p.candidatos.some((c) => c.vacante_id === v.id)).map((v) => <option key={v.id} value={v.id}>{v.titulo} ({p.candidatos.filter((c) => c.vacante_id === v.id).length})</option>)}
        </select>
        <label className="relative">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, teléfono o palabra del CV (ej.: Excel)" className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-9 text-sm" />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Borrar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"><X className="size-4" /></button>}
        </label>
        <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} aria-label="Ordenar" className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold">
          <option value="recientes">Más recientes</option>
          <option value="coincidencia">Más requisitos encontrados</option>
          <option value="puntaje">Mejor valorados</option>
        </select>
      </div>

      {vista === "tablero" ? (
        <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <div className="grid grid-cols-[repeat(4,minmax(11.5rem,1fr))_minmax(10rem,0.8fr)] gap-3">
            {ETAPAS.map((e) => {
              const col = ordenar(base.filter((c) => c.etapa === e.id));
              return (
                <section key={e.id} aria-label={e.label}
                  onDragOver={(ev) => { if (arrastrando) { ev.preventDefault(); setSobre(e.id); } }}
                  onDragLeave={() => setSobre((s) => (s === e.id ? null : s))}
                  onDrop={(ev) => { ev.preventDefault(); soltar(e.id); }}
                  className={`flex min-h-[18rem] flex-col rounded-2xl p-2 transition-colors ${sobre === e.id ? "bg-[#1d6ff2]/10 ring-2 ring-[#1d6ff2]/40" : "bg-[#e9edf3]"}`}>
                  <header className="flex items-center justify-between px-2 pb-2 pt-1">
                    <span className="flex items-center gap-2 text-sm font-extrabold"><span className="size-2 rounded-full" style={{ backgroundColor: e.color }} />{e.label}</span>
                    <span className="rounded-full bg-surface px-2 text-xs font-bold tabular-nums text-muted-foreground">{col.length}</span>
                  </header>
                  <ul className="flex flex-1 flex-col gap-2">
                    {col.map((c) => {
                      const x = extra.get(c.id);
                      return (
                        <li key={c.id} draggable onDragStart={(ev) => { setArrastrando(c.id); ev.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setArrastrando(null); setSobre(null); }} className={arrastrando === c.id ? "opacity-40" : ""}>
                          <button type="button" onClick={() => p.abrir(c.id)} className="w-full cursor-grab rounded-xl border border-transparent bg-surface p-3 text-left shadow-[0_1px_2px_rgb(20_33_58/0.08)] hover:border-[#1d6ff2]/50 active:cursor-grabbing">
                            <span className="flex items-start gap-2.5">
                              <Persona nombre={c.nombre} className="size-8 text-[11px]" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold">{c.nombre}</span>
                                <span className="block truncate text-xs text-muted-foreground">{p.puesto(c.vacante_id)}</span>
                              </span>
                            </span>
                            <span className="mt-2 flex flex-wrap items-center gap-1.5">
                              {x?.k && <Coincide ok={x.k.ok.length} total={x.k.total} />}
                              <Estrellas valor={c.puntaje} />
                              {x && x.otras > 0 && <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-primary">+{x.otras} vacante{x.otras > 1 ? "s" : ""}</span>}
                            </span>
                            {c.entrevista_at && c.etapa === "entrevista" && <span className="mt-2 flex items-center gap-1 whitespace-nowrap rounded-lg bg-[#c27803]/10 px-2 py-1 text-[11px] font-bold text-[#8a5200]"><CalendarClock className="size-3 shrink-0" />{new Date(c.entrevista_at).toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short" })} · {horaCorta(c.entrevista_at)}</span>}
                            <span className="mt-2 block text-[11px] text-muted-foreground">Aplicó {hace(c.created_at)}</span>
                          </button>
                        </li>
                      );
                    })}
                    {!col.length && <li className="grid flex-1 place-items-center rounded-xl border border-dashed border-[#c7cfdb] p-4 text-center text-xs text-muted-foreground">{arrastrando ? "Suelta aquí" : "Nadie en esta etapa"}</li>}
                  </ul>
                </section>
              );
            })}
          </div>
          <p className="mt-3 hidden text-xs text-muted-foreground lg:block">Arrastra una tarjeta a otra columna para cambiarla de etapa. Al soltarla en Entrevista te pedimos fecha y hora.</p>
        </div>
      ) : (
        <>
          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Etapas">
            {[{ id: "" as const, label: "Todos" }, ...ETAPAS].map((e) => {
              const n = e.id ? base.filter((c) => c.etapa === e.id).length : base.length;
              const activo = etapaSel === e.id;
              return <button key={e.id || "todos"} type="button" role="tab" aria-selected={activo} onClick={() => p.ir("candidatos", { vacante: vacanteSel, etapa: e.id })} className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold ${activo ? "border-[#0a2f5c] bg-[#0a2f5c] text-white" : "border-border bg-surface hover:border-primary"}`}>{e.label}<span className={`rounded-full px-1.5 text-xs tabular-nums ${activo ? "bg-white/20" : "bg-muted"}`}>{n}</span></button>;
            })}
          </div>

          {sel.length > 0 && (
            <div className="sticky top-16 z-20 mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-[#0a2f5c] bg-surface p-3 shadow-lg" role="toolbar" aria-label="Acciones para los elegidos">
              <span className="mr-1 text-sm font-bold">{sel.length} elegidos:</span>
              {(["revision", "descartado"] as const).map((e) => <button key={e} type="button" onClick={() => void moverGrupo(e)} className={btnLinea}>Mover a {etapaDe(e).label}</button>)}
              <button type="button" onClick={() => exportar(p.candidatos.filter((c) => sel.includes(c.id)))} className={btnLinea}><Download className="size-4" /> Descargar</button>
              <button type="button" onClick={() => setSel([])} className="ml-auto text-sm font-semibold text-muted-foreground hover:underline">Quitar selección</button>
            </div>
          )}

          {lista.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay candidatos con este filtro.</p> : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
              <label className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                <input type="checkbox" className="size-4" checked={lista.every((c) => sel.includes(c.id))} onChange={(e) => setSel(e.target.checked ? lista.map((c) => c.id) : [])} /> Elegir todos ({lista.length})
              </label>
              <ul className="divide-y divide-border">
                {lista.map((c) => {
                  const x = extra.get(c.id);
                  return (
                    <li key={c.id} className={`flex items-center gap-3 px-4 py-3 ${sel.includes(c.id) ? "bg-secondary/60" : ""}`}>
                      <input type="checkbox" className="size-4 shrink-0" aria-label={`Elegir a ${c.nombre}`} checked={sel.includes(c.id)} onChange={() => setSel((s) => (s.includes(c.id) ? s.filter((i) => i !== c.id) : [...s, c.id]))} />
                      <button type="button" onClick={() => p.abrir(c.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <Persona nombre={c.nombre} className="size-9 text-xs" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2"><span className="truncate font-bold">{c.nombre}</span><EtapaPill etapa={c.etapa} /><Estrellas valor={c.puntaje} /></span>
                          <span className="block truncate text-xs text-muted-foreground">{p.puesto(c.vacante_id)} · {hace(c.created_at)}{x?.cv ? " · con CV" : ""}</span>
                        </span>
                        {x?.k && <span className="hidden sm:inline"><Coincide ok={x.k.ok.length} total={x.k.total} /></span>}
                      </button>
                      <button type="button" onClick={() => p.contactar(c)} aria-label={`Escribir a ${c.nombre}`} className="grid size-9 shrink-0 place-items-center rounded-lg text-[#1fa855] hover:bg-[#1fa855]/10"><MessageCircle className="size-5" /></button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
