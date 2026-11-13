import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Loader2, MessageSquareQuote, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";

import { Calificaciones } from "@/components/empresa/Calificaciones";
import { Estrellas } from "@/components/empresa/Estrellas";
import { Titulo } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import { TIPOS, cargarOpiniones, mesAno, type Opinion } from "@/lib/opiniones";

/** Panel de empresa: lo que opinan de ella y responder en público (solo empresas verificadas). */
export function OpinionesEmpresa() {
  const { data: slug, isLoading } = useQuery({
    queryKey: ["mi-empresa-slug"],
    queryFn: async () => {
      const { data } = await supabase.rpc("mi_empresa_slug" as never);
      return (data as string | null) ?? null;
    },
  });
  const { data: datos } = useQuery({ queryKey: ["opiniones", slug], enabled: !!slug, queryFn: () => cargarOpiniones(slug!) });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!slug) return (
    <div>
      <Titulo titulo="Opiniones de tu empresa" sub="Lo que dicen quienes aplicaron o trabajaron con ustedes." />
      <p className="flex gap-3 rounded-2xl border border-border bg-surface p-5 text-sm"><ShieldCheck className="size-5 shrink-0 text-[#1557c4]" /> Cuando verifiquemos tu empresa (RNC y contacto real), aquí verás las opiniones publicadas y podrás responderlas en público. Escríbenos desde «Mi empresa» si aún no estás verificada.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Titulo titulo="Opiniones de tu empresa" sub="Responder con respeto y rapidez mejora tu imagen ante los candidatos.">
        <a href={`/empresa/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1557c4] hover:underline">Ver mi perfil público <ExternalLink className="size-3.5" /></a>
      </Titulo>
      {datos && datos.opiniones.length === 0 && (
        <p className="flex gap-3 rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground"><Star className="size-5 shrink-0 text-[#f5a700]" /> Todavía no hay opiniones publicadas. Cuando alguien opine y lo aprobemos, aparecerá aquí para que puedas responder.</p>
      )}
      <ul className="space-y-4">
        {(datos?.opiniones ?? []).map((o) => <Responder key={o.id} o={o} slug={slug} />)}
      </ul>
      {datos && datos.opiniones.length > 0 && (
        <div className="rounded-3xl border border-border bg-surface p-6"><Calificaciones datos={datos} nombre="tu empresa" onOpinar={() => toast("Las empresas no pueden calificarse a sí mismas.")} /></div>
      )}
    </div>
  );
}

function Responder({ o, slug }: { o: Opinion; slug: string }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState(o.respuesta ?? "");
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    const { error } = await supabase.rpc("responder_opinion" as never, { p_id: o.id, p_texto: texto } as never);
    setGuardando(false);
    if (error) { toast.error("No se pudo guardar la respuesta."); return; }
    toast.success(texto.trim() ? "Respuesta publicada" : "Respuesta quitada");
    setAbierto(false);
    void qc.invalidateQueries({ queryKey: ["opiniones", slug] });
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Estrellas valor={o.estrellas} />
        <span className="text-xs font-bold text-muted-foreground">{TIPOS[o.tipo].corto} · {mesAno(o.fecha)}</span>
      </div>
      {o.titulo && <p className="mt-2 font-bold">{o.titulo}</p>}
      {o.positivo && <p className="mt-1 text-sm"><b className="text-[#0f7a43]">Lo bueno:</b> {o.positivo}</p>}
      {o.mejorar && <p className="mt-1 text-sm"><b className="text-[#b45309]">Por mejorar:</b> {o.mejorar}</p>}
      {o.respuesta && !abierto && (
        <div className="mt-3 rounded-xl bg-secondary p-3 text-sm"><p className="flex items-center gap-1.5 font-bold"><MessageSquareQuote className="size-4 text-[#1557c4]" /> Tu respuesta</p><p className="mt-1">{o.respuesta}</p></div>
      )}
      {abierto ? (
        <div className="mt-3">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={600} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[#1d6ff2]" placeholder="Agradece, explica qué están mejorando y evita discutir. Se publica con el nombre de tu empresa." />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => void guardar()} disabled={guardando} className="btn-aplicar h-9 rounded-full px-4 text-sm disabled:opacity-60">{guardando ? "Guardando…" : "Publicar respuesta"}</button>
            <button type="button" onClick={() => setAbierto(false)} className="h-9 rounded-full px-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAbierto(true)} className="mt-3 text-sm font-bold text-[#1557c4] hover:underline">{o.respuesta ? "Editar respuesta" : "Responder en público"}</button>
      )}
    </li>
  );
}
