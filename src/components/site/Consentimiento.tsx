import { Link } from "@tanstack/react-router";

/** Casilla obligatoria de consentimiento (Ley 172-13). Sin marcarla, el formulario no se envía. */
export function Consentimiento({ para, className = "" }: { para: "candidato" | "empresa" | "aliado" | "cuenta"; className?: string }) {
  const texto = {
    candidato: "Autorizo a Enlace Laboral a guardar mis datos y a compartirlos con la empresa de esta oferta para mi proceso de selección.",
    empresa: "Confirmo que mis datos son reales y que mis ofertas cumplen la ley (sin discriminación y sin cobrar a los candidatos). Autorizo a Enlace Laboral a verificar mi RNC o cédula.",
    aliado: "Autorizo a Enlace Laboral a guardar estos datos para responder a este mensaje.",
    cuenta: "Autorizo a Enlace Laboral a guardar mi CV y mi búsqueda en mi cuenta.",
  }[para];
  return (
    <label className={`flex items-start gap-2.5 text-xs leading-snug text-muted-foreground ${className}`}>
      <input type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
      <span>{texto} Acepto los <Link to="/terminos" target="_blank" className="font-semibold text-primary underline">términos</Link> y la <Link to="/privacidad" target="_blank" className="font-semibold text-primary underline">política de privacidad</Link>.</span>
    </label>
  );
}
