// ═══════════════════════════════════════════════════════════════════════════
// tdrTemplateUtils.ts
// ═══════════════════════════════════════════════════════════════════════════

import { initialTemplateData } from './TdrTemplatePage';

export function parseTemplate(
  htmlString: string,
  replacements: Record<string, string>,
): string {
  if (!htmlString) return '';
  return htmlString.replace(/\{\{([A-Z0-9_]+)\}\}/gi, (_match, key: string) => {
    const upperKey = key.toUpperCase();
    return replacements[upperKey] !== undefined ? replacements[upperKey] : _match;
  });
}

export function getAdminTemplate(sectionId: string): string {
  try {
    const saved = localStorage.getItem('plantilla_tdr_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[sectionId]?.html) return parsed[sectionId].html;
    }
  } catch { /* silencioso */ }
  return initialTemplateData[sectionId]?.html || '';
}

export function getAdminAplica(sectionId: string): boolean {
  try {
    const saved = localStorage.getItem('plantilla_tdr_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[sectionId] !== undefined) return parsed[sectionId].aplica !== false;
    }
  } catch { /* silencioso */ }
  return initialTemplateData[sectionId]?.aplica !== false;
}

export function buildReplacements(detalle: any): Record<string, string> {
  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const activitiesList =
    detalle.actividades
      ?.map((a: any) => `<li style="margin-bottom:3px;">${a.descripcion}</li>`)
      .join('') || '';

  const entregableRows =
    detalle.entregables
      ?.map((ent: any) =>
        `<tr>
          <td class="tc dd">${ent.nro_armada}</td>
          <td class="dd">${ent.descripcion}</td>
          <td class="tc dd">${ent.fecha_inicio ? new Date(ent.fecha_inicio).toLocaleDateString('es-PE') : ''} — ${ent.fecha_fin ? new Date(ent.fecha_fin).toLocaleDateString('es-PE') : ''}</td>
          <td class="tr dd">${ent.monto_pago}</td>
        </tr>`)
      .join('') || '';

  // ── El LOCADOR firma todos los documentos (m_locadores) ──────────────────
  const loc = detalle.locador;

  // ── El CONTRATANTE es quien creó el TDR — sus datos van en la sección
  //    "Detalle del Colaborador" (UNIDAD, PERSONAL DE CONTACTO, CORREO, CELULAR)
  const cnt = detalle.contratante;

  // Nombre completo del contratante: usa apellidos (campo combinado) + nombres
  // El backend devuelve cnt.apellidos = "Gómez Fernández" (primer + segundo apellido)
  // y cnt.nombres = "Rodrigo"
  const contactoNombre = cnt?.nombres
    ? [cnt.apellidos, cnt.nombres].filter(Boolean).join(', ')
    : '';

  return {
    // ── Contrato ──────────────────────────────────────────────────────────────
    DENOMINACION:             detalle.denominacion || '',
    CODIGO_UNICO:             detalle.codigo_unico || '',
    DESCRIPCION_SERVICIO:     detalle.objetivo || detalle.descripcion_servicio || detalle.denominacion || '',
    MODALIDAD:                detalle.modalidad || 'Mixto',
    PLAZO_EJECUCION:          String(detalle.plazo_ejecucion || ''),
    HONORARIO_TOTAL:          String(detalle.honorario_total || ''),
    FORMA_PAGO:               detalle.forma_pago || 'POR ENTREGABLE - PREVIA CONFORMIDAD',
    ACTIVIDADES_LISTA:        activitiesList
                                ? `<ol style="padding-left:15px;">${activitiesList}</ol>`
                                : '',
    EXP_GENERAL_REQUERIDA:    detalle.experiencia_general_requerida || '03 años',
    EXP_ESPECIFICA_REQUERIDA: detalle.experiencia_especifica_requerida || '02 años',
    OBJETIVO_SUSTENTO:        detalle.objetivo || 'Servicio especializado requerido para el cumplimiento de las metas institucionales.',

    // ── Entregables ───────────────────────────────────────────────────────────
    ENTREGABLE_NRO:     detalle.entregables?.[0]?.nro_armada || '1',
    ENTREGABLE_DESC:    detalle.entregables?.[0]?.descripcion || '',
    ENTREGABLE_PERIODO: detalle.entregables?.length
      ? `${new Date(detalle.entregables[0].fecha_inicio).toLocaleDateString('es-PE')} — ${new Date(detalle.entregables[detalle.entregables.length - 1].fecha_fin).toLocaleDateString('es-PE')}`
      : '',
    ENTREGABLE_MONTO:   detalle.entregables?.[0]?.monto_pago || '',
    ENTREGABLES_ROWS:   entregableRows,

    // ── LOCADOR — persona externa de m_locadores, firma todos los docs ────────
    LOCADOR_NOMBRE_COMPLETO: `${loc?.apellidos || ''}, ${loc?.nombres || ''}`,
    LOCADOR_NOMBRES:          loc?.nombres             || '',
    LOCADOR_APELLIDOS:        loc?.apellidos           || '',
    LOCADOR_RUC:              loc?.ruc                 || '',
    LOCADOR_DNI:              loc?.numero_documento    || '',
    LOCADOR_DOMICILIO:        loc?.domicilio           || '',
    LOCADOR_CORREO:           loc?.correo_electronico  || '',
    LOCADOR_TELEFONO:         loc?.telefono_celular    || '',
    LOCADOR_BANCO:            loc?.banco               || '',
    LOCADOR_CCI:              loc?.cci                 || '',

    // ── SECCIÓN COLABORADOR — datos del CONTRATANTE que creó el TDR ──────────
    // Tabla "DETALLE DEL COLABORADOR QUE COORDINARÁ CON EL OEC Y PROVEEDOR"
    // UNIDAD ORGANIZACIONAL = equipo del TDR (m_equipos.nombre)
    // PERSONAL DE CONTACTO  = nombre del contratante (t_contratantes_perfil)
    // CORREO ELECTRÓNICO    = correo del contratante
    // CELULAR               = teléfono del contratante
    UNIDAD:           detalle.equipo_nombre || '',
    EQUIPO_NOMBRE:    detalle.equipo_nombre || '',
    CONTACTO_NOMBRE:  contactoNombre,
    CONTACTO_CORREO:  cnt?.correo_electronico || '',
    CONTACTO_CELULAR: cnt?.telefono_celular   || '',

    // ── Fechas ────────────────────────────────────────────────────────────────
    FECHA_HOY:  fechaHoy,
    NOMBRE_MES: detalle.nombre_mes || '',
    ANIO:       String(detalle.anio || ''),
  };
}