import { useEffect, useState } from "react";
import { Clock, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { ElegirEstrellas } from "@/components/empresa/Estrellas";
import { useNube } from "@/lib/nube";
import { CATEGORIAS, TIPOS, enviarOpinion, useMisOpiniones, useRefrescarOpiniones, type NuevaOpinion, type TipoOpinion } from "@/lib/opiniones";

const vacia = (tipo: TipoOpinion): NuevaOpinion => ({ tipo, estrellas: 0, categorias: {}, recomienda: null, titulo: "", positivo: "", mejorar: "", puesto: "", relacion: null });

/** Ventana para calificar una empresa. Pide la cuenta (correo con código) y respeta quién puede opinar de qué. */
export function Opinar({ slug, nombre, tipoInicial, onCerrar }: { slug: string; nombre: string; tipoInicial: TipoOpinion; onCerrar: () => void }) {
  const nube = useNube();
  const { data: mis, isLoading, refetch } = useMisOpiniones(slug);
  const refrescar = useRefrescarOpiniones();
  const [o, setO] = useState<NuevaOpinion>(vacia(tipoInicial));
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  // Al iniciar sesión, vuelve a mirar si puede opinar del proceso (sus aplicaciones suben a la cuenta en segundos).
  useEffect(() => {
    if (!nube.correo) return;
    void refetch();
    const t = setTimeout(() => void refetch(), 3000);
    return () => clearTimeout(t);
  }, [nube.correo, refetch]);

  const mia = mis?.mias?.find((m) => m.tipo === o.tipo);
  useEffect(() => {
    if (!mia) return;
    setO((x) => (x.estrellas ? x : { tipo: mia.tipo, estrellas: mia.estrellas, categorias: mia.categorias ?? {}, recomienda: mia.recomienda, titulo: mia.titulo ?? "", positivo: mia.positivo ?? "", mejorar: mia.mejorar ?? "", puesto: mia.puesto ?? "", relacion: mia.relacion }));
  }, [mia]);

  const bloqueadoProceso = o.tipo === "proceso" && mis?.sesion && !mis.puede_proceso;
  const faltaTexto = !o.positivo.trim() && !o.mejorar.trim();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!o.estrellas) { toast.error("Elige de 1 a 5 estrellas."); return; }
    if (faltaTexto) { toast.error("Cuéntanos al menos algo bueno o algo por mejorar."); return; }
    setEnviando(true);
    const err = await enviarOpinion(slug, o);
    setEnviando(false);
    if (err) { toast.error(err); return; }
    refrescar(slug);
    setListo(true);
  }

  const campo = "mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none focus:border-[#1d6ff2] focus:ring-2 focus:ring-[#1d6ff2]/20";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-[#07213f]/60 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Calificar ${nombre}`} onClick={onCerrar}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#1557c4]">Calificar empresa</p>
            <h2 className="text-xl font-extrabold leading-tight">{nombre}</h2>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full hover:bg-secondary"><X className="size-5" /></button>
        </div>

        {listo ? (
          <div className="py-8 text-center">
            <ShieldCheck className="mx-auto size-12 text-[#0f7a43]" />
            <h3 className="mt-3 text-xl font-extrabold">¡Gracias por tu opinión!</h3>
            <p className="mt-2 text-muted-foreground">La revisamos antes de publicarla (normalmente en uno o dos días). No mostramos tu nombre ni tu correo.</p>
            <button type="button" onClick={onCerrar} className="btn-aplicar mt-6 h-11 rounded-full px-6">Listo</button>
          </div>
        ) : !nube.listo || isLoading ? (
          <div className="grid place-items-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : nube.empresa ? (
          <p className="mt-6 rounded-2xl bg-secondary p-4 text-sm">Las cuentas de empresa no pueden calificar empresas. Si quieres responder opiniones sobre tu empresa, hazlo desde tu panel.</p>
        ) : !nube.correo || !mis?.sesion ? (
          <div className="mt-5 space-y-4">
            <p className="flex gap-2 rounded-2xl bg-[#1d6ff2]/[0.07] p-4 text-sm"><Lock className="mt-0.5 size-4 shrink-0 text-[#1557c4]" /> Para que las opiniones sean reales, confirma tu correo con un código. No publicamos tu nombre ni tu correo.</p>
            <EntrarConCodigo />
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-2">
              {(["trabajo", "proceso"] as TipoOpinion[]).map((t) => (
                <button key={t} type="button" onClick={() => setO(vacia(t))} aria-pressed={o.tipo === t}
                  className={`rounded-2xl border-2 p-3 text-left transition-colors ${o.tipo === t ? "border-[#1d6ff2] bg-[#1d6ff2]/[0.06]" : "border-border hover:border-[#1d6ff2]/40"}`}>
                  <span className="block font-extrabold">{TIPOS[t].titulo}</span>
                  <span className="text-xs text-muted-foreground">{t === "trabajo" ? "Trabajas o trabajaste ahí" : "Aplicaste por Enlace"}</span>
                </button>
              ))}
            </div>

            {mia && (
              <p className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-sm"><Clock className="size-4 shrink-0" />
                {mia.estado === "pendiente" ? "Ya enviaste esta opinión y está en revisión. Si la cambias, se revisa otra vez." : mia.estado === "publicada" ? "Tu opinión está publicada. Si la cambias, se revisa otra vez." : `Tu opinión no se publicó${mia.motivo ? `: ${mia.motivo}` : ""}. Puedes corregirla.`}
              </p>
            )}

            {bloqueadoProceso ? (
              <p className="rounded-2xl bg-[#c27803]/[0.08] p-4 text-sm leading-relaxed">Para opinar del <b>proceso de selección</b> tienes que haber aplicado a una vacante de {nombre} desde Enlace (con el botón «Aplicar»), con tu cuenta abierta. Así sabemos que la opinión es real. Si trabajas o trabajaste ahí, elige <b>Trabajar aquí</b>.</p>
            ) : (
              <>
                <div>
                  <p className="text-sm font-bold">{TIPOS[o.tipo].pregunta}</p>
                  <div className="mt-2"><ElegirEstrellas valor={o.estrellas} onChange={(n) => setO({ ...o, estrellas: n })} etiqueta="Calificación general" /></div>
                </div>

                <div>
                  <p className="text-sm font-bold">Califica cada punto <span className="font-normal text-muted-foreground">(opcional)</span></p>
                  <ul className="mt-2 space-y-2.5">
                    {CATEGORIAS[o.tipo].map((c) => (
                      <li key={c.k} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-2">
                        <span className="min-w-0"><span className="block text-sm font-semibold">{c.t}</span><span className="block text-xs text-muted-foreground">{c.ayuda}</span></span>
                        <ElegirEstrellas valor={o.categorias[c.k] ?? 0} onChange={(n) => setO({ ...o, categorias: { ...o.categorias, [c.k]: n } })} size={22} etiqueta={c.t} />
                      </li>
                    ))}
                  </ul>
                </div>

                {o.tipo === "trabajo" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-bold">Tu puesto <span className="font-normal text-muted-foreground">(opcional)</span><input value={o.puesto} onChange={(e) => setO({ ...o, puesto: e.target.value })} maxLength={80} className={campo} placeholder="Ej.: Cajera" /></label>
                    <div className="text-sm font-bold">¿Todavía trabajas ahí?
                      <div className="mt-1 flex gap-2">
                        {(["actual", "anterior"] as const).map((r) => <button key={r} type="button" onClick={() => setO({ ...o, relacion: r })} aria-pressed={o.relacion === r} className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${o.relacion === r ? "border-[#1d6ff2] bg-[#1d6ff2]/[0.07] text-[#1557c4]" : "border-border"}`}>{r === "actual" ? "Sí" : "Ya no"}</button>)}
                      </div>
                    </div>
                  </div>
                )}

                <label className="block text-sm font-bold">Un título corto <span className="font-normal text-muted-foreground">(opcional)</span><input value={o.titulo} onChange={(e) => setO({ ...o, titulo: e.target.value })} maxLength={90} className={campo} placeholder={o.tipo === "proceso" ? "Ej.: Me respondieron rápido" : "Ej.: Buen ambiente, pagan a tiempo"} /></label>
                <label className="block text-sm font-bold">Lo bueno<textarea value={o.positivo} onChange={(e) => setO({ ...o, positivo: e.target.value })} maxLength={600} rows={3} className={campo} placeholder="¿Qué te gustó?" /></label>
                <label className="block text-sm font-bold">Lo que pueden mejorar<textarea value={o.mejorar} onChange={(e) => setO({ ...o, mejorar: e.target.value })} maxLength={600} rows={3} className={campo} placeholder="Con respeto: ¿qué cambiarías?" /></label>

                <div>
                  <p className="text-sm font-bold">{TIPOS[o.tipo].recomienda}</p>
                  <div className="mt-1 flex gap-2">
                    {[true, false].map((v) => <button key={String(v)} type="button" onClick={() => setO({ ...o, recomienda: v })} aria-pressed={o.recomienda === v} className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${o.recomienda === v ? "border-[#1d6ff2] bg-[#1d6ff2]/[0.07] text-[#1557c4]" : "border-border"}`}>{v ? "Sí" : "No"}</button>)}
                  </div>
                </div>

                <p className="rounded-xl bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">No escribas nombres de personas, teléfonos ni datos privados. Las opiniones con insultos, acusaciones sin base o datos personales no se publican. Tu nombre y tu correo nunca se muestran.</p>

                <button type="submit" disabled={enviando} className="btn-aplicar inline-flex h-12 w-full items-center justify-center gap-2 rounded-full disabled:opacity-60">
                  {enviando ? <><Loader2 className="size-5 animate-spin" /> Enviando…</> : mia ? "Actualizar mi opinión" : "Enviar mi opinión"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

/** Entrar con el correo y un código de 6 dígitos (la misma cuenta de «Mi búsqueda»). */
function EntrarConCodigo() {
  const nube = useNube();
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const campo = "h-12 w-full rounded-xl border border-border bg-background px-3.5 text-[16px] outline-none focus:border-[#1d6ff2] focus:ring-2 focus:ring-[#1d6ff2]/20";

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setTrabajando(true);
    const err = await nube.enviarCodigo(correo);
    setTrabajando(false);
    if (err) { toast.error(err); return; }
    setPaso("codigo");
  }
  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setTrabajando(true);
    const err = await nube.verificar(correo, codigo);
    setTrabajando(false);
    if (err) toast.error(err);
  }

  return paso === "correo" ? (
    <form onSubmit={pedir} className="space-y-3">
      <label className="block text-sm font-bold">Tu correo<input required type="email" inputMode="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={`mt-1 ${campo}`} placeholder="tucorreo@ejemplo.com" /></label>
      <button type="submit" disabled={trabajando} className="btn-aplicar inline-flex h-12 w-full items-center justify-center gap-2 rounded-full disabled:opacity-60">{trabajando ? <Loader2 className="size-5 animate-spin" /> : null} Enviarme el código</button>
      <p className="text-xs text-muted-foreground">Es la misma cuenta de «Mi búsqueda». Si aplicaste desde Enlace con ella, también podrás opinar del proceso de selección.</p>
    </form>
  ) : (
    <form onSubmit={confirmar} className="space-y-3">
      <p className="text-sm">Te enviamos un código a <b>{correo}</b>. Escríbelo aquí (o toca el enlace del correo).</p>
      <input required inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value)} className={`${campo} text-center text-xl font-bold tracking-[0.4em]`} placeholder="000000" maxLength={8} />
      <button type="submit" disabled={trabajando} className="btn-aplicar inline-flex h-12 w-full items-center justify-center gap-2 rounded-full disabled:opacity-60">{trabajando ? <Loader2 className="size-5 animate-spin" /> : null} Confirmar</button>
      <button type="button" onClick={() => setPaso("correo")} className="w-full text-sm font-semibold text-muted-foreground">Cambiar el correo</button>
    </form>
  );
}
