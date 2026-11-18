import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Consentimiento } from "@/components/site/Consentimiento";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { AccesoEscena } from "@/components/site/AccesoEscena";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { modo?: "registro" | "equipo" | "nueva"; correo?: string; empresa?: string } => ({
    ...(s["modo"] === "registro" || s["modo"] === "equipo" || s["modo"] === "nueva" ? { modo: s["modo"] } : {}),
    ...(typeof s["correo"] === "string" ? { correo: s["correo"].slice(0, 160) } : {}),
    ...(typeof s["empresa"] === "string" ? { empresa: s["empresa"].slice(0, 120) } : {}),
  }),
  head: () => ({ meta: [{ title: "Empresas: entrar o crear cuenta | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Auth,
});

const soloDigitos = (v: string) => v.replace(/\D/g, "");
type Modo = "registro" | "login" | "equipo" | "olvido" | "nueva";

/** Traduce los mensajes del servicio de cuentas a algo claro. */
function traducir(msg: string): string {
  if (/invalid login/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/email not confirmed/i.test(msg)) return "Todavía no has confirmado tu correo. Abre el enlace que te enviamos o pide uno nuevo abajo.";
  if (/already registered|already exists/i.test(msg)) return "Ese correo ya tiene cuenta. Toca «Iniciar sesión» y entra con tu contraseña.";
  if (/password.*(at least|characters)|weak/i.test(msg)) return "La contraseña debe tener al menos 6 caracteres.";
  if (/same.*password|different from the old/i.test(msg)) return "La nueva contraseña debe ser distinta a la anterior.";
  if (/rate|seconds|too many/i.test(msg)) return "Hiciste varios intentos seguidos. Espera un minuto y vuelve a intentar.";
  if (/invalid.*email|email.*invalid/i.test(msg)) return "Revisa que el correo esté bien escrito.";
  if (/expired|invalid.*(token|link)/i.test(msg)) return "El enlace ya venció. Pide uno nuevo.";
  if (/network|fetch/i.test(msg)) return "No hay conexión. Revisa tu internet e intenta otra vez.";
  return "Algo salió mal. Intenta otra vez en un momento.";
}

function Auth() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [modo, setModo] = useState<Modo>(search.modo ?? "login");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [reenviar, setReenviar] = useState(false);
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState(search.modo === "registro" ? (search.empresa ?? "") : "");
  const [rnc, setRnc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState(search.correo ?? "");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [paso, setPaso] = useState<1 | 2>(1);
  const [verClave, setVerClave] = useState(false);

  const ir = async (uid: string) => {
    // Si una empresa la invitó a su equipo con este correo, queda unida al entrar.
    await supabase.rpc("equipo_aceptar");
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin");
    await qc.invalidateQueries({ queryKey: ["es-admin"] });
    await navigate({ to: roles && roles.length ? "/admin" : "/panel" });
  };

  const cambiar = (m: Modo) => { setModo(m); setError(null); setAviso(null); setReenviar(false); setPaso(1); };

  useEffect(() => {
    // Al volver del enlace «olvidé mi contraseña» hay sesión, pero primero debe poner la clave nueva.
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") cambiar("nueva"); });
    if (search.modo !== "nueva") {
      void supabase.auth.getSession().then(({ data }) => { if (data.session) void ir(data.session.user.id); });
    }
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const volver = `${typeof window !== "undefined" ? window.location.origin : ""}/panel`;

  const reenviarCorreo = async () => {
    setCargando(true); setError(null);
    const { error: err } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: volver } });
    setCargando(false);
    if (err) setError(traducir(err.message));
    else setAviso(`Te enviamos otro enlace a ${email.trim()}. Revisa también «Spam» o «Promociones».`);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setAviso(null); setReenviar(false);
    const correo = email.trim().toLowerCase();
    if (modo === "registro") {
      const r = soloDigitos(rnc);
      if (empresa.trim().length < 2) { setError("Escribe el nombre de la empresa."); setPaso(1); return; }
      if (r.length !== 9 && r.length !== 11) { setError("El RNC debe tener 9 dígitos (empresa) o 11 (cédula)."); setPaso(1); return; }
      if (nombre.trim().length < 3) { setError("Escribe tu nombre."); setPaso(1); return; }
      if (paso === 1) { setPaso(2); return; }
    }
    if ((modo === "registro" || modo === "equipo" || modo === "nueva") && clave.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (modo === "nueva" && clave !== clave2) { setError("Las dos contraseñas no son iguales."); return; }
    setCargando(true);
    try {
      if (modo === "olvido") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(correo, { redirectTo: `${window.location.origin}/auth?modo=nueva` });
        if (err) throw err;
        setAviso(`Si ${correo} tiene cuenta, te llegará un enlace para crear una contraseña nueva. Revisa también «Spam».`);
      } else if (modo === "nueva") {
        const { data, error: err } = await supabase.auth.updateUser({ password: clave });
        if (err) throw err;
        if (data.user) await ir(data.user.id);
      } else if (modo === "equipo" || modo === "registro") {
        const datos = modo === "equipo"
          ? { nombre: nombre.trim(), tipo: "equipo" }
          : { nombre: nombre.trim(), tipo: "empresa", empresa: empresa.trim(), rnc: soloDigitos(rnc) };
        const { data, error: err } = await supabase.auth.signUp({ email: correo, password: clave, options: { emailRedirectTo: volver, data: datos } });
        if (err) throw err;
        // Correo ya registrado: el servicio no da error, devuelve un usuario sin identidades.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setError("Ese correo ya tiene cuenta. Inicia sesión con tu contraseña (o toca «¿Olvidaste tu contraseña?»).");
          setModo("login");
          return;
        }
        if (data.session && data.user) {
          if (modo === "registro") {
            await supabase.from("empresas").insert({ owner_id: data.user.id, nombre: empresa.trim(), rnc: soloDigitos(rnc), contacto_nombre: nombre.trim(), contacto_email: correo, verificada: false });
          }
          await ir(data.user.id);
          return;
        }
        setEnviadoA(correo);
        setReenviar(true);
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
        if (err) { if (/email not confirmed/i.test(err.message)) setReenviar(true); throw err; }
        await ir(data.user.id);
      }
    } catch (err) {
      setError(traducir(err instanceof Error ? err.message : ""));
    } finally {
      setCargando(false);
    }
  };

  const r = soloDigitos(rnc);
  const rncTxt = r.length === 9 ? "RNC de empresa" : r.length === 11 ? "Cédula (persona física)" : "";
  const fuerza = clave.length === 0 ? 0 : clave.length < 6 ? 1 : (/[A-Z]/.test(clave) ? 1 : 0) + (/\d/.test(clave) ? 1 : 0) + (/[^A-Za-z0-9]/.test(clave) ? 1 : 0) + (clave.length >= 10 ? 1 : 0) >= 2 ? 3 : 2;
  const titulo = modo === "registro" ? (paso === 1 ? "Crea la cuenta de tu empresa" : "Último paso: tu acceso") : modo === "equipo" ? `Únete al equipo${search.empresa ? ` de ${search.empresa}` : ""}` : modo === "olvido" ? "Recupera tu contraseña" : modo === "nueva" ? "Crea tu contraseña nueva" : "Qué bueno verte de nuevo";
  const sub = modo === "registro" ? (paso === 1 ? "Un minuto. Publicar es gratis para siempre." : "Con este correo y contraseña entras a tu panel.") : modo === "equipo" ? "Crea tu contraseña con el correo donde te invitaron." : modo === "olvido" ? "Te enviamos un enlace para crear una nueva." : modo === "nueva" ? "Escríbela dos veces." : "Entra a tu panel de empresa.";



  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="order-2 lg:order-1 lg:sticky lg:top-0 lg:h-screen"><AccesoEscena para="empresa" /></div>

      <main className="order-1 flex flex-col px-5 py-6 sm:px-10 lg:order-2 lg:min-h-screen lg:px-16">
        <div className="flex items-center justify-between text-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground lg:invisible"><ArrowLeft className="size-4" /> Inicio</Link>
          <span className="text-muted-foreground">¿Buscas empleo? <Link to="/cuenta" className="font-bold text-primary hover:underline">Entra aquí</Link></span>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-6 lg:py-10">
          {enviadoA ? (
            <div key="enviado" className="fx-paso text-center">
              <span className="fx-sobre relative mx-auto grid size-24 place-items-center rounded-[1.75rem] bg-gradient-to-br from-[#1d6ff2] to-[#0a2f5c] text-white shadow-[0_24px_50px_-18px_rgb(29_111_242/0.7)]">
                <MailCheck className="size-11" />
                <span className="absolute -right-2 -top-2 grid size-9 place-items-center rounded-full bg-[#0f7a43] ring-4 ring-background"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path className="fx-check" d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
              </span>
              <h2 className="mt-7 font-display text-3xl font-extrabold tracking-tight">Revisa tu correo</h2>
              <p className="mt-3 text-muted-foreground">Enviamos un enlace a <b className="text-foreground">{enviadoA}</b>. Ábrelo y entrarás directo al panel de <b className="text-foreground">{empresa || "tu empresa"}</b>.</p>
              <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                <a href="https://mail.google.com/mail/u/0/#search/enlace" target="_blank" rel="noopener" className="fx-btn rounded-xl border border-border bg-surface py-3.5 text-sm font-bold">Abrir Gmail</a>
                <a href="https://outlook.live.com/mail/0/" target="_blank" rel="noopener" className="fx-btn rounded-xl border border-border bg-surface py-3.5 text-sm font-bold">Abrir Outlook</a>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">¿No llega en 5 minutos? Mira en «Spam» o «Promociones».</p>
              {error && (<p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>)}
              {aviso && (<p role="status" className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">{aviso}</p>)}
              <button type="button" disabled={cargando} onClick={() => void reenviarCorreo()} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline disabled:opacity-60">{cargando && <Loader2 className="size-4 animate-spin" />} Reenviar el correo</button>
              <p className="mt-2 text-xs text-muted-foreground">¿Escribiste mal el correo? <button type="button" onClick={() => { setEnviadoA(null); setReenviar(false); setAviso(null); setError(null); }} className="font-semibold text-primary hover:underline">Corrígelo</button></p>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate className="space-y-4">
              {(modo === "login" || modo === "registro") && (
                <div className="relative grid grid-cols-2 rounded-2xl bg-secondary p-1 text-sm font-bold" role="tablist">
                  <span aria-hidden="true" className={`absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-surface shadow-sm transition-transform duration-300 ${modo === "registro" ? "translate-x-[calc(100%+0.5rem)]" : "translate-x-1"}`} style={{ left: 0 }} />
                  {(["login", "registro"] as const).map((m) => <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => cambiar(m)} className={`relative z-10 py-2.5 transition-colors ${modo === m ? "text-foreground" : "text-muted-foreground"}`}>{m === "registro" ? "Crear cuenta" : "Iniciar sesión"}</button>)}
                </div>
              )}

              <div key={`${modo}-${paso}`} className="fx-paso space-y-4">
                <div className="pt-2">
                  {modo === "registro" && (
                    <div className="mb-4 flex items-center gap-3 text-xs font-bold text-muted-foreground">
                      {[1, 2].map((k) => <span key={k} className="flex flex-1 items-center gap-2"><span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] transition-colors ${paso >= k ? "bg-[#1d6ff2] text-white" : "bg-secondary"}`}>{paso > k ? <Check className="size-3.5" /> : k}</span><span className={paso === k ? "text-foreground" : ""}>{k === 1 ? "Tu empresa" : "Tu acceso"}</span>{k === 1 && <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-secondary"><span className={`block h-full bg-[#1d6ff2] transition-transform duration-500 origin-left ${paso > 1 ? "scale-x-100" : "scale-x-0"}`} /></span>}</span>)}
                    </div>
                  )}
                  <h2 className="font-display text-[1.9rem] font-extrabold leading-tight tracking-tight">{titulo}</h2>
                  <p className="mt-1.5 text-muted-foreground">{sub}</p>
                </div>

                {modo === "registro" && paso === 1 && (
                  <>
                    <Campo id="empresa" label="Nombre de la empresa" required autoFocus value={empresa} onChange={(e) => setEmpresa(e.target.value)} autoComplete="organization" />
                    <div>
                      <Campo id="rnc" label="RNC o cédula" required inputMode="numeric" value={rnc} onChange={(e) => setRnc(soloDigitos(e.target.value).slice(0, 11))} aria-invalid={rncTxt ? false : undefined} />
                      <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${rncTxt ? "text-[#0f7a43]" : "text-muted-foreground"}`}>{rncTxt ? <><Check className="size-3.5" /> {rncTxt}</> : r.length ? `${r.length} dígitos · el RNC tiene 9 y la cédula 11` : "Lo usamos para darte el sello de empresa verificada."}</p>
                    </div>
                    <Campo id="nombre" label="Tu nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
                  </>
                )}
                {modo === "equipo" && <Campo id="nombre" label="Tu nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />}

                {(modo !== "registro" || paso === 2) && modo !== "nueva" && <Campo id="correo" label={modo === "registro" ? "Correo de trabajo" : "Correo"} type="email" required autoFocus={modo === "registro"} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
                {(modo !== "registro" || paso === 2) && modo !== "olvido" && (
                  <div>
                    <div className="relative">
                      <Campo id="clave" label={modo === "nueva" ? "Contraseña nueva" : "Contraseña"} type={verClave ? "text" : "password"} required minLength={6} autoComplete={modo === "login" ? "current-password" : "new-password"} value={clave} onChange={(e) => setClave(e.target.value)} />
                      <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">{verClave ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
                    </div>
                    {modo !== "login" && clave.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="flex flex-1 gap-1">{[1, 2, 3].map((k) => <span key={k} className={`h-1.5 flex-1 rounded-full transition-colors ${fuerza >= k ? (fuerza === 1 ? "bg-destructive" : fuerza === 2 ? "bg-[#f5a700]" : "bg-[#0f7a43]") : "bg-secondary"}`} />)}</span>
                        <span className="text-xs font-semibold text-muted-foreground">{fuerza === 1 ? "Muy corta" : fuerza === 2 ? "Aceptable" : "Segura"}</span>
                      </div>
                    )}
                  </div>
                )}
                {modo === "nueva" && <Campo id="clave2" label="Repite la contraseña" type={verClave ? "text" : "password"} required minLength={6} autoComplete="new-password" value={clave2} onChange={(e) => setClave2(e.target.value)} />}
                {modo === "login" && <button type="button" onClick={() => cambiar("olvido")} className="text-sm font-semibold text-primary hover:underline">¿Olvidaste tu contraseña?</button>}
                {modo === "registro" && paso === 2 && <Consentimiento para="empresa" />}
              </div>

              {error && (<p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>)}
              {aviso && (<p role="status" className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">{aviso}</p>)}
              {reenviar && email.trim() && (<button type="button" disabled={cargando} onClick={() => void reenviarCorreo()} className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60">Reenviar el correo de confirmación</button>)}

              <div className="flex gap-2 pt-1">
                {modo === "registro" && paso === 2 && <button type="button" onClick={() => { setPaso(1); setError(null); }} aria-label="Volver al paso 1" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border hover:bg-secondary"><ArrowLeft className="size-5" /></button>}
                <button type="submit" disabled={cargando} className="fx-btn flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1d6ff2] to-[#1557c4] text-[1.05rem] font-bold text-white disabled:opacity-70">
                  {cargando ? <Loader2 className="size-5 animate-spin" /> : null}
                  {modo === "registro" ? (paso === 1 ? <>Seguir <ArrowRight className="size-5" /></> : "Crear mi cuenta gratis") : modo === "equipo" ? "Entrar al equipo" : modo === "olvido" ? "Enviar enlace" : modo === "nueva" ? "Guardar contraseña" : <>Entrar a mi panel <ArrowRight className="size-5" /></>}
                </button>
              </div>
              {(modo === "olvido" || modo === "nueva") && <button type="button" onClick={() => cambiar("login")} className="w-full text-sm font-semibold text-muted-foreground hover:underline">Volver a iniciar sesión</button>}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function Campo({ id, label, ...p }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div className="campo-flota" data-ok={p["aria-invalid"] === false ? "true" : undefined}><input id={id} placeholder=" " {...p} /><label htmlFor={id}>{label}</label></div>;
}
