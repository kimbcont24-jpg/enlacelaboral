import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="Enlace Laboral">
      <svg viewBox="0 0 32 32" role="img" aria-label="Enlace Laboral" className="size-8">
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path d="M11 20.5a4.6 4.6 0 0 1 0-6.5l2.7-2.7" className="stroke-primary-foreground" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M21 11.5a4.6 4.6 0 0 1 0 6.5l-2.7 2.7" className="stroke-primary-foreground" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M13.6 18.4l4.8-4.8" className="stroke-primary-foreground" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </svg>
      <span className="text-lg font-bold tracking-tight">Enlace <span className="text-primary">Laboral</span></span>
    </Link>
  );
}
