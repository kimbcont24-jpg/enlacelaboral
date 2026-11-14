import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

import { ApplyProvider } from "@/components/site/apply-context";
import { EntradaLogo, scriptEntrada } from "@/components/site/EntradaLogo";
import { RobotNexa } from "@/components/site/RobotNexa";
import { Accesibilidad } from "@/components/site/Accesibilidad";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { iniciarNube } from "@/lib/nube";
import { iniciarApariencia, scriptApariencia } from "@/lib/apariencia";
import appCss from "../styles.css?url";

/** Quién es el sitio, para que Google muestre «Enlace Laboral RD» como nombre y no lo confunda con otras marcas parecidas. */
const MARCA_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://enlacelaboralrd.com/#organizacion",
      name: "Enlace Laboral RD",
      alternateName: ["Enlace Laboral", "Enlace RD"],
      url: "https://enlacelaboralrd.com/",
      logo: "https://enlacelaboralrd.com/icon-512.png",
      description: "Plataforma dominicana de empleo que conecta a personas que buscan trabajo con empresas de República Dominicana.",
      areaServed: { "@type": "Country", name: "República Dominicana" },
      founder: { "@type": "Person", "@id": "https://kimberlycontreras.vercel.app/#persona", name: "Kimberly Mariel Contreras Liriano", alternateName: "Kimberly Contreras", url: "https://kimberlycontreras.vercel.app/sobre-kimberly-contreras" },
      sameAs: ["https://t.me/enlacelaboral", "https://whatsapp.com/channel/0029Vb7GW0UKLaHf3idEm62D"],
    },
    {
      "@type": "WebSite",
      "@id": "https://enlacelaboralrd.com/#sitio",
      name: "Enlace Laboral RD",
      alternateName: ["Enlace Laboral", "enlacelaboralrd.com"],
      url: "https://enlacelaboralrd.com/",
      inLanguage: "es-DO",
      publisher: { "@id": "https://enlacelaboralrd.com/#organizacion" },
      potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: "https://enlacelaboralrd.com/vacantes?q={search_term_string}" }, "query-input": "required name=search_term_string" },
    },
  ],
}).replace(/</g, "\\u003c");

function NotFoundComponent() {
  const atajos = [["Ver todas las vacantes", "/vacantes"], ["Empleos desde casa", "/empleos/remoto"], ["Hacer mi CV gratis", "/cv"], ["Publicar una vacante", "/empresas"]] as const;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <p className="font-display text-6xl font-extrabold tracking-tight text-[#1d6ff2]">Ups</p>
        <h1 className="mt-4 text-balance text-2xl font-extrabold">Esta página o vacante ya no está disponible</h1>
        <p className="mt-2 text-muted-foreground">Puede que la empresa ya llenó el puesto o que el enlace esté incompleto. Hay muchas más esperándote.</p>
        <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
          {atajos.map(([t, href], i) => <a key={href} href={href} className={i === 0 ? "btn-aplicar grid h-12 place-items-center rounded-xl sm:col-span-3" : "grid h-12 place-items-center rounded-xl border border-border bg-surface font-bold hover:border-primary hover:text-primary"}>{t}</a>)}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Enlace Laboral · Empleos en República Dominicana" },
      { name: "description", content: "Vacantes reales de empresas, portales e instituciones de República Dominicana, en un solo lugar. Aplicar es gratis." },
      { name: "theme-color", content: "#0a2f5c" },
      { property: "og:site_name", content: "Enlace Laboral RD" },
      { property: "og:locale", content: "es_DO" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Enlace Laboral · Empleos en República Dominicana" },
      { property: "og:description", content: "Vacantes reales de empresas, portales e instituciones de República Dominicana, en un solo lugar. Aplicar es gratis." },
      { property: "og:image", content: "https://enlacelaboralrd.com/og/enlace-laboral-rd.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Enlace Laboral: empleos reales en República Dominicana. Aplica en 1 minuto, sin crear cuenta y gratis." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://enlacelaboralrd.com/og/enlace-laboral-rd.png" },
      { name: "google-site-verification", content: "nAeJKgDNM-yYtt0zmC-2lKd0eo_y-u7L07Re10v9NVg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=Unbounded:wght@700;800&display=swap" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
    scripts: [{ children: scriptApariencia }, { children: scriptEntrada }, { type: "application/ld+json", children: MARCA_LD }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es-DO">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => iniciarNube(), []);
  useEffect(() => { void iniciarApariencia(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ApplyProvider>
        <EntradaLogo />
        <Outlet />
        <RobotNexa />
        <Accesibilidad />
        <Toaster richColors position="top-center" />
      </ApplyProvider>
    </QueryClientProvider>
  );
}
