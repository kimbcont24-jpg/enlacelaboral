import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Ban, Flag, Search, Siren } from "lucide-react";

import { Bloque, LEGAL_ACTUALIZADO, PaginaLegal } from "@/components/site/Legal";

export const Route = createFileRoute("/seguridad")({
  head: () => ({ meta: [{ title: "Empleo seguro: cómo evitar estafas | Enlace Laboral" }, { name: "description", content: "Señales de una oferta de empleo falsa en República Dominicana, cómo verificar una empresa y qué hacer si te estafaron." }] }),
  component: Seguridad,
});

const SENALES: [string, string][] = [
  ["Te piden dinero", "Para la entrevista, el uniforme, un curso, el carnet, un examen médico o «asegurar el puesto». Ninguna empresa seria te cobra."],
  ["El salario es demasiado bueno", "Mucho dinero por poco trabajo y sin experiencia. Si suena irreal, casi siempre lo es."],
  ["Todo es por WhatsApp y con prisa", "No hay dirección, nadie da su nombre completo y te presionan: «hoy mismo o pierdes el puesto»."],
  ["Piden datos que no tocan", "Tu clave del banco, el número completo de tu tarjeta o códigos que te llegan por mensaje. Nunca los compartas."],
  ["Correo de una gran empresa desde Gmail", "Las empresas grandes escriben desde su propio dominio (por ejemplo @empresa.com.do)."],
  ["«Trabaja desde casa» con inversión", "Si para empezar tienes que comprar un kit, pagar una inscripción o traer a más personas, es un esquema."],
];

function Seguridad() {
  return (
    <PaginaLegal actual="/seguridad" etiqueta="Cuídate" titulo="Empleo seguro: cómo evitar estafas" intro={<p>Actualizado el {LEGAL_ACTUALIZADO}. Lo que hacemos para protegerte y lo que puedes hacer tú.</p>}
      resumen={[
        { I: Ban, t: "Si te piden dinero, es estafa", d: "Ninguna empresa seria cobra por entrevistar ni por contratar." },
        { I: Search, t: "Verifica antes de ir", d: "Busca la empresa, su RNC y su dirección real." },
        { I: Flag, t: "Repórtalo", d: "Nos ayudas a quitarla para que no engañe a nadie más." },
      ]}
      indice={[["senales", "Señales de alerta"], ["verificar", "Cómo verificar una empresa"], ["entrevista", "Antes de ir a una entrevista"], ["hacemos", "Lo que hacemos nosotros"], ["paso", "Si ya te pasó"]]}>
      <Bloque id="senales" titulo="Señales de alerta">
        <ul className="grid gap-3 sm:grid-cols-2">
          {SENALES.map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-[#c27803]/30 bg-[#c27803]/[0.06] p-4"><p className="font-extrabold text-[#8a5200]">{t}</p><p className="mt-1 text-sm">{d}</p></li>
          ))}
        </ul>
      </Bloque>
      <Bloque id="verificar" titulo="Cómo verificar una empresa">
        <ul className="list-disc pl-5">
          <li>Busca el nombre en internet y en sus redes. Mira si tiene página web, dirección y teléfono fijos.</li>
          <li>Consulta su RNC en la <a href="https://dgii.gov.do/herramientas/consultas/Paginas/RNC.aspx" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">página oficial de la DGII</a> y confirma que el nombre coincide.</li>
          <li>En Enlace Laboral, las empresas con el sello <BadgeCheck className="inline size-4 align-[-2px] text-success" aria-label="verificada" /> fueron revisadas por nuestro equipo.</li>
          <li>Si te escriben de una vacante a la que no aplicaste, desconfía.</li>
        </ul>
      </Bloque>
      <Bloque id="entrevista" titulo="Antes de ir a una entrevista">
        <ul className="list-disc pl-5">
          <li>Confirma la dirección y que sea una oficina, tienda o lugar público.</li>
          <li>Dile a alguien de confianza a dónde vas y a qué hora.</li>
          <li>Lleva tu CV y tu cédula, pero no entregues copias de documentos hasta que te ofrezcan el puesto de verdad.</li>
          <li>No firmes nada que no entiendas ni pagues nada.</li>
        </ul>
      </Bloque>
      <Bloque id="hacemos" titulo="Lo que hacemos nosotros">
        <ul className="list-disc pl-5">
          <li>Pedimos RNC o cédula a toda empresa que publica, y revisamos sus vacantes antes de verificarla.</li>
          <li>Detenemos los avisos que discriminan y quitamos las vacantes con señales de estafa.</li>
          <li>Cada vacante tiene el botón «Reportar». Revisamos cada reporte.</li>
          <li>Prohibimos en nuestros <Link to="/terminos" className="font-semibold text-primary underline">términos</Link> cobrar a los candidatos. Si una empresa lo hace, la sacamos.</li>
        </ul>
      </Bloque>
      <Bloque id="paso" titulo="Si ya te pasó">
        <ol className="list-decimal space-y-2 pl-5">
          <li><strong>No envíes más dinero</strong> ni más datos, aunque te prometan devolverlo.</li>
          <li><strong>Guarda las pruebas:</strong> capturas de los mensajes, números, recibos de transferencia.</li>
          <li>Si diste datos del banco, <strong>llama a tu banco</strong> de inmediato para bloquear.</li>
          <li><strong>Denuncia</strong> ante el Departamento de Investigación de Crímenes y Delitos de Alta Tecnología (DICAT) de la Policía Nacional.</li>
          <li><Link to="/contacto" search={{ tipo: "denuncia" }} className="font-semibold text-primary underline">Repórtalo en Enlace Laboral</Link> para que lo quitemos y avisemos a otros.</li>
        </ol>
        <p className="flex items-start gap-2 rounded-2xl bg-destructive/[0.07] p-4 text-sm"><Siren className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" /> Si estás en peligro, llama al 911.</p>
      </Bloque>
    </PaginaLegal>
  );
}
