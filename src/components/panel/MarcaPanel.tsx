import { useMemo, useRef, useState } from "react";
import { Award, Camera, Check, CheckCircle2, Circle, Copy, Download, Eye, ImagePlus, Loader2, Plus, Sparkles, Trash2, Trophy, Users, X } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { campoPanel } from "@/components/panel/comun";
import { descargarInsignia, htmlSello, SelloEmpresa } from "@/components/empresa/Sello";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { supabase } from "@/integrations/supabase/client";
import { esClara } from "@/lib/claridad";
import { slug as slugDe } from "@/lib/empleos";
import { BENEFICIOS_SUGERIDOS, faltaParaSello, marcaDe, pasosPerfil, porcentajePerfil, puntajeClaridad, rankingEmpresas, selloDe, useAudiencia, type Marca } from "@/lib/motivar-empresas";
import { SITIO, useVacantes } from "@/lib/vacantes";

/** Achica la foto en el navegador (máx. 1600 px, JPG) para que suba rápido con datos del celular. */
async function achicar(file: File, max = 1600): Promise<Blob> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return await new Promise<Blob>((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("foto"))), "image/jpeg", 0.85));
}

/**
 * Marca empleadora: lo que la empresa cuenta de sí misma, con un medidor de perfil completo,
 * lo que ya le dio Enlace (seguidores, vistas) y su sello «Empresa que publica claro».
 */
