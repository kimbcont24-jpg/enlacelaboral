import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, Gift, Scale } from "lucide-react";

import { Bloque, LEGAL_ACTUALIZADO, PaginaLegal } from "@/components/site/Legal";

export const Route = createFileRoute("/terminos")({
  head: () => ({ meta: [{ title: "Términos y condiciones | Enlace Laboral" }, { name: "description", content: "Las reglas para usar Enlace Laboral: candidatos, empresas, servicios pagados y responsabilidades. En palabras sencillas." }] }),
  component: Terminos,
});

function Terminos() {
  return (
    <PaginaLegal actual="/terminos" etiqueta="Reglas claras" titulo="Términos y condiciones" intro={<p>Actualizados el {LEGAL_ACTUALIZADO}. Son las reglas para usar Enlace Laboral. Al usar la página, las aceptas.</p>}
      resumen={[
        { I: Gift, t: "Buscar empleo es gratis", d: "Aplicar nunca cuesta. Nadie puede cobrarte por un puesto." },
        { I: Ban, t: "Cero discriminación", d: "Ninguna vacante puede pedir edad, sexo, foto ni estado civil." },
        { I: Scale, t: "Empresas reales y revisadas", d: "Con RNC o cédula. Quitamos lo que no cumple." },
      ]}
      indice={[["que", "Qué es Enlace Laboral"], ["quien", "Quién puede usarlo"], ["candidatos", "Si buscas empleo"], ["empresas", "Si eres empresa"], ["otras", "Vacantes de otras fuentes"], ["pagos", "Servicios pagados"], ["prohibido", "Lo que no está permitido"], ["contenido", "Contenido y marca"], ["responsabilidad", "Hasta dónde respondemos"], ["cambios", "Suspensión y cambios"], ["ley", "Ley aplicable"]]}>
      <Bloque id="que" titulo="Qué es Enlace Laboral">
        <p>Enlace Laboral es una página que conecta a personas que buscan empleo con empresas que contratan en República Dominicana. Publicamos vacantes, recibimos aplicaciones y damos herramientas como el creador de CV, el panel de empresas y las jornadas de empleo.</p>
        <p><strong>No somos el empleador.</strong> La decisión de contratar y la relación de trabajo son entre la persona y la empresa. No garantizamos que una aplicación termine en entrevista o en empleo.</p>
      </Bloque>
      <Bloque id="quien" titulo="Quién puede usarlo">
        <p>Cualquier persona puede ver las vacantes. Para aplicar debes tener la edad mínima para trabajar que permite la ley dominicana. Si eres menor de 18 años, la empresa debe cumplir las reglas especiales del Código de Trabajo para menores.</p>
        <p>Para publicar vacantes hay que registrar una empresa o un negocio con RNC o cédula reales.</p>
      </Bloque>
      <Bloque id="candidatos" titulo="Si buscas empleo">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Buscar empleo y aplicar en Enlace Laboral es <strong>gratis</strong>. Nadie puede cobrarte por aplicar o por conseguir un puesto en nuestra página.</li>
          <li>Ofrecemos servicios opcionales pagados, como <Link to="/impulso" className="font-semibold text-primary underline">Impulso Laboral</Link> (te hacemos el CV). Nunca son un requisito para aplicar ni te dan ventaja frente a las empresas.</li>
          <li>Puedes aplicar sin crear cuenta. La cuenta es opcional y sirve para guardar tu CV y seguir tus aplicaciones.</li>
          <li>Escribe datos reales: tu nombre, tu contacto y tu experiencia. No uses los datos de otra persona.</li>
          <li>Cuando aplicas, la empresa de esa vacante recibe tus datos. Revisa la vacante antes de enviar.</li>
          <li>Si una empresa te pide dinero, documentos que no tienen que ver con el puesto o algo que te parezca raro, no lo hagas y <Link to="/contacto" search={{ tipo: "denuncia" }} className="font-semibold text-primary underline">repórtalo</Link>. Mira cómo cuidarte en <Link to="/seguridad" className="font-semibold text-primary underline">Empleo seguro</Link>.</li>
        </ul>
      </Bloque>
      <Bloque id="empresas" titulo="Si eres empresa">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Debes dar un RNC o una cédula reales y un contacto que responda. Revisamos cada empresa y decidimos si la verificamos. Mientras no esté verificada, revisamos sus vacantes antes de mostrarlas.</li>
          <li>Publica solo puestos reales y vigentes. Cierra la vacante cuando la cubras.</li>
          <li><strong>Está prohibido discriminar.</strong> No pidas edad, sexo, foto, estado civil, religión, «buena presencia» ni nada que no tenga que ver con el trabajo. Tampoco pongas límites como «hasta 35 años» o «persona joven». Así lo establecen el Principio VII del Código de Trabajo, el artículo 39 de la Constitución y el Convenio 111 de la OIT. Nuestro sistema detiene los avisos que lo hacen.</li>
          <li><strong>Está prohibido cobrar a los candidatos</strong> por aplicar, por entrevistas, por capacitaciones o por el puesto.</li>
          <li>Usa los datos de los candidatos solo para su proceso de selección. No los vendas, no los compartas con otros y bórralos cuando ya no los necesites. Lee la <Link to="/privacidad" className="font-semibold text-primary underline">política de privacidad</Link>.</li>
          <li>Eres responsable de lo que hacen las personas que invitas a tu equipo en el panel.</li>
          <li>Podemos corregir, pausar o quitar una vacante que no cumpla estas reglas.</li>
        </ul>
      </Bloque>
      <Bloque id="otras" titulo="Vacantes de otras fuentes">
        <p>Algunas vacantes vienen de fuentes públicas, como las páginas de empleo de las mismas empresas u otros portales. En esos casos mostramos de dónde vienen. Revisamos que tengan sentido y quitamos las que parecen estafas, pero no controlamos esas fuentes: confirma siempre los datos con la empresa.</p>
      </Bloque>
      <Bloque id="pagos" titulo="Servicios pagados">
        <p>Publicar vacantes es gratis. Algunos servicios tienen costo: para empresas, el Plan Empresa, destacar una vacante o el reclutamiento asistido (precios en <Link to="/empresas" className="font-semibold text-primary underline">Empresas</Link>); para candidatos, Impulso Laboral (precios en <Link to="/impulso" className="font-semibold text-primary underline">Impulso</Link>). Lee también <Link to="/reembolsos" className="font-semibold text-primary underline">Pagos y reembolsos</Link>.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Antes de cobrar te confirmamos por escrito el precio, lo que incluye y cómo pagar. No hay cobros automáticos.</li>
          <li>Los planes duran el tiempo pagado y no se renuevan solos.</li>
          <li>Si tienes un reclamo, escríbenos. Respetamos tus derechos según la Ley 358-05 de Protección de los Derechos del Consumidor o Usuario.</li>
        </ul>
      </Bloque>
      <Bloque id="prohibido" titulo="Lo que no está permitido">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Publicar ofertas falsas, engañosas, de esquemas piramidales o que pidan dinero.</li>
          <li>Hacerte pasar por otra persona o empresa.</li>
          <li>Enviar mensajes masivos, publicidad o contenido ofensivo.</li>
          <li>Copiar en masa las vacantes o los datos de la página con programas automáticos.</li>
          <li>Intentar entrar a cuentas ajenas o dañar el funcionamiento de la página.</li>
        </ul>
      </Bloque>
      <Bloque id="contenido" titulo="Contenido y marca">
        <p>El nombre Enlace Laboral, el logo, el diseño y los textos de la página son nuestros. Lo que tú escribes (tu CV, una vacante) sigue siendo tuyo; nos das permiso para mostrarlo en la página solo para lo que pediste.</p>
      </Bloque>
      <Bloque id="responsabilidad" titulo="Hasta dónde respondemos">
        <p>Trabajamos para que la página funcione bien y la información sea correcta, pero puede haber errores o momentos sin servicio. No respondemos por lo que una empresa o un candidato diga, haga o deje de hacer, ni por decisiones de contratación. Lo que dice cada vacante es responsabilidad de quien la publica.</p>
      </Bloque>
      <Bloque id="cambios" titulo="Suspensión y cambios">
        <p>Podemos suspender o cerrar cuentas que incumplan estas reglas. Podemos cambiar estos términos; si el cambio es importante, lo avisaremos en la página. La fecha de arriba dice cuándo se actualizaron.</p>
      </Bloque>
      <Bloque id="ley" titulo="Ley aplicable">
        <p>Estos términos se rigen por las leyes de la República Dominicana. Aceptarlos en la página es válido según la Ley 126-02 de Comercio Electrónico, Documentos y Firmas Digitales. Cualquier conflicto se resolverá ante los tribunales dominicanos. Antes de eso, escríbenos en <Link to="/contacto" className="font-semibold text-primary underline">Contacto</Link> para buscar una solución.</p>
      </Bloque>
    </PaginaLegal>
  );
}
