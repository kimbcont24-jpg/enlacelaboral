import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

import { diaNum, faltan, mesCorto, OFICINAS_EMPLEO, organizadorDe, ubicacion, type Jornada } from "@/lib/jornadas";

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Mapa interactivo de República Dominicana con las ferias de empleo.
 * Cada feria es un marcador con su fecha; las próximas laten. También muestra las
 * Oficinas de Empleo del Ministerio de Trabajo (abiertas todo el año).
 * `activa` hace volar el mapa hasta esa feria y abre su ficha.
 */
export function MapaFerias({ ferias, activa, onElegir, oficinas = true, className = "" }: { ferias: Jornada[]; activa?: string | null; onElegir?: (id: string) => void; oficinas?: boolean; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<import("leaflet").Map | null>(null);
  const marcas = useRef(new Map<string, import("leaflet").Marker>());
  const L = useRef<typeof import("leaflet") | null>(null);
  // Siempre la versión más reciente de los datos (el mapa se crea de forma asíncrona).
  const datos = useRef({ ferias, oficinas, onElegir });
  datos.current = { ferias, oficinas, onElegir };

  // Crear el mapa una sola vez (Leaflet solo funciona en el navegador).
  useEffect(() => {
    let vivo = true;
    void import("leaflet").then((mod) => {
      const Lf = (mod as unknown as { default?: typeof import("leaflet") }).default ?? mod;
      if (!vivo || !caja.current || mapa.current) return;
      L.current = Lf;
      const m = Lf.map(caja.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true, minZoom: 7, maxZoom: 17, zoomSnap: 0.25 })
        .fitBounds([[17.45, -72.05], [19.98, -68.3]], { padding: [10, 10] });
      Lf.control.zoom({ position: "bottomright" }).addTo(m);
      // Mapa base gratis y sin clave: OpenStreetMap. Si falla, cambia solo a Esri.
      const fuentes = [
        { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
        { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri" },
      ];
      let actual = 0, errores = 0;
      const poner = (i: number) => {
        const capa = Lf.tileLayer(fuentes[i]!.url, { attribution: fuentes[i]!.attribution, maxZoom: 19, className: "mf-teselas" });
        capa.on("tileerror", () => {
          errores += 1;
          if (errores >= 4 && actual < fuentes.length - 1) { m.removeLayer(capa); actual += 1; errores = 0; poner(actual); }
        });
        capa.addTo(m);
      };
      poner(0);
      // La rueda del ratón solo hace zoom después de tocar el mapa (no secuestra el desplazamiento de la página).
      m.on("click", () => m.scrollWheelZoom.enable());
      m.on("mouseout", () => m.scrollWheelZoom.disable());
      mapa.current = m;
      pintar();
    });
    return () => { vivo = false; mapa.current?.remove(); mapa.current = null; marcas.current.clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pintar = () => {
    const Lf = L.current, m = mapa.current;
    if (!Lf || !m) return;
    const { ferias, oficinas, onElegir } = datos.current;
    marcas.current.forEach((mk) => mk.remove());
    marcas.current.clear();
    m.eachLayer((capa) => { if ((capa as { options?: { pane?: string; esOficina?: boolean } }).options?.esOficina) m.removeLayer(capa); });

    if (oficinas) {
      for (const o of OFICINAS_EMPLEO) {
        Lf.marker(o.pos, {
          esOficina: true,
          icon: Lf.divIcon({ className: "", html: `<span class="mf-oficina" title="${esc(o.nombre)}">🏛</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
        } as import("leaflet").MarkerOptions & { esOficina: boolean })
          .bindPopup(`<div class="mf-pop"><p class="mf-pop-et">Abierta todo el año · gratis</p><p class="mf-pop-t">${esc(o.nombre)}</p><p class="mf-pop-l">${esc(o.direccion)}</p><p class="mf-pop-n">Ministerio de Trabajo · Servicio Nacional de Empleo. Lleva tu CV.</p><a class="mf-pop-b" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.direccion}, ${o.provincia}, República Dominicana`)}">Cómo llegar</a></div>`)
          .addTo(m);
      }
    }

    const puntos: [number, number][] = [];
    for (const j of ferias) {
      const pos = ubicacion(j);
      if (!pos) continue;
      puntos.push(pos);
      const estado = j.pasada ? "pasada" : faltan(j.fecha) === "Hoy" ? "hoy" : "proxima";
      const icono = Lf.divIcon({
        className: "",
        html: `<span class="mf-feria mf-${estado}"><span class="mf-pulso"></span><span class="mf-txt"><b>${diaNum(j.fecha)}</b><i>${mesCorto(j.fecha)}</i></span></span>`,
        iconSize: [46, 52], iconAnchor: [23, 50], popupAnchor: [0, -46],
      });
      const mk = Lf.marker(pos, { icon: icono, riseOnHover: true, zIndexOffset: j.pasada ? 0 : 500 })
        .bindPopup(`<div class="mf-pop"><p class="mf-pop-et">${j.pasada ? "Ya pasó" : esc(faltan(j.fecha))}</p><p class="mf-pop-t">${esc(j.titulo)}</p><p class="mf-pop-o">${esc(organizadorDe(j))}</p><p class="mf-pop-l">📍 ${esc(j.lugar)}, ${esc(j.provincia)}</p>${j.vacantes ? `<p class="mf-pop-n">${j.vacantes.toLocaleString("es-DO")} vacantes</p>` : ""}<a class="mf-pop-b" href="/jornadas/${j.id}">Ver la feria</a></div>`, { maxWidth: 260 })
        .addTo(m);
      mk.on("click", () => onElegir?.(j.id));
      marcas.current.set(j.id, mk);
    }
    if (puntos.length) m.fitBounds(Lf.latLngBounds(puntos).pad(puntos.length === 1 ? 0.6 : 0.25), { maxZoom: puntos.length === 1 ? 10 : 9, animate: false });
  };

  // Volver a dibujar cuando cambian las ferias.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { pintar(); }, [ferias, oficinas]);

  // Volar a la feria elegida en la lista.
  useEffect(() => {
    if (!activa || !mapa.current) return;
    const mk = marcas.current.get(activa);
    if (!mk) return;
    mapa.current.flyTo(mk.getLatLng(), 12, { duration: 1.1 });
    setTimeout(() => mk.openPopup(), 1150);
  }, [activa]);

  return <div ref={caja} role="region" aria-label="Mapa de ferias de empleo en República Dominicana" className={`mapa-ferias z-0 ${className}`} />;
}
