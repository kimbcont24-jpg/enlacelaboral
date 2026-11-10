import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Building2, Check, Eye, EyeOff, Link2, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { MiInvitacion } from "@/integrations/supabase/types";
import { cvCompleto, leerCV, textoCV } from "@/lib/cv";
import { useNube } from "@/lib/nube";
import { usePostulaciones } from "@/lib/postulaciones";
import { useVacantes } from "@/lib/vacantes";

const pesos = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

/** El enlace del lado del candidato: aparecer para las empresas y responder sus invitaciones. */
export function EnlaceTalento() {
  const nube = useNube();
  const [visible, setVisible] = useState<boolean | null>(null);
  const [invs, setInvs] = useState<MiInvitacion[]>([]);
  const [ocupado, setOcupado] = useState("");
  const { registrar } = usePostulaciones();
  const { jobs } = useVacantes();
  const conCuenta = !!nube.correo && !nube.empresa;

  const cargar = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user.id;
    if (!uid) return;
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from("candidatos").select("visible").eq("user_id", uid).maybeSingle(),
      supabase.rpc("mis_invitaciones"),
    ]);
    setVisible(!!(c as { visible?: boolean } | null)?.visible);
    setInvs(i ?? []);
  }, []);
  useEffect(() => { if (conCuenta) void cargar(); }, [conCuenta, cargar]);

  if (!nube.listo || nube.empresa) return null;

  if (!conCuenta) {
    return (
      <section className="mb-6 flex items-start gap-4 rounded-2xl border border-border bg-surface p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4]"><Link2 className="size-5" /></span>
        <div className="min-w-0">
          <p className="font-extrabold">Deja que las empresas te encuentren</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Guarda tu CV con tu correo (arriba) y activa tu perfil. Las empresas te invitan a sus vacantes y tú decides si aplicas. Tu teléfono y correo no se muestran.</p>
        </div>
      </section>
    );
  }

  const cambiar = async (v: boolean) => {
    const cv = leerCV();
    if (v && !cvCompleto(cv)) return void toast.error("Completa tu nombre y tu WhatsApp o correo en tu CV primero.");
    if (v && !(cv?.puesto.trim())) return void toast.error("Escribe en tu CV qué puesto buscas: así te encuentran las empresas.");
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user.id;
    if (!uid) return;
    setOcupado("visible");
    const { error } = await supabase.from("candidatos").update({ visible: v, visible_at: v ? new Date().toISOString() : null }).eq("user_id", uid);
    setOcupado("");
    if (error) return void toast.error("No se pudo cambiar. Intenta otra vez.");
    setVisible(v);
    toast.success(v ? "Listo: las empresas ya pueden encontrarte e invitarte." : "Tu perfil ya no aparece para las empresas.");
  };

  const responder = async (i: MiInvitacion, acepta: boolean) => {
    const cv = leerCV();
    if (acepta && !cvCompleto(cv)) return void toast.error("Completa tu nombre y tu contacto en tu CV para aplicar.");
    setOcupado(i.id);
    const { error } = await supabase.rpc("responder_invitacion", { p_id: i.id, p_acepta: acepta, p_mensaje: acepta && cv ? `--- CV ---\n${textoCV(cv)}` : null });
    setOcupado("");
    if (error) return void toast.error("No se pudo responder. Intenta otra vez.");
    if (acepta) {
      const v = jobs.find((j) => j.id === i.vacante_id);
      registrar(v ?? { id: i.vacante_id, titulo: i.titulo, empresa: i.empresa, provincia: i.provincia, aplicar: "" }, "Invitación de la empresa");
      toast.success(`¡Aplicaste! ${i.empresa} ya tiene tu CV y tu contacto.`);
    } else toast.success("Listo. No le compartimos tus datos.");
    void cargar();
  };

  const pendientes = invs.filter((i) => i.estado === "enviada");

  return (
    <section className="mb-6 space-y-3">
      {pendientes.map((i) => (
        <div key={i.id} className="overflow-hidden rounded-2xl border-2 border-[#1d6ff2] bg-surface">
          <div className="flex items-center gap-2 bg-[#1d6ff2] px-5 py-2 text-sm font-bold text-white"><Send className="size-4" /> Una empresa te invita a aplicar</div>
          <div className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary"><Building2 className="size-5 text-[#1557c4]" /></span>
              <div className="min-w-0">
                <p className="text-lg font-extrabold leading-tight">{i.titulo}</p>
                <p className="inline-flex items-center gap-1 text-sm font-semibold">{i.empresa}{i.verificada && <BadgeCheck className="size-4 text-success" aria-label="Empresa verificada" />}</p>
                <p className="text-sm text-muted-foreground">{i.provincia}{i.salarioMin > 0 ? ` · ${pesos(i.salarioMin)}${i.salarioMax ? ` – ${pesos(i.salarioMax)}` : ""}` : ""}</p>
              </div>
            </div>
            {i.mensaje && <p className="mt-3 rounded-xl bg-secondary/70 p-3 text-sm">«{i.mensaje}»</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={ocupado === i.id} onClick={() => void responder(i, true)} className="btn-aplicar inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm">{ocupado === i.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Aplicar con mi CV</button>
              <a href={`/vacantes/${i.vacante_id}`} className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:border-primary">Ver la vacante</a>
              <button type="button" disabled={ocupado === i.id} onClick={() => void responder(i, false)} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"><X className="size-4" /> No me interesa</button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Si aplicas, la empresa recibe tu CV con tu teléfono o correo. Nunca pagues por un empleo.</p>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-5">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${visible ? "bg-success/12 text-success" : "bg-[#1d6ff2]/10 text-[#1557c4]"}`}>{visible ? <Eye className="size-5" /> : <Link2 className="size-5" />}</span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{visible ? "Las empresas pueden encontrarte" : "Deja que las empresas te encuentren"}</p>
          <p className="text-sm text-muted-foreground">{visible ? `Ven tu nombre, puesto, ciudad y experiencia. No ven tu teléfono ni tu correo hasta que aceptes una invitación.${invs.length ? ` Te han invitado ${invs.length} ${invs.length === 1 ? "vez" : "veces"}.` : ""}` : "Las empresas ven tu experiencia (sin tu contacto) y te invitan a sus vacantes. Tú decides."}</p>
        </div>
        {visible === null ? <Loader2 className="size-5 animate-spin text-muted-foreground" />
          : <button type="button" disabled={ocupado === "visible"} onClick={() => void cambiar(!visible)} className={visible ? "inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold hover:border-destructive hover:text-destructive" : "btn-aplicar inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"}>{visible ? <><EyeOff className="size-4" /> Ocultarme</> : <><Eye className="size-4" /> Activar mi perfil</>}</button>}
      </div>
    </section>
  );
}
