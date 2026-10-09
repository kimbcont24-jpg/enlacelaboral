import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Iniciar sesión | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Auth,
});

const soloDigitos = (v: string) => v.replace(/\D/g, "");

function Auth() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modo, setModo] = useState<"registro" | "login">("login");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState("");
  const [rnc, setRnc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");

  const ir = async (uid: string) => {
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin");
    await qc.invalidateQueries({ queryKey: ["es-admin"] });
    await navigate({ to: roles && roles.length ? "/admin" : "/panel" });
  };

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { if (data.session) void ir(data.session.user.id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (modo === "registro") {
      const r = soloDigitos(rnc);
      if (r.length !== 9 && r.length !== 11) { setError("El RNC debe tener 9 dígitos (empresa) o 11 (cédula)."); return; }
    }
    setCargando(true);
    try {
      if (modo === "registro") {
        const { data, error: err } = await supabase.auth.signUp({ email, password: clave, options: { emailRedirectTo: `${window.location.origin}/panel`, data: { nombre } } });
        if (err) throw err;
        const userId = data.user?.id;
        if (data.session && userId) {
          await supabase.from("empresas").insert({ owner_id: userId, nombre: empresa, rnc: soloDigitos(rnc), contacto_nombre: nombre, contacto_email: email, verificada: false });
          await navigate({ to: "/panel" });
          return;
        }
        setError("Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: clave });
        if (err) throw err;
        await ir(data.user.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Algo salió mal";
      setError(msg.includes("Invalid login") ? "Correo o contraseña incorrectos." : msg);
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
          <h1 className="text-balance text-4xl font-extrabold tracking-tight">Acceso a Enlace RD</h1>
          <p className="mt-6 text-sm text-muted-foreground">¿Buscas empleo? No necesitas cuenta. <Link to="/vacantes" className="font-semibold text-primary">Mira las vacantes</Link>.</p>
        </div>
        <form onSubmit={enviar} className="space-y-3 self-start rounded-3xl border border-border bg-surface p-7">
          <div className="flex rounded-full border border-border p-1 text-sm font-semibold">
            {(["login", "registro"] as const).map((m) => (<button key={m} type="button" onClick={() => setModo(m)} className={modo === m ? "flex-1 rounded-full bg-primary py-2 text-primary-foreground" : "flex-1 rounded-full py-2 text-muted-foreground"}>{m === "registro" ? "Crear cuenta" : "Iniciar sesión"}</button>))}
          </div>
          {modo === "registro" && (
            <>
              <input required className={input} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nombre de la empresa" />
              <input required className={input} value={rnc} onChange={(e) => setRnc(soloDigitos(e.target.value).slice(0, 11))} placeholder="RNC o cédula" />
              <input required className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
            </>
          )}
          <input required type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" />
          <input required type="password" className={input} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Contraseña (mínimo 6)" />
          {error && (<p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>)}
          <button type="submit" disabled={cargando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-70">
            {cargando && <Loader2 className="size-4 animate-spin" />}
            {modo === "registro" ? "Crear cuenta" : "Entrar"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
