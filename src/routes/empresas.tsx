import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { comparativa, planes, provincias, serviciosCandidato } from "@/lib/data";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: "Publica vacantes gratis | Enlace Laboral" }] }),
  component: Empresas,
});

function Empresas() {
  const [enviado, setEnviado] = useState(false);
  const [plan, setPlan] = useState(planes[0]!.nombre);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="mx-auto max-w-7xl px-6 pb-12 pt-16">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary">Para empresas y reclutadores</p>
        <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight md:text-6xl">Publicar es gratis. Recibe candidatos <span className="text-primary">esta misma tarde.</span></h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Crea tu cuenta de reclutador y publica vacantes ilimitadas sin costo. Los servicios extras son opcionales.</p>
      </header>
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {planes.map((p) => (
            <div key={p.nombre} className={p.popular ? "relative flex flex-col rounded-3xl border-2 border-primary bg-surface p-7" : "relative flex flex-col rounded-3xl border border-border bg-surface p-7"}>
              {p.popular && (<span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary-foreground">Más elegido</span>)}
              <h2 className="text-lg font-bold">{p.nombre}</h2>
              <div className="mt-3 flex items-baseline gap-1"><span className="text-3xl font-extrabold">{p.precio}</span><span className="text-sm text-muted-foreground">{p.unidad}</span></div>
              {"impulso" in p && p.impulso && (<p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary">⚡ {p.impulso}</p>)}
              <p className="mt-3 text-sm text-muted-foreground">{p.resumen}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">{p.beneficios.map((b) => (<li key={b} className="flex gap-2"><span className="text-primary">✓</span> {b}</li>))}</ul>
              <button onClick={() => { setPlan(p.nombre); document.getElementById("publicar")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-6 w-full rounded-xl border border-border py-3 font-bold hover:border-primary hover:text-primary">{p.cta}</button>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-surface p-7">
          <h2 className="text-2xl font-extrabold tracking-tight">Gratis vs. Destacada por RD$500</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr><th className="px-4 py-3 text-left">Incluye</th><th className="px-4 py-3">Gratis</th><th className="px-4 py-3 text-primary">Destacada</th></tr></thead>
              <tbody>{comparativa.map((c) => (<tr key={c.fila}><td className="px-4 py-3">{c.fila}</td><td className="px-4 py-3 text-center">{c.gratis ? "✓" : "—"}</td><td className="px-4 py-3 text-center text-primary">{c.destacada ? "✓" : "—"}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </section>
      <section id="publicar" className="border-y border-border bg-surface px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Publica tu vacante</h2>
            <p className="mt-3 text-muted-foreground">Completa el formulario y nuestro equipo la revisa.</p>
          </div>
          {enviado ? (
            <div className="rounded-3xl border border-primary/40 bg-primary/5 p-8">
              <h3 className="text-xl font-bold">¡Recibimos tu vacante!</h3>
              <p className="mt-2 text-sm text-muted-foreground">Plan seleccionado: <strong>{plan}</strong>.</p>
              <button onClick={() => setEnviado(false)} className="mt-6 rounded-xl border border-border px-4 py-2 text-sm font-bold">Publicar otra</button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setEnviado(true); }} className="space-y-4 rounded-3xl border border-border bg-background p-8">
              <Field label="Empresa" placeholder="Nombre de la empresa" />
              <Field label="Contacto" placeholder="Nombre y apellido" />
              <Field label="Correo" type="email" placeholder="rrhh@empresa.do" />
              <Field label="Título del puesto" placeholder="Ej. Cajero/a" />
              <select required className="w-full rounded-xl border border-border bg-surface px-4 py-3">{provincias.slice(1).map((p) => (<option key={p}>{p}</option>))}</select>
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-3">{planes.map((p) => (<option key={p.nombre} value={p.nombre}>{p.nombre} — {p.precio}</option>))}</select>
              <textarea required rows={4} placeholder="Funciones, requisitos, horario y beneficios" className="w-full rounded-xl border border-border bg-surface px-4 py-3" />
              <button type="submit" className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground">Crear cuenta y publicar gratis</button>
            </form>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-2xl font-bold">Servicios para candidatos</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {serviciosCandidato.map((s) => (
            <div key={s.nombre} className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-bold">{s.nombre}</h3>
              <p className="mt-2 text-2xl font-extrabold text-primary">{s.precio}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{s.beneficios.map((b) => (<li key={b}>• {b}</li>))}</ul>
            </div>
          ))}
        </div>
        <Link to="/vacantes" className="mt-10 inline-block rounded-xl bg-foreground px-6 py-3 font-bold text-background">Explorar vacantes</Link>
      </section>
      <Footer />
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input required type={type} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary" />
    </label>
  );
}
