import { useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { areas, provincias } from "@/lib/data";

const campo = "w-full min-w-0 rounded-xl border border-input bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-primary";

/** Suscripción a alertas de empleo por correo. Cada mañana llegan las vacantes nuevas que coinciden. */
export function AlertaForm({ areaInicial = "", provinciaInicial = "", compacta = false }: { areaInicial?: string; provinciaInicial?: string; compacta?: boolean }) {
  const [email, setEmail] = useState("");
  const [area, setArea] = useState(areaInicial);
  const [provincia, setProvincia] = useState(provinciaInicial);
  const [estado, setEstado] = useState<"" | "enviando" | "listo" | "error" | "limite">("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    const { data, error } = await supabase.rpc("suscribir_alerta", { p_email: email.trim(), p_area: area || null, p_provincia: provincia || null });
    if (error) return setEstado("error");
    setEstado(data === "limite" ? "limite" : "listo");
  };

  if (estado === "listo") {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-success/10 p-5 text-foreground">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
        <div>
          <p className="font-bold">¡Listo! Te avisaremos por correo.</p>
          <p className="mt-1 text-sm text-muted-foreground">Cada mañana recibirás las vacantes nuevas de {area || "todas las áreas"} en {provincia || "todo el país"}. Puedes darte de baja desde cualquier correo.</p>
          <button type="button" onClick={() => { setEstado(""); setEmail(""); }} className="mt-2 text-sm font-semibold text-primary underline">Crear otra alerta</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className={compacta ? "" : "rounded-3xl border border-border bg-surface p-6 md:p-8"}>
      {!compacta && (
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cta text-white shadow-[0_8px_16px_-8px_rgba(29,111,242,.8)]"><BellRing className="size-5" aria-hidden="true" /></span>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">Recibe empleos en tu correo</h2>
            <p className="mt-1 text-muted-foreground">Te avisamos cada mañana cuando salga una vacante para ti. Gratis y sin cuenta.</p>
          </div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <label className="block">
          <span className="sr-only">Tu correo</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu correo electrónico" autoComplete="email" className={campo} />
        </label>
        <label className="block">
          <span className="sr-only">Área</span>
          <select value={area} onChange={(e) => setArea(e.target.value)} className={campo}>
            <option value="">Todas las áreas</option>
            {areas.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Provincia</span>
          <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className={campo}>
            <option value="">Todo el país</option>
            {provincias.slice(1).map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <button type="submit" disabled={estado === "enviando"} className="btn-aplicar inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base disabled:opacity-60">
          {estado === "enviando" ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" aria-hidden="true" />} Crear alerta
        </button>
      </div>
      {estado === "error" && <p className="mt-3 text-sm font-semibold text-destructive">No pudimos guardar tu alerta. Revisa el correo e intenta de nuevo.</p>}
      {estado === "limite" && <p className="mt-3 text-sm font-semibold text-destructive">Ya tienes 5 alertas con ese correo. Da de baja alguna desde tus correos para crear otra.</p>}
    </form>
  );
}
