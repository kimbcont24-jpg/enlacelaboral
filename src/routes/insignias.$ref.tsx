import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ShieldAlert } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarcaPerfila, Medalla } from "@/components/insignias/Sello";
import { NIVEL_TXT, PERFILA, infoPrueba } from "@/lib/insignias-datos";
import { consultarInsignias, type EstadoInsignia } from "@/lib/insignias.functions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Verificación pública de una insignia: la abre la empresa desde el CV o la aplicación. */
export const Route = createFileRoute("/insignias/$ref")({
  loader: async ({ params }): Promise<{ insignia: EstadoInsignia | null; error: boolean }> => {
    if (!UUID.test(params.ref)) return { insignia: null, error: false };
    try {
      const [e] = await consultarInsignias({ data: { refs: [params.ref] } });
      return { insignia: e && e.estado === "terminada" && e.nivel ? e : null, error: false };
    } catch {
      return { insignia: null, error: true };
    }
  },
  head: () => ({
    meta: [
      { title: "Verificar insignia | Enlace Laboral · Perfila" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&display=swap" }],
  }),
  component: Verificar,
});

function Verificar() {
  const { insignia, error } = Route.useLoaderData();
  const info = insignia ? infoPrueba(insignia.prueba) : null;
  const fecha = insignia?.fecha ? new Date(insignia.fecha).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <div className="min-h-screen bg-[#f4f2ff] text-[#06004b]" style={{ fontFamily: "Manrope, Figtree, system-ui, sans-serif" }}>
      <Header />
      <main className="mx-auto max-w-lg px-4 py-12">
        {insignia && info ? (
          <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_60px_-30px_rgb(6_0_75/0.45)]">
            <div className="relative px-6 pb-8 pt-8 text-center text-white" style={{ backgroundColor: PERFILA.azul }}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-20 mx-auto size-64 rounded-full opacity-60 blur-3xl" style={{ background: `radial-gradient(circle, ${info.color}, transparent 70%)` }} />
              <div className="relative">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#5cc28a] px-3 py-1 text-xs font-extrabold text-white"><BadgeCheck className="size-4" /> Insignia auténtica</p>
                <div className="mt-5"><Medalla prueba={insignia.prueba} nivel={insignia.nivel} size={112} /></div>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight">{info.nombre}</h1>
                <p className="mt-1 text-lg">Nivel <b className="text-[#f9c400]">{NIVEL_TXT[insignia.nivel ?? "solido"]}</b></p>
              </div>
            </div>
            <dl className="grid gap-3 p-6 text-[15px]">
              {insignia.nombre && <div className="flex justify-between gap-4"><dt className="text-[#4b4680]">Obtenida por</dt><dd className="font-bold">{insignia.nombre}</dd></div>}
              {fecha && <div className="flex justify-between gap-4"><dt className="text-[#4b4680]">Fecha</dt><dd className="font-bold">{fecha}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-[#4b4680]">Qué mide</dt><dd className="max-w-[60%] text-right">{info.queMide}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#4b4680]">Nivel</dt><dd className="text-right">{insignia.nivel === "destacado" ? "85 % o más de aciertos" : "70 % o más de aciertos"}</dd></div>
            </dl>
            <p className="flex items-center gap-2 border-t border-[#ece9f7] px-6 py-4 text-sm text-[#4b4680]"><MarcaPerfila size={22} /> Prueba hecha en Perfila, con reloj y control de trampas. Enlace solo recibe el nivel.</p>
          </div>
        ) : (
          <div className="rounded-[1.75rem] bg-white p-8 text-center">
            <ShieldAlert className="mx-auto size-12 text-[#f2557a]" />
            <h1 className="mt-4 text-2xl font-extrabold">{error ? "No pudimos verificar ahora" : "Esta insignia no está verificada"}</h1>
            <p className="mt-2 text-[#4b4680]">{error ? "Perfila no respondió. Intenta de nuevo en unos minutos." : "El enlace no corresponde a una insignia terminada en Perfila. Si te la mostraron en un CV, pídele a la persona el enlace correcto."}</p>
          </div>
        )}
        <Link to="/insignias" className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-[#06004b] px-5 py-3 text-sm font-bold text-white hover:bg-[#15106a]">Gana tu propia insignia <ArrowRight className="size-4" /></Link>
      </main>
      <Footer />
    </div>
  );
}
