import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';

interface TdrTemplatePageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
export const initialTemplateData: Record<string, { aplica: boolean; html: string }> = {

  // ══════════════════════════════════════════════════════════════════
  // DOC 1: TÉRMINOS DE REFERENCIA
  // ══════════════════════════════════════════════════════════════════

  tdr_denominacion: {
    aplica: true,
    html: `<table class="excel-table" style="margin-bottom:0;">
  <tbody>
    <tr>
      <td colspan="3" class="ehl" style="text-align:center; padding:6px;">DETALLE DE LA SOLICITUD</td>
    </tr>
  </tbody>
</table>
<table class="excel-table" style="margin-top:-1px;">
  <tbody>
    <tr>
      <td class="tc fb" rowspan="3" style="width:4%; vertical-align:middle; background:#f2f2f2; border:1px solid #000;">1</td>
      <td class="fb" style="width:28%; background:#f2f2f2; border:1px solid #000; padding:8px 10px;">DENOMINACIÓN DE LA CONTRATACIÓN</td>
      <td contenteditable="false" style="background:#e8f5e3; border:1px solid #000; padding:8px 10px; font-style:italic; text-align:justify;">{{DENOMINACION}}</td>
    </tr>
    <tr>
      <td class="fb" style="background:#f2f2f2; border:1px solid #000; padding:8px 10px; vertical-align:top;">DESCRIPCIÓN DEL SERVICIO (OBJETIVO DE LA CONTRATACIÓN)</td>
      <td contenteditable="false" style="background:#e8f5e3; border:1px solid #000; padding:8px 10px; font-style:italic; text-align:justify;">{{DESCRIPCION_SERVICIO}}</td>
    </tr>
    <tr>
      <td class="fb" style="background:#f2f2f2; border:1px solid #000; padding:8px 10px; vertical-align:top;">FINALIDAD PÚBLICA</td>
      <td contenteditable="false" style="background:#e8f5e3; border:1px solid #000; padding:8px 10px; font-style:italic; text-align:justify; line-height:1.5;">{{FINALIDAD_PUBLICA}}</td>
    </tr>
  </tbody>
</table>`,
  },

  tdr_colaborador: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">DETALLE DEL COLABORADOR QUE COORDINARÁ CON EL OEC Y PROVEEDOR</td>
    </tr>
    <tr>
      <td class="fb" style="width:35%;">UNIDAD ORGANIZACIONAL</td>
      <td class="dd" contenteditable="false">{{UNIDAD}}</td>
    </tr>
    <tr>
      <td class="fb">PERSONAL DE CONTACTO</td>
      <td class="dd" contenteditable="false">{{CONTACTO_NOMBRE}}</td>
    </tr>
    <tr>
      <td class="fb">CORREO ELECTRÓNICO</td>
      <td class="dd" contenteditable="false">{{CONTACTO_CORREO}}</td>
    </tr>
    <tr>
      <td class="fb">CELULAR</td>
      <td class="dd" contenteditable="false">{{CONTACTO_CELULAR}}</td>
    </tr>
  </tbody>
</table>`,
  },

  tdr_entregables_nota: {
    aplica: true,
    html: `<p style="font-size:9px; font-style:italic; margin:4px 0 10px 0; color:#555;">
  Nota: La fecha de inicio del servicio (del primer entregable) será en función a lo indicado por el área usuaria, o al día siguiente de notificada la orden, en cuyo caso las fechas de inicio y fin (de los entregables) podrían ser modificadas, manteniendo el plazo total de ejecución.
</p>`,
  },

  tdr_lugar_plazo: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">LUGAR, PLAZO Y HORARIO DE LA PRESTACIÓN</td>
    </tr>
    <tr>
      <td class="fb" style="width:40%;">DIRECCIÓN EXACTA DE LA PRESTACIÓN</td>
      <td style="padding:6px 10px;">El servicio se realizará en Calle Morelli 109 - San Borja, cuya presencialidad será a solicitud del Ministerio de Educación</td>
    </tr>
    <tr>
      <td class="fb">PLAN DE TRABAJO (DE CORRESPONDER)</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb">HORARIO DE EJECUCIÓN (DE CORRESPONDER)</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb">PLAZO DE EJECUCIÓN DEL SERVICIO</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{PLAZO_EJECUCION}} días calendario</td>
    </tr>
    <tr>
      <td class="fb">REQUIERE SER EFECTUADO FUERA DEL HORARIO DE OFICINA (DE CORRESPONDER)</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb">MODALIDAD DE PRESTACIÓN DEL SERVICIO</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{MODALIDAD}}</td>
    </tr>
    <tr>
      <td class="fb">MATERIALES, EQUIPOS E INSTALACIONES (DE CORRESPONDER)</td>
      <td style="padding:8px 10px; font-size:10px; line-height:1.5;">
        Previa coordinación con el proveedor, este deberá contar, según la naturaleza de la prestación del servicio, con lo siguiente:<br/>
        * Equipo de cómputo para el desarrollo de las actividades<br/>
        * Conectividad a internet que garantice la realización de las actividades señaladas en el numeral 3 del presente documento.<br/>
        * Constancia vigente del cuestionario de salud durante todo el periodo de prestación del servicio.<br/><br/>
        En caso deba asistir presencialmente, adicionalmente deberá contar con:<br/>
        * Todos los protocolos indicados por el MINEDU.<br/>
        * Cuestionario de salud habilitado para acceso presencial al MINEDU y/o el requerimiento que el servicio lo amerite.
      </td>
    </tr>
  </tbody>
</table>`,
  },

  tdr_actividades: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">CARACTERÍSTICAS Y CONDICIONES DEL SERVICIO</td>
    </tr>
    <tr>
      <td class="ehl" colspan="2">ACTIVIDADES</td>
    </tr>
    <tr>
      <td colspan="2" class="dd" contenteditable="false" style="padding:8px 10px;">{{ACTIVIDADES_LISTA}}</td>
    </tr>
  </tbody>
</table>`,
  },

  // ← CAMBIOS: NIVEL_FORMACION, DESCRIPCION_CARGO_REQUERIDO, CAPACITACION_REQUERIDA ya son variables
  tdr_requisitos: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">REQUISITOS DEL PROVEEDOR</td>
    </tr>
    <tr>
      <td class="fb" style="width:40%;">REQUIERE PERSONAL ESPECIALIZADO</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="ehl" colspan="2">REQUISITOS MÍNIMOS DEL PROVEEDOR</td>
    </tr>
    <tr>
      <td class="fb">NIVEL DE FORMACIÓN</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{NIVEL_FORMACION}}</td>
    </tr>
    <tr>
      <td class="fb">EXPERIENCIA GENERAL (en años):</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{EXP_GENERAL_REQUERIDA}}<br/>Experiencia general en la Administración Pública y/o Privada</td>
    </tr>
    <tr>
      <td class="fb">EXPERIENCIA ESPECÍFICA (en años):</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{EXP_ESPECIFICA_REQUERIDA}}<br/>{{DESCRIPCION_CARGO_REQUERIDO}}</td>
    </tr>
    <tr>
      <td class="fb">CAPACITACIÓN / ENTRENAMIENTO</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{CAPACITACION_REQUERIDA}}</td>
    </tr>
    <tr>
      <td class="fb">CÓDIGO DE LA UNIDAD</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{CODIGO_UNICO}}</td>
    </tr>
  </tbody>
</table>`,
  },

  // ← CAMBIO: TOTAL DE PAGOS ahora es {{TOTAL_ARMADAS}}
  tdr_conformidad: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">UNIDAD ORGÁNICA QUE OTORGARÁ LA CONFORMIDAD Y FORMA DE PAGO</td>
    </tr>
    <tr>
      <td class="fb" style="width:40%; vertical-align:top;">UNIDAD QUE OTORGA CONFORMIDAD</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{UNIDAD}}</td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">FORMA DE PAGO</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{FORMA_PAGO}}</td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">TOTAL DE PAGOS</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{TOTAL_ARMADAS}}</td>
    </tr>
    <tr>
      <td class="ehl" colspan="2">Garantías</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 10px;">No aplica</td>
    </tr>
    <tr>
      <td class="ehl" colspan="2">Conformidad</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        La conformidad de la prestación del servicio se regula por lo dispuesto en el artículo 144 del Reglamento de la Ley N° 32069, Ley General de Contrataciones Públicas, aprobado mediante Decreto Supremo N° 009-2025. La conformidad es otorgada por el área usuaria en el plazo máximo de SIETE (7) DÍAS O MÁXIMO VEINTE (20) DÍAS, EN CASO SE REQUIERA EFECTUAR PRUEBAS QUE PERMITAN VERIFICAR EL CUMPLIMIENTO DE LA OBLIGACIÓN días computados desde el día siguiente de recibido el entregable.<br/><br/>
        De existir observaciones, la DEC las comunica al CONTRATISTA, indicando claramente el sentido de estas, otorgándole un plazo para subsanar NO MAYOR AL 30% DEL PLAZO DEL ENTREGABLE CORRESPONDIENTE, DEPENDIENDO DE LA COMPLEJIDAD O SOFISTICACIÓN DE LAS SUBSANACIONES A REALIZAR. Si pese al plazo otorgado, EL CONTRATISTA no cumpliese a cabalidad con la subsanación, la DEC puede otorgar al CONTRATISTA periodos adicionales para las correcciones pertinentes.
      </td>
    </tr>
    <tr>
      <td class="ehl" colspan="2">Forma y Condiciones de Pago</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        El pago se realiza de conformidad con lo establecido en el artículo 67 de la Ley. La DEC paga las contraprestaciones pactadas a favor del contratista dentro de los diez (10) días hábiles siguientes de otorgada la conformidad por parte del área usuaria y es prorrogable, previa justificación de la demora, por cinco días hábiles.<br/><br/>
        Para efectos del pago de las contraprestaciones ejecutadas por el contratista, la DEC debe contar con la siguiente documentación:<br/>
        - Documento en el que conste la conformidad de la prestación efectuada suscrita por el servidor responsable del ÁREA RESPONSABLE DE OTORGAR LA CONFORMIDAD.<br/>
        - Comprobante de pago.<br/>
        - OTRA DOCUMENTACIÓN NECESARIA A SER PRESENTADA PARA EL PAGO ÚNICO O LOS PAGOS A CUENTA, DE CORRESPONDER.<br/><br/>
        En caso de retraso en el pago por parte de la DEC, salvo que se deba a caso fortuito o fuerza mayor, EL CONTRATISTA tiene derecho al pago de intereses legales conforme a lo establecido en el artículo 67 de la Ley N° 32069, Ley General de Contrataciones Públicas.
      </td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">TIPO DE PENALIDAD A APLICAR</td>
      <td style="padding:6px 10px;">POR ENTREGABLE - PREVIA CONFORMIDAD</td>
    </tr>
  </tbody>
