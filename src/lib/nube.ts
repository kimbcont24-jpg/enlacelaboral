import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { aplicarCVRemoto, CV_EDITADO, cvVacio, EVENTO_CV, leerCV, type CV } from "@/lib/cv";
import { EV_VERSIONES, guardarVersiones, K_VERSIONES, leerVersiones, type Versiones } from "@/lib/cv-versiones";

/**
 * Copia opcional en la cuenta del candidato: CV, diseño del CV, guardadas y aplicaciones.
 * Sin cuenta todo sigue en el teléfono como siempre. Con cuenta se mezcla y se mantiene igual en todos sus equipos.
 */
const K_GUARDADAS = "enlace-guardados";
const K_POSTS = "enlace-postulaciones";
const K_PLANTILLA = "enlace-cv-plantilla";
const EV_GUARDADAS = "enlace-guardados-cambio";
const EV_POSTS = "enlace-postulaciones-cambio";
export const EV_NUBE = "enlace-nube-estado";

type Post = { id: string; fecha?: string; cambio?: string; [k: string]: unknown };
type Fila = { cv: Partial<CV>; plantilla: string | null; guardadas: string[]; postulaciones: Post[]; versiones: Partial<Versiones> | null; updated_at: string };

const leerJSON = <T,>(k: string, d: T): T => { try { const v = JSON.parse(localStorage.getItem(k) ?? "null") as T | null; return v ?? d; } catch { return d; } };
const tieneCV = (cv: Partial<CV> | null | undefined) => !!cv && !!(cv.nombre?.trim() || cv.resumen?.trim() || cv.puesto?.trim());

let aplicando = false;
let usuario: string | null = null;
let esEmpresa = false;
let temporizador = 0;

function local() {
  return {
    cv: leerCV(),
    editado: (() => { try { return localStorage.getItem(CV_EDITADO) ?? ""; } catch { return ""; } })(),
    plantilla: (() => { try { return localStorage.getItem(K_PLANTILLA); } catch { return null; } })(),
    guardadas: leerJSON<string[]>(K_GUARDADAS, []).filter((x) => typeof x === "string"),
    postulaciones: leerJSON<Post[]>(K_POSTS, []).filter((x) => x && typeof x.id === "string"),
    versiones: leerVersiones(),
  };
}

async function subir() {
  if (!usuario || aplicando) return;
  const l = local();
  await supabase.from("candidatos").upsert({ user_id: usuario, cv: (l.cv ?? {}) as unknown as Record<string, unknown>, plantilla: l.plantilla, guardadas: l.guardadas.slice(0, 200), postulaciones: l.postulaciones.slice(0, 300), versiones: (l.versiones ?? {}) as unknown as Record<string, unknown>, updated_at: new Date().toISOString() });
}
const subirLuego = () => { window.clearTimeout(temporizador); temporizador = window.setTimeout(() => void subir(), 1500); };

/** Junta lo del teléfono con lo de la cuenta: nada se pierde. */
async function mezclar(uid: string) {
  const { data } = await supabase.from("candidatos").select("cv,plantilla,guardadas,postulaciones,versiones,updated_at").eq("user_id", uid).maybeSingle();
  const r = data as unknown as Fila | null;
  const l = local();
  aplicando = true;
  try {
    if (r) {
      // CV: gana el que se editó último; si uno está vacío, gana el otro.
      const remotoMasNuevo = !l.editado || new Date(r.updated_at) > new Date(l.editado);
      if (tieneCV(r.cv) && (!tieneCV(l.cv) || remotoMasNuevo)) aplicarCVRemoto({ ...cvVacio, ...r.cv } as CV, r.updated_at);
      if (r.plantilla && (!l.plantilla || remotoMasNuevo)) localStorage.setItem(K_PLANTILLA, r.plantilla);
      const guardadas = [...new Set([...l.guardadas, ...(r.guardadas ?? [])])].slice(0, 200);
      localStorage.setItem(K_GUARDADAS, JSON.stringify(guardadas));
      const porId = new Map<string, Post>();
      for (const p of [...(r.postulaciones ?? []), ...l.postulaciones]) {
        const ya = porId.get(p.id);
        const t = (x: Post) => x.cambio ?? x.fecha ?? "";
        if (!ya || t(p) >= t(ya)) porId.set(p.id, ya ? { ...ya, ...p } : p);
      }
      const posts = [...porId.values()].sort((a, b) => String(b.fecha ?? "").localeCompare(String(a.fecha ?? ""))).slice(0, 300);
      localStorage.setItem(K_POSTS, JSON.stringify(posts));
      // Versiones del CV: se juntan por id; gana la editada último.
      const rv = r.versiones && Array.isArray(r.versiones.lista) ? (r.versiones as Versiones) : null;
      if (rv) {
        const lv = leerVersiones();
        const m = new Map((lv?.lista ?? []).map((x) => [x.id, x]));
        for (const x of rv.lista) { const y = m.get(x.id); if (!y || x.editado > y.editado) m.set(x.id, x); }
        const lista = [...m.values()].slice(0, 8);
        const activo = lv && lista.some((x) => x.id === lv.activo) ? lv.activo : rv.activo;
        guardarVersiones({ activo: lista.some((x) => x.id === activo) ? activo : lista[0]!.id, lista });
      }
      window.dispatchEvent(new Event(EV_GUARDADAS));
      window.dispatchEvent(new Event(EV_POSTS));
    }
  } catch { /* sin almacenamiento */ } finally { aplicando = false; }
  await subir();
}

