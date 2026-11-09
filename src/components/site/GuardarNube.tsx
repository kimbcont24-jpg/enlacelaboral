import { useState } from "react";
import { Consentimiento } from "@/components/site/Consentimiento";
import { CloudCheck, CloudUpload, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { useNube } from "@/lib/nube";

/**
 * Botón opcional para no perder el CV ni la búsqueda: correo + código, sin contraseña.
 * `compacto` para ponerlo en una franja; normal para tarjeta.
 */
export function GuardarNube({ compacto = false, className = "" }: { compacto?: boolean; className?: string }) {
  const nube = useNube();
  const [paso, setPaso] = useState<"inicio" | "correo" | "codigo">("inicio");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!nube.listo || nube.empresa) return null;

  if (nube.correo) {
    return (
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-success/25 bg-success/[0.06] px-4 py-3 text-sm ${className}`}>
        <CloudCheck className="size-5 shrink-0 text-success" />
        <p className="min-w-0 flex-1"><b>Guardado en tu cuenta</b> <span className="text-muted-foreground">({nube.correo}). Se mantiene igual en todos tus teléfonos.</span></p>
        <div className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Opciones</button>
          {menu && (
            <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface py-1 text-left shadow-xl">
              <button type="button" onClick={() => { setMenu(false); void nube.salir(); }} className="block w-full px-4 py-2.5 text-left hover:bg-secondary">Salir (lo de este teléfono se queda)</button>
              <button type="button" onClick={() => { if (confirm("¿Salir y borrar tu CV y tu búsqueda de este teléfono? En tu cuenta se quedan guardados.")) void nube.salir(true); }} className="block w-full px-4 py-2.5 text-left hover:bg-secondary">Salir y borrar de este teléfono</button>
              <button type="button" onClick={() => { if (confirm("¿Borrar la copia de tu cuenta? Lo de este teléfono se queda.")) void nube.borrar().then(() => toast.success("Borramos la copia de tu cuenta.")); }} className="block w-full px-4 py-2.5 text-left text-destructive hover:bg-destructive/5">Borrar mi copia de la cuenta</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return void toast.error("Escribe un correo válido.");
    setTrabajando(true);
    const err = await nube.enviarCodigo(correo);
    setTrabajando(false);
    if (err) return void toast.error(err);
    setPaso("codigo");
  };
  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.replace(/\D/g, "").length < 6) return void toast.error("Escribe el código que te llegó al correo.");
    setTrabajando(true);
    const err = await nube.verificar(correo, codigo);
    setTrabajando(false);
    if (err) return void toast.error(err);
    toast.success("Listo. Tu CV y tu búsqueda quedaron guardados en tu cuenta.");
    setPaso("inicio");
  };

  return (
    <div className={`rounded-2xl border border-[#1d6ff2]/25 bg-[#1d6ff2]/[0.05] ${compacto ? "px-4 py-3" : "p-5"} ${className}`}>
      {paso === "inicio" && (
        <div className="flex flex-wrap items-center gap-3">
          <CloudUpload className="size-5 shrink-0 text-[#1557c4]" />
          <p className="min-w-0 flex-1 text-sm"><b>Guarda tu CV para no perderlo.</b> <span className="text-muted-foreground">Si cambias de teléfono o se borra el navegador, lo recuperas con tu correo. Sin contraseña.</span></p>
          <button type="button" onClick={() => setPaso("correo")} className="h-10 shrink-0 rounded-xl bg-[#1d6ff2] px-4 text-sm font-bold text-white hover:bg-[#155fd4]">Guardar con mi correo</button>
        </div>
      )}
      {paso === "correo" && (
        <form onSubmit={(e) => void enviar(e)} className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[14rem] flex-1">
            <span className="sr-only">Tu correo</span>
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" autoFocus required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" autoComplete="email" className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-[15px]" />
          </label>
          <button type="submit" disabled={trabajando} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1d6ff2] px-4 text-sm font-bold text-white disabled:opacity-60">{trabajando && <Loader2 className="size-4 animate-spin" />} Enviarme el código</button>
          <button type="button" onClick={() => setPaso("inicio")} className="h-11 px-2 text-sm font-semibold text-muted-foreground">Cancelar</button>
          <p className="w-full text-xs text-muted-foreground">Solo tú ves tu CV. No lo compartimos con nadie hasta que tú apliques.</p>
          <Consentimiento para="cuenta" className="w-full" />
        </form>
      )}
      {paso === "codigo" && (
        <form onSubmit={(e) => void verificar(e)} className="space-y-2">
          <p className="text-sm"><b>Revisa tu correo</b> ({correo}). Toca el enlace que te enviamos, o escribe aquí el código si viene uno. Si no lo ves, mira en «Spam» o «Promociones».</p>
          <div className="flex flex-wrap gap-2">
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" placeholder="Código" aria-label="Código del correo" className="h-11 w-40 rounded-xl border border-border bg-surface px-3 text-center text-lg font-bold tracking-[0.3em]" />
            <button type="submit" disabled={trabajando} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1d6ff2] px-4 text-sm font-bold text-white disabled:opacity-60">{trabajando && <Loader2 className="size-4 animate-spin" />} Confirmar</button>
            <button type="button" onClick={() => setPaso("correo")} className="h-11 px-2 text-sm font-semibold text-muted-foreground">Cambiar correo</button>
          </div>
        </form>
      )}
    </div>
  );
}