</table>`,
  },

  tdr_penalidades: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="3">PENALIDADES / VICIOS OCULTOS</td>
    </tr>
    <tr>
      <td class="fb" style="width:25%; vertical-align:top;">FORMA DE CÁLCULO</td>
      <td style="width:45%; padding:8px 10px; text-align:center; font-size:10px;">
        <strong>Penalidad diaria = <span style="text-decoration:underline;">0.10 x monto</span></strong><br/>
        <strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;F x plazo</strong><br/><br/>
        Donde F tiene los siguientes valores:<br/>
        <strong>Para bienes y servicios: F= 0.40</strong>
      </td>
      <td style="width:30%; padding:8px 10px; font-size:9px; vertical-align:top;">
        MONTO MÁXIMO APLICABLE<br/><br/>
        La entidad contratante puede establecer penalidades en el contrato menor. La suma de la aplicación de las penalidades por mora y de otras penalidades no puede exceder el 10% del monto del entregable correspondiente.
      </td>
    </tr>
    <tr>
      <td class="fb">SE APLICARÁ PENALIDADES ADICIONALES</td>
      <td colspan="2" style="padding:6px 10px;">NO APLICA</td>
    </tr>
    <tr>
      <td class="fb">PLAZO POR VICIOS OCULTOS</td>
      <td colspan="2" style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
  </tbody>
</table>`,
  },

  tdr_condiciones_complementarias: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">CONDICIONES COMPLEMENTARIAS</td>
    </tr>
    <tr>
      <td class="fb" style="width:40%;">MANTENIMIENTO PREVENTIVO</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb">SOPORTE TÉCNICO</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb">CAPACITACIÓN O ENTRENAMIENTO</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb">GARANTÍA</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
  </tbody>