/** Se monta una vez en la raíz: escucha la sesión y sube los cambios solo. */
export function iniciarNube() {
  const alCambiar = () => { if (usuario && !aplicando) subirLuego(); };
  for (const ev of [EVENTO_CV, EV_GUARDADAS, EV_POSTS, EV_VERSIONES]) window.addEventListener(ev, alCambiar);
  const revisar = async (uid: string | null) => {
    if (uid === usuario && !esEmpresa) return;
    usuario = uid;
    esEmpresa = false;
    if (uid) {
      // Las empresas usan su panel; la copia del candidato es solo para quien no tiene empresa.
      const { count } = await supabase.from("empresas").select("id", { count: "exact", head: true }).eq("owner_id", uid);
      if (count) { usuario = null; esEmpresa = true; window.dispatchEvent(new Event(EV_NUBE)); return; }
      await mezclar(uid);
    }
    window.dispatchEvent(new Event(EV_NUBE));
  };
  void supabase.auth.getSession().then(({ data }) => revisar(data.session?.user.id ?? null));
  const { data } = supabase.auth.onAuthStateChange((_e, s) => { void revisar(s?.user.id ?? null); });
  return () => { for (const ev of [EVENTO_CV, EV_GUARDADAS, EV_POSTS, EV_VERSIONES]) window.removeEventListener(ev, alCambiar); data.subscription.unsubscribe(); };
}

export type EstadoNube = { listo: boolean; correo: string | null; empresa: boolean };

export function useNube() {
  const [estado, setEstado] = useState<EstadoNube>({ listo: false, correo: null, empresa: false });
  const leer = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setEstado({ listo: true, correo: data.session && usuario ? data.session.user.email ?? "tu cuenta" : null, empresa: !!data.session && esEmpresa });
  }, []);
  useEffect(() => {
    void leer();
    window.addEventListener(EV_NUBE, leer);
    return () => window.removeEventListener(EV_NUBE, leer);
  }, [leer]);

  const enviarCodigo = async (correo: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email: correo.trim(), options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/guardadas` } });
    return error ? (/rate|seconds|limit/i.test(error.message) ? "Espera un minuto antes de pedir otro código." : "No pudimos enviar el correo. Revisa que esté bien escrito.") : null;
  };
  const verificar = async (correo: string, codigo: string) => {
    const t = codigo.replace(/\D/g, "");
    let r = await supabase.auth.verifyOtp({ email: correo.trim(), token: t, type: "email" });
    if (r.error) r = await supabase.auth.verifyOtp({ email: correo.trim(), token: t, type: "signup" });
    return r.error ? "Ese código no es válido o ya venció. Pide uno nuevo." : null;
  };
  const salir = async (borrarTelefono = false) => {
    await supabase.auth.signOut();
    if (borrarTelefono) {
      try { for (const k of ["enlace-cv", CV_EDITADO, K_GUARDADAS, K_POSTS, K_PLANTILLA, "enlace-aplicante", K_VERSIONES, "enlace-entrevista"]) localStorage.removeItem(k); } catch { /* sin almacenamiento */ }
      window.location.reload();
    }
  };
  /** Borra la copia de la cuenta. Lo del teléfono se queda. */
  const borrar = async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) await supabase.from("candidatos").delete().eq("user_id", uid);
    await supabase.auth.signOut();
  };
  return { ...estado, enviarCodigo, verificar, salir, borrar };
}
