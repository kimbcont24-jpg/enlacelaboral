import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Consentimiento } from "@/components/site/Consentimiento";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { modo?: "registro" | "equipo" | "nueva"; correo?: string; empresa?: string } => ({
    ...(s["modo"] === "registro" || s["modo"] === "equipo" || s["modo"] === "nueva" ? { modo: s["modo"] } : {}),
    ...(typeof s["correo"] === "string" ? { correo: s["correo"].slice(0, 160) } : {}),
    ...(typeof s["empresa"] === "string" ? { empresa: s["empresa"].slice(0, 120) } : {}),
  }),
  head: () => ({ meta: [{ title: "Iniciar sesión | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
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
  const [empresa, setEmpresa] = useState(search.modo === "registro" ? (search.empresa ?? "") : "");
  const [rnc, setRnc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState(search.correo ?? "");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");

  const ir = async (uid: string) => {
    // Si una empresa la invitó a su equipo con este correo, queda unida al entrar.
    await supabase.rpc("equipo_aceptar");
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin");
    await qc.invalidateQueries({ queryKey: ["es-admin"] });
    await navigate({ to: roles && roles.length ? "/admin" : "/panel" });
  };

  const cambiar = (m: Modo) => { setModo(m); setError(null); setAviso(null); setReenviar(false); };

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
      if (empresa.trim().length < 2) { setError("Escribe el nombre de la empresa."); return; }
      if (r.length !== 9 && r.length !== 11) { setError("El RNC debe tener 9 dígitos (empresa) o 11 (cédula)."); return; }
      if (nombre.trim().length < 3) { setError("Escribe tu nombre."); return; }
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
        setAviso(`¡Listo! Te enviamos un correo a ${correo}. Abre el enlace para confirmar tu cuenta y entrarás directo a tu panel. Si no llega en 5 minutos, revisa «Spam» o «Promociones».`);
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

  const input = "mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2">
        <div>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight">Acceso a Enlace Laboral</h1>
          <p className="mt-3 text-muted-foreground">Esta entrada es para empresas que publican vacantes.</p>
          <p className="mt-6 text-sm text-muted-foreground">¿Buscas empleo? No necesitas cuenta. <Link to="/vacantes" className="font-semibold text-primary">Mira las vacantes</Link>.</p>
        </div>
        <form onSubmit={enviar} className="space-y-3 self-start rounded-3xl border border-border bg-surface p-7">
          {modo === "equipo" ? (
            <div className="rounded-2xl bg-secondary p-4 text-sm"><p className="font-extrabold">Te invitaron al equipo{search.empresa ? ` de ${search.empresa}` : ""}</p><p className="mt-1 text-muted-foreground">Crea tu contraseña con el correo donde te invitaron y entrarás al panel de la empresa. ¿Ya tienes cuenta? <button type="button" onClick={() => cambiar("login")} className="font-bold text-primary">Inicia sesión</button>.</p></div>
          ) : modo === "olvido" || modo === "nueva" ? (
            <div className="rounded-2xl bg-secondary p-4 text-sm"><p className="font-extrabold">{modo === "olvido" ? "Recupera tu contraseña" : "Crea tu contraseña nueva"}</p><p className="mt-1 text-muted-foreground">{modo === "olvido" ? "Escribe el correo de tu cuenta y te enviamos un enlace." : "Escríbela dos veces. Después entrarás a tu panel."}</p></div>
          ) : (
          <div className="flex rounded-full border border-border p-1 text-sm font-semibold">
            {(["login", "registro"] as const).map((m) => (<button key={m} type="button" onClick={() => cambiar(m)} className={modo === m ? "flex-1 rounded-full bg-primary py-2 text-primary-foreground" : "flex-1 rounded-full py-2 text-muted-foreground"}>{m === "registro" ? "Crear cuenta" : "Iniciar sesión"}</button>))}
          </div>
          )}
          {modo === "equipo" && <input required className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />}
          {modo === "registro" && (
            <>
              <input required className={input} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nombre de la empresa" />
              <input required inputMode="numeric" className={input} value={rnc} onChange={(e) => setRnc(soloDigitos(e.target.value).slice(0, 11))} placeholder="RNC o cédula (solo números)" />
              <input required className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
            </>
          )}
          {modo !== "nueva" && <input required type="email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" />}
          {modo !== "olvido" && <input required type="password" minLength={6} autoComplete={modo === "login" ? "current-password" : "new-password"} className={input} value={clave} onChange={(e) => setClave(e.target.value)} placeholder={modo === "nueva" ? "Contraseña nueva (mínimo 6)" : "Contraseña (mínimo 6)"} />}
          {modo === "nueva" && <input required type="password" minLength={6} autoComplete="new-password" className={input} value={clave2} onChange={(e) => setClave2(e.target.value)} placeholder="Repite la contraseña" />}
          {modo === "login" && <button type="button" onClick={() => cambiar("olvido")} className="text-sm font-semibold text-primary hover:underline">¿Olvidaste tu contraseña?</button>}
          {modo === "registro" && <Consentimiento para="empresa" />}
          {error && (<p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>)}
          {aviso && (<p role="status" className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">{aviso}</p>)}
          {reenviar && email.trim() && (<button type="button" disabled={cargando} onClick={() => void reenviarCorreo()} className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60">Reenviar el correo de confirmación</button>)}
          <button type="submit" disabled={cargando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-70">
            {cargando && <Loader2 className="size-4 animate-spin" />}
            {modo === "registro" ? "Crear cuenta" : modo === "equipo" ? "Entrar al equipo" : modo === "olvido" ? "Enviar enlace" : modo === "nueva" ? "Guardar contraseña" : "Entrar"}
          </button>
          {(modo === "olvido" || modo === "nueva") && <button type="button" onClick={() => cambiar("login")} className="w-full text-sm font-semibold text-muted-foreground hover:underline">Volver a iniciar sesión</button>}
        </form>
      </main>
      <Footer />
    </div>
  );
}