</table>`,
  },

  tdr_clausulas: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">OTRAS OBLIGACIONES DE PARTE DEL PROVEEDOR</td>
    </tr>
    <tr>
      <td class="fb" style="width:30%; vertical-align:top;">Cláusula Anticorrupción y Antisoborno</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        A la suscripción de este contrato, EL CONTRATISTA declara y garantiza no haber ofrecido, negociado, prometido o efectuado ningún pago o entrega de cualquier beneficio o incentivo ilegal, de manera directa o indirecta, a los evaluadores del proceso de contratación o cualquier servidor de la DEC.<br/><br/>
        Asimismo, EL CONTRATISTA se obliga a mantener una conducta proba e íntegra durante la vigencia del contrato, y después de culminado el mismo en caso existan controversias pendientes de resolver.<br/><br/>
        Adicionalmente, EL CONTRATISTA se compromete a denunciar oportunamente ante las autoridades competentes los actos de corrupción o de inconducta funcional de los cuales tuviera conocimiento durante la ejecución del contrato con la DEC.<br/><br/>
        Finalmente, el incumplimiento de las obligaciones establecidas en esta cláusula, durante la ejecución contractual, otorga a la DEC el derecho de resolver total o parcialmente el contrato.
      </td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">Cláusula Solución de Controversias</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        Las controversias que surjan entre las partes durante la ejecución del contrato se resuelven mediante conciliación. Cualquiera de las partes tiene el derecho a solicitar una conciliación dentro del plazo de caducidad correspondiente, según lo señalado en el artículo 82 de la Ley N° 32069, Ley General de Contrataciones Públicas, sin perjuicio de recurrir al arbitraje, en caso no se llegue a un acuerdo entre ambas partes o se llegue a un acuerdo parcial. Las controversias sobre nulidad del contrato solo pueden ser sometidas a arbitraje.
      </td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">Resolución del Contrato</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        Cualquiera de las partes puede resolver el contrato, de conformidad con el numeral 68.1 del artículo 68 de la Ley N° 32069, Ley General de Contrataciones Públicas. De encontrarse en alguno de los supuestos de resolución del contrato, LAS PARTES procederán de acuerdo con lo establecido en el artículo 122 del Reglamento de la Ley N° 32069.
      </td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">Cláusula Gestión de Riesgos</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        Las partes realizan la gestión de riesgos de acuerdo con lo establecido en el presente documento, a fin de tomar decisiones informadas, aprovechando el impacto de riesgos positivos y disminuyendo la probabilidad de los riesgos negativos y su impacto durante la ejecución contractual, considerando la finalidad pública de la contratación.
      </td>
    </tr>
    <tr>
      <td class="fb">SEGUROS APLICABLES</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">CONFIDENCIALIDAD</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        a) EL PROVEEDOR se compromete a mantener en reserva y a no revelar a terceros, sin previa autorización escrita de EL MINEDU, información que le sea suministrada por ésta última y/o sea obtenida en el ejercicio de las actividades a desarrollarse o conozca directa o indirectamente durante el proceso de selección o para la realización de sus tareas, excepto en cuanto resultare estrictamente necesario para el cumplimiento del contrato.<br/><br/>
        b) EL PROVEEDOR deberá mantener a perpetuidad la confidencialidad y reserva absoluta en el manejo de cualquier información y documentación a la que se tenga acceso a consecuencia del procedimiento de selección y la ejecución del Contrato, quedando prohibida su revelación a terceros.<br/><br/>
        c) Dicha obligación comprende la información que se entrega, como también la que se genera durante la realización de las actividades previas a la ejecución del Contrato, durante su ejecución y la producida una vez que se haya concluido el Contrato.<br/><br/>
        d) Dicha información puede consistir en informes, recomendaciones, cálculos, documentos y demás datos compilados o recibidos por EL PROVEEDOR.<br/><br/>
        e) Asimismo, aun cuando sea de índole pública, la información vinculada al procedimiento de contratación, incluyendo su ejecución y conclusión, no podrá ser utilizada por EL PROVEEDOR para fines publicitarios o de difusión por cualquier medio sin obtener la autorización correspondiente de EL MINEDU.<br/><br/>
        f) Los documentos técnicos, estudios, informes, grabaciones, películas, programas informáticos y todos los demás que formen parte de su oferta y que se deriven de las prestaciones contratadas serán de exclusiva propiedad de EL MINEDU.
      </td>
    </tr>
  </tbody>
</table>`,
  },

  tdr_otras_obligaciones: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">OTRAS OBLIGACIONES DE PARTE DEL PROVEEDOR</td>
    </tr>
    <tr>
      <td class="fb" style="width:40%; vertical-align:top;">DERECHOS PARA EL USO DE IMAGEN PERSONAL</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">RETIRO DEL PERSONAL ASIGNADO AL SERVICIO</td>
      <td style="padding:6px 10px;">NO CORRESPONDE</td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">LEY Nº 31564 - LEY DE PREVENCIÓN Y MITIGACIÓN DEL CONFLICTO DE INTERESES EN EL ACCESO Y SALIDA DE PERSONAL DEL SERVICIO PÚBLICO</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        Son causales de resolución de contrato la presentación con información inexacta o falsa de la Declaración Jurada de Prohibiciones e Incompatibilidades a que se hace referencia en la Ley de prevención y mitigación del conflicto de intereses en el acceso y salida de personal del servicio público. Asimismo, en caso se incumpla con los impedimentos señalados en el artículo 5 de dicha ley se aplicará la inhabilitación por cinco años para contratar o prestar servicios al Estado, bajo cualquier modalidad; conforme a lo establecido en el segundo párrafo del artículo 8 de la Ley N° 31564.
      </td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">COMPROMISO DE CUMPLIR Y OBSERVAR LO ESTABLECIDO EN LA LEY DE SEGURIDAD Y SALUD EN EL TRABAJO (APROBADO MEDIANTE LEY N° 29783) Y EN SU REGLAMENTO (APROBADO MEDIANTE DECRETO SUPREMO Nº 005-2012-TR)</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        El PROVEEDOR se compromete a cumplir y a observar lo establecido en la Ley de Seguridad y Salud en el Trabajo y su Reglamento, así como de otras disposiciones legales vinculadas durante la ejecución de las prestaciones a su cargo; obligándose a dotar, proveer y/o administrar a cada uno de sus trabajadores los implementos de seguridad que corresponda de acuerdo al grado y/o nivel de riesgo que pueda evidenciarse en el desarrollo de las actividades propias de la presente contratación dentro de las instalaciones del MINEDU; así como garantizar la contratación de los respectivos seguros de acuerdo a la normatividad vigente.<br/><br/>
        Del mismo modo, EL PROVEEDOR se compromete a cumplir y respetar cada una de las medidas de seguridad previstas en el Reglamento Interno de Seguridad y Salud en el Trabajo de EL MINEDU, bajo apercibimiento de RESOLVER EL CONTRATO en el supuesto que incumpla los requisitos dispuestos por la normatividad correspondiente; documento que será entregado por EL MINEDU a la suscripción del contrato o notificación de la Orden de Compra/Servicio.
      </td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">PROPIEDAD INTELECTUAL</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        a) EL PROVEEDOR se compromete a no usar el nombre de EL MINEDU ni hacer referencia al bien o servicio materia del presente contrato, en cualquier promoción, publicidad o anuncio, sin previa autorización de EL MINEDU. Los documentos técnicos, estudios, informes, grabaciones, películas, programas y todos los demás que formen parte de su oferta y que se deriven de las prestaciones contratadas serán de propiedad exclusiva de EL MINEDU.<br/><br/>
        b) EL PROVEEDOR deberá indemnizar y eximir de cualquier responsabilidad a EL MINEDU y a sus empleados y funcionarios, por cualquier litigio, acción legal o procedimiento administrativo, reclamación, demanda, pérdida, daño, costo y gasto cualquiera sea su naturaleza, incluidos los honorarios y gastos de representación legal, en los cuales pueda incurrir EL MINEDU como resultado de cualquier trasgresión o supuesta trasgresión de cualquier patente, uso de modelo, diseño registrado, marca registrada, derechos de autor o cualquier otro derecho de propiedad intelectual.<br/><br/>
        c) Si se entablará una demanda o reclamación contra EL MINEDU como resultado de cualquiera de las situaciones indicadas, EL MINEDU notificará con prontitud al proveedor, y éste podrá, a su propio costo y a nombre de EL MINEDU, proceder con tales acciones legales o reclamaciones.<br/><br/>
        d) Si EL PROVEEDOR no cumpliese con la obligación de informar a la Entidad dentro del plazo de ley contado a partir de la fecha del recibo de tal notificación, de su intención de proceder con cualquier acción legal o reclamación, EL MINEDU tendrá derecho a emprender dichas acciones o reclamaciones a nombre propio.<br/><br/>
        e) EL MINEDU se compromete a brindarle al proveedor, cuando éste así lo solicite, cualquier asistencia que estuviese a su alcance para que EL PROVEEDOR pueda contestar las citadas acciones legales o reclamaciones.
      </td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">Sobre la Declaración Jurada de Intereses</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        Es pertinente recordarle que, conforme al artículo 3 de la Ley Nº 31227, las personas que participen en las actividades señaladas en dicho artículo se encuentran obligadas a presentar la declaración jurada de intereses; obligación que será exigible cuando se implemente el Sistema de Declaraciones Juradas para la Gestión de Conflictos de Intereses de la Contraloría General de la República.
      </td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">Responsables de la Solicitud y Autorización del Requerimiento</td>
      <td style="padding:8px 10px; text-align:justify; line-height:1.5; font-size:10px;">
        Las Áreas Usuarias deben gestionar y contar necesariamente, para la contratación de servicios prestados por terceros (Locadores de Servicios), la autorización previa del órgano de Alta Dirección del cual dependen, o de la Secretaría de Planificación Estratégica, según corresponda; ello conforme a lo dispuesto en el último párrafo del numeral 8.1.1. del acápite denominado Disposiciones Específicas, concordado con el Memorándum Múltiple N° 039-2023-MINEDU/SG; debiendo además de ello adjuntar la Estructura de Costo de la prestación.
      </td>
    </tr>
  </tbody>
</table>`,
  },

  tdr_firma: {
    aplica: true,
    html: `<table style="width:100%; border-collapse:collapse; margin-top:50px; border:none;">
  <tbody>
    <tr>
      <td style="border:none; text-align:center; width:50%;">
        <div style="border-top:1px solid #000; width:70%; margin:0 auto; padding-top:5px; font-size:10px;">FIRMA DEL LOCADOR</div>
      </td>
      <td style="border:none; text-align:center; width:50%;">
        <div style="border-top:1px solid #000; width:70%; margin:0 auto; padding-top:5px; font-size:10px;">V°B° ÁREA USUARIA</div>
      </td>
    </tr>
  </tbody>
</table>`,
  },

  // ══════════════════════════════════════════════════════════════════
  // DOC 2: ESTRUCTURA DE COSTOS
  // ← CAMBIO: ahora incluye {{UNIDAD}} y {{HONORARIO_TOTAL}}
  // ══════════════════════════════════════════════════════════════════

  estructura_costos_intro: {
    aplica: true,
    html: `<table class="excel-table" style="margin-bottom:8px;">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">ESTRUCTURA DE COSTOS PARA LA CONTRATACIÓN DE SERVICIOS DE LOCACIÓN</td>
    </tr>
    <tr>
      <td class="fb" style="width:35%;">Área usuaria</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{UNIDAD}}</td>
    </tr>
  </tbody>
</table>
<p style="font-size:10px; text-align:justify; line-height:1.6; margin-bottom:6px;">
  señala a continuación los rubros que componen el siguiente servicio de manera que permitan identificar la proporción que cada uno de estos representa,
  considerando los conceptos que tienen directa incidencia en el costo del servicio de:
</p>
<div contenteditable="false" style="border:1px solid #000; padding:8px; font-size:10px; font-style:italic; margin-bottom:10px; background:#e8f5e3;">{{DENOMINACION}}</div>
<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">RUBRO 01: Honorarios Profesionales</td>
    </tr>
    <tr>
      <td style="padding:6px 10px; font-size:10px;">Honorarios Profesionales a todo costo por la totalidad del servicio</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px; text-align:right; width:25%;">S/. {{HONORARIO_TOTAL}}</td>
    </tr>
    <tr>
      <td class="fb" style="padding:6px 10px;">SUB TOTAL S/.</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px; text-align:right;">S/. {{HONORARIO_TOTAL}}</td>
    </tr>
    <tr>
      <td class="ehl" colspan="2">RUBRO 02: Desplazamiento</td>
    </tr>
    <tr>
      <td style="padding:6px 10px; font-size:10px;">Desplazamiento</td>
      <td style="padding:6px 10px; text-align:right;">S/. -</td>
    </tr>
    <tr>
      <td class="fb" style="padding:6px 10px;">SUB TOTAL S/.</td>
      <td style="padding:6px 10px; text-align:right;">S/. -</td>
    </tr>
    <tr>
      <td class="ehl" colspan="2">RUBRO 03: Otros</td>
    </tr>
    <tr>
      <td style="padding:6px 10px; font-size:10px;">—</td>
      <td style="padding:6px 10px; text-align:right;">S/. -</td>
    </tr>
    <tr>
      <td class="fb" style="padding:6px 10px;">COSTO TOTAL DEL SERVICIO</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px; text-align:right; font-weight:bold;">S/. {{HONORARIO_TOTAL}}</td>
    </tr>
  </tbody>
