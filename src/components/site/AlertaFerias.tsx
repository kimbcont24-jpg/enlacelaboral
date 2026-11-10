import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2, MailCheck, MapPin, Radar } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { provincias } from "@/lib/data";

const campo = "w-full min-w-0 rounded-xl border border-white/20 bg-white/95 px-3.5 py-3 text-base text-[#0a2f5c] outline-none placeholder:text-[#5b6b80] focus:border-[#ffd84d] focus:ring-2 focus:ring-[#ffd84d]/50";

/**
 * Suscripción a alertas de ferias de empleo. Cuando aparece una feria nueva
 * (las buscamos todos los días), avisamos por correo a quien se apuntó.
 */
export function AlertaFerias({ provinciaInicial = "", id = "alertas" }: { provinciaInicial?: string; id?: string }) {
  const [email, setEmail] = useState("");
  const [provincia, setProvincia] = useState(provinciaInicial);
  const [estado, setEstado] = useState<"" | "enviando" | "listo" | "error" | "limite">("");
  const [suscritos, setSuscritos] = useState<number | null>(null);

  useEffect(() => { if (provinciaInicial) setProvincia(provinciaInicial); }, [provinciaInicial]);
  useEffect(() => {
    void supabase.rpc("total_suscritos_ferias" as never).then(({ data }) => { if (typeof data === "number") setSuscritos(data); });
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    const { data, error } = await supabase.rpc("suscribir_ferias" as never, { p_email: email.trim(), p_provincia: provincia || null } as never);
    if (error) return setEstado("error");
    setEstado(data === "limite" ? "limite" : "listo");
  };

  return (
    <section id={id} aria-labelledby={`${id}-t`} className="relative mt-14 scroll-mt-24 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0a2f5c_0%,#0f4aa8_55%,#1d6ff2_100%)] p-7 text-white shadow-[0_30px_70px_-30px_rgb(10_47_92/0.7)] sm:p-10">
      {/* Radar animado */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-[22rem] opacity-60 md:-right-10">
        <span className="alf-onda" />
        <span className="alf-onda [animation-delay:1.3s]" />
        <span className="alf-onda [animation-delay:2.6s]" />
        <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd84d] shadow-[0_0_24px_6px_rgba(255,216,77,.6)]" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold ring-1 ring-white/20"><Radar className="size-4 text-[#ffd84d]" aria-hidden="true" /> Te avisamos primero</p>
          <h2 id={`${id}-t`} className="mt-4 text-balance font-display text-[1.8rem] font-extrabold leading-tight md:text-[2.2rem]">
            Suscríbete y recibe una alerta cada vez que se anuncie una feria de empleo
          </h2>
          <p className="mt-3 max-w-xl text-white/85">Todos los días buscamos ferias en el Ministerio de Trabajo, INFOTEP, universidades, empresas, LinkedIn y redes sociales. Apenas confirmamos una, te llega un correo con la fecha, el lugar y los puestos. Así llegas con tiempo y con tu CV listo.</p>
          <ul className="mt-5 grid gap-2 text-sm text-white/90 sm:grid-cols-3">
            <li className="flex items-center gap-2"><MailCheck className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Gratis, sin cuenta</li>
            <li className="flex items-center gap-2"><MapPin className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Solo de tu provincia</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Te das de baja en 1 clic</li>
          </ul>
        </div>

        {estado === "listo" ? (
          <div className="vidrio flex items-start gap-3 rounded-3xl p-6">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[#7ee2a8]" aria-hidden="true" />
            <div>
              <p className="text-lg font-extrabold">¡Listo! Ya estás en la lista.</p>
              <p className="mt-1 text-white/85">Te escribiremos cuando se anuncie una feria {provincia ? `en ${provincia}` : "en cualquier parte del país"}. Revisa también tu carpeta de spam o promociones la primera vez.</p>
              <button type="button" onClick={() => { setEstado(""); setEmail(""); }} className="mt-3 text-sm font-semibold text-[#ffd84d] underline">Apuntar otro correo o provincia</button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void enviar(e)} className="vidrio rounded-3xl p-5 sm:p-6">
            <div className="grid gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/90">Tu correo</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" autoComplete="email" className={campo} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/90">¿Dónde te queda bien ir?</span>
                <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className={campo}>
                  <option value="">Todo el país</option>
                  {provincias.slice(1).map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <button type="submit" disabled={estado === "enviando"} className="mt-1 inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#ffd84d] px-6 py-3.5 text-base font-extrabold text-[#0a2f5c] shadow-[0_12px_24px_-12px_rgba(255,216,77,.9)] transition hover:-translate-y-0.5 hover:bg-[#ffe27a] disabled:opacity-60">
                {estado === "enviando" ? <Loader2 className="size-5 animate-spin" /> : <BellRing className="alf-campana size-5" aria-hidden="true" />} Avisarme de las ferias
              </button>
            </div>
            {estado === "error" && <p className="mt-3 text-sm font-semibold text-[#ffb4b4]">No pudimos guardar tu correo. Revísalo e intenta de nuevo.</p>}
            {estado === "limite" && <p className="mt-3 text-sm font-semibold text-[#ffb4b4]">Ese correo ya tiene 5 alertas de ferias.</p>}
            <p className="mt-3 text-xs text-white/70">
              {suscritos && suscritos >= 10 ? `${suscritos.toLocaleString("es-DO")} personas ya reciben estas alertas. ` : ""}
              Usamos tu correo solo para avisarte de ferias. Puedes darte de baja desde cualquier aviso.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

/** Procesa el enlace de baja (/jornadas?baja=<token>) y muestra el resultado. */
export function BajaFerias() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = new URLSearchParams(window.location.search).get("baja");
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return;
    void supabase.rpc("baja_ferias" as never, { p_token: token } as never).then(({ data, error }) => {
      setMsg(!error && data === "ok" ? "Listo, ya no recibirás alertas de ferias en ese correo. Puedes volver a suscribirte cuando quieras." : "Ese enlace de baja ya no es válido o ya te habías dado de baja.");
    });
  }, []);
  if (!msg) return null;
  return <div role="status" className="mx-auto mt-4 max-w-6xl rounded-2xl bg-success/10 px-5 py-4 text-sm font-semibold text-foreground">{msg}</div>;
}
