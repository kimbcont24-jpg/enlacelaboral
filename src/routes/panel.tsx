import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Loader2, LogOut, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Candidatos } from "@/components/panel/Candidatos";
import { VacantesEmpresa } from "@/components/panel/VacantesEmpresa";
import { PublicarEmpresa } from "@/components/panel/PublicarEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { diasRestantes } from "@/lib/claridad";
import { estadoVacante, pendientesDe, type Candidato, type EmpresaPerfil, type Etapa, type Pendiente } from "@/lib/panel";
import { rowToVacante, SELECT, type Vacante, type VacanteRow } from "@/lib/vacantes";

type Tab = "candidatos" | "vacantes" | "publicar";

export const Route = createFileRoute("/panel")({
  head: () => ({ meta: [{ title: "Panel de empresa | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Panel,
});

const CAMPOS_APLICACION = "id,vacante_id,nombre,contacto,mensaje,created_at,etapa,nota,etapa_at";

function Panel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [uid, setUid] = useState("");
  const [empresa, setEmpresa] = useState<EmpresaPerfil | null | undefined>(undefined);
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [tab, setTab] = useState<Tab>("candidatos");
  const [vacanteSel, setVacanteSel] = useState("");
  const [etapaSel, setEtapaSel] = useState<Etapa | "">("");
  const [editar, setEditar] = useState<Vacante | null>(null);
  const [vistoAntes, setVistoAntes] = useState(0);
  const conteo = useRef(-1);

  const cargarCandidatos = useCallback(async (ids: string[], avisar: boolean) => {
    if (!ids.length) { setCandidatos([]); return; }
    const filas: Candidato[] = [];
    // En tandas para no pasar el largo máximo de la dirección.
    for (let i = 0; i < ids.length; i += 150) {
      const { data } = await supabase.from("aplicaciones").select(CAMPOS_APLICACION).in("vacante_id", ids.slice(i, i + 150)).order("created_at", { ascending: false }).limit(2000);
      filas.push(...((data ?? []) as unknown as Candidato[]));
    }
    filas.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (avisar && conteo.current >= 0 && filas.length > conteo.current) {
      const n = filas.length - conteo.current;
      toast.success(n === 1 ? `Llegó un candidato nuevo: ${filas[0]!.nombre}` : `Llegaron ${n} candidatos nuevos`, { action: { label: "Ver", onClick: () => { setTab("candidatos"); setEtapaSel("nuevo"); } } });
    }
    conteo.current = filas.length;
    setCandidatos(filas);
  }, []);

  const cargarTodo = useCallback(async (id: string) => {
    const { data } = await supabase.from("vacantes").select(SELECT).eq("owner_id", id).order("created_at", { ascending: false }).limit(1000);
    const vs = ((data ?? []) as unknown as VacanteRow[]).map(rowToVacante);
    setVacantes(vs);
    await cargarCandidatos(vs.map((v) => v.id), false);
  }, [cargarCandidatos]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id;
      if (!id) { await navigate({ to: "/auth" }); return; }
      setUid(id);
      const clave = `enlace-panel-visto-${id}`;
      try { setVistoAntes(Number(localStorage.getItem(clave)) || 0); localStorage.setItem(clave, String(Date.now())); } catch { /* sin almacenamiento */ }
      const { data: e } = await supabase.from("empresas").select("id,nombre,verificada,contacto_telefono").eq("owner_id", id).limit(1).maybeSingle();
      setEmpresa((e as EmpresaPerfil | null) ?? null);
      await cargarTodo(id);
    })();
  }, [navigate, cargarTodo]);

  // Revisa solo cada minuto y al volver a la pestaña, y avisa si llegó alguien.
  useEffect(() => {
    if (!uid) return;
    const revisar = () => { if (document.visibilityState === "visible") void cargarCandidatos(vacantes.map((v) => v.id), true); };
    const t = window.setInterval(revisar, 60_000);
    document.addEventListener("visibilitychange", revisar);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", revisar); };
  }, [uid, vacantes, cargarCandidatos]);

  const cambiarCandidato = (id: string, cambios: Partial<Candidato>) => setCandidatos((xs) => xs.map((c) => (c.id === id ? { ...c, ...cambios } : c)));

  const accionVacante = async (v: Vacante, a: "renovar" | "pausar" | "reactivar" | "cerrar") => {
    if (a === "cerrar" && !confirm(`¿Cerrar "${v.titulo}"? Deja de verse y no recibe más aplicaciones. Tus candidatos se quedan aquí.`)) return;
    const vencida = diasRestantes(v) <= 0;
    const cambios = a === "pausar" ? { estado: "pausada" } : a === "cerrar" ? { estado: "cerrada" } : a === "renovar" || vencida ? { estado: "publicada", created_at: new Date().toISOString() } : { estado: "publicada" };
    const { data, error } = await supabase.from("vacantes").update(cambios).eq("id", v.id).select("estado").single();
    if (error) return void toast.error("No se pudo cambiar. Intenta otra vez.");
    const estado = (data as { estado: string } | null)?.estado;
    toast.success(estado === "revision" ? "Enviada a revisión." : a === "pausar" ? "Pausada: ya no se ve en la página." : a === "cerrar" ? "Cerrada. ¡Felicidades por la contratación!" : a === "renovar" ? "Renovada: se ve 30 días más." : "Publicada otra vez.");
    await cargarTodo(uid);
    await qc.invalidateQueries({ queryKey: ["vacantes"] });
  };

  const resolver = (p: Pendiente) => {
    const v = vacantes.find((x) => x.id === p.vacanteId);
    if (p.tipo === "candidatos") { setTab("candidatos"); setVacanteSel(""); setEtapaSel("nuevo"); }
    else if (p.tipo === "entrevista") { setTab("candidatos"); setVacanteSel(""); setEtapaSel("entrevista"); }
    else if (v && p.tipo === "renovar") void accionVacante(v, "renovar");
    else if (v && p.tipo === "cerrar") void accionVacante(v, "cerrar");
    else if (v && p.tipo === "salario") { setEditar(v); setTab("publicar"); }
  };

  const pendientes = useMemo(() => pendientesDe(vacantes, candidatos), [vacantes, candidatos]);
  const kpis = useMemo(() => {
    const semana = Date.now() - 7 * 864e5;
    return [
      { n: candidatos.filter((c) => c.etapa === "nuevo").length, t: "Por revisar", ir: () => { setTab("candidatos"); setEtapaSel("nuevo"); } },
      { n: candidatos.filter((c) => new Date(c.created_at).getTime() > semana).length, t: "Aplicaron esta semana", ir: () => { setTab("candidatos"); setEtapaSel(""); } },
      { n: candidatos.filter((c) => c.etapa === "entrevista").length, t: "En entrevista", ir: () => { setTab("candidatos"); setEtapaSel("entrevista"); } },
      { n: vacantes.filter((v) => estadoVacante(v).id === "activa").length, t: "Vacantes activas", ir: () => setTab("vacantes") },
    ];
  }, [candidatos, vacantes]);

  const salir = async () => { await supabase.auth.signOut(); await navigate({ to: "/auth" }); };
  const irPublicar = () => { setEditar(null); setTab("publicar"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        {empresa === undefined ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : empresa === null ? (
          <CrearEmpresa uid={uid} onListo={(e) => setEmpresa(e)} onSalir={() => void salir()} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <EmpresaAvatar nombre={empresa.nombre} className="size-12 text-xl" />
                <div className="min-w-0">
                  <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-tight">
                    {empresa.nombre}
                    {empresa.verificada && <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success"><BadgeCheck className="size-3.5" /> Verificada</span>}
                  </h1>
                  <p className="text-sm text-muted-foreground">Tu panel para publicar y elegir candidatos. Gratis.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={irPublicar} className="btn-aplicar inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"><Plus className="size-4" /> Publicar vacante</button>
                <button type="button" onClick={() => void salir()} aria-label="Salir" className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:border-primary"><LogOut className="size-4" /></button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {kpis.map((k) => (
                <button key={k.t} type="button" onClick={k.ir} className="rounded-2xl border border-border bg-surface p-4 text-left hover:border-primary">
                  <p className="text-3xl font-extrabold tabular-nums">{k.n}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{k.t}</p>
                </button>
              ))}
            </div>

            {pendientes.length > 0 && (
              <section className="mt-6 rounded-2xl border border-primary/30 bg-secondary/40 p-4 sm:p-5" aria-label="Lo que toca hoy">
                <h2 className="flex items-center gap-2 text-base font-extrabold"><Sparkles className="size-4 text-primary" /> Lo que toca hoy</h2>
                <ul className="mt-3 space-y-2">
                  {pendientes.slice(0, 6).map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3.5 py-2.5">
                      <span className="text-sm">{p.texto}</span>
                      <button type="button" onClick={() => resolver(p)} className="h-9 rounded-lg bg-primary px-3.5 text-sm font-bold text-primary-foreground">{p.accion}</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-8 flex gap-1 border-b border-border" role="tablist">
              {([["candidatos", `Candidatos (${candidatos.length})`], ["vacantes", `Mis vacantes (${vacantes.length})`], ["publicar", editar ? "Editar vacante" : "Publicar"]] as const).map(([id, t]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { if (id === "publicar" && tab !== "publicar") setEditar(null); setTab(id); }} className={`-mb-px border-b-2 px-3 py-3 text-sm font-bold sm:px-4 ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
              ))}
            </div>

            <div className="mt-5">
              {tab === "candidatos" && <Candidatos candidatos={candidatos} vacantes={vacantes} empresa={empresa.nombre} vacanteSel={vacanteSel} etapaSel={etapaSel} vistoAntes={vistoAntes} onFiltro={(v, e) => { setVacanteSel(v); setEtapaSel(e); }} onCambio={cambiarCandidato} />}
              {tab === "vacantes" && <VacantesEmpresa vacantes={vacantes} candidatos={candidatos} onAccion={(v, a) => void accionVacante(v, a)} onEditar={(v) => { setEditar(v); setTab("publicar"); }} onVerCandidatos={(id) => { setVacanteSel(id); setEtapaSel(""); setTab("candidatos"); }} onPublicar={irPublicar} />}
              {tab === "publicar" && <PublicarEmpresa key={editar?.id ?? "nueva"} empresa={empresa} uid={uid} editar={editar} onListo={() => { setEditar(null); setTab("vacantes"); void cargarTodo(uid); void qc.invalidateQueries({ queryKey: ["vacantes"] }); }} />}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function CrearEmpresa({ uid, onListo, onSalir }: { uid: string; onListo: (e: EmpresaPerfil) => void; onSalir: () => void }) {
  const [nombre, setNombre] = useState("");
  const [rnc, setRnc] = useState("");
  const [guardando, setGuardando] = useState(false);
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = rnc.replace(/\D/g, "");
    if (nombre.trim().length < 2) return void toast.error("Escribe el nombre de tu empresa.");
    if (d.length !== 9 && d.length !== 11) return void toast.error("El RNC tiene 9 dígitos (o 11 si es cédula).");
    setGuardando(true);
    const { data, error } = await supabase.from("empresas").insert({ owner_id: uid, nombre: nombre.trim(), rnc: d, verificada: false }).select("id,nombre,verificada,contacto_telefono").single();
    setGuardando(false);
    if (error) return void toast.error("No se pudo guardar. Intenta otra vez.");
    onListo(data as EmpresaPerfil);
  };
  return (
    <form onSubmit={(e) => void guardar(e)} className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6">
      <h1 className="text-2xl font-extrabold">Datos de tu empresa</h1>
      <p className="text-sm text-muted-foreground">Un último paso para usar el panel y publicar vacantes gratis.</p>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la empresa" aria-label="Nombre de la empresa" className="h-12 w-full rounded-xl border border-border bg-background px-3.5" />
      <input value={rnc} onChange={(e) => setRnc(e.target.value)} inputMode="numeric" placeholder="RNC" aria-label="RNC" className="h-12 w-full rounded-xl border border-border bg-background px-3.5" />
      <button type="submit" disabled={guardando} className="btn-aplicar flex h-12 w-full items-center justify-center gap-2 rounded-xl">{guardando && <Loader2 className="size-4 animate-spin" />} Guardar y entrar</button>
      <button type="button" onClick={onSalir} className="w-full text-sm font-semibold text-muted-foreground hover:underline">Salir</button>
    </form>
  );
}