</table>`,
  },

  // ══════════════════════════════════════════════════════════════════
  // DOC 3: SUSTENTO PROVEEDOR ESPECÍFICO
  // ══════════════════════════════════════════════════════════════════

  sustento_introduccion: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">1. DETALLE DEL REQUERIMIENTO</td>
    </tr>
    <tr>
      <td class="fb" style="width:40%;">OBJETO DE LA CONTRATACIÓN</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{DENOMINACION}}</td>
    </tr>
  </tbody>
</table>`,
  },

  sustento_analisis: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">2. ANÁLISIS RESPECTO DE LA CONTRATACIÓN CON PROVEEDOR ESPECÍFICO</td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top; padding:8px 10px; width:40%; font-size:10px;">
        DETALLE OBJETIVAMENTE LOS MOTIVOS QUE HAGAN NECESARIA LA CONTRATACIÓN CON DETERMINADO PROVEEDOR<br/>
        <span style="font-size:9px; font-weight:normal; color:#666;">Debe existir coherencia entre la necesidad existente, el tipo de prestación y el proveedor con el que se solicita la contratación</span>
      </td>
      <td class="dd" contenteditable="false" style="padding:8px 10px; text-align:justify;">{{OBJETIVO_SUSTENTO}}</td>
    </tr>
    <tr>
      <td class="fb">SE VERIFICÓ CUMPLIMIENTO DE LOS REQUISITOS MÍNIMOS ESTABLECIDOS EN LOS TDR O EETT</td>
      <td style="padding:6px 10px;">SÍ</td>
    </tr>
  </tbody>
</table>`,
  },

  sustento_conclusiones: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">3. CONCLUSIONES</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:10px; text-transform:uppercase; text-align:justify; line-height:1.5; font-size:10px;">
        CONFORME LO EXPUESTO EN LA SECCIÓN 2 DEL PRESENTE FORMATO, SE CONCLUYE QUE LA CONTRATACIÓN DEBE EFECTUARSE CON EL PROVEEDOR CUYO DETALLE Y CONTACTO SE INDICA A CONTINUACIÓN:
      </td>
    </tr>
    <tr>
      <td class="fb" style="width:40%;">RAZÓN SOCIAL</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
    <tr>
      <td class="fb">RUC DEL PROVEEDOR</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{LOCADOR_RUC}}</td>
    </tr>
    <tr>
      <td class="fb">PERSONA DE CONTACTO DEL PROVEEDOR</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
    <tr>
      <td class="fb">CORREO ELECTRÓNICO DEL PROVEEDOR</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{LOCADOR_CORREO}}</td>
    </tr>
    <tr>
      <td class="fb">TELÉFONO</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{LOCADOR_TELEFONO}}</td>
    </tr>
    <tr>
      <td class="fb" style="vertical-align:top;">DOCUMENTOS QUE ADJUNTA</td>
      <td style="padding:8px 10px; font-size:10px; line-height:1.6;">
        *Hoja de vida según TDR<br/>
        *RUC<br/>
        *RNP<br/>
        *DNI vigente
      </td>
    </tr>
  </tbody>
</table>`,
  },

  sustento_responsable: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2">4. FUNCIONARIO RESPONSABLE</td>
    </tr>
    <tr>
      <td colspan="2" style="height:90px; vertical-align:bottom; padding-bottom:10px; border:1px solid #000;">
        <div style="border-top:1px solid #000; width:300px; margin:0 auto; text-align:center; padding-top:5px; font-size:10px; font-weight:bold;">
          FIRMA Y SELLO DEL FUNCIONARIO QUE APRUEBA EL REQUERIMIENTO<sup style="font-size:8px;">5</sup>
        </div>
      </td>
    </tr>
    <tr>
      <td class="ehl" colspan="2">LUGAR Y FECHA</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:6px 10px;">Lima, <span class="dd" contenteditable="false">{{FECHA_HOY}}</span></td>
    </tr>
  </tbody>
</table>
<p style="font-size:9px; font-style:italic; margin-top:4px;"><sup>5</sup> Funcionario de la unidad orgánica, mínimo de tercer nivel organizacional, que tiene bajo su cargo el ÁREA USUARIA o AT.</p>`,
  },

  // ══════════════════════════════════════════════════════════════════
  // DOC 4: PROPUESTA ECONÓMICA
  // ← CAMBIO: cabecera del locador con DNI y domicilio + monto desde BD
  // ══════════════════════════════════════════════════════════════════

  propuesta_economica_cabecera: {
    aplica: true,
    html: `<table class="excel-table" style="margin-bottom:10px;">
  <tbody>
    <tr>
      <td class="fb" style="width:35%;">Apellidos y Nombres</td>
      <td class="dd" contenteditable="false">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
    <tr>
      <td class="fb">RUC N°</td>
      <td class="dd" contenteditable="false">{{LOCADOR_RUC}}</td>
    </tr>
    <tr>
      <td class="fb">DNI / CE N°</td>
      <td class="dd" contenteditable="false">{{LOCADOR_DNI}}</td>
    </tr>
    <tr>
      <td class="fb">Domicilio</td>
      <td class="dd" contenteditable="false">{{LOCADOR_DOMICILIO}}</td>
    </tr>
    <tr>
      <td class="fb">Cotización que formulo a fecha</td>
      <td class="dd" contenteditable="false">{{FECHA_HOY}}</td>
    </tr>
  </tbody>
</table>`,
  },

  propuesta_economica_cuerpo: {
    aplica: true,
    html: `<p style="font-size:10px; text-align:justify; line-height:1.6; margin-bottom:10px;">
  Al respecto declaro bajo juramento conocer todos los alcances del requerimiento del mencionado servicio, sobre los cuales declaro que acepto y me someto a los Términos de Referencia indicados, por lo cual alcanzo mi propuesta económica como proveedor, la cual es la siguiente:
</p>`,
  },

  propuesta_economica_monto: {
    aplica: true,
    html: `<table class="excel-table" style="margin-top:10px;">
  <tbody>
    <tr>
      <td class="ehl" colspan="2" style="text-align:center;">MONTO DEL SERVICIO</td>
    </tr>
    <tr>
      <td class="fb" style="width:40%;">Monto Total</td>
      <td class="dd" contenteditable="false" style="text-align:center; font-size:14px; font-weight:bold;">S/ {{HONORARIO_TOTAL}}</td>
    </tr>
  </tbody>
