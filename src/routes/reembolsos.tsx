import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeDollarSign, CalendarX2, Undo2 } from "lucide-react";

import { Bloque, LEGAL_ACTUALIZADO, PaginaLegal } from "@/components/site/Legal";

export const Route = createFileRoute("/reembolsos")({
  head: () => ({ meta: [{ title: "Pagos y reembolsos | Enlace Laboral" }, { name: "description", content: "Cuándo pagas por los servicios de Enlace Laboral y cuándo te devolvemos tu dinero. Sin cobros automáticos." }], links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/reembolsos" }] }),
  component: Reembolsos,
});

function Reembolsos() {
  return (
    <PaginaLegal actual="/reembolsos" etiqueta="Sin letra pequeña" titulo="Pagos y reembolsos" intro={<p>Actualizado el {LEGAL_ACTUALIZADO}. Buscar empleo y publicar vacantes es gratis. Esto aplica solo a los servicios opcionales que se pagan.</p>}
      resumen={[
        { I: BadgeDollarSign, t: "Sabes el precio antes", d: "Te lo confirmamos por escrito antes de que pagues." },
        { I: CalendarX2, t: "Nada se cobra solo", d: "Sin cobros automáticos ni renovaciones escondidas." },
        { I: Undo2, t: "Si no cumplimos, te devolvemos", d: "Si no entregamos lo que pagaste, recuperas tu dinero." },
      ]}
      indice={[["como", "Cómo se paga"], ["empresas", "Servicios para empresas"], ["impulso", "Impulso Laboral (candidatos)"], ["pedir", "Cómo pedir un reembolso"], ["derechos", "Tus derechos"]]}>
      <Bloque id="como" titulo="Cómo se paga">
        <p>Primero nos pides el servicio en la página. Te escribimos con el precio, lo que incluye y los datos para pagar por transferencia. Lo activamos cuando confirmamos el pago. No guardamos números de tarjeta.</p>
      </Bloque>
      <Bloque id="empresas" titulo="Servicios para empresas">
        <ul className="list-disc pl-5">
          <li><strong>Plan Empresa:</strong> puedes probarlo gratis 14 días antes de pagar. Se paga por mes y dura el tiempo pagado; no se renueva solo. Si pagaste y no lo activamos, te devolvemos todo.</li>
          <li><strong>Destacar una vacante:</strong> pagas solo cuando la destacamos. Si no la activamos, te devolvemos el pago.</li>
          <li><strong>Reclutamiento asistido:</strong> pagas solo si contratas a una de las personas que te presentamos.</li>
        </ul>
        <p>Los precios están en <Link to="/empresas" className="font-semibold text-primary underline">Empresas</Link>.</p>
      </Bloque>
      <Bloque id="impulso" titulo="Impulso Laboral (candidatos)">
        <p>Es un servicio opcional en el que te hacemos el CV, la carta y el perfil de LinkedIn. <strong>Nunca es un requisito para aplicar.</strong> Entregamos en menos de 24 horas desde que confirmamos tu pago. Si no llegamos a tiempo, te devolvemos tu dinero. Detalles en <Link to="/impulso" className="font-semibold text-primary underline">Impulso</Link>.</p>
      </Bloque>
      <Bloque id="pedir" titulo="Cómo pedir un reembolso">
        <p>Escríbenos en <Link to="/contacto" search={{ tipo: "empresa" }} className="font-semibold text-primary underline">Contacto</Link> con tu nombre, el servicio y la fecha del pago. Te respondemos y, si corresponde, hacemos la devolución por transferencia a la misma cuenta desde donde pagaste.</p>
      </Bloque>
      <Bloque id="derechos" titulo="Tus derechos">
        <p>Esta política no quita ningún derecho que te da la Ley 358-05 de Protección de los Derechos del Consumidor o Usuario. Si no quedas conforme con nuestra respuesta, puedes acudir a Pro Consumidor.</p>
      </Bloque>
    </PaginaLegal>
  );
}
