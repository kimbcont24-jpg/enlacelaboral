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
import appCss from "../styles.css?url";

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
      { name: "google-site-verification", content: "nAeJKgDNM-yYtt0zmC-2lKd0eo_y-u7L07Re10v9NVg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Inter (texto) y Manrope (titulares), variables: un archivo por familia. Figtree 800 solo para el logotipo.
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&family=Manrope:wght@500..800&family=Figtree:wght@800&display=swap" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
    scripts: [{ children: scriptEntrada }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => iniciarNube(), []);
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