</table>`,
  },

  // ══════════════════════════════════════════════════════════════════
  // NUEVO — DOC: HOJA DE VIDA — Datos personales del locador
  // ← NUEVO: fecha nac, lugar nac, estado civil, nacionalidad
  // ══════════════════════════════════════════════════════════════════

  hoja_vida_datos_personales: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="4">FORMATO ESTÁNDAR DE HOJA DE VIDA</td>
    </tr>
    <tr>
      <td class="ehl" colspan="4">DATOS PERSONALES</td>
    </tr>
    <tr>
      <td class="fb" style="width:25%;">APELLIDOS Y NOMBRES</td>
      <td class="dd" contenteditable="false" colspan="3">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
    <tr>
      <td class="fb">LUGAR DE NACIMIENTO</td>
      <td class="dd" contenteditable="false">{{LOCADOR_LUGAR_NAC}}</td>
      <td class="fb">FECHA DE NACIMIENTO</td>
      <td class="dd" contenteditable="false">{{LOCADOR_FECHA_NAC}}</td>
    </tr>
    <tr>
      <td class="fb">ESTADO CIVIL</td>
      <td class="dd" contenteditable="false">{{LOCADOR_ESTADO_CIVIL}}</td>
      <td class="fb">NACIONALIDAD</td>
      <td class="dd" contenteditable="false">{{LOCADOR_NACIONALIDAD}}</td>
    </tr>
    <tr>
      <td class="ehl" colspan="4">DIRECCIÓN Y MEDIOS DE CONTACTO</td>
    </tr>
    <tr>
      <td class="fb">DNI / CE N°</td>
      <td class="dd" contenteditable="false">{{LOCADOR_DNI}}</td>
      <td class="fb">RUC</td>
      <td class="dd" contenteditable="false">{{LOCADOR_RUC}}</td>
    </tr>
    <tr>
      <td class="fb">Domicilio</td>
      <td class="dd" contenteditable="false" colspan="3">{{LOCADOR_DOMICILIO}}</td>
    </tr>
    <tr>
      <td class="fb">Línea Celular</td>
      <td class="dd" contenteditable="false">{{LOCADOR_TELEFONO}}</td>
      <td class="fb">Correo electrónico</td>
      <td class="dd" contenteditable="false">{{LOCADOR_CORREO}}</td>
    </tr>
  </tbody>
</table>`,
  },

  // ══════════════════════════════════════════════════════════════════
  // NUEVO — DOC: CCI — Carta autorización de pago
  // ← NUEVO: banco y CCI desde BD
  // ══════════════════════════════════════════════════════════════════

  cci_carta_pago: {
    aplica: true,
    html: `<table class="excel-table">
  <tbody>
    <tr>
      <td class="ehl" colspan="2" style="text-align:center;">CCI - CARTA DE AUTORIZACIÓN DE PAGO</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 10px; font-size:10px; text-align:justify; line-height:1.6;">
        Por medio de la presente, comunico a Usted que el número de CÓDIGO DE CUENTA INTERBANCARIO (CCI) que consta de (20 NUMEROS) es:
      </td>
    </tr>
    <tr>
      <td class="fb" style="width:40%;">NOMBRE DEL BANCO</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{LOCADOR_BANCO}}</td>
    </tr>
    <tr>
      <td class="fb">CCI (20 dígitos)</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px; font-family:monospace; letter-spacing:2px;">{{LOCADOR_CCI}}</td>
    </tr>
    <tr>
      <td class="fb">PROVEEDOR</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
    <tr>
      <td class="fb">RUC N°</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{LOCADOR_RUC}}</td>
    </tr>
    <tr>
      <td class="fb">Fecha</td>
      <td class="dd" contenteditable="false" style="padding:6px 10px;">{{FECHA_HOY}}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 10px; font-size:9px; color:#555; font-style:italic;">
        NOTA: EL CCI DEBE ESTAR VINCULADO ÚNICAMENTE CON EL RUC
      </td>
    </tr>
  </tbody>
</table>`,
  },

  // ══════════════════════════════════════════════════════════════════
  // DJs LEGALES — cabecera del locador + cuerpos
  // ← CAMBIO: todas las DJs ahora tienen cabecera con datos del locador
  // ══════════════════════════════════════════════════════════════════

  dj_cabecera_locador: {
    aplica: true,
    html: `<table class="excel-table" style="margin-bottom:10px;">
  <tbody>
    <tr>
      <td class="fb" style="width:35%;">El/La que suscribe (Apellidos y Nombres)</td>
      <td class="dd" contenteditable="false">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
    <tr>
      <td class="fb">con RUC N°</td>
      <td class="dd" contenteditable="false">{{LOCADOR_RUC}}</td>
    </tr>
    <tr>
      <td class="fb">identificado(a) con DNI / CE N°</td>
      <td class="dd" contenteditable="false">{{LOCADOR_DNI}}</td>
    </tr>
    <tr>
      <td class="fb">Domicilio</td>
      <td class="dd" contenteditable="false">{{LOCADOR_DOMICILIO}}</td>
    </tr>
  </tbody>
</table>`,
  },

  dj_anticorrupcion_cuerpo: {
    aplica: true,
    html: `<p style="font-size:10px; margin-bottom:8px;">Que para la prestación:</p>
<div class="solid-box dd fb" style="margin-bottom:10px; font-size:10px; border:1.5px solid #000; padding:8px; text-align:center;" contenteditable="false">{{DENOMINACION}}</div>
<ol style="padding-left:16px; font-size:10px; line-height:1.6; text-align:justify; list-style-type:decimal;">
  <li style="margin-bottom:6px;">No haber ofrecido, negociado, prometido o efectuado ningún pago o entrega de cualquier beneficio o incentivo ilegal, de manera directa o indirecta, a los evaluadores del proceso de contratación o cualquier servidor de la entidad contratante.</li>
  <li style="margin-bottom:6px;">Asimismo, EL CONTRATISTA se obliga a mantener una conducta proba e íntegra durante la vigencia del contrato, y después de culminado el mismo en caso existan controversias pendientes de resolver, lo que supone actuar con probidad, sin cometer actos ilícitos, directa o indirectamente.</li>
  <li style="margin-bottom:6px;">Aunado a ello, EL CONTRATISTA se obliga a abstenerse de ofrecer, negociar, prometer o dar regalos, cortesías, invitaciones, donativos o cualquier beneficio o incentivo ilegal, directa o indirectamente, a funcionarios públicos, servidores públicos, locadores de servicios o proveedores de servicios del área usuaria, de la dependencia encargada de la contratación, actores del proceso de contratación y/o cualquier servidor de la entidad contratante, con la finalidad de obtener alguna ventaja indebida o beneficio ilícito.</li>
  <li style="margin-bottom:6px;">Tratándose de una persona jurídica, lo anterior se extiende a sus accionistas, participacionistas, integrantes de los órganos de administración, apoderados, representantes legales, funcionarios, asesores o cualquier persona vinculada a la persona jurídica que representa.</li>
  <li style="margin-bottom:6px;">Finalmente, el incumplimiento de las obligaciones establecidas en esta cláusula, durante la ejecución contractual, otorga a LA ENTIDAD CONTRATANTE el derecho de resolver total o parcialmente el contrato.</li>
  <li style="margin-bottom:6px;">Adicionalmente, EL CONTRATISTA se compromete a denunciar oportunamente ante las autoridades competentes los actos de corrupción o de inconducta funcional de los cuales tuviera conocimiento durante la ejecución del contrato con LA ENTIDAD CONTRATANTE.</li>
</ol>
<table class="excel-table" style="margin-top:20px;">
  <tbody>
    <tr>
      <td class="fb" style="width:40%;">Declaración que formulo a fecha</td>
      <td class="dd" contenteditable="false">{{FECHA_HOY}}</td>
    </tr>
    <tr>
      <td class="fb">Apellidos y Nombres</td>
      <td class="dd" contenteditable="false">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
  </tbody>
</table>`,
  },

  dj_pacto_integridad_cuerpo: {
    aplica: true,
    html: `<p style="font-size:10px; margin-bottom:6px; font-weight:bold;">PRIMERO: DECLARO BAJO JURAMENTO LO SIGUIENTE:</p>
<ol style="padding-left:16px; font-size:10px; line-height:1.6; text-align:justify; list-style-type:decimal;">
  <li style="margin-bottom:6px;">Que conozco los impedimentos para ser participante, postor, contratista o subcontratista, establecidos en el artículo 30 de la Ley N° 32069, Ley General de Contrataciones Públicas.</li>
  <li style="margin-bottom:6px;">Que conozco el alcance de la cláusula anticorrupción y antisoborno de los contratos suscritos en el marco del proceso de contratación y las consecuencias derivadas de su incumplimiento.</li>
  <li style="margin-bottom:6px;">Que conozco la obligación de denunciar cualquier acto de corrupción cometido por los actores del proceso de contratación, así como las medidas de protección que le asisten a los denunciantes; además de las consecuencias administrativas y legales que de estos se derivan.</li>
  <li style="margin-bottom:6px;">Que los recursos que componen mi patrimonio no provienen de lavado de activos, narcotráfico, minería ilegal, financiamiento del terrorismo, y/o de cualquier actividad ilícita.</li>
  <li style="margin-bottom:6px;">Que conozco el alcance de la Ley N° 28024 y el marco de aplicación de la Ley N° 31564, Ley de prevención y mitigación del conflicto de intereses.</li>
</ol>
<p style="font-size:10px; margin-bottom:6px; font-weight:bold;">SEGUNDO: DENTRO DE ESE MARCO, ASUMO LOS SIGUIENTES COMPROMISOS:</p>
<ol style="padding-left:16px; font-size:10px; line-height:1.6; text-align:justify; list-style-type:decimal;">
  <li style="margin-bottom:6px;">Mantener una conducta proba e íntegra en todas las actividades del proceso de contratación, actuando con honestidad y veracidad, sin cometer actos ilícitos.</li>
  <li style="margin-bottom:6px;">Abstenerme de ofrecer, dar o prometer regalos, cortesías, invitaciones, donativos u otros beneficios similares a funcionarios o servidores públicos.</li>
  <li style="margin-bottom:6px;">Denunciar ante las autoridades competentes, de manera oportuna, los actos de corrupción, inconducta funcional o conflicto de intereses.</li>
  <li style="margin-bottom:6px;">Facilitar las acciones o mecanismos implementados por la entidad pública responsable del proceso de contratación para fortalecer la transparencia y fomentar la rendición de cuentas.</li>
</ol>
<p style="font-size:10px; margin:8px 0; text-align:justify; line-height:1.5;"><strong>TERCERO:</strong> Este pacto de integridad tiene vigencia desde el momento de su suscripción hasta la culminación de la fase de selección; y en caso de resultar adjudicado con la buena pro, hasta la finalización del proceso de contratación.</p>
<p style="font-size:10px; margin:8px 0; text-align:justify; line-height:1.5;"><strong>CUARTO:</strong> Me someto a las acciones de debida diligencia, supervisión y fiscalización posterior; así como a las responsabilidades administrativas, civiles y/o penales que se deriven, conforme al marco legal vigente.</p>
<table class="excel-table" style="margin-top:20px;">
  <tbody>
    <tr>
      <td class="fb" style="width:40%;">Fecha que suscribo mi Declaración</td>
      <td class="dd" contenteditable="false">{{FECHA_HOY}}</td>
    </tr>
    <tr>
      <td class="fb">Apellidos y Nombres</td>
      <td class="dd" contenteditable="false">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
  </tbody>
</table>`,
  },

  dj_prohibiciones_cuerpo: {
    aplica: true,
    html: `<p style="font-size:10px; margin-bottom:8px; font-weight:bold;">Declaro bajo juramento:</p>
<p style="font-size:10px; margin-bottom:6px; font-weight:bold;">a) Cumplir con las obligaciones consignadas en el artículo 3 de la Ley N° 31564 y artículo 16 de su Reglamento, esto es:</p>
<ul style="padding-left:20px; font-size:10px; line-height:1.6; text-align:justify; list-style-type:none;">
  <li style="margin-bottom:6px;">➢ Guardar secreto, reserva o confidencialidad de los asuntos o información que, por ley expresa, tengan dicho carácter. Esta obligación se extiende aun cuando el vínculo laboral o contractual con la entidad pública se hubiera extinguido.</li>
  <li style="margin-bottom:6px;">➢ No divulgar ni utilizar información que, sin tener reserva legal expresa, pudiera resultar privilegiada por su contenido relevante, empleándola en su beneficio o de terceros, o en perjuicio o desmedro del Estado o de terceros.</li>
</ul>
<p style="font-size:10px; margin-bottom:6px;"><strong>b)</strong> Abstenerme de intervenir en los casos que se configure el supuesto de impedimento señalado en el artículo 5 de la Ley N° 31564 y en los artículos 10 y 11 de su Reglamento.</p>
<p style="font-size:10px; margin-bottom:8px;"><strong>c)</strong> No hallarme incurso en ninguno de los impedimentos señalados en los numerales 11.3 y 11.4 del artículo 11 del Reglamento de la Ley N° 31564.</p>
<p style="font-size:10px; text-align:justify; line-height:1.5;">Suscribo la presente declaración jurada manifestando que la información presentada se sujeta al principio de presunción de veracidad del numeral 1.7 del artículo IV del TUO de la Ley N° 27444.</p>
<table class="excel-table" style="margin-top:20px;">
  <tbody>
    <tr>
      <td class="fb" style="width:40%;">Declaración que formulo a fecha</td>
      <td class="dd" contenteditable="false">{{FECHA_HOY}}</td>
    </tr>
    <tr>
      <td class="fb">Apellidos y Nombres</td>
      <td class="dd" contenteditable="false">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
  </tbody>
</table>`,
  },

  dj_antisoborno_cuerpo: {
    aplica: true,
    html: `<p style="font-size:10px; margin-bottom:8px; font-weight:bold;">DECLARO BAJO JURAMENTO LO SIGUIENTE:</p>
<ol style="padding-left:16px; font-size:10px; line-height:1.6; text-align:justify; list-style-type:decimal;">
  <li style="margin-bottom:6px;">Nos comprometemos a cumplir con los lineamientos del Sistema de Gestión Antisoborno y del Sistema de Gestión de Cumplimiento, la Política del Sistema de Gestión Antisoborno y del Sistema de Gestión de Cumplimiento (www.gob.pe/minedu) y los procedimientos aplicables a los proveedores, establecidos en el Manual del Sistema de Gestión Antisoborno.</li>
  <li style="margin-bottom:6px;">El Ministerio de Educación ejerce su rol respetando los siguientes valores: integridad, respeto, servicio y excelencia; rechazando la corrupción en cualquiera de sus modalidades y prohibiendo la aceptación de regalos, obsequios, cortesías, así como la obtención de ventajas indebidas.</li>
  <li style="margin-bottom:6px;">Asegurar el cumplimiento de las leyes, normativas y requisitos aplicables al Sistema de Gestión Antisoborno y Sistema de Gestión de Cumplimiento.</li>
  <li style="margin-bottom:6px;">Promover la gestión de riesgos de soborno y el cumplimiento de obligaciones, fomentando la mejora continua del Sistema de Gestión Antisoborno y Sistema de Gestión de Cumplimiento.</li>
  <li style="margin-bottom:6px;">Garantizar la confidencialidad y protección de los denunciantes ante cualquier hecho de represalias.</li>
  <li style="margin-bottom:6px;">Sancionar el incumplimiento normativo vinculado a los sistemas de gestión, mediante la adopción de medidas disciplinarias conforme a la normativa aplicable.</li>
</ol>
<p style="font-size:10px; margin-top:8px; text-align:justify; line-height:1.5;">
  De contar con información respecto a amenazas o incidentes de soborno, nos comprometemos a comunicarlo a través de los siguientes canales:<br/>
  • Mesa de Partes de la Entidad, sito en Calle Del Comercio 193, San Borja<br/>
  • Mesa de Partes Virtual (web) del MINEDU: https://enlinea.minedu.gob.pe/<br/>
  • Correo electrónico: cerocorrupcion@minedu.gob.pe<br/>
  • Plataforma Digital Única de Denuncias del Ciudadano: https://denuncias.servicios.gob.pe/
</p>
<table class="excel-table" style="margin-top:20px;">
  <tbody>
    <tr>
      <td class="fb" style="width:40%;">Fecha que suscribo mi Declaración</td>
      <td class="dd" contenteditable="false">{{FECHA_HOY}}</td>
    </tr>
    <tr>
      <td class="fb">Apellidos y Nombres</td>
      <td class="dd" contenteditable="false">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
  </tbody>
</table>`,
  },

  dj_confidencialidad_cuerpo: {
    aplica: true,
    html: `<p style="font-size:10px; font-weight:bold; margin-bottom:8px;">DECLARO BAJO JURAMENTO LO SIGUIENTE:</p>
<ol style="padding-left:16px; font-size:10px; line-height:1.6; text-align:justify; list-style-type:decimal;">
  <li style="margin-bottom:8px;">Que, para la prestación del servicio a la entidad intervenga en cualquier parte del tratamiento de los datos personales de los bancos de datos del MINEDU; está obligado a guardar confidencialidad respecto de los datos personales y de sus antecedentes. Esta obligación subsiste aun después de finalizada la prestación del servicio con el MINEDU.</li>
  <li style="margin-bottom:8px;">Que, no divulgaré información relacionada al desarrollo de la prestación y/o a las que tenga acceso, bajo apercibimiento de que la entidad inicie las acciones legales que correspondan.</li>
  <li style="margin-bottom:8px;">La obligación de consentimiento se extingue cuando medie consentimiento previo, informado, expreso e inequívoco del titular de los datos personales, resolución judicial consentida o ejecutoriada, o cuando medien razones fundadas relativas a la defensa nacional, seguridad o la sanidad pública.</li>
</ol>
<table class="excel-table" style="margin-top:20px;">
  <tbody>
    <tr>
      <td class="fb" style="width:40%;">Fecha que suscribo mi Declaración</td>
      <td class="dd" contenteditable="false">{{FECHA_HOY}}</td>
    </tr>
    <tr>
      <td class="fb">Apellidos y Nombres</td>
      <td class="dd" contenteditable="false">{{LOCADOR_NOMBRE_COMPLETO}}</td>
    </tr>
  </tbody>
</table>`,
  },
};

