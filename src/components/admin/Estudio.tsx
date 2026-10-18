import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Loader2, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tarjeta, campo, rotulo } from "@/components/admin/comun";
import { FORMATOS, GANCHOS, crearCarrusel, crearZip, textoCanal, textoRedes, type Gancho, type Pieza } from "@/lib/piezas";
import { CANAL_WHATSAPP, useVacantes, type Vacante } from "@/lib/vacantes";

const MAX = 8;

async function copiar(t: string) {
  try { await navigator.clipboard.writeText(t); toast.success("Texto copiado."); } catch { toast.error("No pude copiar. Selecciona el texto y cópialo."); }
}

function descargar(blob: Blob, nombre: string) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}

const orden = (a: Vacante, b: Vacante) => (b.salarioMin > 0 ? 1 : 0) - (a.salarioMin > 0 ? 1 : 0) || new Date(b.creado).getTime() - new Date(a.creado).getTime();

export function Estudio() {
  const { jobs, cargando } = useVacantes();
  const [soloAutorizadas, setSoloAutorizadas] = useState(true);
  const [sel, setSel] = useState<string[]>([]);
  const [fmt, setFmt] = useState(FORMATOS[0]!.id);
  const [gancho, setGancho] = useState<Gancho>("dato");
  const [titulo, setTitulo] = useState("");
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [armando, setArmando] = useState(false);
  const previas = useRef<Pieza[]>([]);

  const lista = useMemo(() => jobs.filter((j) => !soloAutorizadas || j.redes).sort(orden), [jobs, soloAutorizadas]);
  const elegidas = useMemo(() => sel.map((id) => jobs.find((j) => j.id === id)).filter((x): x is Vacante => !!x), [sel, jobs]);
  const sinPermiso = elegidas.filter((v) => !v.redes).length;

  const poner = (ids: string[]) => setSel(ids.slice(0, MAX));
  const alternar = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= MAX ? (toast.message(`Máximo ${MAX} vacantes por carrusel.`), s) : [...s, id]));

  // dibuja las piezas cuando cambia algo (con una pequeña espera)
  useEffect(() => {
    if (!elegidas.length) { setPiezas([]); return; }
    let vivo = true;
    setArmando(true);
    const t = setTimeout(() => {
      const f = FORMATOS.find((x) => x.id === fmt)!;
      crearCarrusel(f, elegidas, titulo.trim() || undefined)
        .then((p) => {
          if (!vivo) { p.forEach((x) => URL.revokeObjectURL(x.url)); return; }
          previas.current.forEach((x) => URL.revokeObjectURL(x.url));
          previas.current = p;
          setPiezas(p);
        })
        .catch(() => toast.error("No pude crear las imágenes."))
        .finally(() => vivo && setArmando(false));
    }, 350);
    return () => { vivo = false; clearTimeout(t); };
  }, [elegidas, fmt, titulo]);

  useEffect(() => () => previas.current.forEach((x) => URL.revokeObjectURL(x.url)), []);

  const textoIG = elegidas.length ? textoRedes(elegidas, gancho) : "";
  const textoWA = elegidas.length ? textoCanal(elegidas, gancho) : "";

  const compartir = async () => {
    const archivos = piezas.map((p) => new File([p.blob], p.nombre, { type: "image/png" }));
    try {
      if (navigator.canShare?.({ files: archivos })) await navigator.share({ files: archivos, text: textoIG });
      else toast.message("Tu navegador no comparte imágenes directo. Usa «Descargar todo».");
    } catch { /* la persona cerró el menú */ }
  };
  const zip = async () => descargar(await crearZip(piezas), `enlace-laboral-carrusel-${new Date().toISOString().slice(0, 10)}.zip`);

  const masNuevas = () => poner([...lista].sort((a, b) => new Date(b.creado).getTime() - new Date(a.creado).getTime()).map((j) => j.id));
  const mejorPagadas = () => poner([...lista].filter((j) => j.salarioMin > 0).sort((a, b) => (b.salarioMax ?? b.salarioMin) - (a.salarioMax ?? a.salarioMin)).map((j) => j.id));
  const conSalario = () => poner(lista.filter((j) => j.salarioMin > 0).map((j) => j.id));

  return (
    <div className="space-y-5">
      <Tarjeta titulo="Estudio viral" ayuda="Elige vacantes reales y te armo un carrusel listo para Instagram y Facebook, con el texto y los hashtags. Solo usa datos de las vacantes; nada inventado.">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={conSalario}>Las que muestran salario</Button>
          <Button size="sm" variant="outline" onClick={mejorPagadas}>Las mejor pagadas</Button>
          <Button size="sm" variant="outline" onClick={masNuevas}>Las más nuevas</Button>
          <Button size="sm" variant="ghost" onClick={() => setSel([])} disabled={!sel.length}>Quitar todas</Button>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={soloAutorizadas} onChange={(e) => setSoloAutorizadas(e.target.checked)} /> Mostrar solo las que autorizaron compartirse en redes</label>
        <div className="mt-3 max-h-80 divide-y divide-border overflow-auto rounded-xl border border-border">
          {cargando && <p className="p-4 text-sm text-muted-foreground">Cargando vacantes…</p>}
          {!cargando && lista.length === 0 && <p className="p-4 text-sm text-muted-foreground">No hay vacantes {soloAutorizadas ? "con autorización para redes. Desmarca la casilla para ver todas, o publica con la casilla «Autoriza compartir»." : "publicadas."}</p>}
          {lista.map((j) => (
            <label key={j.id} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50">
              <input type="checkbox" className="mt-1 size-4" checked={sel.includes(j.id)} onChange={() => alternar(j.id)} />
              <span className="min-w-0 flex-1 text-sm">
                <strong className="block truncate">{j.titulo}</strong>
                <span className="text-muted-foreground">{j.empresa !== "Empresa no indicada" ? `${j.empresa} · ` : ""}{j.provincia} · </span>
                <span className={j.salarioMin > 0 ? "font-semibold text-success" : "text-muted-foreground"}>{j.salarioMin > 0 ? j.salario : "sin salario"}</span>
                {!j.redes && <span className="ml-2 rounded-full bg-[#fff8dc] px-2 py-0.5 text-xs font-semibold text-[#6b4a00]">sin permiso para redes</span>}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{sel.length} de {MAX} elegidas.</p>
        {sinPermiso > 0 && <p className="mt-2 rounded-lg border border-[#e0b100]/50 bg-[#fff8dc] px-3 py-2 text-sm font-semibold text-[#6b4a00]">{sinPermiso} de las elegidas no tienen permiso para redes. Compártelas solo si la empresa te lo confirmó.</p>}
      </Tarjeta>

      {elegidas.length > 0 && (
        <>
          <Tarjeta titulo="Ajustes">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block"><span className={rotulo}>Formato</span><select className={campo} value={fmt} onChange={(e) => setFmt(e.target.value as typeof fmt)}>{FORMATOS.map((f) => (<option key={f.id} value={f.id}>{f.nombre}</option>))}</select></label>
              <label className="block"><span className={rotulo}>Estilo del texto</span><select className={campo} value={gancho} onChange={(e) => setGancho(e.target.value as Gancho)}>{GANCHOS.map((g) => (<option key={g.id} value={g.id}>{g.nombre}</option>))}</select></label>
              <label className="block"><span className={rotulo}>Título de portada (opcional)</span><input className={campo} value={titulo} maxLength={60} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Empleos en Santiago" /></label>
            </div>
          </Tarjeta>

          <Tarjeta titulo="Imágenes" ayuda={`${piezas.length || elegidas.length + 2} imágenes: portada, una por vacante y cierre. Publícalas en ese orden.`}>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button onClick={() => void zip()} disabled={!piezas.length || armando}><Download /> Descargar todo (.zip)</Button>
              <Button variant="outline" onClick={() => void compartir()} disabled={!piezas.length || armando}><Share2 /> Compartir desde el celular</Button>
              {armando && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Armando…</span>}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {piezas.map((p) => (
                <figure key={p.url} className="w-44 shrink-0 sm:w-52">
                  <img src={p.url} alt={`Imagen ${p.nombre}`} className="w-full rounded-xl border border-border" />
                  <figcaption className="mt-1 flex items-center justify-between gap-1 text-xs text-muted-foreground"><span className="truncate">{p.nombre}</span><button type="button" className="shrink-0 font-semibold text-primary hover:underline" onClick={() => descargar(p.blob, p.nombre)}>Bajar</button></figcaption>
                </figure>
              ))}
            </div>
          </Tarjeta>

          <div className="grid gap-5 lg:grid-cols-2">
            <Tarjeta titulo="Texto para Instagram y Facebook" ayuda="Con gancho, llamado a compartir y hashtags.">
              <textarea readOnly className={`${campo} h-72 font-mono text-xs`} value={textoIG} aria-label="Texto para Instagram y Facebook" />
              <Button className="mt-3" onClick={() => void copiar(textoIG)}><Copy /> Copiar texto</Button>
            </Tarjeta>
            <Tarjeta titulo="Texto para el canal de WhatsApp" ayuda="Con el enlace de cada vacante.">
              <textarea readOnly className={`${campo} h-72 font-mono text-xs`} value={textoWA} aria-label="Texto para el canal de WhatsApp" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => void copiar(textoWA)}><Copy /> Copiar texto</Button>
                <Button variant="outline" onClick={async () => { await copiar(textoWA); window.open(CANAL_WHATSAPP, "_blank", "noopener"); }}><Sparkles /> Copiar y abrir mi canal</Button>
              </div>
            </Tarjeta>
          </div>
        </>
      )}
    </div>
  );
}
