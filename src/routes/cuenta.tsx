import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Mail, MailCheck } from "lucide-react";

import { AccesoEscena } from "@/components/site/AccesoEscena";
import { Consentimiento } from "@/components/site/Consentimiento";
import { correoTraeCodigo, useNube } from "@/lib/nube";

export const Route = createFileRoute("/cuenta")({
  head: () => ({ meta: [{ title: "Crea tu cuenta gratis | Enlace Laboral" }, { name: "description", content: "Guarda tu CV, recibe vacantes que encajan contigo y deja que las empresas te encuentren. Sin contraseña." }] }),
  component: Cuenta,
});

/** Cuenta de candidato: solo correo y código (sin contraseña). Al entrar va a «Vacantes para ti en 3 toques». */
function Cuenta() {
  const navigate = useNavigate();
  const nube = useNube();
  const [paso, setPaso] = useState<"correo" | "codigo" | "listo">("correo");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [espera, setEspera] = useState(0);
  const [conCodigo, setConCodigo] = useState(false);
  const codigoRef = useRef<HTMLInputElement>(null);
  const intento = useRef(false);
  const destino = "/guardadas?ver=parati";

  // Si ya tiene sesión: candidato a su búsqueda, empresa a su panel.
  useEffect(() => {
    if (!nube.listo || paso === "listo") return;
    if (nube.empresa) void navigate({ to: "/panel" });
    else if (nube.correo) void navigate({ to: "/guardadas", search: { ver: "parati" } });
  }, [nube.listo, nube.empresa, nube.correo, navigate, paso]);

  useEffect(() => { if (espera <= 0) return; const t = setTimeout(() => setEspera((x) => x - 1), 1000); return () => clearTimeout(t); }, [espera]);

  const pedir = async (e?: React.FormEvent) => {
    e?.preventDefault(); setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) { setError("Escribe un correo válido, por ejemplo maria@gmail.com"); return; }
    setCargando(true);
    const err = await nube.enviarCodigo(correo, destino);
    setCargando(false);
    if (err) { setError(err); return; }
    setConCodigo(correoTraeCodigo()); setPaso("codigo"); setEspera(45); intento.current = false; setCodigo("");
    setTimeout(() => codigoRef.current?.focus(), 350);
  };

  const confirmar = async (valor = codigo) => {
    const t = valor.replace(/\D/g, "");
    if (t.length < 6) return;
    setCargando(true); setError(null);
    const err = await nube.verificar(correo, t);
    setCargando(false);
    if (err) { setError(`${err} Si tu código tiene 8 números, escríbelo completo y toca Entrar.`); codigoRef.current?.focus(); return; }
    setPaso("listo");
    setTimeout(() => void navigate({ to: "/guardadas", search: { ver: "parati" } }), 1600);
  };

  const digitos = codigo.replace(/\D/g, "");
  const largo = Math.max(6, digitos.length);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="order-2 lg:order-1 lg:sticky lg:top-0 lg:h-screen"><AccesoEscena para="candidato" /></div>

      <main className="order-1 flex flex-col px-5 py-6 sm:px-10 lg:order-2 lg:min-h-screen lg:px-16">
        <div className="flex items-center justify-between text-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground lg:invisible"><ArrowLeft className="size-4" /> Inicio</Link>
          <span className="text-muted-foreground">¿Eres empresa? <Link to="/auth" search={{ modo: "registro" }} className="font-bold text-primary hover:underline">Entra aquí</Link></span>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-6 lg:py-10">
          {paso === "correo" && (
            <form key="correo" onSubmit={(e) => void pedir(e)} noValidate className="fx-paso space-y-5">
              <div>
                <h2 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight">Crea tu cuenta en 20 segundos</h2>
                <p className="mt-2 text-muted-foreground">Solo tu correo. Te enviamos un código para entrar: sin contraseñas que recordar. Si ya tienes cuenta, es igual.</p>
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input type="email" autoFocus required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" autoComplete="email" aria-label="Tu correo" className="h-16 w-full rounded-2xl border-[1.5px] border-border bg-background pl-12 pr-4 text-lg outline-none transition focus:border-[#1d6ff2] focus:shadow-[0_0_0_4px_rgb(29_111_242/0.14)]" />
              </div>
              <Consentimiento para="cuenta" />
              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={cargando} className="fx-btn flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1d6ff2] to-[#1557c4] text-[1.05rem] font-bold text-white disabled:opacity-70">{cargando ? <Loader2 className="size-5 animate-spin" /> : null} Enviarme el código <ArrowRight className="size-5" /></button>
              <ul className="grid gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
                {["Tu CV guardado en todos tus teléfonos", "Vacantes que encajan contigo, marcadas con ✦", "Las empresas te invitan; tú decides si aplicas"].map((t) => <li key={t} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-[#0f7a43]/12 text-[#0f7a43]"><Check className="size-3.5" /></span>{t}</li>)}
              </ul>
              <p className="text-xs text-muted-foreground">¿Prefieres no crear cuenta? <Link to="/vacantes" className="font-semibold text-primary hover:underline">Aplica sin registrarte</Link>.</p>
            </form>
          )}

          {paso === "codigo" && (
            <div key="codigo" className="fx-paso flex flex-col gap-5">
              <span className="fx-sobre grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#1d6ff2] to-[#0a2f5c] text-white shadow-[0_20px_40px_-16px_rgb(29_111_242/0.7)]"><MailCheck className="size-8" /></span>
              <div>
                <h2 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight">Revisa tu correo</h2>
                <p className="mt-2 text-muted-foreground">Enviamos un correo de <b className="text-foreground">Enlace Laboral RD</b> a <b className="text-foreground">{correo.trim()}</b>. {conCodigo ? "Escribe aquí el código de 6 números que trae, o toca el botón del correo." : "Ábrelo y toca el botón para entrar: llegarás directo a tus vacantes."}</p>
              </div>
              <div className={`grid gap-2.5 sm:grid-cols-2 ${conCodigo ? "order-last" : ""}`}>
                <a href="https://mail.google.com/mail/u/0/#search/enlace" target="_blank" rel="noopener" className="fx-btn flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#1d6ff2] to-[#1557c4] font-bold text-white">Abrir Gmail</a>
                <a href="https://outlook.live.com/mail/0/" target="_blank" rel="noopener" className="fx-btn flex h-14 items-center justify-center rounded-2xl border border-border bg-surface font-bold">Abrir Outlook</a>
              </div>
              <div>
                {!conCodigo && <p className="text-sm font-semibold text-muted-foreground">¿Tu correo trae un código de números? Escríbelo aquí:</p>}
              </div>
              {/* Un solo campo (pegar funciona) que se ve como casillas */}
              <label className="relative block cursor-text" onClick={() => codigoRef.current?.focus()}>
                <span className="sr-only">Código del correo (si viene)</span>
                <input ref={codigoRef} value={digitos} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 8); setCodigo(v); setError(null); if (v.length === 6 && !intento.current) { intento.current = true; void confirmar(v); } }} inputMode="numeric" autoComplete="one-time-code" maxLength={8} className="absolute inset-0 opacity-0" />
                <span className="flex justify-between gap-2" aria-hidden="true">
                  {Array.from({ length: largo }, (_, k) => (
                    <span key={k} className={`grid ${conCodigo ? "h-16 rounded-2xl text-2xl" : "h-12 rounded-xl text-xl"} flex-1 place-items-center border-[1.5px] font-display font-extrabold transition-all ${digitos[k] ? "border-[#1d6ff2] bg-[#1d6ff2]/[0.06] scale-100" : k === digitos.length ? "border-[#1d6ff2] shadow-[0_0_0_4px_rgb(29_111_242/0.14)]" : "border-border"}`}>{digitos[k] ?? ""}</span>
                  ))}
                </span>
              </label>
              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
              {digitos.length >= 6 && <button type="button" disabled={cargando} onClick={() => void confirmar()} className="fx-btn flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#1d6ff2] font-bold text-[#1557c4] disabled:opacity-50">{cargando ? <Loader2 className="size-5 animate-spin" /> : null} Entrar con el código</button>}
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button type="button" onClick={() => { setPaso("correo"); setCodigo(""); setError(null); }} className="font-semibold text-muted-foreground hover:text-foreground">Cambiar correo</button>
                <button type="button" disabled={espera > 0 || cargando} onClick={() => void pedir()} className="font-bold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline">{espera > 0 ? `Reenviar en ${espera} s` : "Reenviar el correo"}</button>
              </div>
              <p className="text-xs text-muted-foreground">¿No llega? Mira en «Spam» o «Promociones». Puedes dejar esta página abierta mientras lo buscas.</p>
            </div>
          )}

          {paso === "listo" && (
            <div key="listo" className="fx-paso text-center">
              <span className="fx-sobre mx-auto grid size-24 place-items-center rounded-full bg-[#0f7a43] text-white shadow-[0_24px_50px_-18px_rgb(15_122_67/0.7)]"><svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path className="fx-check" d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
              <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight">¡Ya eres parte de Enlace!</h2>
              <p className="mt-2 text-muted-foreground">Tu cuenta está lista. Ahora dinos qué buscas y te mostramos tus vacantes…</p>
              <Loader2 className="mx-auto mt-5 size-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