// ─── CATÁLOGO DE SECCIONES PARA EL EDITOR MAESTRO ────────────────────────────
export const SECCIONES_MAESTRAS: Array<{
  grupo: string;
  items: Array<{ id: string; label: string }>;
}> = [
  {
    grupo: 'Documento 1 — Términos de Referencia',
    items: [
      { id: 'tdr_denominacion',               label: '① Sección 1 — Denominación + Descripción + Finalidad Pública' },
      { id: 'tdr_colaborador',                label: '② Detalle del Colaborador Coordinador' },
      { id: 'tdr_entregables_nota',           label: '③ Nota pie de entregables' },
      { id: 'tdr_lugar_plazo',                label: '③ Lugar, Plazo y Horario de la Prestación' },
      { id: 'tdr_actividades',                label: '④ Características del Servicio / Actividades' },
      { id: 'tdr_requisitos',                 label: '⑤ Requisitos Mínimos del Proveedor' },
      { id: 'tdr_conformidad',                label: '⑥ Conformidad, Forma y Condiciones de Pago' },
      { id: 'tdr_penalidades',                label: '⑦ Penalidades / Vicios Ocultos (fórmula)' },
      { id: 'tdr_condiciones_complementarias',label: '⑧ Condiciones Complementarias' },
      { id: 'tdr_clausulas',                  label: '⑨ Otras Obligaciones (Anticorrupción, Controversias, Confidencialidad)' },
      { id: 'tdr_otras_obligaciones',         label: '⑩ SST (Ley 29783), Propiedad Intelectual, DJ Intereses, Ley 31564' },
      { id: 'tdr_firma',                      label: 'Bloque de Firmas' },
    ],
  },
  {
    grupo: 'Documento 2 — Estructura de Costos',
    items: [
      { id: 'estructura_costos_intro', label: 'Tabla completa de estructura de costos (Rubros 01, 02, 03)' },
    ],
  },
  {
    grupo: 'Documento 3 — Sustento Proveedor Específico',
    items: [
      { id: 'sustento_introduccion',  label: '① Detalle del Requerimiento' },
      { id: 'sustento_analisis',      label: '② Análisis de la Contratación' },
      { id: 'sustento_conclusiones',  label: '③ Conclusiones y Datos del Proveedor' },
      { id: 'sustento_responsable',   label: '④ Funcionario Responsable y Fecha' },
    ],
  },
  {
    grupo: 'Documento 4 — Propuesta Económica',
    items: [
      { id: 'propuesta_economica_cabecera', label: 'Cabecera — Datos del locador (nombre, RUC, DNI, domicilio)' },
      { id: 'propuesta_economica_cuerpo',   label: 'Párrafo introductorio' },
      { id: 'propuesta_economica_monto',    label: 'Tabla de monto del servicio' },
    ],
  },
  {
    grupo: 'Hoja de Vida del Locador',
    items: [
      { id: 'hoja_vida_datos_personales', label: 'Datos personales (nombre, fecha nac., lugar, estado civil, nacionalidad, DNI, RUC, domicilio, contacto)' },
    ],
  },
  {
    grupo: 'CCI — Carta Autorización de Pago',
    items: [
      { id: 'cci_carta_pago', label: 'Tabla CCI — Banco, número de cuenta, locador, RUC' },
    ],
  },
  {
    grupo: 'Declaraciones Juradas — Cabecera del Locador',
    items: [
      { id: 'dj_cabecera_locador', label: 'Cabecera reutilizable — Nombre, RUC, DNI, domicilio del locador' },
    ],
  },
  {
    grupo: 'Declaraciones Juradas — Cuerpos Legales Editables',
    items: [
      { id: 'dj_anticorrupcion_cuerpo',    label: 'DJ Anticorrupción y Antisoborno' },
      { id: 'dj_pacto_integridad_cuerpo',  label: 'DJ Pacto de Integridad (PRIMERO / SEGUNDO / TERCERO / CUARTO)' },
      { id: 'dj_prohibiciones_cuerpo',     label: 'DJ Prohibiciones e Incompatibilidades (Ley 31564)' },
      { id: 'dj_antisoborno_cuerpo',       label: 'DJ Política Antisoborno y Cumplimiento (SIG MINEDU)' },
      { id: 'dj_confidencialidad_cuerpo',  label: 'DJ Compromiso de Confidencialidad' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🖊️ RICH HTML EDITOR — WYSIWYG con barra flotante
// ═══════════════════════════════════════════════════════════════════════════════
const RichTableEditor = React.memo(({
  value,
  onChange,
  sectionId,
}: {
  value: string;
  onChange: (html: string) => void;
  sectionId: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pendingHtml = useRef(value);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.innerHTML !== value) {
      containerRef.current.innerHTML = value;
      pendingHtml.current = value;
      containerRef.current.querySelectorAll('[contenteditable="false"]').forEach((el) => {
        (el as HTMLElement).style.color = '#d97706';
        (el as HTMLElement).style.fontWeight = 'bold';
        (el as HTMLElement).style.background = '#fef7ec';
      });
    }
  }, [value]);

  const persistChange = useCallback(() => {
    if (!containerRef.current) return;
    const html = containerRef.current.innerHTML;
    pendingHtml.current = html;
    onChange(html);
  }, [onChange]);

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !containerRef.current) {
      setShowToolbar(false);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setShowToolbar(false);
      return;
    }
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== containerRef.current) {
      if ((node as HTMLElement).contentEditable === 'false') {
        setShowToolbar(false);
        return;
      }
      node = node.parentNode;
    }
    if (!sel.isCollapsed) {
      const rect = range.getBoundingClientRect();
      setToolbarPos({ top: rect.top - 44, left: rect.left });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    containerRef.current?.focus();
    persistChange();
  };

  const btnStyle: React.CSSProperties = {
    width: 28, height: 28, border: 'none',
    background: '#34495e', color: 'white',
    cursor: 'pointer', borderRadius: 3, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{ position: 'relative' }}>
      {showToolbar && (
        <div
          ref={toolbarRef}
          style={{
            position: 'fixed',
            top: toolbarPos.top,
            left: toolbarPos.left,
            background: '#2c3e50',
            border: '1px solid #34495e',
            borderRadius: 4,
            padding: '3px 4px',
            display: 'flex', gap: 2,
            zIndex: 9999,
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button style={{ ...btnStyle, fontWeight: 'bold' }} onClick={() => execCmd('bold')} title="Negrita">B</button>
          <button style={{ ...btnStyle, fontStyle: 'italic' }} onClick={() => execCmd('italic')} title="Cursiva">I</button>
          <button style={{ ...btnStyle, textDecoration: 'underline' }} onClick={() => execCmd('underline')} title="Subrayado">U</button>
          <div style={{ width: 1, background: '#555', margin: '3px 2px' }} />
          <button style={{ ...btnStyle, fontSize: 11 }} onClick={() => execCmd('insertUnorderedList')} title="Lista">•</button>
          <button style={{ ...btnStyle, fontSize: 10 }} onClick={() => execCmd('insertOrderedList')} title="Lista numerada">1.</button>
          <div style={{ width: 1, background: '#555', margin: '3px 2px' }} />
          <button style={{ ...btnStyle, fontSize: 10 }} onClick={() => execCmd('justifyLeft')} title="Izquierda">≡</button>
          <button style={{ ...btnStyle, fontSize: 10 }} onClick={() => execCmd('justifyCenter')} title="Centro">≡</button>
        </div>
      )}

      <div
        ref={containerRef}
        contentEditable
        suppressContentEditableWarning
        onInput={persistChange}
        onBlur={persistChange}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 11,
          lineHeight: 1.5,
          outline: 'none',
          minHeight: 60,
        }}
      />

      <div style={{
        marginTop: 8, padding: '5px 8px',
        background: '#fef7ec', borderRadius: 4,
        fontSize: 10, color: '#92400e',
        border: '1px dashed #fcd34d',
      }}>
        <strong>Variables disponibles (no editar):</strong>{' '}
        <span style={{ color: '#d97706', fontFamily: 'monospace' }}>
          {'{{DENOMINACION}} {{FINALIDAD_PUBLICA}} {{UNIDAD}} {{CONTACTO_NOMBRE}} {{CONTACTO_CORREO}} {{CONTACTO_CELULAR}} {{PLAZO_EJECUCION}} {{MODALIDAD}} {{ACTIVIDADES_LISTA}} {{NIVEL_FORMACION}} {{EXP_GENERAL_REQUERIDA}} {{EXP_ESPECIFICA_REQUERIDA}} {{DESCRIPCION_CARGO_REQUERIDO}} {{CAPACITACION_REQUERIDA}} {{CODIGO_UNICO}} {{FORMA_PAGO}} {{TOTAL_ARMADAS}} {{HONORARIO_TOTAL}} {{LOCADOR_NOMBRE_COMPLETO}} {{LOCADOR_RUC}} {{LOCADOR_DNI}} {{LOCADOR_DOMICILIO}} {{LOCADOR_CORREO}} {{LOCADOR_TELEFONO}} {{LOCADOR_BANCO}} {{LOCADOR_CCI}} {{LOCADOR_FECHA_NAC}} {{LOCADOR_LUGAR_NAC}} {{LOCADOR_ESTADO_CIVIL}} {{LOCADOR_NACIONALIDAD}} {{FECHA_HOY}}'}
        </span>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: TdrTemplatePage
// ═══════════════════════════════════════════════════════════════════════════════
export default function TdrTemplatePage({ user, onNavigate }: TdrTemplatePageProps) {
  const [data, setData] = useState<typeof initialTemplateData>(initialTemplateData);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECCIONES_MAESTRAS.map((g) => [g.grupo, true]))
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (user.rol !== 'ADMINISTRATIVO') {
    return (
      <div style={{
        minHeight: '100vh', background: '#F5F4F0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif',
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626', marginBottom: 16 }}>Acceso Restringido</h2>
        <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>Solo el perfil Administrativo puede editar la Plantilla Global.</p>
        <button onClick={() => onNavigate('dashboard')}
          style={{ padding: '8px 16px', background: '#1B4B8A', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
          Volver al Panel
        </button>
      </div>
    );
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('plantilla_tdr_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch { /* silencioso */ }
  }, []);

  const triggerSave = useCallback((newData: typeof initialTemplateData) => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem('plantilla_tdr_v2', JSON.stringify(newData));
        setSaveStatus('saved');
      } catch { setSaveStatus('saved'); }
    }, 900);
  }, []);

  const handleHtmlChange = useCallback((sectionId: string, html: string) => {
    setData((prev) => {
      const next = { ...prev, [sectionId]: { ...prev[sectionId], html } };
      triggerSave(next);
      return next;
    });
  }, [triggerSave]);

  const toggleAplica = useCallback((sectionId: string, checked: boolean) => {
    setData((prev) => {
      const next = { ...prev, [sectionId]: { ...prev[sectionId], aplica: checked } };
      triggerSave(next);
      return next;
    });
  }, [triggerSave]);

  const resetSection = useCallback((sectionId: string) => {
    if (!confirm('¿Restaurar esta sección al texto original? Se perderán los cambios.')) return;
    setData((prev) => {
      const next = { ...prev, [sectionId]: { ...initialTemplateData[sectionId] } };
      triggerSave(next);
      return next;
    });
  }, [triggerSave]);

  const toggleGroup = (grupo: string) => {
    setExpandedGroups((prev) => ({ ...prev, [grupo]: !prev[grupo] }));
  };

  return (
    <div style={{ background: '#F5F4F0', minHeight: '100vh', fontFamily: "'DM Sans', Arial, sans-serif", color: '#1a1a1a' }}>

      <header style={{
        position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #ddd',
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => onNavigate('dashboard')}
            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
            ← Volver
          </button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Editor Maestro — Plantilla Global de TdR</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Los cambios aplican a todos los expedientes nuevos</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: saveStatus === 'saving' ? '#fbbf24' : '#22c55e', display: 'inline-block' }} />
            {saveStatus === 'saving' ? 'Guardando...' : 'Guardado automáticamente'}
          </span>
        </div>
      </header>

      <div style={{ background: '#EBF0F9', borderBottom: '1px solid #c3d3eb', padding: '10px 32px', fontSize: 12, color: '#1B4B8A' }}>
        <strong>📝 Modo Editor HTML de Tablas:</strong>{' '}
        Haz clic en cualquier celda <em>gris o blanca</em> para editarla. Las celdas{' '}
        <span style={{ color: '#d97706', fontWeight: 'bold', background: '#fef7ec', padding: '1px 5px', borderRadius: 3 }}>naranja</span>{' '}
        son variables dinámicas (ej: <code>{'{{DENOMINACION}}'}</code>) y están protegidas — el sistema las reemplazará con datos reales.
      </div>

      <main style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
        {SECCIONES_MAESTRAS.map((grupo) => (
          <div key={grupo.grupo} style={{ marginBottom: 32 }}>
            <button
              onClick={() => toggleGroup(grupo.grupo)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#1B4B8A', color: 'white', border: 'none', borderRadius: '6px 6px 0 0',
                padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'left',
              }}
            >
              <span>{grupo.grupo}</span>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{expandedGroups[grupo.grupo] ? '−' : '+'}</span>
            </button>

            {expandedGroups[grupo.grupo] && (
              <div style={{ border: '1px solid #c3d3eb', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                {grupo.items.map((item, idx) => {
                  const sec = data[item.id];
                  if (!sec) return null;
                  const isActive = activeSection === item.id;

                  return (
                    <div key={item.id} style={{
                      background: isActive ? '#fefefe' : idx % 2 === 0 ? 'white' : '#fafaf8',
                      borderBottom: idx < grupo.items.length - 1 ? '1px solid #e4e2db' : 'none',
                    }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 16px', cursor: 'pointer',
                          background: isActive ? '#EBF0F9' : 'transparent',
                          borderBottom: isActive ? '1px solid #c3d3eb' : 'none',
                        }}
                        onClick={() => setActiveSection(isActive ? null : item.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sec.aplica ? '#22c55e' : '#d1d5db', display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: '#1a1a1a' }}>{item.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={sec.aplica} onChange={(e) => toggleAplica(item.id, e.target.checked)} />
                            Aplica
                          </label>
                          <span style={{ fontSize: 11, color: isActive ? '#1B4B8A' : '#888', fontWeight: 500, padding: '2px 8px', border: '1px solid currentColor', borderRadius: 10 }}>
                            {isActive ? 'Cerrar ↑' : 'Editar ↓'}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <div style={{ padding: 16 }}>
                          {!sec.aplica ? (
                            <div style={{ padding: '12px 10px', fontStyle: 'italic', color: '#888', fontSize: 12 }}>
                              Sección deshabilitada — no aparecerá en el expediente final.
                            </div>
                          ) : (
                            <>
                              <div style={{ border: '1px solid #1B4B8A', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ padding: '5px 10px', background: '#EBF0F9', fontSize: 10, color: '#1B4B8A', borderBottom: '1px solid #c3d3eb' }}>
                                  ✏️ Haz clic en cualquier celda gris o blanca para editar su texto
                                </div>
                                <div style={{ padding: 12 }}>
                                  <RichTableEditor
                                    key={item.id}
                                    value={sec.html}
                                    onChange={(html) => handleHtmlChange(item.id, html)}
                                    sectionId={item.id}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 8 }}>
                                <button onClick={() => resetSection(item.id)}
                                  style={{ fontSize: 11, padding: '4px 12px', background: 'transparent', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', color: '#666' }}>
                                  ↺ Restaurar original
                                </button>
                                <button onClick={() => setActiveSection(null)}
                                  style={{ fontSize: 11, padding: '4px 12px', background: '#1B4B8A', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                                  ✓ Listo
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        <div style={{ height: 40 }} />
      </main>

      <style>{`
        * { box-sizing: border-box; }
        .excel-table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; }
        .excel-table td, .excel-table th { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
        .ehl { background-color: #D3D3D3; font-weight: bold; text-align: left; padding-left: 10px; }
        .eh { background-color: #D3D3D3; font-weight: bold; text-align: center; }
        .dd { background-color: #ffffff; color: #000; font-weight: normal; }
        .fb { font-weight: bold; }
        .tc { text-align: center; }
        .tr { text-align: right; }
        [contenteditable="true"] { outline: none; }
        [contenteditable="false"] { background-color: #e8e8e8 !important; color: #555 !important; font-style: italic; cursor: not-allowed; }
      `}</style>
    </div>
  );
}