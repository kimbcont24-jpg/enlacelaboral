import { useCallback, useEffect, useState } from "react";
import { Copy, Crown, Loader2, MessageCircle, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { campoPanel, Persona, Titulo } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import { esCorreo, planActivo } from "@/lib/panel";
import { SITIO } from "@/lib/vacantes";

type Miembro = { id: string; email: string; nombre: string | null; estado: string; created_at: string; soy_yo: boolean };

/** Equipo: el dueño invita a su gente de recursos humanos. Todos ven los mismos candidatos, vacantes y entrevistas. */
export function Equipo() {
  const p = usePanel();
  const pro = planActivo(p.empresa);
  const limite = pro ? 10 : 1;
  const [lista, setLista] = useState<Miembro[] | null>(null);
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await supabase.rpc("equipo_lista");
    setLista((data ?? []) as Miembro[]);
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const enlace = (m: Pick<Miembro, "email">) => `${SITIO}/auth?modo=equipo&correo=${encodeURIComponent(m.email)}&empresa=${encodeURIComponent(p.empresa.nombre)}`;
  const mensaje = (m: Pick<Miembro, "email" | "nombre">) => `Hola${m.nombre ? ` ${m.nombre.split(" ")[0]}` : ""}, te agregué al panel de ${p.empresa.nombre} en Enlace Laboral para manejar juntos los candidatos. Entra aquí con tu correo ${m.email} y crea tu contraseña: ${enlace(m)}`;

  const invitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esCorreo(correo)) return void toast.error("Escribe un correo válido.");
    setEnviando(true);
    const { error } = await supabase.rpc("equipo_invitar", { p_email: correo, p_nombre: nombre || null });
    setEnviando(false);
    if (error) return void toast.error(error.message.includes("limite_equipo") ? (pro ? "Llegaste al máximo de 10 personas." : "En Gratis puedes agregar 1 persona. Con el Plan Empresa, hasta 10.") : error.message.includes("eres_tu") ? "Ese es tu propio correo." : /duplicate|unique/.test(error.message) ? "Ya invitaste ese correo." : "No se pudo invitar. Intenta otra vez.");
    toast.success("Listo. Ahora envíale el enlace para que entre.");
    const m = { email: correo.trim().toLowerCase(), nombre: nombre || null };
    setCorreo(""); setNombre("");
    await cargar();
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje(m))}`, "_blank", "noopener");
  };

  const quitar = async (m: Miembro) => {
    if (!window.confirm(m.soy_yo ? "¿Salir del equipo de esta empresa?" : `¿Quitar a ${m.nombre || m.email} del equipo?`)) return;
    const { error } = await supabase.rpc("equipo_quitar", { p_id: m.id });
    if (error) return void toast.error("No se pudo quitar.");
    if (m.soy_yo) { window.location.href = "/"; return; }
    toast.success("Quitado del equipo.");
    void cargar();
  };

  return (
    <>
      <Titulo titulo="Equipo" sub="Trabajen juntos: todos ven los mismos candidatos, vacantes, entrevistas y jornadas. Cada cambio queda con el nombre de quien lo hizo." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {lista === null ? <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-[#1d6ff2]" /></div> : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              <li className="flex items-center gap-3 px-4 py-3.5">
                <Persona nombre={p.empresa.contacto_nombre || p.empresa.nombre} className="size-10 text-xs" />
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{p.empresa.contacto_nombre || "Dueño de la cuenta"}{p.yo.dueno && <span className="font-normal text-muted-foreground"> (tú)</span>}</p><p className="truncate text-xs text-muted-foreground">{p.yo.dueno ? p.yo.correo : p.empresa.contacto_email}</p></div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ffd84d]/30 px-2 py-0.5 text-[11px] font-bold text-[#6b5000]"><Crown className="size-3" /> Dueño</span>
              </li>
              {lista.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                  <Persona nombre={m.nombre || m.email} className="size-10 text-xs" />
                  <div className="min-w-0 flex-1"><p className="truncate font-bold">{m.nombre || m.email.split("@")[0]}{m.soy_yo && <span className="font-normal text-muted-foreground"> (tú)</span>}</p><p className="truncate text-xs text-muted-foreground">{m.email}</p></div>
                  {m.estado === "activo" ? <span className="rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-bold text-success">Activo</span> : (
                    <span className="flex items-center gap-1">
                      <span className="rounded-full bg-[#c27803]/12 px-2 py-0.5 text-[11px] font-bold text-[#8a5200]">Falta que entre</span>
                      {p.yo.dueno && <><a href={`https://wa.me/?text=${encodeURIComponent(mensaje(m))}`} target="_blank" rel="noopener noreferrer" aria-label="Enviar enlace por WhatsApp" className="grid size-8 place-items-center rounded-lg text-[#1fa855] hover:bg-[#1fa855]/10"><MessageCircle className="size-4" /></a>
                      <button type="button" onClick={() => { void navigator.clipboard.writeText(enlace(m)).then(() => toast.success("Enlace copiado.")); }} aria-label="Copiar enlace" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><Copy className="size-4" /></button></>}
                    </span>
                  )}
                  {(p.yo.dueno || m.soy_yo) && <button type="button" onClick={() => void quitar(m)} aria-label={m.soy_yo ? "Salir del equipo" : "Quitar"} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>}
                </li>
              ))}
            </ul>
          )}
          {p.yo.dueno ? (
            (lista?.length ?? 0) < limite ? (
              <form onSubmit={(e) => void invitar(e)} className="rounded-2xl border border-border bg-surface p-5">
                <p className="flex items-center gap-2 font-extrabold"><UserPlus className="size-4 text-[#1d6ff2]" /> Agregar a alguien</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} placeholder="Nombre" aria-label="Nombre" className={campoPanel} />
                  <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} maxLength={160} placeholder="Correo" aria-label="Correo" required className={campoPanel} />
                  <button type="submit" disabled={enviando} className="btn-aplicar inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm">{enviando && <Loader2 className="size-4 animate-spin" />} Agregar</button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Te abrimos WhatsApp con el enlace para que entre. Crea su contraseña con ese mismo correo y ya está dentro.</p>
              </form>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
                <p className="font-extrabold">{pro ? "Llegaste a 10 personas" : "En Gratis puedes agregar 1 persona"}</p>
                {!pro && <p className="mt-1 text-muted-foreground">Con el Plan Empresa agregas hasta 10. <button type="button" onClick={() => p.ir("planes")} className="font-bold text-[#1557c4]">Ver planes</button></p>}
              </div>
            )
          ) : <p className="rounded-2xl bg-secondary p-4 text-sm">Eres parte del equipo de <strong>{p.empresa.nombre}</strong>. Solo el dueño puede agregar o quitar personas.</p>}
        </div>
        <aside className="h-fit rounded-2xl bg-[#0a2f5c] p-5 text-sm text-white">
          <Users className="size-5 text-[#8ec1ff]" />
          <p className="mt-2 font-extrabold">Todo el equipo en el mismo lugar</p>
          <ul className="mt-3 space-y-2 text-white/80">
            <li>Ven los mismos candidatos y se enteran al momento cuando alguien aplica.</li>
            <li>El historial de cada candidato dice quién lo movió o le escribió.</li>
            <li>Sin compartir contraseñas: cada quien entra con su correo.</li>
          </ul>
          <p className="mt-4 text-white/60">{pro ? "Hasta 10 personas con tu plan." : "Gratis: 1 persona. Plan Empresa: hasta 10."}</p>
        </aside>
      </div>
    </>
  );
}