export function MarcaPanel() {
  const p = usePanel();
  const e = p.empresa;
  const [m, setM] = useState<Marca>(() => marcaDe(e.marca));
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState<"logo" | "foto" | null>(null);
  const [nuevoBen, setNuevoBen] = useState("");
  const [nuevoVal, setNuevoVal] = useState("");
  const inputLogo = useRef<HTMLInputElement>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const cambiado = JSON.stringify(m) !== JSON.stringify(marcaDe(e.marca));

  const slug = e.perfil_slug ?? slugDe(e.nombre);
  const { data: aud } = useAudiencia(slug);
  const { jobs } = useVacantes();
  const publicas = useMemo(() => jobs.filter((j) => j.empresa !== "Empresa no indicada" && slugDe(j.empresa) === slug), [jobs, slug]);
  const puntaje = puntajeClaridad(publicas);
  const sello = publicas.length ? selloDe(puntaje, publicas.length) : null;
  const falta = faltaParaSello(puntaje, publicas.length);
  const ranking = useMemo(() => rankingEmpresas(jobs).filter((f) => f.sello), [jobs]);
  const puesto = ranking.findIndex((f) => f.slug === slug) + 1;
  const claras = p.vacantes.filter((v) => esClara(v)).length;

  const pasos = pasosPerfil(e, m, claras);
  const pct = porcentajePerfil(pasos);
  const urlPerfil = `${SITIO}/empresa/${e.perfil_slug ?? e.id}`;

  const subir = async (file: File, tipo: "logo" | "foto") => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return void toast.error("Sube una foto JPG, PNG o WEBP.");
    if (tipo === "foto" && (m.fotos?.length ?? 0) >= 6) return void toast.error("Máximo 6 fotos. Quita una para subir otra.");
    setSubiendo(tipo);
    try {
      const blob = tipo === "logo" && file.type === "image/png" ? file : await achicar(file, tipo === "logo" ? 600 : 1600);
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const ruta = `${e.id}/${tipo}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("empresas").upload(ruta, blob, { contentType: blob.type, cacheControl: "31536000" });
      if (error) throw error;
      const url = supabase.storage.from("empresas").getPublicUrl(ruta).data.publicUrl;
      setM((x) => (tipo === "logo" ? { ...x, logo: url } : { ...x, fotos: [...(x.fotos ?? []), url] }));
      toast.success(tipo === "logo" ? "Logo listo. Toca «Guardar» para publicarlo." : "Foto lista. Toca «Guardar» para publicarla.");
    } catch {
      toast.error("No se pudo subir la foto. Prueba con otra o revisa tu internet.");
    } finally { setSubiendo(null); }
  };

  const guardar = async () => {
    setGuardando(true);
    const limpia = marcaDe(m);
    const { error } = await supabase.from("empresas").update({ marca: limpia } as never).eq("id", e.id);
    setGuardando(false);
    if (error) return void toast.error("No se pudo guardar.");
    p.setEmpresa({ ...e, marca: limpia });
    setM(limpia);
    toast.success("Tu página de empresa ya muestra los cambios.");
  };

  const alternarBen = (b: string) => setM((x) => {
    const bs = x.beneficios ?? [];
    return { ...x, beneficios: bs.includes(b) ? bs.filter((y) => y !== b) : bs.length >= 12 ? bs : [...bs, b] };
  });
  const copiar = async (t: string, que: string) => { try { await navigator.clipboard.writeText(t); toast.success(`${que} copiado.`); } catch { toast.error("No se pudo copiar."); } };

  return (
    <section className="mt-6 space-y-6" aria-labelledby="marca-t">
      {/* Lo que ya tienes en Enlace */}
      <div className="grid gap-4 md:grid-cols-3">
        <Cifra I={Users} n={aud?.seguidores ?? 0} t={(aud?.seguidores ?? 0) === 1 ? "persona sigue a tu empresa" : "personas siguen a tu empresa"} d={(aud?.seguidores ?? 0) > 0 ? "Esperan tu próxima vacante: se les marca como nueva." : "Cuando alguien te siga, lo verás aquí."} />
        <Cifra I={Eye} n={aud?.vistas ?? 0} t="vistas de tus vacantes en 30 días" d="Incluye las vacantes tuyas que Enlace reunió de otras fuentes." />
        <div className="rounded-2xl border border-border bg-surface p-5">
          {sello ? <SelloEmpresa s={sello} tam="grande" /> : <p className="flex items-center gap-2 font-extrabold"><Award className="size-5 text-muted-foreground" /> Sin sello todavía</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            {publicas.length ? <>Claridad de tus vacantes: <b className="text-foreground">{puntaje}/100</b>{puesto > 0 ? <> · puesto <b className="text-foreground">#{puesto}</b> de {ranking.length}</> : null}. </> : "Publica una vacante para empezar a medir. "}
            {falta && (falta.puntaje > 0 ? `Te faltan ${falta.puntaje} puntos para el sello ${falta.t}.` : `Te falta${falta.vacantes === 1 ? "" : "n"} ${falta.vacantes} vacante${falta.vacantes === 1 ? "" : "s"} para el sello ${falta.t}.`)}
          </p>
          {!sello && <p className="mt-1 text-xs text-muted-foreground">Lo que más suma: publicar el sueldo (un rango también cuenta).</p>}
        </div>
      </div>

      {sello && (
        <div className="rounded-2xl border border-[#e0a200]/40 bg-gradient-to-br from-[#fff8e6] to-white p-5">
          <p className="flex items-center gap-2 font-extrabold"><Trophy className="size-5 text-[#e0a200]" /> Presume tu sello {sello.t}</p>
          <p className="mt-1 text-sm text-muted-foreground">Las personas confían más en empresas que publican claro. Ponlo donde te vean los candidatos.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void descargarInsignia(sello, e.nombre, puntaje)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0a2f5c] px-4 text-sm font-bold text-white"><Download className="size-4" /> Insignia para redes (PNG)</button>
            <button type="button" onClick={() => void copiar(htmlSello(sello, urlPerfil), "Sello para tu firma")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold"><Copy className="size-4" /> Para la firma del correo o tu web</button>
            <a href="/empresas-claras" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold">Ver el ranking</a>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div>
            <h2 id="marca-t" className="font-display text-xl font-bold">Tu marca empleadora</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sale en tu página de empresa, en la sección «Por qué trabajar aquí». Cuenta lo que una persona quiere saber antes de aplicar.</p>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4">
            {m.logo ? <img src={m.logo} alt="Tu logo" className="size-20 rounded-2xl border border-border bg-white object-contain p-1" /> : <EmpresaAvatar nombre={e.nombre} className="size-20 text-3xl" />}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => inputLogo.current?.click()} disabled={subiendo === "logo"} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold hover:bg-secondary">{subiendo === "logo" ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} {m.logo ? "Cambiar logo" : "Subir logo"}</button>
              {m.logo && <button type="button" onClick={() => setM((x) => ({ ...x, logo: undefined }))} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"><Trash2 className="size-4" /> Quitar</button>}
              <input ref={inputLogo} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(x) => { const f = x.target.files?.[0]; x.target.value = ""; if (f) void subir(f, "logo"); }} />
            </div>
          </div>

          {/* Fotos */}
          <div>
            <p className="text-sm font-bold">Fotos del equipo o del lugar <span className="font-normal text-muted-foreground">(hasta 6)</span></p>
            <p className="text-xs text-muted-foreground">Fotos reales, con permiso de quienes salen. Nada de fotos de internet.</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(m.fotos ?? []).map((f) => (
                <div key={f} className="group relative overflow-hidden rounded-xl bg-muted">
                  <img src={f} alt="" className="aspect-square size-full object-cover" />
                  <button type="button" onClick={() => setM((x) => ({ ...x, fotos: (x.fotos ?? []).filter((y) => y !== f) }))} aria-label="Quitar foto" className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white"><X className="size-4" /></button>
                </div>
              ))}
              {(m.fotos?.length ?? 0) < 6 && (
                <button type="button" onClick={() => inputFoto.current?.click()} disabled={subiendo === "foto"} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground hover:border-[#1d6ff2] hover:text-[#1557c4]">
                  <span className="flex flex-col items-center gap-1">{subiendo === "foto" ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />} Agregar</span>
                </button>
              )}
              <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(x) => { const f = x.target.files?.[0]; x.target.value = ""; if (f) void subir(f, "foto"); }} />
            </div>
          </div>

          {/* Beneficios */}
          <div>
            <p className="text-sm font-bold">Beneficios además de los de ley <span className="font-normal text-muted-foreground">(toca los que tienes)</span></p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[...new Set([...BENEFICIOS_SUGERIDOS, ...(m.beneficios ?? [])])].map((b) => {
                const on = (m.beneficios ?? []).includes(b);
                return <button key={b} type="button" onClick={() => alternarBen(b)} aria-pressed={on} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${on ? "bg-[#0f7a43] text-white" : "border border-border hover:border-[#0f7a43]"}`}>{on && <Check className="size-3.5" />}{b}</button>;
              })}
            </div>
            <form onSubmit={(x) => { x.preventDefault(); const t = nuevoBen.trim(); if (t.length >= 3) { alternarBen(t.slice(0, 60)); setNuevoBen(""); } }} className="mt-2 flex gap-2">
              <input value={nuevoBen} onChange={(x) => setNuevoBen(x.target.value)} maxLength={60} placeholder="Otro beneficio" className={`${campoPanel} h-10`} />
              <button type="submit" className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-[#0a2f5c] px-3 text-sm font-bold text-white"><Plus className="size-4" /> Agregar</button>
            </form>
          </div>

          {/* Valores */}
          <div>
            <p className="text-sm font-bold">Tus valores en una o dos palabras <span className="font-normal text-muted-foreground">(hasta 5)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(m.valores ?? []).map((v) => <span key={v} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm font-bold">{v}<button type="button" onClick={() => setM((x) => ({ ...x, valores: (x.valores ?? []).filter((y) => y !== v) }))} aria-label={`Quitar ${v}`}><X className="size-3.5" /></button></span>)}
            </div>
            {(m.valores?.length ?? 0) < 5 && (
              <form onSubmit={(x) => { x.preventDefault(); const t = nuevoVal.trim().slice(0, 40); if (t.length >= 3 && !(m.valores ?? []).includes(t)) { setM((y) => ({ ...y, valores: [...(y.valores ?? []), t] })); setNuevoVal(""); } }} className="mt-2 flex gap-2">
                <input value={nuevoVal} onChange={(x) => setNuevoVal(x.target.value)} maxLength={40} placeholder="Ej.: Puntualidad, Trato familiar, Innovación" className={`${campoPanel} h-10`} />
                <button type="submit" className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-border px-3 text-sm font-bold"><Plus className="size-4" /> Agregar</button>
              </form>
            )}
          </div>

          <label className="block"><span className="mb-1 block text-sm font-bold">Cómo es trabajar aquí</span><textarea value={m.cultura ?? ""} onChange={(x) => setM((y) => ({ ...y, cultura: x.target.value }))} rows={4} maxLength={900} placeholder="El ambiente, cómo se trata a la gente, cómo se crece. Ej.: «Somos un equipo de 25. Los supervisores empezaron como cajeros…»" className={`${campoPanel} h-auto py-3`} /></label>
          <label className="block"><span className="mb-1 block text-sm font-bold">Un día normal</span><textarea value={m.dia ?? ""} onChange={(x) => setM((y) => ({ ...y, dia: x.target.value }))} rows={4} maxLength={900} placeholder="Ej.: «Entras a las 8, revisamos el plan del día en 10 minutos, almuerzo en el comedor a la 1…»" className={`${campoPanel} h-auto py-3`} /></label>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button type="button" onClick={() => void guardar()} disabled={guardando || !cambiado} className="btn-aplicar h-11 rounded-xl px-6 text-sm disabled:opacity-50">{guardando ? "Guardando…" : cambiado ? "Guardar y publicar" : "Todo guardado"}</button>
            <a href={urlPerfil} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold"><Eye className="size-4" /> Ver mi página como candidato</a>
          </div>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-4">
          {/* Medidor */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-4">
              <Anillo pct={pct} />
              <div><p className="font-extrabold">Perfil {pct >= 100 ? "completo" : `al ${pct}%`}</p><p className="text-xs text-muted-foreground">{pct >= 80 ? "Tu página convence. ¡Bien hecho!" : "Completa lo que falta: cada paso suma confianza."}</p></div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {pasos.map((s) => (
                <li key={s.id} className="flex gap-2 text-sm">
                  {s.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                  <span><span className={`font-semibold ${s.ok ? "text-muted-foreground line-through decoration-1" : ""}`}>{s.t}</span>{!s.ok && <span className="block text-xs text-muted-foreground">{s.por}</span>}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vista previa */}
          <div className="overflow-hidden rounded-2xl border border-border bg-[#f3f6fb]">
            <p className="flex items-center gap-1.5 bg-[#0a2f5c] px-4 py-2 text-xs font-bold text-white"><Sparkles className="size-3.5" /> Así te ven los candidatos</p>
            <div className="p-4">
              <div className="flex items-center gap-3">
                {m.logo ? <img src={m.logo} alt="" className="size-12 rounded-xl bg-white object-contain p-0.5" /> : <EmpresaAvatar nombre={e.nombre} className="size-12 text-xl" />}
                <div className="min-w-0"><p className="truncate font-extrabold">{e.nombre}</p>{sello ? <SelloEmpresa s={sello} className="mt-0.5" /> : <p className="text-xs text-muted-foreground">{e.sector ?? "Sector sin indicar"}</p>}</div>
              </div>
              {m.fotos?.[0] && <img src={m.fotos[0]} alt="" className="mt-3 aspect-video w-full rounded-xl object-cover" />}
              {(m.beneficios ?? []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">{m.beneficios!.slice(0, 4).map((b) => <span key={b} className="rounded-full bg-[#fff8e6] px-2.5 py-1 text-[11px] font-bold">{b}</span>)}{m.beneficios!.length > 4 && <span className="px-1 text-[11px] font-bold text-muted-foreground">+{m.beneficios!.length - 4}</span>}</div>
              ) : <p className="mt-3 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">Sin beneficios, tu página se ve igual a la de cualquier otra empresa.</p>}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Cifra({ I, n, t, d }: { I: typeof Users; n: number; t: string; d: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="flex items-center gap-2"><I className="size-5 text-[#1d6ff2]" /><span className="font-display text-3xl font-bold tabular-nums">{n.toLocaleString("es-DO")}</span></p>
      <p className="mt-1 font-bold">{t}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{d}</p>
    </div>
  );
}

function Anillo({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  const color = pct >= 80 ? "#0f7a43" : pct >= 50 ? "#1d6ff2" : "#f5a700";
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" role="img" aria-label={`Perfil al ${pct}%`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e7ebf2" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)" }} />
      <text x="32" y="32" textAnchor="middle" dominantBaseline="central" transform="rotate(90 32 32)" className="fill-foreground text-[15px] font-extrabold">{pct}%</text>
    </svg>
  );
}

/** Franja corta para el Inicio del panel: quién espera tus vacantes y qué tan completo está tu perfil. */
export function PulsoEmpresa() {
  const p = usePanel();
  const e = p.empresa;
  const slug = e.perfil_slug ?? slugDe(e.nombre);
  const { data: aud } = useAudiencia(slug);
  const pct = porcentajePerfil(pasosPerfil(e, marcaDe(e.marca), p.vacantes.filter((v) => esClara(v)).length));
  const seg = aud?.seguidores ?? 0;
  if (pct >= 100 && seg === 0) return null;
  return (
    <button type="button" onClick={() => p.ir("empresa")} className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-gradient-to-r from-[#eef4ff] to-[#fff8e6] p-4 text-left text-sm hover:border-[#1d6ff2]">
      {seg > 0 && <span className="inline-flex items-center gap-2 font-bold"><Users className="size-5 text-[#1d6ff2]" /> {seg.toLocaleString("es-DO")} {seg === 1 ? "persona espera" : "personas esperan"} tu próxima vacante</span>}
      {pct < 100 && <span className="inline-flex items-center gap-2"><Sparkles className="size-4 text-[#f5a700]" /> Tu página de empresa está al <b>{pct}%</b>: agrega fotos y beneficios</span>}
      <span className="ml-auto font-bold text-[#1557c4]">Mejorar mi página →</span>
    </button>
  );
}
