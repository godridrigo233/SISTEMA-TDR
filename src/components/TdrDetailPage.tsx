import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { User, TdR } from '../types';
// Utilidades de plantilla en archivo separado para cumplir con Vite Fast Refresh.
import {
  parseTemplate,
  buildReplacements,
  getAdminTemplate,
  getAdminAplica,
} from './tdrTemplateUtils';

interface TdrDetailPageProps {
  user: User;
  tdr: TdR;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// ─── Componente auxiliar que renderiza HTML inyectado de forma segura ──────────
const TemplateBlock = React.memo(({
  html,
  replacements,
  style,
}: {
  html: string;
  replacements: Record<string, string>;
  style?: React.CSSProperties;
}) => {
  const parsed = parseTemplate(html, replacements);
  return (
    <div
      dangerouslySetInnerHTML={{ __html: parsed }}
      style={style}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES REUTILIZABLES
// ═══════════════════════════════════════════════════════════════════════════════

const EditableInput = React.memo(({
  value, onChange, placeholder, type = 'text', style, className = 'print-input', disabled = false,
}: any) => {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);
  return (
    <input
      type={type}
      className={className}
      value={localVal}
      onChange={(e) => { if (!disabled) setLocalVal(e.target.value); }}
      onBlur={() => { if (!disabled && localVal !== value) onChange(localVal); }}
      placeholder={placeholder}
      style={style}
      disabled={disabled}
    />
  );
});

const DJHeader = ({ locador }: { locador: any }) => (
  <table className="excel-table" style={{ marginBottom: 15 }}>
    <tbody>
      <tr><td style={{ width: '38%' }}>El/la que suscribe (Apellidos y Nombres)</td><td className="dd fb">{locador?.apellidos}, {locador?.nombres}</td></tr>
      <tr><td>con RUC N°</td><td className="dd fb">{locador?.ruc}</td></tr>
      <tr><td>identificado(a) con DNI / CE N°</td><td className="dd fb">{locador?.numero_documento}</td></tr>
      <tr><td>domiciliado(a) en</td><td className="dd fb">{locador?.domicilio}</td></tr>
    </tbody>
  </table>
);

const DJFooter = ({ locador, fechaHoy }: { locador: any; fechaHoy: string }) => (
  <div style={{ pageBreakInside: 'avoid', marginTop: 10 }}>
    <table style={{ width: '100%', marginTop: 20, fontSize: 10, borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ width: '35%', textAlign: 'right', paddingRight: 10 }}>Fecha que suscribo mi Declaración:</td>
          <td style={{ border: '1.5px solid #000', textAlign: 'center', padding: 4, width: '35%', backgroundColor: '#f2f2f2' }} className="dd fb">{fechaHoy}</td>
          <td />
        </tr>
      </tbody>
    </table>
    <table style={{ width: '60%', margin: '40px auto 0', borderCollapse: 'collapse', fontSize: 10 }}>
      <tbody>
        <tr>
          <td style={{ width: '30%', textAlign: 'right', paddingRight: 10, verticalAlign: 'bottom' }}>Firma:</td>
          <td style={{ border: '1.5px solid #000', height: 60 }} />
        </tr>
        <tr>
          <td style={{ textAlign: 'right', paddingRight: 10 }}>Apellidos y Nombres:</td>
          <td style={{ border: '1.5px solid #000', textAlign: 'center', padding: 4, backgroundColor: '#f2f2f2' }} className="dd fb">{locador?.apellidos}, {locador?.nombres}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const CheckBox = ({ checked, onClick }: { checked: boolean; onClick?: () => void }) => (
  <span
    onClick={onClick}
    style={{
      border: '1px solid #000', width: 12, height: 12,
      display: 'inline-block', textAlign: 'center', lineHeight: '10px',
      fontWeight: 'bold', verticalAlign: 'middle', cursor: 'pointer', background: 'white',
    }}
  >
    {checked ? 'X' : ''}
  </span>
);

// ── Celda blanca editable — para campos opcionales del TDR ───────────────────
// Las celdas grises (.ehl .fb) son de solo lectura, las blancas (.dd) vacías
// pueden ser completadas por el usuario antes de imprimir.
const CeldaEditable = React.memo(({
  value, onChange, placeholder = '', multiline = false, style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
}) => {
  const [localVal, setLocalVal] = React.useState(value);
  React.useEffect(() => setLocalVal(value), [value]);

  const baseStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: localVal ? 'transparent' : '#fffde7',
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    padding: '2px 4px',
    resize: 'none',
    boxSizing: 'border-box',
    ...style,
  };

  if (multiline) {
    return (
      <textarea
        className="no-print"
        rows={2}
        value={localVal}
        onChange={e => setLocalVal(e.target.value)}
        onBlur={() => { if (localVal !== value) onChange(localVal); }}
        placeholder={placeholder}
        style={baseStyle}
      />
    );
  }
  return (
    <input
      type="text"
      className="no-print"
      value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={() => { if (localVal !== value) onChange(localVal); }}
      placeholder={placeholder}
      style={baseStyle}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR EXPEDIENTE A ZIP
// Usa dom-to-image-more (soporta oklch) + jsPDF + JSZip
// Instalar: npm install jspdf dom-to-image-more jszip
// ═══════════════════════════════════════════════════════════════════════════════

/** CSS para el PDF — formato limpio sin colores de fondo, sin cortes */
const EXPORT_CSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #000; background: #fff; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
  th, td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }

  /* ── Evitar cortes de filas entre páginas ── */
  tr { page-break-inside: avoid !important; break-inside: avoid !important; }
  .solid-box, .dashed-box, .excel-title, .no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
  h1, h2, h3, .excel-title { page-break-after: avoid; }

  .excel-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-family: Arial, sans-serif; font-size: 11px; color: #000; }
  .excel-table th, .excel-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
  .eh  { background-color: #D3D3D3; font-weight: bold; text-align: center; }
  .ehl { background-color: #D3D3D3; font-weight: bold; text-align: left; padding-left: 8px; }
  .dd  { background-color: #fff; color: #000; }
  .dd-green { background-color: #fff; color: #000; font-style: italic; }
  .dd-var { background-color: #fff; color: #000; font-weight: bold; }
  .excel-title { font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #000; padding: 10px; margin-bottom: 12px; background: #fff; line-height: 1.3; }
  .fb  { font-weight: bold; }
  .tc  { text-align: center; }
  .tr  { text-align: right; }
  .tl  { text-align: left; }
  .tj  { text-align: justify; }

  .cost-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10px; font-size: 10px; }
  .cost-table td { padding: 5px 7px; vertical-align: middle; border: 1px solid #000; }
  .bdb { border-bottom: 1px solid #000; } .bdr { border-right: 1px solid #000; }
  .bdbD { border-bottom: 1px solid #999; } .bdrD { border-right: 1px solid #999; }
  .bg-green { background-color: #fff; }
  .solid-box { border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; margin: 6px 0; background: #f2f2f2; }
  .dashed-box { border: 1px solid #999; padding: 8px; margin-bottom: 12px; font-size: 10px; }
  .propuesta-list { padding-left: 14px; list-style-type: none; font-size: 9px; line-height: 1.4; margin: 0; }
  .propuesta-list li { margin-bottom: 3px; }
  .exp-box { display: inline-block; border: 1px solid #000; width: 36px; height: 18px; text-align: center; margin: 0 3px; font-weight: bold; vertical-align: middle; line-height: 18px; font-size: 10px; }
  .cv-date-box { display: inline-block; border: 1px solid #000; width: 28px; height: 18px; text-align: center; vertical-align: middle; margin-right: 3px; line-height: 18px; font-size: 10px; }
  .print-input { width: 100%; min-height: 20px; border: none; background: transparent; font-family: Arial, sans-serif; font-size: 11px; text-align: center; }
  .dj-table { width: 100%; border-collapse: collapse; font-size: 10px; line-height: 1.5; }
  .dj-table td { vertical-align: top; padding-bottom: 6px; text-align: justify; border: none; }
  .dj-num { width: 18px; font-weight: bold; padding-right: 5px; }
  .footnotes { font-size: 8px; color: #555; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 5px; line-height: 1.3; text-align: justify; }
  .no-print, .btn-add-row, .btn-remove-row { display: none !important; }
  .print-only { display: block !important; }
  ol, ul { padding-left: 16px; }
  li { margin-bottom: 3px; font-size: 10px; }
  sup { font-size: 8px; }
  p { margin-bottom: 5px; }
  a { color: #000; text-decoration: none; }
  [contenteditable="false"] { background-color: #fff !important; color: #000 !important; }

  /* ── Forzar que NADA tenga fondo verde ── */
  [style*="e8f5e3"] { background-color: #fff !important; }
  [style*="background:#e8f5e3"], [style*="background-color:#e8f5e3"] { background-color: #fff !important; }

  /* ── html2canvas renderiza mal los bordes dashed — forzar solid donde haya borde ── */
  [style*="dashed"] { border-style: solid !important; }
  .dashed-box, .bdbD, .bdrD { border-style: solid !important; }
`;

// html2canvas no entiende oklch()/color() (usados por Tailwind v4). El
// <canvas> del navegador sí resuelve cualquier color CSS válido y lo
// serializa siempre como rgb()/hex al leerlo de vuelta — lo usamos para
// "traducir" cualquier color moderno a algo que html2canvas pueda pintar.
const _colorCanvasCtx = document.createElement('canvas').getContext('2d');
const toSafeColor = (input: string): string => {
  if (!_colorCanvasCtx || !input || !input.includes('oklch')) return input;
  try {
    _colorCanvasCtx.fillStyle = '#000000';
    _colorCanvasCtx.fillStyle = input;
    return _colorCanvasCtx.fillStyle;
  } catch {
    return '#000000';
  }
};

// Cualquier propiedad computada puede traer oklch() (color, background,
// border, outline, box-shadow, text-decoration, fill/stroke de SVG, etc).
// En vez de listar propiedades a mano, revisamos TODAS las que expone
// getComputedStyle y reescribimos como inline style las que usan oklch.
const neutralizarColoresModernos = (root: HTMLElement) => {
  const elementos = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  for (const el of elementos) {
    const cs = window.getComputedStyle(el);
    for (let i = 0; i < cs.length; i++) {
      const prop = cs[i];
      const val = cs.getPropertyValue(prop);
      if (val && val.includes('oklch')) {
        el.style.setProperty(prop, toSafeColor(val), 'important');
      }
    }
  }
};

/** Evita que un documento colgado (p.ej. por un color no soportado) bloquee todo el export. */
const conTimeout = <T,>(promise: Promise<T>, ms: number, etiqueta: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Tiempo de espera agotado generando ${etiqueta}`)), ms)),
  ]);

const exportarExpedienteZIP = async (detalle: any) => {
  const codigoTdr   = detalle.codigo_unico || 'TDR';
  const nombreLoc   = detalle.locador?.nombres?.split(' ')?.[0] || 'Locador';
  const apellidoLoc = detalle.locador?.apellidos?.split(' ')?.[0] || 'Apellido';

  const documentos = [
    { id: 'group-doc-tdr',         nombre: '01_TerminosReferencia' },
    { id: 'group-doc-costos',       nombre: '02_EstructuraCostos' },
    { id: 'group-doc-sustento',     nombre: '03_SustentoProveedor' },
    { id: 'group-doc-propuesta',    nombre: '04_PropuestaEconomica' },
    { id: 'group-doc-cv',           nombre: '05_HojaVida' },
    { id: 'group-doc-dj-imp',       nombre: '06_DJImpedimentos' },
    { id: 'group-doc-dj-par',       nombre: '07_DJParentesco' },
    { id: 'group-doc-dj-redam',     nombre: '08_DJREDAM' },
    { id: 'group-doc-anticorr',     nombre: '09_DJAnticorrupcion' },
    { id: 'group-doc-pacto',        nombre: '10_PactoIntegridad' },
    { id: 'group-doc-prohib',       nombre: '11_DJProhibiciones' },
    { id: 'group-doc-antisoborno',  nombre: '12_DJAntisoborno' },
    { id: 'group-doc-confidencial', nombre: '13_DJConfidencialidad' },
    { id: 'group-doc-cci',          nombre: '14_CCI' },
    { id: 'group-doc-sst',          nombre: '15_ConstanciaSST' },
  ];

  let html2pdf: any, JSZip: any;
  try {
    html2pdf = (await import('html2pdf.js')).default;
    JSZip    = (await import('jszip')).default;
  } catch (err) {
    console.error('Error cargando dependencias de exportación:', err);
    toast.error('No se pudieron cargar las librerías de exportación a PDF.');
    return;
  }

  if (!document.getElementById(documentos[0].id)) {
    toast.error('Abre el panel de Vista Previa antes de exportar.');
    return;
  }

  const zip = new JSZip();
  const fallidos: string[] = [];

  // Contenedor temporal fuera de pantalla
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;z-index:-1;';
  const styleTag = document.createElement('style');
  styleTag.textContent = EXPORT_CSS;
  wrapper.appendChild(styleTag);
  document.body.appendChild(wrapper);

  // A4: 210mm x 297mm — márgenes mínimos para llenar la página
  const CONTENT_WIDTH = 750;

  const baseOpt = {
    margin:      [6, 6, 6, 6],  // mm: top, left, bottom, right — mínimo
    image:       { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: CONTENT_WIDTH,
      windowWidth: CONTENT_WIDTH,
    },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    pagebreak:   { mode: ['css', 'legacy'], avoid: ['tr', '.no-break', '.solid-box', '.dashed-box'] },
  };

  try {
    for (const doc of documentos) {
      const el = document.getElementById(doc.id);
      if (!el || !el.innerHTML.trim()) continue;

      const clon = el.cloneNode(true) as HTMLElement;

      // ── Limpiar elementos interactivos ──
      clon.querySelectorAll('.no-print, button, .btn-add-row, .btn-remove-row').forEach(n => n.remove());
      clon.querySelectorAll('.print-only').forEach(n => { (n as HTMLElement).style.display = 'block'; });

      // ── Convertir inputs a texto plano ──
      clon.querySelectorAll('input').forEach((inp: HTMLInputElement) => {
        const span = document.createElement('span');
        span.textContent = inp.value || '';
        span.style.cssText = 'font-family:Arial,sans-serif;font-size:11px;';
        inp.parentNode?.replaceChild(span, inp);
      });

      // ── CLAVE: quitar page-break que causa página en blanco ──
      clon.classList.remove('page-break');
      clon.style.cssText = `width:${CONTENT_WIDTH}px;background:#fff;font-family:Arial,sans-serif;font-size:11px;line-height:1.4;margin:0;padding:0;`;

      clon.querySelectorAll('.page-break').forEach(child => {
        (child as HTMLElement).classList.remove('page-break');
        (child as HTMLElement).style.pageBreakBefore = 'auto';
        (child as HTMLElement).style.marginTop = '0';
      });

      // ── Recorrer TODOS los elementos y limpiar estilos inline ──
      clon.querySelectorAll('*').forEach(el => {
        const h = el as HTMLElement;
        const s = h.style;

        // Quitar fondos verdes
        if (s.backgroundColor === 'rgb(232, 245, 227)' || s.cssText?.includes('e8f5e3')) {
          s.backgroundColor = '#ffffff';
        }
        if (s.background?.includes('e8f5e3')) {
          s.background = '#ffffff';
        }

        // Convertir TODOS los bordes dashed a solid 1px — html2canvas los renderiza mal
        if (s.cssText?.includes('dashed')) {
          s.cssText = s.cssText.replace(/dashed/g, 'solid');
        }
        if (s.borderStyle === 'dashed') s.borderStyle = 'solid';
        if (s.borderTopStyle === 'dashed') s.borderTopStyle = 'solid';
        if (s.borderBottomStyle === 'dashed') s.borderBottomStyle = 'solid';
        if (s.borderLeftStyle === 'dashed') s.borderLeftStyle = 'solid';
        if (s.borderRightStyle === 'dashed') s.borderRightStyle = 'solid';

        // Reducir bordes gruesos que html2canvas exagera
        const bw = parseFloat(s.borderWidth);
        if (bw > 1) s.borderWidth = '1px';
        const btw = parseFloat(s.borderTopWidth);
        if (btw > 1) s.borderTopWidth = '1px';
        const bbw = parseFloat(s.borderBottomWidth);
        if (bbw > 1) s.borderBottomWidth = '1px';

        // Quitar contenteditable
        if (h.hasAttribute('contenteditable')) {
          h.removeAttribute('contenteditable');
          s.backgroundColor = '#ffffff';
          s.color = '#000000';
        }
      });

      wrapper.appendChild(clon);
      neutralizarColoresModernos(clon);

      // Esperar render
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 100));

      try {
        const pdfBlob: Blob = await conTimeout(
          html2pdf().set(baseOpt).from(clon).outputPdf('blob') as Promise<Blob>,
          20000,
          doc.nombre
        );

        zip.file(
          `${doc.nombre}_${codigoTdr}_${nombreLoc}_${apellidoLoc}.pdf`,
          await pdfBlob.arrayBuffer()
        );
      } catch (docErr) {
        console.warn(`Error en ${doc.nombre}:`, docErr);
        fallidos.push(doc.nombre);
      }

      wrapper.removeChild(clon);
    }

    if (fallidos.length === documentos.length) {
      throw new Error('No se pudo generar ningún documento del expediente.');
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `Expediente_${codigoTdr}_${nombreLoc}_${apellidoLoc}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (fallidos.length > 0) {
      toast.warning(`No se pudieron generar: ${fallidos.join(', ')}`);
    }
  } finally {
    document.body.removeChild(wrapper);
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: TdrDetailPage
// ═══════════════════════════════════════════════════════════════════════════════
export default function TdrDetailPage({ user, tdr, onNavigate }: TdrDetailPageProps) {
  const [detalle, setDetalle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('general');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Estados interactivos para tablas dinámicas (no vienen de plantilla Admin) ──
  const [redamInfo, setRedamInfo] = useState(false);
  const [montoLetras, setMontoLetras] = useState('');
  const [parentescoInfo, setParentescoInfo] = useState({
    tiene: false,
    filas: [{ nombres: '', grado: '', oficina: '', cargo: '', condicion: '' }],
  });
  const [cvFormacion, setCvFormacion] = useState<any[]>([]);
  const [cvCursos, setCvCursos] = useState<any[]>([]);
  const [cvExpGen, setCvExpGen] = useState<any[]>([]);
  const [cvExpEsp, setCvExpEsp] = useState<any[]>([]);
  const [cvOtros, setCvOtros] = useState({ colegio: '', certificacion: '', registro: '', dato_cert: '' });
  const [costosTrayectos, setCostosTrayectos] = useState([{ trayecto: '', costo: '', dias: '', subtotal: '' }]);
  const [costosOtros, setCostosOtros] = useState([{ concepto: '', subtotal: '' }]);

  // ── Celdas editables opcionales del TDR (campos que el usuario completa antes de imprimir)
  const [tdrEditable, setTdrEditable] = useState({
    planTrabajo: '',
    horarioEjecucion: '',
    fueraHorario: 'NO CORRESPONDE',
    capacitacion: '',
    lugarPrestacion: '',
    materialesEquipos: 'NO CORRESPONDE',
  });
  const setTE = (field: keyof typeof tdrEditable, val: string) =>
    setTdrEditable(prev => ({ ...prev, [field]: val }));

  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Obtener datos del TDR ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`http://localhost:4000/api/tdrs/${tdr.id}`)
      .then((res) => res.json())
      .then((data) => {
        setDetalle(data);
        if (data.formacion?.length) setCvFormacion(data.formacion.map((f: any) => ({ ...f })));
        else setCvFormacion([{ grado_obtenido: '', centro_estudios: '', especialidad: '', fecha_inicio: '', fecha_fin: '', fecha_extension: '', ciudad: '' }]);
        setCvCursos([{ nivel: '', centro_estudios: '', tema: '', fecha_inicio: '', fecha_fin: '', duracion: '', documento: '' }]);
        const gen = data.experiencia?.filter((e: any) => e.tipo_experiencia === 'General') || [];
        setCvExpGen(gen.length ? gen.map((e: any) => ({ ...e })) : [{ entidad_empresa: '', cargo: '', descripcion_trabajo: '-', fecha_inicio: '', fecha_fin: '' }]);
        const esp = data.experiencia?.filter((e: any) => e.tipo_experiencia === 'Especifica') || [];
        setCvExpEsp(esp.length ? esp.map((e: any) => ({ ...e })) : [{ entidad_empresa: '', cargo: '', descripcion_trabajo: '-', fecha_inicio: '', fecha_fin: '' }]);
        setLoading(false);
      })
      .catch((err) => { console.error('Error obteniendo TDR:', err); setLoading(false); });
  }, [tdr.id]);

  useEffect(() => {
    if (!loading && detalle) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setCurrentSection(entry.target.id.replace('group-', ''));
          });
        },
        { threshold: 0.3 },
      );
      document.querySelectorAll('.group-card').forEach((card) => observerRef.current?.observe(card));
      return () => observerRef.current?.disconnect();
    }
  }, [loading, detalle]);

  if (loading) return <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center font-sans text-blue-800 font-bold">Cargando expediente...</div>;
  if (!detalle) return <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center font-sans text-red-600 font-bold">Error: No se encontró el TDR.</div>;

  // ── Mapa de reemplazos construido de los datos reales del locador/TDR ──────
  const replacements = buildReplacements(detalle);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fechaHoy = replacements.FECHA_HOY;

  const toYMD = (dateString: string) => {
    if (!dateString) return '';
    try { return new Date(dateString).toISOString().split('T')[0]; } catch { return dateString; }
  };

  const getDurationText = (startStr: string, endStr: string) => {
    if (!startStr) return '-';
    const s = new Date(startStr), e = endStr ? new Date(endStr) : new Date();
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return '-';
    let y = e.getFullYear() - s.getFullYear();
    let m = e.getMonth() - s.getMonth();
    let d = e.getDate() - s.getDate();
    if (d < 0) { m--; d += new Date(e.getFullYear(), e.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    const parts = [];
    if (y > 0) parts.push(`${y} año${y !== 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} mes${m !== 1 ? 'es' : ''}`);
    if (d > 0) parts.push(`${d} día${d !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ').replace(/, ([^,]*)$/, ' y $1') : '0 días';
  };

  const getTotalExperience = (exps: any[]) => {
    if (!exps?.length) return { years: 0, months: 0, days: 0 };
    const intervals = exps
      .map((e) => ({ start: new Date(e.fecha_inicio).getTime(), end: e.fecha_fin ? new Date(e.fecha_fin).getTime() : Date.now() }))
      .filter((i) => !isNaN(i.start) && !isNaN(i.end));
    intervals.sort((a, b) => a.start - b.start);
    const merged: any[] = [];
    if (intervals.length) {
      let cur = intervals[0];
      for (let i = 1; i < intervals.length; i++) {
        if (intervals[i].start <= cur.end) cur.end = Math.max(cur.end, intervals[i].end);
        else { merged.push(cur); cur = intervals[i]; }
      }
      merged.push(cur);
    }
    let totalDays = 0;
    merged.forEach((i) => { totalDays += Math.round((i.end - i.start) / 86400000) + 1; });
    return { years: Math.floor(totalDays / 360), months: Math.floor((totalDays % 360) / 30), days: Math.floor((totalDays % 360) % 30) };
  };

  const totalGen = getTotalExperience(cvExpGen);
  const totalEsp = getTotalExperience(cvExpEsp);

  const handleArrayChange = (setter: any, index: number, field: string, value: string) => {
    setter((prev: any[]) => { const c = [...prev]; c[index] = { ...c[index], [field]: value }; return c; });
  };
  const addArrayRow = (setter: any, empty: any) => setter((prev: any[]) => [...prev, empty]);
  const removeArrayRow = (setter: any, index: number) => setter((prev: any[]) => prev.filter((_: any, i: number) => i !== index));

  const handleParentescoChange = (index: number, field: string, value: string) => {
    const f = [...parentescoInfo.filas];
    f[index] = { ...f[index], [field]: value };
    setParentescoInfo({ ...parentescoInfo, filas: f });
  };

  const scrollToGroup = (groupId: string) => {
    setCurrentSection(groupId);
    setIsSidebarOpen(false);
    if (groupId.startsWith('doc-')) {
      if (!previewOpen) {
        setPreviewOpen(true);
        setTimeout(() => document.getElementById(`group-${groupId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
      } else {
        document.getElementById(`group-${groupId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      setPreviewOpen(false);
      setTimeout(() => document.getElementById(`group-${groupId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  const descargarPDF = () => {
    setActiveModal(null);
    // Abrir el preview para que los elementos group-doc-* existan en el DOM
    setPreviewOpen(true);
    // Esperar a que React renderice el panel antes de recopilar el HTML
    setTimeout(() => {
      toast.promise(exportarExpedienteZIP(detalle), {
        loading: 'Generando expediente en PDF...',
        success: 'Expediente descargado correctamente',
        error: (err) =>
          err?.message?.includes('oklch') || err?.message?.includes('color')
            ? 'Este navegador no puede generar el ZIP de PDFs separados. Usa "Imprimir / Guardar PDF único" en su lugar.'
            : err?.message || 'Error al generar el expediente PDF',
      });
    }, 600);
  };
  const descargarPDFClasico = () => { setActiveModal(null); setPreviewOpen(true); setTimeout(() => window.print(), 500); };

  // ─── Sidebar nav items ─────────────────────────────────────────────────────
  const docNavItems: [string, string, boolean][] = [
    ['doc-tdr', '1. TdR Principal', true],
    ['doc-costos', '2. Estructura de Costos', getAdminAplica('estructura_costos_intro')],
    ['doc-sustento', '3. Sustento Proveedor', true],
    ['doc-propuesta', '4. Propuesta Económica', true],
    ['doc-cv', '5. Hoja de Vida', true],
    ['doc-dj-imp', '6. DJ Impedimentos', true],
    ['doc-dj-par', '7. DJ Parentesco', true],
    ['doc-dj-redam', '8. DJ REDAM', true],
    ['doc-anticorr', '9. DJ Anticorrupción', true],
    ['doc-pacto', '10. Pacto de Integridad', true],
    ['doc-prohib', '11. DJ Prohibiciones', true],
    ['doc-antisoborno', '12. DJ Antisoborno', true],
    ['doc-confidencial', '13. DJ Confidencialidad', true],
    ['doc-cci', '14. CCI - Autorización Pago', true],
    ['doc-sst', '15. Constancia SST', true],
  ];

  return (
    <div className="tdr-v2-theme overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        .tdr-v2-theme {
          --bg: #F5F4F0; --surface: #FFFFFF; --surface2: #F9F8F5;
          --border: #E4E2DB; --border2: #D0CEC6;
          --text: #1A1916; --text2: #6B6860; --text3: #9E9C96;
          --accent: #1B4B8A; --accent-light: #EBF0F9;
          --success: #1A6B3C; --success-bg: #EBF5EF;
          --sidebar: 260px; --header: 64px; --radius: 8px; --radius-lg: 12px;
          --shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
          font-family: 'DM Sans', sans-serif;
          background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.6; min-height: 100vh;
        }
        .tdr-v2-theme * { box-sizing: border-box; margin: 0; padding: 0; }

        .tdr-header { position: fixed; top: 0; left: 0; right: 0; height: var(--header); background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 20px; gap: 16px; z-index: 100; box-shadow: var(--shadow); }
        .header-sep { width: 1px; height: 24px; background: var(--border); margin: 0 4px; }
        .header-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; border: 1px solid transparent; }
        .btn-ghost { background: transparent; border-color: var(--border); color: var(--text2); }
        .btn-ghost:hover { background: var(--surface2); border-color: var(--border2); color: var(--text); }
        .btn-primary { background: var(--accent); color: white; border-color: var(--accent); }
        .btn-primary:hover { opacity: .9; }
        .layout { display: flex; margin-top: var(--header); min-height: calc(100vh - var(--header)); width: 100%; }

        .tdr-sidebar { width: var(--sidebar); background: var(--surface); border-right: 1px solid var(--border); position: fixed; top: var(--header); bottom: 0; left: 0; overflow-y: auto; padding: 16px 0; z-index: 95; transition: transform 0.3s ease; transform: translateX(-100%); }
        .tdr-sidebar.open { transform: translateX(0); }
        @media (min-width: 1024px) { .tdr-sidebar { transform: translateX(0); } }
        .sidebar-group { padding: 6px 16px; font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; margin-top: 12px; }
        .sidebar-item { display: flex; align-items: center; gap: 8px; padding: 8px 16px; cursor: pointer; border-left: 3px solid transparent; transition: all .12s; }
        .sidebar-item:hover { background: var(--surface2); }
        .sidebar-item.active { background: var(--accent-light); border-left-color: var(--accent); }
        .sidebar-item.active .sidebar-label { color: var(--accent); font-weight: 500; }
        .sidebar-label { font-size: 13px; color: var(--text2); flex: 1; }
        .sidebar-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; background: var(--surface2); color: var(--text3); border: 1px solid var(--border); }
        .sidebar-badge.done { background: var(--success-bg); color: var(--success); border-color: #b8ddc7; }

        .tdr-main { flex: 1; padding: 24px 16px; width: 100%; margin-left: 0; transition: padding-right 0.3s ease; }
        @media (min-width: 1024px) { .tdr-main { margin-left: var(--sidebar); padding: 32px 48px; } .tdr-main.preview-open { padding-right: calc(650px + 48px); } }
        .inner-container { width: 100%; max-width: 1000px; margin: 0 auto; }
        .section-tag { display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--accent); background: var(--accent-light); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .section-title { font-family: 'DM Serif Display', serif; font-size: 28px; color: var(--text); letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 20px; }
        .data-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); margin-bottom: 20px; overflow: hidden; box-shadow: var(--shadow); }
        .data-header { padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--surface2); font-weight: 600; font-size: 14px; color: var(--text); display: flex; justify-content: space-between; align-items: center; }
        .data-body { padding: 20px; }
        .data-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 640px) { .data-grid { grid-template-columns: 1fr 1fr; } }
        .data-label { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: .05em; font-weight: 600; margin-bottom: 4px; display: block; }
        .data-value { font-size: 14px; color: var(--text); font-weight: 500; }

        /* PREVIEW PANEL */
        .preview-panel { position: fixed; right: 0; top: var(--header); bottom: 0; width: 100%; max-width: 680px; background: var(--surface); border-left: 1px solid var(--border); display: flex; flex-direction: column; transform: translateX(100%); transition: transform .3s cubic-bezier(.4,0,.2,1); z-index: 105; box-shadow: -4px 0 24px rgba(0,0,0,0.12); }
        .preview-panel.open { transform: translateX(0); }
        .preview-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--surface2); flex-shrink: 0; }
        .preview-body { flex: 1; overflow-y: auto; padding: 28px; background: white; color: black; font-family: 'Arial', sans-serif; font-size: 11px; line-height: 1.4; }
        .preview-footer { padding: 16px 20px; border-top: 1px solid var(--border); background: var(--surface2); flex-shrink: 0; }

        /* ESTILOS EXCEL — aplican dentro del preview */
        .excel-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-family: "Arial", sans-serif; font-size: 11px; color: black; border: 1px solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .excel-table th, .excel-table td { border: 1px solid #000 !important; padding: 8px 10px; vertical-align: top; -webkit-print-color-adjust: exact; print-color-adjust: exact; word-wrap: break-word; }
        .eh { background-color: #D3D3D3 !important; font-weight: bold; text-align: center; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .ehl { background-color: #D3D3D3 !important; font-weight: bold; text-align: left; padding-left: 10px !important; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .dd { background-color: #ffffff !important; color: #000; font-weight: normal; padding: 8px 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .dd-green { background-color: #ffffff !important; color: #000; font-style: italic; padding: 8px 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        /* Forzar blanco y negro: ningún campo dinámico lleva fondo verde en el preview */
        [style*="e8f5e3"] { background-color: #ffffff !important; }
        .dd-var { background-color: #ffffff !important; color: #000; font-weight: bold; padding: 8px 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .cell-editable { background-color: #ffffff !important; color: #000; padding: 8px 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .excel-title { font-size: 12pt; font-weight: bold; text-align: center; border: 1.5px solid #000 !important; padding: 10px; margin-bottom: 14px; background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fb { font-weight: bold !important; }
        .tc { text-align: center; }
        .tr { text-align: right; }
        .tl { text-align: left; }
        .tj { text-align: justify; }
        .cost-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000 !important; margin-bottom: 10px; font-size: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .cost-table td { padding: 6px 8px; vertical-align: middle; border: 1px solid #000 !important; }
        .bdb { border-bottom: 1px solid #000 !important; } .bdr { border-right: 1px solid #000 !important; }
        .bdbD { border-bottom: 1px dashed #000 !important; } .bdrD { border-right: 1px dashed #000 !important; }
        .bg-green { background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .solid-box { border: 1.5px solid #000 !important; padding: 10px; text-align: center; font-weight: bold; margin: 8px 0; background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .dashed-box { border: 1.5px dashed #000 !important; padding: 10px; margin-bottom: 14px; font-size: 10px; }
        .propuesta-list { padding-left: 14px; list-style-type: none; font-size: 9px; line-height: 1.4; margin: 0; }
        .propuesta-list li { margin-bottom: 3px; }
        .exp-box { display: inline-block; border: 1px solid #000; width: 40px; height: 20px; text-align: center; margin: 0 4px; padding-top: 2px; font-weight: bold; }
        .cv-date-box { display: inline-block; border: 1px solid #000; width: 30px; height: 20px; text-align: center; vertical-align: middle; padding-top: 2px; margin-right: 4px; }
        .editable-cell { padding: 0 !important; position: relative; height: 100%; min-height: 28px; }
        .print-input { width: 100%; height: 100%; min-height: 28px; border: none; outline: none; background: #ffffff; font-family: inherit; font-size: inherit; text-align: center; font-weight: bold; box-sizing: border-box; }
        .print-input:focus { background: #fffde7; }
        .print-input:disabled { background: transparent; font-weight: normal; color: black; }
        .btn-add-row { display: inline-block; margin-top: 5px; font-size: 10px; color: var(--accent); cursor: pointer; background: var(--accent-light); padding: 5px 10px; border-radius: 4px; font-weight: bold; border: 1px dashed var(--accent); }
        .btn-remove-row { position: absolute; right: -20px; top: 6px; color: white; background: #c00; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; font-size: 10px; border: none; }
        .dj-table { width: 100%; border-collapse: collapse; font-size: 10px; line-height: 1.5; }
        .dj-table td { vertical-align: top; padding-bottom: 10px; text-align: justify; }
        .dj-num { width: 18px; font-weight: bold; }
        .print-only { display: none; }
        .page-break { page-break-before: always; margin-top: 15mm; }
        .no-border { border: none !important; }
        .footnotes { font-size: 8px; color: #555; margin-top: 12px; border-top: 1px solid #ccc; padding-top: 6px; line-height: 1.3; text-align: justify; }

        /* contenteditable="false" del Admin — sin color de fondo */
        .preview-body [contenteditable="false"] { background-color: #ffffff !important; color: #000 !important; font-weight: normal !important; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 104; opacity: 0; pointer-events: none; transition: opacity .3s; }
        .overlay.show { opacity: 1; pointer-events: all; }
        .tdr-modal { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity .2s; }
        .tdr-modal.open { opacity: 1; pointer-events: all; }
        .modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); }
        .modal-box { position: relative; background: var(--surface); border-radius: var(--radius-lg); width: 100%; max-width: 500px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,.18); }

        @media print {
          @page { margin: 12mm; size: A4 portrait; }
          html, body, #root, .tdr-v2-theme, .layout { height: auto !important; min-height: auto !important; overflow: visible !important; width: auto !important; display: block !important; background: white !important; color: black !important; }
          .tdr-header, .tdr-sidebar, .tdr-main, .overlay, .tdr-modal, .preview-header, .preview-footer, .no-print { display: none !important; }
          .preview-panel { position: absolute !important; left: 0 !important; top: 0 !important; transform: none !important; width: 100% !important; max-width: none !important; border: none !important; box-shadow: none !important; background: white !important; display: block !important; padding: 0 !important; overflow: visible !important; height: auto !important; }
          .preview-body { padding: 0 !important; overflow: visible !important; height: auto !important; font-family: 'Arial', sans-serif !important; font-size: 11px !important; }
          .dd { color: black !important; }
          .print-input { background: transparent !important; font-weight: normal !important; -webkit-text-fill-color: black; opacity: 1; padding: 0 !important; outline: none !important; }
          .print-only { display: block !important; }
          [contenteditable="false"] { background-color: transparent !important; color: black !important; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="tdr-header">
        <button className="lg:hidden btn btn-ghost" style={{ padding: 8 }} onClick={() => setIsSidebarOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <button className="btn btn-ghost hidden sm:inline-flex" style={{ padding: '6px 12px' }} onClick={() => onNavigate('dashboard')}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg> Volver
        </button>
        <div className="header-sep hidden sm:block" />
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, fontWeight: 'bold', color: 'var(--text)' }}>
          Sistema <span style={{ color: 'var(--accent)' }}>TDR</span>
        </span>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setPreviewOpen(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            <span className="hidden sm:inline">Ver Expediente</span>
          </button>
          <button className="btn btn-primary" onClick={() => setActiveModal('export')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
            Imprimir
          </button>
        </div>
      </header>

      <div className="layout">
        <div className={`overlay ${isSidebarOpen ? 'show' : ''} lg:hidden`} onClick={() => setIsSidebarOpen(false)} style={{ zIndex: 94 }} />

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className={`tdr-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-group">Vista Rápida</div>
          {(['general', 'locador', 'ejecucion'] as const).map((id) => {
            const labels: Record<string, string> = { general: 'Datos Generales', locador: 'Datos del Locador', ejecucion: 'Ejecución y Montos' };
            return (
              <div key={id} className={`sidebar-item ${currentSection === id ? 'active' : ''}`} onClick={() => scrollToGroup(id)}>
                <span className="sidebar-label">{labels[id]}</span>
                <span className="sidebar-badge done">✓</span>
              </div>
            );
          })}
          <div className="sidebar-group" style={{ marginTop: 20 }}>Documentos del Expediente</div>
          {docNavItems.map(([id, label, isVisible]) =>
            isVisible ? (
              <div key={id} className={`sidebar-item ${currentSection === id ? 'active' : ''}`} onClick={() => scrollToGroup(id)}>
                <span className="sidebar-label" style={{ fontSize: 12 }}>{label}</span>
              </div>
            ) : null,
          )}
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <main className={`tdr-main ${previewOpen ? 'preview-open' : ''}`}>
          <div className="inner-container group-card">

            {/* SECCIÓN 1 — Datos Generales */}
            <div id="group-general" style={{ marginBottom: 48 }}>
              <div className="section-tag">Sección 1</div>
              <div className="section-title">Datos Generales del TdR</div>
              <div className="data-card">
                <div className="data-header">
                  Información del Contrato
                  <span style={{ color: 'var(--text3)', fontWeight: 'normal', fontSize: 13 }}>Código: {detalle.codigo_unico}</span>
                </div>
                <div className="data-body data-grid">
                  <div><span className="data-label">Área Usuaria</span><span className="data-value">{detalle.equipo_nombre}</span></div>
                  <div><span className="data-label">Periodo</span><span className="data-value">{detalle.nombre_mes} {detalle.anio}</span></div>
                  <div className="sm:col-span-2"><span className="data-label">Denominación del Servicio</span><span className="data-value" style={{ fontWeight: 700 }}>{detalle.denominacion}</span></div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2 — Locador */}
            <div id="group-locador" style={{ marginBottom: 48 }}>
              <div className="section-tag">Sección 2</div>
              <div className="section-title">Datos del Locador</div>
              <div className="data-card">
                <div className="data-header">Datos Personales y Bancarios</div>
                <div className="data-body data-grid">
                  <div className="sm:col-span-2"><span className="data-label">Nombres y Apellidos</span><span className="data-value">{detalle.locador?.apellidos}, {detalle.locador?.nombres}</span></div>
                  <div><span className="data-label">Documento</span><span className="data-value">{detalle.locador?.tipo_documento}: {detalle.locador?.numero_documento}</span></div>
                  <div><span className="data-label">RUC</span><span className="data-value">{detalle.locador?.ruc}</span></div>
                  <div className="sm:col-span-2"><span className="data-label">Domicilio</span><span className="data-value">{detalle.locador?.domicilio}</span></div>
                  <div><span className="data-label">Banco</span><span className="data-value">{detalle.locador?.banco}</span></div>
                  <div><span className="data-label">CCI</span><span className="data-value">{detalle.locador?.cci}</span></div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3 — Ejecución */}
            <div id="group-ejecucion" style={{ marginBottom: 48 }}>
              <div className="section-tag">Sección 3</div>
              <div className="section-title">Ejecución del Servicio</div>
              <div className="data-card">
                <div className="data-header">Presupuesto y Plazo</div>
                <div className="data-body data-grid">
                  <div><span className="data-label">Monto Total</span><span className="data-value" style={{ color: 'var(--success)', fontWeight: 700 }}>S/ {detalle.honorario_total}</span></div>
                  <div><span className="data-label">Plazo</span><span className="data-value">{detalle.plazo_ejecucion} días calendario</span></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '30px 0', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                Regresar al Panel Principal
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ── OVERLAY ────────────────────────────────────────────────────────── */}
      <div className={`overlay ${previewOpen ? 'show' : ''}`} onClick={() => setPreviewOpen(false)} />

      {/* ═══════════════════════════════════════════════════════════════════
          PREVIEW PANEL — Expediente Completo
          Toda la lógica de plantilla pasa por parseTemplate + dangerouslySetInnerHTML
      ═══════════════════════════════════════════════════════════════════ */}
      <div className={`preview-panel ${previewOpen ? 'open' : ''}`}>
        <div className="preview-header no-print">
          <span style={{ fontWeight: 'bold', fontSize: 14 }}>Expediente Completo — Vista Previa</span>
          <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setPreviewOpen(false)}>Cerrar ✕</button>
        </div>

        <div className="preview-body" id="documento-preview">

          {/* AVISO INTERACTIVO */}
          <div className="no-print" style={{ padding: '10px 14px', background: '#FEF7EC', borderLeft: '4px solid #fcd34d', marginBottom: 20, fontSize: 10, color: '#8B5A00', lineHeight: 1.4 }}>
            <strong>Zonas Interactivas:</strong> Rellena las celdas amarillas en Hoja de Vida y marca SÍ/NO en las Declaraciones Juradas antes de imprimir.
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 1: TÉRMINOS DE REFERENCIA
              Orden fiel al PDF oficial MINEDU.
              Secciones del Admin + tabla dinámica de entregables (React).
          ═══════════════════════════════════════════════════════════════ */}
          <div id="group-doc-tdr">
            {/* Título */}
            <div className="excel-title" style={{ border: 'none', background: 'transparent', marginBottom: 6 }}>
              TÉRMINOS DE REFERENCIA
              <div style={{ fontSize: '10pt', fontWeight: 'normal' }}>
                CÓDIGO: <span className="dd">{detalle.codigo_unico}</span>
              </div>
            </div>

            {/* Sección 1 — Denominación + Descripción del Servicio + Finalidad Pública */}
            <TemplateBlock html={getAdminTemplate('tdr_denominacion')} replacements={replacements} />

            {/* ② Colaborador coordinador — datos del CONTRATANTE que creó el TDR */}
            <table className="excel-table">
              <tbody>
                <tr>
                  <td className="ehl" colSpan={2}>DETALLE DEL COLABORADOR QUE COORDINARÁ CON EL OEC Y PROVEEDOR</td>
                </tr>
                <tr>
                  <td className="fb" style={{ width: '35%' }}>UNIDAD ORGANIZACIONAL</td>
                  <td className="dd">{detalle.equipo_nombre || ''}</td>
                </tr>
                <tr>
                  <td className="fb">PERSONAL DE CONTACTO</td>
                  <td className="dd">
                    {detalle.contratante?.nombres
                      ? `${detalle.contratante.apellidos || ''}, ${detalle.contratante.nombres}`.trim().replace(/^,\s*/, '')
                      : <CeldaEditable value={tdrEditable.planTrabajo} onChange={v => setTE('planTrabajo', v)} placeholder="Nombre del colaborador..." />
                    }
                  </td>
                </tr>
                <tr>
                  <td className="fb">CORREO ELECTRÓNICO</td>
                  <td className="dd">{detalle.contratante?.correo_electronico || ''}</td>
                </tr>
                <tr>
                  <td className="fb">CELULAR</td>
                  <td className="dd">{detalle.contratante?.telefono_celular || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* ③ Resultados Esperados — tabla dinámica React (N filas de BD) */}
            <table className="excel-table">
              <tbody>
                <tr>
                  <td className="ehl" colSpan={4}>RESULTADOS ESPERADOS O ENTREGABLES (DE CORRESPONDER)</td>
                </tr>
                <tr>
                  <td className="fb tc" style={{ width: '8%' }}>N°</td>
                  <td className="fb tc">Descripción del Entregable</td>
                  <td className="fb tc" style={{ width: '22%' }}>Período</td>
                  <td className="fb tc" style={{ width: '15%' }}>Monto (S/)</td>
                </tr>
                {detalle.entregables?.map((ent: any, i: number) => (
                  <tr key={i}>
                    <td className="tc dd">{ent.nro_armada}</td>
                    <td className="dd">{ent.descripcion}</td>
                    <td className="tc dd">
                      {ent.fecha_inicio
                        ? `Del ${new Date(ent.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })} hasta ${new Date(ent.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                        : ''}
                    </td>
                    <td className="tr dd">{ent.monto_pago}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="tr fb">TOTAL:</td>
                  <td className="tr fb dd">S/ {detalle.honorario_total}</td>
                </tr>
              </tbody>
            </table>

            {/* Nota al pie de entregables */}
            {getAdminAplica('tdr_entregables_nota') && (
              <TemplateBlock html={getAdminTemplate('tdr_entregables_nota')} replacements={replacements} />
            )}

            {/* ③ Lugar, plazo, horario, modalidad */}
            <TemplateBlock html={getAdminTemplate('tdr_lugar_plazo')} replacements={replacements} />

            {/* ④ Características / Actividades */}
            <TemplateBlock html={getAdminTemplate('tdr_actividades')} replacements={replacements} />

            {/* ⑤ Requisitos mínimos */}
            <TemplateBlock html={getAdminTemplate('tdr_requisitos')} replacements={replacements} />

            {/* ⑥ Conformidad, garantías, forma de pago */}
            {getAdminAplica('tdr_conformidad') && (
              <TemplateBlock html={getAdminTemplate('tdr_conformidad')} replacements={replacements} />
            )}

            {/* ⑦ Penalidades con fórmula */}
            {getAdminAplica('tdr_penalidades') && (
              <TemplateBlock html={getAdminTemplate('tdr_penalidades')} replacements={replacements} />
            )}

            {/* ⑧ Condiciones Complementarias */}
            <TemplateBlock html={getAdminTemplate('tdr_condiciones_complementarias')} replacements={replacements} />

            {/* ⑨ Otras Obligaciones (Anticorrupción, Controversias, Confidencialidad) */}
            {getAdminAplica('tdr_clausulas') && (
              <TemplateBlock html={getAdminTemplate('tdr_clausulas')} replacements={replacements} />
            )}

            {/* ⑩ SST, DJ Intereses, Ley 31564 */}
            {getAdminAplica('tdr_otras_obligaciones') && (
              <TemplateBlock html={getAdminTemplate('tdr_otras_obligaciones')} replacements={replacements} />
            )}

            {/* Bloque de firmas */}
            <TemplateBlock html={getAdminTemplate('tdr_firma')} replacements={replacements} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 2: ESTRUCTURA DE COSTOS
              Intro viene del Admin; tablas de trayectos son dinámicas (React)
          ═══════════════════════════════════════════════════════════════ */}
          {getAdminAplica('estructura_costos_intro') && (
            <div className="page-break" id="group-doc-costos">
              <div style={{ border: '2px solid #000', textAlign: 'center', padding: 8, fontWeight: 'bold', fontSize: 11, marginBottom: 14 }}>
                ESTRUCTURA DE COSTOS PARA LA CONTRATACIÓN DE SERVICIOS DE LOCACIÓN
              </div>
              <table style={{ width: '100%', marginBottom: 12, fontSize: 10, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '15%' }}>El área usuaria:</td>
                    <td style={{ width: '55%', borderBottom: '1px solid #000', textAlign: 'center' }} className="dd fb">{detalle.equipo_nombre}</td>
                    <td className="tc" style={{ width: '10%' }}>de la UE:</td>
                    <td style={{ width: '20%', borderBottom: '1px solid #000', textAlign: 'center' }}>026</td>
                  </tr>
                </tbody>
              </table>

              {/* Texto introductorio del Admin */}
              <TemplateBlock html={getAdminTemplate('estructura_costos_intro')} replacements={replacements} />

              <div className="solid-box dd">{detalle.denominacion}</div>

              {/* Rubros — tablas dinámicas (React) */}
              <table className="cost-table">
                <tbody>
                  <tr><td colSpan={2} className="bdbD fb">RUBRO 01: Honorarios Profesionales</td></tr>
                  <tr><td className="bdb bdrD tc fb" style={{ width: '75%' }}>Concepto</td><td className="bdb tc fb" style={{ width: '25%' }}>Sub Total S/.</td></tr>
                  <tr>
                    <td className="bdb bdr tc">Honorarios Profesionales a todo costo por la totalidad del servicio</td>
                    <td className="bdb bg-green tr"><span style={{ float: 'left' }}>S/.</span><span className="dd fb">{detalle.honorario_total}</span></td>
                  </tr>
                  <tr><td className="bdr tr fb">SUB TOTAL S/.</td><td className="tr"><span style={{ float: 'left' }}>S/.</span><span className="dd fb">{detalle.honorario_total}</span></td></tr>
                </tbody>
              </table>

              <table className="cost-table">
                <tbody>
                  <tr><td colSpan={4} className="bdbD fb">RUBRO 02: Desplazamiento</td></tr>
                  <tr>
                    <td className="bdb bdrD tc fb" style={{ width: '40%' }}>Concepto</td>
                    <td className="bdb bdrD tc fb" style={{ width: '20%' }}>Costo unitario</td>
                    <td className="bdb bdrD tc fb" style={{ width: '20%' }}>Cantidad de días</td>
                    <td className="bdb tc fb" style={{ width: '20%' }}>Sub Total S/.</td>
                  </tr>
                  {costosTrayectos.map((ct, i) => (
                    <tr key={i}>
                      <td className="bdbD bdrD" style={{ padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                          <tbody><tr>
                            <td className="tr fb" style={{ width: '45%', borderRight: '1px dashed #000', padding: 4 }}>TRAYECTO {i + 1}</td>
                            <td className="tc editable-cell" style={{ width: '55%' }}>
                              <EditableInput value={ct.trayecto} onChange={(v: string) => handleArrayChange(setCostosTrayectos, i, 'trayecto', v)} placeholder="(Indique Trayecto)" />
                            </td>
                          </tr></tbody>
                        </table>
                      </td>
                      <td className="bdbD bdrD editable-cell"><EditableInput value={ct.costo} onChange={(v: string) => handleArrayChange(setCostosTrayectos, i, 'costo', v)} placeholder="S/." /></td>
                      <td className="bdbD bdrD editable-cell"><EditableInput value={ct.dias} onChange={(v: string) => handleArrayChange(setCostosTrayectos, i, 'dias', v)} placeholder="Días" /></td>
                      <td className="bdbD tr editable-cell">
                        <EditableInput value={ct.subtotal} onChange={(v: string) => handleArrayChange(setCostosTrayectos, i, 'subtotal', v)} placeholder="S/." />
                        {costosTrayectos.length > 1 && <button className="btn-remove-row no-print" onClick={() => removeArrayRow(setCostosTrayectos, i)}>✕</button>}
                      </td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} className="bdb bdr tr fb">SUB TOTAL S/.</td><td className="bdb tr editable-cell"><EditableInput placeholder="S/. Total" /></td></tr>
                </tbody>
              </table>
              <div className="no-print" style={{ textAlign: 'right', marginTop: -10, marginBottom: 15 }}>
                <span className="btn-add-row" onClick={() => addArrayRow(setCostosTrayectos, { trayecto: '', costo: '', dias: '', subtotal: '' })}>+ Añadir Trayecto</span>
              </div>

              <table className="cost-table">
                <tbody>
                  <tr><td colSpan={2} className="bdbD fb">RUBRO 03: Otros</td></tr>
                  <tr><td className="bdb bdrD tc fb" style={{ width: '75%' }}>Concepto</td><td className="bdb tc fb" style={{ width: '25%' }}>Sub Total S/.</td></tr>
                  {costosOtros.map((co, i) => (
                    <tr key={i}>
                      <td className="bdb bdrD tc editable-cell">
                        <EditableInput value={co.concepto} onChange={(v: string) => handleArrayChange(setCostosOtros, i, 'concepto', v)} placeholder="Escribir concepto..." />
                      </td>
                      <td className="bdb editable-cell">
                        <EditableInput value={co.subtotal} onChange={(v: string) => handleArrayChange(setCostosOtros, i, 'subtotal', v)} placeholder="S/." />
                        {costosOtros.length > 1 && <button className="btn-remove-row no-print" onClick={() => removeArrayRow(setCostosOtros, i)}>✕</button>}
                      </td>
                    </tr>
                  ))}
                  <tr><td className="bdr tr fb">SUB TOTAL S/.</td><td className="tr editable-cell"><EditableInput placeholder="S/. Total" /></td></tr>
                </tbody>
              </table>
              <div className="no-print" style={{ textAlign: 'right', marginTop: -10, marginBottom: 15 }}>
                <span className="btn-add-row" onClick={() => addArrayRow(setCostosOtros, { concepto: '', subtotal: '' })}>+ Añadir Concepto</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: 10 }}>
                <tbody>
                  <tr>
                    <td className="bdr tr fb" style={{ padding: 6, width: '75%' }}>COSTO TOTAL DEL SERVICIO</td>
                    <td className="tr" style={{ padding: 6 }}><span style={{ float: 'left' }}>S/.</span><span className="dd fb">{detalle.honorario_total}</span></td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: 9, marginTop: 10, fontStyle: 'italic' }}>
                Habiéndose determinado el costo del servicio en la presente estructura, se deriva a la Oficina de Logística para su contratación según el monto indicado.
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              DOC 3: SUSTENTO PROVEEDOR — 100% template del Admin
          ═══════════════════════════════════════════════════════════════ */}
          <div className="page-break" id="group-doc-sustento">
            <div className="excel-title" style={{ fontSize: '11pt' }}>FORMATO DE SUSTENTO PARA SOLICITAR LA CONTRATACIÓN PROVEEDOR ESPECÍFICO</div>
            <TemplateBlock html={getAdminTemplate('sustento_introduccion')} replacements={replacements} />
            <TemplateBlock html={getAdminTemplate('sustento_analisis')} replacements={replacements} />
            <TemplateBlock html={getAdminTemplate('sustento_conclusiones')} replacements={replacements} />
            <TemplateBlock html={getAdminTemplate('sustento_responsable')} replacements={replacements} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 4: PROPUESTA ECONÓMICA
          ═══════════════════════════════════════════════════════════════ */}
          <div className="page-break" id="group-doc-propuesta">
            <div className="excel-title">PROPUESTA ECONÓMICA</div>
            <p style={{ fontSize: 11, marginBottom: 16 }}>
              Estimados señores<br /><strong>MINISTERIO DE EDUCACIÓN</strong>
            </p>
            <div className="dashed-box">
              <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ width: '40%' }}>Apellidos y Nombres</td><td>: <span className="dd fb">{detalle.locador?.apellidos}, {detalle.locador?.nombres}</span></td></tr>
                  <tr><td>RUC N°</td><td>: <span className="dd fb">{detalle.locador?.ruc}</span></td></tr>
                  <tr><td>DNI / CE N°</td><td>: <span className="dd fb">{detalle.locador?.numero_documento}</span></td></tr>
                  <tr><td>Domicilio</td><td>: <span className="dd fb">{detalle.locador?.domicilio}</span></td></tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, marginBottom: 10 }}>Me dirijo a usted en referencia a la contratación de lo siguiente:</p>
            <div className="solid-box dd fb">{detalle.denominacion}</div>

            {/* Cuerpo editado por el Admin */}
            <TemplateBlock html={getAdminTemplate('propuesta_economica_cuerpo')} replacements={replacements} />

            <div className="dashed-box tc">
              <div style={{ borderBottom: '1px dashed #000', paddingBottom: 5, marginBottom: 5 }}>MONTO DEL SERVICIO</div>
              <div style={{ borderBottom: '1px dashed #000', paddingBottom: 5, marginBottom: 5 }}>
                <span className="dd fb" style={{ fontSize: 12 }}>S/ {detalle.honorario_total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <EditableInput
                  style={{ width: 250, borderBottom: '1px dashed #000', textAlign: 'center', padding: '0 5px', background: 'transparent' }}
                  placeholder="[ Escribir monto en letras ]"
                  value={montoLetras}
                  onChange={setMontoLetras}
                /> Soles
              </div>
            </div>

            <p style={{ fontSize: 10, marginBottom: 10, textAlign: 'justify' }}>
              En ese sentido, me comprometo a mantener la oferta presentada hasta perfeccionar el contrato, en caso de resultar favorecido.
            </p>
            <p style={{ fontSize: 10, marginBottom: 10, textAlign: 'justify' }}>
              El costo total del servicio incluye todos los impuestos de ley, seguros, transporte, inspecciones, pruebas, así como cualquier otro concepto que pueda tener incidencia sobre el costo del servicio. El pago se realizará de acuerdo a la aprobación de el(los) entregable(s) y de la conformidad del servicio, en las condiciones que se detallan en los términos de referencia, los que declaro conocer y aceptar a cabalidad.
            </p>
            <p style={{ fontSize: 10, marginBottom: 6 }}>Adjunto a la presente los siguientes documentos:</p>
            <ul className="propuesta-list">
              {[
                '1) Formato Hoja de Vida y documentos sustentatorios en copia simple.',
                '2) DJ de no tener impedimento para contratar y de no percibir otros ingresos del estado.',
                '3) Declaración Jurada de Grado de vínculo o parentesco.',
                '4) Declaración Jurada de No estar registrado en el REDAM.',
                '5) Declaración Jurada de Anticorrupción y Antisoborno.',
                '6) Formato de sustento para solicitar la contratación proveedor específico.',
                '7) Declaración Jurada de Pacto de Integridad.',
                '8) Formato de Declaración Jurada sobre Prohibiciones e Incompatibilidades.',
                '9) Declaración Jurada de Política del Sistema de Gestión Antisoborno y de Cumplimiento.',
                '10) Declaración Jurada de compromiso de confidencialidad.',
                '11) CCI - CARTA DE AUTORIZACIÓN DE PAGO.',
                '12) Constancia de recepción de la Política Institucional y del RISST del Ministerio de Educación.',
                '13) Copia simple de DNI.',
                '14) Copia simple de Constancia de Inscripción en el RNP vigente.',
                '15) Copia simple de ficha RUC actualizada.',
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <table style={{ width: '80%', margin: '16px auto 0', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ width: '40%', textAlign: 'right', paddingRight: 10 }}>Cotización que formulo a fecha:</td>
                  <td style={{ border: '1.5px solid #000', textAlign: 'center', padding: 4, backgroundColor: '#f2f2f2' }} className="dd fb">{fechaHoy}</td>
                </tr>
              </tbody>
            </table>
            <DJFooter locador={detalle.locador} fechaHoy={fechaHoy} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 5: HOJA DE VIDA — Tablas dinámicas (React) con cabeceras editables por Admin
              El texto introductorio y los encabezados de columna son editados por el Admin
              pero las FILAS son dinámicas con React para permitir "+ Añadir fila"
          ═══════════════════════════════════════════════════════════════ */}
          <div className="page-break" id="group-doc-cv">
            <div className="tc fb" style={{ fontSize: '14pt', textDecoration: 'underline', marginBottom: 12 }}>FORMATO ESTÁNDAR DE HOJA DE VIDA</div>
            <p style={{ fontSize: 9, textAlign: 'justify', marginBottom: 6 }}>
              La información que se registra en el presente formato se encuentra sustentada con la presentación, en copia simple,
              de los documentos que la acreditan. Declaro conocer y aceptar que todo documento que no haya sido informado en el
              presente formato, NO será tomado en cuenta.
            </p>

            <table className="excel-table">
              <tbody>
                <tr><td className="ehl" colSpan={4}>DATOS PERSONALES</td></tr>
                <tr><td className="fb">APELLIDOS Y NOMBRES:</td><td colSpan={3} className="dd fb">{detalle.locador?.apellidos}, {detalle.locador?.nombres}</td></tr>
                <tr>
                  <td className="fb">LUGAR DE NACIMIENTO:</td>
                  <td className="dd">{detalle.locador?.lugar_nacimiento || '—'}</td>
                  <td className="fb tc" rowSpan={2} style={{ verticalAlign: 'middle' }}>FECHA DE NACIMIENTO:</td>
                  <td className="tc" rowSpan={2} style={{ verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                      {['DIA', 'MES', 'AÑO'].map((lbl, i) => (
                        <div key={i}>
                          <div className="cv-date-box dd fb">
                            {detalle.locador?.fecha_nacimiento
                              ? (i === 0 ? new Date(detalle.locador?.fecha_nacimiento).getDate() : i === 1 ? new Date(detalle.locador?.fecha_nacimiento).getMonth() + 1 : new Date(detalle.locador?.fecha_nacimiento).getFullYear())
                              : ''}
                          </div>
                          <div style={{ fontSize: 8, textAlign: 'center' }}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr><td className="fb">ESTADO CIVIL:</td><td className="dd">{detalle.locador?.estado_civil}</td></tr>
                <tr><td className="fb">DNI / CE Nº:</td><td colSpan={3} className="dd fb">{detalle.locador?.numero_documento}</td></tr>
                <tr><td className="fb">RUC:</td><td colSpan={3} className="dd fb">{detalle.locador?.ruc}</td></tr>
                <tr><td className="ehl" colSpan={4}>DIRECCIÓN Y MEDIOS DE CONTACTO</td></tr>
                <tr><td className="fb">Domicilio:</td><td colSpan={3} className="dd">{detalle.locador?.domicilio}</td></tr>
                <tr><td className="fb">CORREO ELECTRÓNICO:</td><td colSpan={3} className="dd">{detalle.locador?.correo_electronico}</td></tr>
              </tbody>
            </table>

            {/* FORMACIÓN ACADÉMICA — dinámica */}
            <table className="excel-table">
              <thead>
                <tr><td className="ehl" colSpan={8}>FORMACIÓN ACADÉMICA</td></tr>
                <tr>{['N°', 'Nivel', 'Centro de Estudios', 'Especialidad', 'Año Inicio', 'Año Fin', 'Fecha Título', 'Ciudad/País'].map((h) => <td key={h} className="eh" style={{ fontSize: 9 }}>{h}</td>)}</tr>
              </thead>
              <tbody>
                {cvFormacion.map((f, i) => (
                  <tr key={i}>
                    <td className="tc">{i + 1}</td>
                    <td className="editable-cell"><EditableInput value={f.grado_obtenido} onChange={(v: string) => handleArrayChange(setCvFormacion, i, 'grado_obtenido', v)} /></td>
                    <td className="editable-cell"><EditableInput value={f.centro_estudios} onChange={(v: string) => handleArrayChange(setCvFormacion, i, 'centro_estudios', v)} /></td>
                    <td className="editable-cell"><EditableInput value={f.especialidad} onChange={(v: string) => handleArrayChange(setCvFormacion, i, 'especialidad', v)} /></td>
                    <td className="editable-cell"><EditableInput type="number" value={f.fecha_inicio ? new Date(f.fecha_inicio).getFullYear() : ''} onChange={(v: string) => handleArrayChange(setCvFormacion, i, 'fecha_inicio', `${v}-01-01`)} /></td>
                    <td className="editable-cell"><EditableInput type="number" value={f.fecha_fin ? new Date(f.fecha_fin).getFullYear() : ''} onChange={(v: string) => handleArrayChange(setCvFormacion, i, 'fecha_fin', `${v}-01-01`)} /></td>
                    <td className="editable-cell"><EditableInput value={f.fecha_extension} onChange={(v: string) => handleArrayChange(setCvFormacion, i, 'fecha_extension', v)} placeholder="MM/AAAA" /></td>
                    <td className="editable-cell">
                      <EditableInput value={f.ciudad} onChange={(v: string) => handleArrayChange(setCvFormacion, i, 'ciudad', v)} />
                      {cvFormacion.length > 1 && <button className="btn-remove-row no-print" onClick={() => removeArrayRow(setCvFormacion, i)}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print" style={{ textAlign: 'right', marginTop: -10, marginBottom: 15 }}>
              <span className="btn-add-row" onClick={() => addArrayRow(setCvFormacion, { grado_obtenido: '', centro_estudios: '', especialidad: '', fecha_inicio: '', fecha_fin: '', fecha_extension: '', ciudad: '' })}>+ Añadir fila</span>
            </div>

            {/* CURSOS */}
            <table className="excel-table">
              <tbody>
                <tr><td className="ehl" colSpan={8}>OTROS REQUISITOS DE FORMACIÓN</td></tr>
                <tr>{['N°', 'Nivel', 'Centro de Estudios', 'Tema', 'Fecha Inicio', 'Fecha Término', 'Duración (Hrs)', 'Documento'].map((h) => <td key={h} className="eh" style={{ fontSize: 9 }}>{h}</td>)}</tr>
                {cvCursos.map((c, i) => (
                  <tr key={i}>
                    <td className="tc">{i + 1}</td>
                    <td className="editable-cell"><EditableInput value={c.nivel} onChange={(v: string) => handleArrayChange(setCvCursos, i, 'nivel', v)} /></td>
                    <td className="editable-cell"><EditableInput value={c.centro_estudios} onChange={(v: string) => handleArrayChange(setCvCursos, i, 'centro_estudios', v)} /></td>
                    <td className="editable-cell"><EditableInput value={c.tema} onChange={(v: string) => handleArrayChange(setCvCursos, i, 'tema', v)} /></td>
                    <td className="editable-cell"><EditableInput type="date" style={{ fontSize: 8 }} value={toYMD(c.fecha_inicio)} onChange={(v: string) => handleArrayChange(setCvCursos, i, 'fecha_inicio', v)} /></td>
                    <td className="editable-cell"><EditableInput type="date" style={{ fontSize: 8 }} value={toYMD(c.fecha_fin)} onChange={(v: string) => handleArrayChange(setCvCursos, i, 'fecha_fin', v)} /></td>
                    <td className="editable-cell"><EditableInput value={c.duracion} onChange={(v: string) => handleArrayChange(setCvCursos, i, 'duracion', v)} /></td>
                    <td className="editable-cell">
                      <EditableInput value={c.documento} onChange={(v: string) => handleArrayChange(setCvCursos, i, 'documento', v)} />
                      {cvCursos.length > 1 && <button className="btn-remove-row no-print" onClick={() => removeArrayRow(setCvCursos, i)}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print" style={{ textAlign: 'right', marginTop: -10, marginBottom: 15 }}>
              <span className="btn-add-row" onClick={() => addArrayRow(setCvCursos, { nivel: '', centro_estudios: '', tema: '', fecha_inicio: '', fecha_fin: '', duracion: '', documento: '' })}>+ Añadir fila</span>
            </div>

            {/* Otros requisitos */}
            <table className="excel-table" style={{ marginBottom: 15 }}>
              <tbody>
                <tr><td className="ehl" colSpan={4}>OTROS REQUISITOS</td></tr>
                <tr>
                  <td className="fb" style={{ width: '20%' }}>COLEGIO PROFESIONAL:</td>
                  <td className="editable-cell" style={{ width: '30%' }}><EditableInput value={cvOtros.colegio} onChange={(v: string) => setCvOtros({ ...cvOtros, colegio: v })} /></td>
                  <td className="fb" style={{ width: '20%' }}>CERTIFICACIÓN:</td>
                  <td className="editable-cell" style={{ width: '30%' }}><EditableInput value={cvOtros.certificacion} onChange={(v: string) => setCvOtros({ ...cvOtros, certificacion: v })} /></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* EXPERIENCIA */}
          <div className="page-break">
            <div className="ehl" style={{ border: '1px solid #000', padding: '5px 10px', marginBottom: 8, fontWeight: 'bold' }}>EXPERIENCIA DE TRABAJO</div>

            {/* Experiencia General */}
            <table className="excel-table">
              <tbody>
                <tr><td className="ehl" colSpan={7}>EXPERIENCIA LABORAL (GENERAL)</td></tr>
                <tr><td colSpan={7} style={{ fontSize: 10 }}>
                  Experiencia acumulada:&nbsp;
                  <span className="exp-box dd">{totalGen.years}</span> AÑOS
                  <span className="exp-box dd">{totalGen.months}</span> MESES
                  <span className="exp-box dd">{totalGen.days}</span> DIAS
                </td></tr>
                <tr>{['N°', 'Entidad/Empresa', 'Cargo', 'Descripción', 'Fecha Inicio', 'Fecha Fin', 'Tiempo'].map((h) => <td key={h} className="eh" style={{ fontSize: 9 }}>{h}</td>)}</tr>
                {cvExpGen.map((e, i) => (
                  <tr key={i}>
                    <td className="tc">{i + 1}</td>
                    <td className="editable-cell"><EditableInput value={e.entidad_empresa} onChange={(v: string) => handleArrayChange(setCvExpGen, i, 'entidad_empresa', v)} /></td>
                    <td className="editable-cell"><EditableInput value={e.cargo} onChange={(v: string) => handleArrayChange(setCvExpGen, i, 'cargo', v)} /></td>
                    <td className="editable-cell"><EditableInput style={{ textAlign: 'left', paddingLeft: 4 }} value={e.descripcion_trabajo} onChange={(v: string) => handleArrayChange(setCvExpGen, i, 'descripcion_trabajo', v)} /></td>
                    <td className="editable-cell"><EditableInput type="date" style={{ fontSize: 8 }} value={toYMD(e.fecha_inicio)} onChange={(v: string) => handleArrayChange(setCvExpGen, i, 'fecha_inicio', v)} /></td>
                    <td className="editable-cell"><EditableInput type="date" style={{ fontSize: 8 }} value={toYMD(e.fecha_fin)} onChange={(v: string) => handleArrayChange(setCvExpGen, i, 'fecha_fin', v)} /></td>
                    <td className="editable-cell" style={{ verticalAlign: 'middle', textTransform: 'capitalize' }}>
                      <div className="print-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getDurationText(e.fecha_inicio, e.fecha_fin)}</div>
                      {cvExpGen.length > 1 && <button className="btn-remove-row no-print" onClick={() => removeArrayRow(setCvExpGen, i)}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print" style={{ textAlign: 'right', marginTop: -10, marginBottom: 15 }}>
              <span className="btn-add-row" onClick={() => addArrayRow(setCvExpGen, { entidad_empresa: '', cargo: '', descripcion_trabajo: '', fecha_inicio: '', fecha_fin: '' })}>+ Añadir fila</span>
            </div>

            {/* Experiencia Específica */}
            <table className="excel-table">
              <tbody>
                <tr><td className="ehl" colSpan={7}>EXPERIENCIA ESPECÍFICA (EN EL SERVICIO REQUERIDO)</td></tr>
                <tr><td colSpan={7} style={{ fontSize: 10 }}>
                  Experiencia acumulada:&nbsp;
                  <span className="exp-box dd">{totalEsp.years}</span> AÑOS
                  <span className="exp-box dd">{totalEsp.months}</span> MESES
                  <span className="exp-box dd">{totalEsp.days}</span> DIAS
                </td></tr>
                <tr>{['N°', 'Entidad/Empresa', 'Cargo', 'Descripción', 'Fecha Inicio', 'Fecha Fin', 'Tiempo'].map((h) => <td key={h} className="eh" style={{ fontSize: 9 }}>{h}</td>)}</tr>
                {cvExpEsp.map((e, i) => (
                  <tr key={i}>
                    <td className="tc">{i + 1}</td>
                    <td className="editable-cell"><EditableInput value={e.entidad_empresa} onChange={(v: string) => handleArrayChange(setCvExpEsp, i, 'entidad_empresa', v)} /></td>
                    <td className="editable-cell"><EditableInput value={e.cargo} onChange={(v: string) => handleArrayChange(setCvExpEsp, i, 'cargo', v)} /></td>
                    <td className="editable-cell"><EditableInput style={{ textAlign: 'left', paddingLeft: 4 }} value={e.descripcion_trabajo} onChange={(v: string) => handleArrayChange(setCvExpEsp, i, 'descripcion_trabajo', v)} /></td>
                    <td className="editable-cell"><EditableInput type="date" style={{ fontSize: 8 }} value={toYMD(e.fecha_inicio)} onChange={(v: string) => handleArrayChange(setCvExpEsp, i, 'fecha_inicio', v)} /></td>
                    <td className="editable-cell"><EditableInput type="date" style={{ fontSize: 8 }} value={toYMD(e.fecha_fin)} onChange={(v: string) => handleArrayChange(setCvExpEsp, i, 'fecha_fin', v)} /></td>
                    <td className="editable-cell" style={{ verticalAlign: 'middle', textTransform: 'capitalize' }}>
                      <div className="print-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getDurationText(e.fecha_inicio, e.fecha_fin)}</div>
                      {cvExpEsp.length > 1 && <button className="btn-remove-row no-print" onClick={() => removeArrayRow(setCvExpEsp, i)}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print" style={{ textAlign: 'right', marginTop: -10, marginBottom: 15 }}>
              <span className="btn-add-row" onClick={() => addArrayRow(setCvExpEsp, { entidad_empresa: '', cargo: '', descripcion_trabajo: '', fecha_inicio: '', fecha_fin: '' })}>+ Añadir fila</span>
            </div>

            <p style={{ fontSize: 10, marginTop: 10 }}>Declaro que la información proporcionada es veraz.</p>
            <DJFooter locador={detalle.locador} fechaHoy={fechaHoy} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 6: DJ IMPEDIMENTOS — cabecera fija, items hardcodeados por su naturaleza legal
          ═══════════════════════════════════════════════════════════════ */}
          <div className="page-break" id="group-doc-dj-imp">
            <div className="excel-title" style={{ fontSize: '9pt' }}>DECLARACIÓN JURADA DE NO TENER IMPEDIMENTO PARA CONTRATAR Y DE NO PERCIBIR OTROS INGRESOS DEL ESTADO Y DE NO ENCONTRARSE CON SANCIÓN VIGENTE DE INHABILITACIÓN O SUSPENSIÓN INSCRITA, EN EL REGISTRO NACIONAL DE SANCIONES CONTRA SERVIDORES CIVILES</div>
            <DJHeader locador={detalle.locador} />
            <div className="fb" style={{ marginBottom: 8, fontSize: 10 }}>Declaro bajo juramento lo siguiente:</div>
            <table className="dj-table">
              <tbody>
                <tr>
                  <td className="dj-num">1</td>
                  <td>Que, no me encuentro bajo ninguna causal de prohibición y/o impedimento o inhabilitado(a) ni administrativa ni judicialmente para contratar con el Estado, ni en ninguna otra causal contemplada en alguna disposición legal o reglamentaria que determine mi imposibilidad de ser contratado(a) por el Estado, conforme al artículo 30° de la Ley General de Contrataciones Públicas y su Reglamento.</td>
                </tr>
                <tr>
                  <td className="dj-num">2</td>
                  <td>
                    Que, conozco, acepto y me someto a los Términos de Referencia establecidos en la contratación de:
                    <div className="solid-box dd fb" style={{ marginTop: 6 }}>{detalle.denominacion}</div>
                  </td>
                </tr>
                <tr><td className="dj-num">3</td><td>Que, soy responsable de la veracidad de los documentos e información que presento en la presente contratación.</td></tr>
                <tr><td className="dj-num">4</td><td>Que, me comprometo a mantener la oferta presentada hasta perfeccionar la contratación, en caso de resultar favorecido(a).</td></tr>
                <tr><td className="dj-num">5</td><td>Que, en caso surja cualquier evento que me impida iniciar y/o continuar con la ejecución del servicio, me comprometo a informar sobre el hecho generador del incumplimiento, vía correo electrónico, en un plazo no mayor de 24 horas de haberse suscitado el mismo, caso contrario la Entidad podrá resolver la contratación por incumplimiento bajo el marco legal del Artículo 1430° del Código Civil Vigente.</td></tr>
                <tr><td className="dj-num">6</td><td>Que, conozco las sanciones contenidas en la Ley General de Contrataciones Públicas y su Reglamento, así como la Ley N° 27444 - Ley del Procedimiento Administrativo General.</td></tr>
                <tr><td className="dj-num">7</td><td>Que, no estoy incurso(a) en las prohibiciones e incompatibilidades establecidas en la Ley N° 27588 - Ley que establece prohibiciones e incompatibilidades de Funcionarios y Servidores Públicos, así como de las personas que presten servicios al Estado bajo cualquier modalidad contractual.</td></tr>
                <tr><td className="dj-num">8</td><td>Que, no he sido implicado(a) en delitos de terrorismo, apología del terrorismo, delitos de violación de la libertad sexual y/o delitos de tráfico ilícito de drogas, ni he sido sentenciado(a), con resolución consentida o ejecutoriada, ni me encuentro dentro de un proceso de investigación para el esclarecimiento de la comisión en cualquiera de los delitos a los que se refiere la Ley N° 29988, su Reglamento aprobado por Decreto Supremo N° 004-2017-MINEDU, la Ley N° 30794, y la Norma Técnica "Disposiciones que regulan la aplicación de la Ley N° 29988 y su Reglamento en el Minedu, DRE y UGEL" aprobada por Resolución Ministerial N° 241-2018-MINEDU.</td></tr>
                <tr><td className="dj-num">9</td><td>Que, no me encuentro inhabilitado(a) para prestar servicios con el Estado, conforme al REGISTRO NACIONAL DE SANCIONES DE DESTITUCIÓN Y DESPIDO - RNSDD.</td></tr>
                <tr><td className="dj-num">10</td><td>Que, no me encuentro inmerso(a) en el ámbito de aplicación de la Ley N° 28175 - Ley Marco del Empleo Público, por lo que puedo percibir ingresos provenientes del Estado relacionados a la contratación de cualquier prestación de servicios.</td></tr>
                <tr><td className="dj-num">11</td><td>Que, no he ofrecido u otorgado, ni ofreceré, ni otorgaré ya sea directa o indirectamente a través de terceros, ningún pago o beneficio indebido o cualquier otra ventaja inadecuada, a funcionario público alguno, o sus familiares, o socios comerciales, a fin de obtener el objeto de la presente contratación. Asimismo, confirmo no haber celebrado o celebrar acuerdos formales o tácitos, entre los postores o con terceros con el fin de establecer prácticas restrictivas de la libre competencia, y de resultar ganador(a) de la presente contratación, me obligo a dejar de percibir dichos ingresos durante el periodo del presente servicio.</td></tr>
                <tr><td className="dj-num">12</td><td>Que no cuento con sanción vigente de inhabilitación o suspensión inscrita, en el Registro Nacional de Sanciones Contra Servidores Civiles.</td></tr>
                <tr>
                  <td className="dj-num">13</td>
                  <td>
                    Que, declaro el siguiente correo electrónico, el cual servirá de medio de comunicación para toda notificación que deba realizarse en relación al servicio indicado:
                    <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '30%', textAlign: 'right', paddingRight: 10, fontWeight: 'bold' }}>Correo Electrónico:</td>
                          <td style={{ border: '1.5px solid #000', textAlign: 'center', padding: 4, backgroundColor: '#f2f2f2' }} className="dd fb">{detalle.locador?.correo_electronico}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <DJFooter locador={detalle.locador} fechaHoy={fechaHoy} />
            <div className="footnotes">
              [1] Mediante Resolución Ministerial 017-2007-PCM, publicado el 20 de enero de 2007, se aprobó la "Directiva para el uso, registro y consulta del Sistema Electrónico del Registro Nacional de Sanciones de Destitución y Despido – RNSDD". En ella se establece la obligación de realizar consulta o constatar que ningún candidato se encuentre inhabilitado para ejercer función pública conforme al RNSDD, respecto de los procesos de nombramiento, designación, elección, contratación laboral o de locación de servicios.
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 7: DJ PARENTESCO — tabla dinámica con React
          ═══════════════════════════════════════════════════════════════ */}
          <div className="page-break" id="group-doc-dj-par">
            <div className="excel-title">DECLARACIÓN JURADA DE GRADO DE VÍNCULO O PARENTESCO</div>
            <DJHeader locador={detalle.locador} />
            <table className="dj-table">
              <tbody>
                <tr>
                  <td className="dj-num">1</td>
                  <td>
                    Que, en pleno ejercicio de mis derechos ciudadanos declaro que:
                    <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0', fontSize: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} onClick={() => setParentescoInfo({ ...parentescoInfo, tiene: true })}>
                        <CheckBox checked={parentescoInfo.tiene} /> <span>SÍ</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} onClick={() => setParentescoInfo({ ...parentescoInfo, tiene: false })}>
                        <CheckBox checked={!parentescoInfo.tiene} /> <span>NO</span>
                      </div>
                    </div>
                    <div className="print-only">
                      <div style={{ display: 'flex', gap: 20, margin: '8px 0' }}>
                        <div><CheckBox checked={parentescoInfo.tiene} /> SÍ</div>
                        <div><CheckBox checked={!parentescoInfo.tiene} /> NO</div>
                      </div>
                    </div>
                    tengo parentesco hasta el segundo grado de consanguinidad y segundo de afinidad con personas que presten servicios en el Ministerio de Educación.
                    <table className="excel-table" style={{ marginTop: 8 }}>
                      <thead>
                        <tr>
                          {['NOMBRES Y APELLIDOS', 'GRADO DE PARENTESCO', 'OFICINA', 'CARGO', 'CONDICIÓN'].map((h) => (
                            <td key={h} className="eh" style={{ fontSize: 9, width: '20%' }}>{h}</td>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parentescoInfo.filas.map((fila, i) => (
                          <tr key={i}>
                            {(['nombres', 'grado', 'oficina', 'cargo', 'condicion'] as const).map((field) => (
                              <td key={field} className="editable-cell">
                                <EditableInput value={fila[field]} onChange={(v: string) => handleParentescoChange(i, field, v)} disabled={!parentescoInfo.tiene} />
                                {field === 'condicion' && parentescoInfo.tiene && parentescoInfo.filas.length > 1 && (
                                  <button className="btn-remove-row no-print" onClick={() => setParentescoInfo({ ...parentescoInfo, filas: parentescoInfo.filas.filter((_, fi) => fi !== i) })}>✕</button>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parentescoInfo.tiene && (
                      <div className="no-print" style={{ textAlign: 'right', marginTop: 4 }}>
                        <span className="btn-add-row" onClick={() => setParentescoInfo({ ...parentescoInfo, filas: [...parentescoInfo.filas, { nombres: '', grado: '', oficina: '', cargo: '', condicion: '' }] })}>+ Añadir fila</span>
                      </div>
                    )}
                  </td>
                </tr>
                <tr><td className="dj-num">3</td><td>Que, señalo que he sido informado que la relación del personal del Ministerio de Educación contratado bajo cualquier modalidad se encuentra publicada en el Portal de Transparencia de la Entidad.</td></tr>
                <tr><td className="dj-num">4</td><td>Que, manifiesto que lo antes mencionado corresponde a la verdad de los hechos y que tengo conocimiento que si lo declarado resulta falso, estoy sujeto a las acciones que correspondan de acuerdo a lo establecido en la normativa vigente, al haber realizado declaración falsa violando el Principio de Presunción de Veracidad, así como en caso de haber incurrido en falsedad, simulación o alteración de la verdad intencionalmente.</td></tr>
              </tbody>
            </table>
            <DJFooter locador={detalle.locador} fechaHoy={fechaHoy} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 8: DJ REDAM
          ═══════════════════════════════════════════════════════════════ */}
          <div className="page-break" id="group-doc-dj-redam">
            <div className="excel-title" style={{ fontSize: '11pt' }}>DECLARACIÓN JURADA DE NO ESTAR REGISTRADO EN EL REDAM</div>
            <DJHeader locador={detalle.locador} />
            <table className="dj-table">
              <tbody>
                <tr>
                  <td className="dj-num">1</td>
                  <td>
                    Que, en pleno ejercicio de mis derechos ciudadanos declaro que me encuentro registrado en el Registro de Deudores Alimentarios Morosos:
                    <div className="no-print" style={{ display: 'flex', gap: 16, margin: '8px 0', fontSize: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} onClick={() => setRedamInfo(true)}><CheckBox checked={redamInfo} /> SÍ</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} onClick={() => setRedamInfo(false)}><CheckBox checked={!redamInfo} /> NO</div>
                    </div>
                    <div className="print-only">
                      <div style={{ display: 'flex', gap: 20, margin: '8px 0' }}>
                        <div><CheckBox checked={redamInfo} /> SÍ</div>
                        <div><CheckBox checked={!redamInfo} /> NO</div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr><td className="dj-num">2</td><td>Que, en caso me encuentre registrado en el Registro de Deudores Alimentarios Morosos, autorizo se realicen los descuentos que correspondan, conforme a lo señalado en el artículo 10 de la Ley 28970 Ley que creó el Registro de Deudores Alimentarios Morosos.</td></tr>
                <tr><td className="dj-num">3</td><td>Que en caso surja, durante el periodo de la contratación del presente servicio, algún registro, me comprometo a comunicar a la entidad y autorizo se realicen los descuentos que correspondan, conforme a lo señalado en el artículo 10 de la Ley 28970 Ley que creó el Registro de Deudores Alimentarios Morosos.</td></tr>
                <tr><td className="dj-num">4</td><td>Que, tengo conocimiento de los alcances de la Ley 28970 Ley que creó el Registro de Deudores Alimentarios Morosos, Decreto Supremo N°002-2007-JUS Reglamento de la Ley que crea el Registro de Deudores Alimentarios Morosos y el Decreto Legislativo N°1377 que fortalece la Protección Integral de Niñas, Niños y Adolescentes.</td></tr>
                <tr><td className="dj-num">5</td><td>Que, manifiesto que lo antes mencionado corresponde a la verdad de los hechos y que tengo conocimiento que si lo declarado resulta falso, estoy sujeto a las acciones que correspondan de acuerdo a lo establecido en la normativa vigente, al haber realizado declaración falsa violando el Principio de Presunción de Veracidad, así como en caso de haber incurrido en falsedad, simulación o alteración de la verdad intencionalmente.</td></tr>
              </tbody>
            </table>
            <DJFooter locador={detalle.locador} fechaHoy={fechaHoy} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 9–13: DJs LEGALES — cuerpo 100% editable por Admin
          ═══════════════════════════════════════════════════════════════ */}
          {([
            ['group-doc-anticorr', 'DECLARACIÓN JURADA DE ANTICORRUPCIÓN Y ANTISOBORNO', 'dj_anticorrupcion_cuerpo', null],
            ['group-doc-pacto', 'DECLARACIÓN JURADA DE PACTO DE INTEGRIDAD', 'dj_pacto_integridad_cuerpo', `<div class="footnotes"><sup>20</sup> De conformidad con el literal b del numeral 69.1 del artículo 69 del Reglamento de la Ley N° 32069.</div>`],
            ['group-doc-prohib', 'DECLARACIÓN JURADA SOBRE PROHIBICIONES E INCOMPATIBILIDADES', 'dj_prohibiciones_cuerpo', null],
            ['group-doc-antisoborno', 'DECLARACIÓN JURADA DE POLÍTICA DEL SISTEMA DE GESTIÓN ANTISOBORNO Y DE CUMPLIMIENTO', 'dj_antisoborno_cuerpo', null],
            ['group-doc-confidencial', 'DECLARACIÓN JURADA DE COMPROMISO DE CONFIDENCIALIDAD', 'dj_confidencialidad_cuerpo', `<div class="footnotes"><sup>1</sup> REF. OFICIO_MULTIPLE-00026-2021-MINEDU-SPE-OTIC</div>`],
          ] as [string, string, string, string | null][]).map(([id, titulo, templateKey, footnote]) => (
            <div className="page-break" id={id} key={id}>
              <div className="excel-title" style={{ fontSize: '10pt' }}>{titulo}</div>
              <DJHeader locador={detalle.locador} />
              <div style={{ margin: '12px 0', fontSize: 10 }}>
                Para la prestación:
                <div className="solid-box dd fb" style={{ marginTop: 6 }}>{detalle.denominacion}</div>
              </div>
              <div className="fb" style={{ marginBottom: 8, fontSize: 10 }}>DECLARO BAJO JURAMENTO LO SIGUIENTE:</div>
              {/* Cuerpo HTML completamente editable por el Admin */}
              <TemplateBlock html={getAdminTemplate(templateKey)} replacements={replacements} />
              <DJFooter locador={detalle.locador} fechaHoy={fechaHoy} />
              {footnote && <div dangerouslySetInnerHTML={{ __html: footnote }} />}
            </div>
          ))}

          {/* ═══════════════════════════════════════════════════════════════
              DOC 14: CCI
          ═══════════════════════════════════════════════════════════════ */}
          <div className="page-break" id="group-doc-cci">
            <div className="excel-title">CCI - CARTA DE AUTORIZACIÓN DE PAGO</div>
            <div style={{ fontSize: 10, marginBottom: 12 }}>(Para el pago con abonos en la cuenta bancaria del proveedor)</div>
            <p style={{ fontSize: 11, marginBottom: 16 }}>
              Fecha: <span className="dd fb">{fechaHoy}</span>
            </p>
            <p style={{ fontSize: 11, marginBottom: 6 }}>Señor</p>
            <p style={{ fontSize: 11, marginBottom: 14 }}>
              Director General de Administración{' '}
              <span style={{ fontSize: 10 }}>
                UE 024 <span style={{ border: '1px solid #000', padding: '0 4px' }}>&nbsp;</span>&nbsp;
                026 <span style={{ border: '1px solid #000', padding: '0 4px', background: '#f2f2f2' }}>X</span>&nbsp;
                116 <span style={{ border: '1px solid #000', padding: '0 4px' }}>&nbsp;</span>
                <span style={{ fontSize: 9, fontStyle: 'italic' }}> (Marcar con una X)</span>
              </span>
              <br />Presente.-
            </p>
            <p style={{ fontSize: 11, marginBottom: 14 }}><strong>Asunto: Autorización para el pago con abonos en cuenta</strong></p>
            <p style={{ fontSize: 11, marginBottom: 14, textAlign: 'justify' }}>
              Por medio de la presente, comunico a Usted que el número de CÓDIGO DE CUENTA INTERBANCARIO (CCI) que consta de (20 NUMEROS) es:
            </p>
            <div style={{ border: '2px solid #000', padding: 10, marginBottom: 14, textAlign: 'center' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 auto', maxWidth: 500 }}>
                <tbody>
                  <tr>
                    {(detalle.locador?.cci || '').toString().split('').concat(Array(20).fill('')).slice(0, 20).map((d: string, i: number) => (
                      <td key={i} style={{ border: '1px solid #000', width: 28, height: 28, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: 'var(--accent)' }}>{d}</td>
                    ))}
                  </tr>
                  <tr>
                    {Array.from({ length: 20 }, (_, i) => (
                      <td key={i} style={{ textAlign: 'center', fontSize: 8, border: 'none', paddingTop: 2 }}>{i + 1}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, marginBottom: 14, textAlign: 'justify' }}>
              Agradeciéndole se sirva disponer lo conveniente de manera que los pagos a nombre de mi representada sean abonados en la cuenta que corresponde al indicado CCI - Cuenta de Ahorros en SOLES del BANCO:
            </p>
            <table className="excel-table" style={{ marginBottom: 14 }}>
              <tbody>
                <tr><td className="fb" style={{ width: '30%' }}>NOMBRE DEL BANCO:</td><td className="dd fb">{detalle.locador?.banco}</td></tr>
                <tr><td className="fb">PROVEEDOR:</td><td className="dd fb">{detalle.locador?.apellidos}, {detalle.locador?.nombres}</td></tr>
                <tr><td className="fb">RUC N°:</td><td className="dd fb">{detalle.locador?.ruc}</td></tr>
              </tbody>
            </table>
            <p style={{ fontSize: 10, textAlign: 'justify', marginBottom: 14 }}>
              Asimismo, dejo constancia que la factura a ser emitida por el suscrito (o mi representada) una vez cumplida o atendida la correspondiente Orden de Compra y/o de Servicio quedará cancelada para todos sus efectos mediante la sola acreditación del importe de la referida factura a favor de la cuenta en la entidad bancaria a que se refiere el primer párrafo de la presente.
            </p>
            <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic', marginBottom: 14, padding: 6, border: '1px dashed #ccc' }}>
              NOTA: EL CCI DEBE ESTAR VINCULADO ÚNICAMENTE CON EL RUC
            </div>
            <p style={{ fontSize: 11, marginBottom: 8 }}>Atentamente,</p>
            <DJFooter locador={detalle.locador} fechaHoy={fechaHoy} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DOC 15: CONSTANCIA SST
          ═══════════════════════════════════════════════════════════════ */}
          <div className="page-break" id="group-doc-sst">
            <div className="excel-title" style={{ fontSize: '10pt' }}>ANEXO<br/>CONSTANCIA DE RECEPCIÓN DE LA POLÍTICA INSTITUCIONAL Y DEL REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO DEL MINISTERIO DE EDUCACIÓN</div>
            <DJHeader locador={detalle.locador} />
            <div style={{ margin: '12px 0', fontSize: 10 }}>
              Para la prestación:
              <div className="solid-box dd fb" style={{ marginTop: 6 }}>{detalle.denominacion}</div>
            </div>
            <p style={{ fontSize: 10, textAlign: 'justify', marginBottom: 10 }}>
              Mediante la presente declaración jurada declaro tomar conocimiento, comprender y me comprometo a contribuir con el
              cumplimiento de los compromisos de la "Política del Sistema de Gestión de la Seguridad y Salud en el Trabajo", la cual fue
              formalizada por la Resolución Ministerial N° 370-2025-MINEDU y el "Reglamento Interno de Seguridad y Salud en el Trabajo"
              formalizado por la Resolución de Secretaría General N.° 012-2021-MINEDU. Los documentos mencionados se pueden
              visualizar en los siguientes enlaces:
            </p>
            <p style={{ fontSize: 9, marginBottom: 10, color: '#1B4B8A' }}>
              https://www.transparencia.gob.pe/enlaces/pte_transparencia_enlaces.aspx?id_entidad=133&id_tema=107<br/>
              https://www.gob.pe/institucion/minedu/normas-legales/1517665-012-2021-minedu
            </p>
            <div style={{ border: '1px solid #000', padding: 12, marginBottom: 12, fontSize: 10, textAlign: 'justify' }}>
              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>POLÍTICA DEL SISTEMA DE GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO</p>
              <p style={{ marginBottom: 8 }}>
                El Ministerio de Educación es el órgano de Gobierno Nacional que tiene por finalidad definir, dirigir y articular la política de
                educación, recreación y deporte, en concordancia con la política general del Estado, y cuya rectoría se ejerce a través de la
                articulación intergubernamental con los Gobiernos Regionales y Locales, propiciando los siguientes valores: integridad,
                respeto, servicio y legalidad; asumiendo los siguientes compromisos:
              </p>
              <ul style={{ paddingLeft: 14, lineHeight: 1.6 }}>
                <li>Proteger la seguridad y salud de los servidores, las personas bajo modalidades formativas, aquellas que prestan servicios, así como a los visitantes, que se encuentren dentro de las instalaciones del Ministerio de Educación.</li>
                <li>Proporcionar condiciones de trabajo seguras y saludables, para la prevención de lesiones, dolencias, enfermedades, deterioro de la salud e incidentes relacionados con el trabajo; mediante la identificación y eliminación de los peligros, así como la reducción de los riesgos, promoviendo la cultura de prevención en el Ministerio de Educación.</li>
                <li>Cumplir con el marco legal vigente, disposiciones internas y otros requisitos aplicables al Sistema de Gestión de Seguridad y Salud en el Trabajo del Ministerio de Educación.</li>
                <li>Promover mecanismos de participación y consulta de los servidores, así como de sus representantes en el Sistema de Gestión de Seguridad y Salud en el Trabajo, a través de la ejecución de los planes y programas sobre la materia de Seguridad y Salud en el Trabajo.</li>
                <li>Articular el Sistema de Gestión de Seguridad y Salud en el Trabajo del Ministerio de Educación para su integración y/o compatibilidad con cualquier otro Sistema de Gestión del que se disponga o sea implementado en el futuro.</li>
                <li>Fomentar la mejora continua del Sistema de Gestión de Seguridad y Salud en el Trabajo.</li>
              </ul>
            </div>
            <p style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 8 }}>CONSTANCIA DE RECEPCIÓN DE LA POLÍTICA INSTITUCIONAL Y DEL REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO DEL MINISTERIO DE EDUCACIÓN</p>
            <table className="dj-table">
              <tbody>
                <tr><td className="dj-num">1.</td><td>Declaro haber recibido y leído la Política Institucional y el Reglamento Interno de Seguridad y Salud en el Trabajo (RISST) del Ministerio de Educación.</td></tr>
                <tr><td className="dj-num">2.</td><td>Declaro que me regiré por las normas y reglas especificadas en el Reglamento, fomentando el desarrollo de mis actividades de manera segura y eficiente y poniendo en práctica lo regulado en el RISST.</td></tr>
                <tr><td className="dj-num">3.</td><td>Me comprometo a cumplir la legislación vigente sobre Seguridad y Salud en el Trabajo y toda disposición en dicha materia que se fije durante el tiempo que dure mi relación contractual o convenio de prácticas.</td></tr>
              </tbody>
            </table>
            <DJFooter locador={detalle.locador} fechaHoy={fechaHoy} />
          </div>

        </div>

        {/* FOOTER DEL PANEL */}
        <div className="preview-footer no-print">
          <p style={{ fontSize: 11, color: 'gray', marginBottom: 10, textAlign: 'center' }}>
            Activa <strong>"Gráficos de fondo"</strong> en los ajustes de impresión para preservar los encabezados grises.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveModal('export')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
            Imprimir Expediente Completo
          </button>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────────── */}
      <div className={`tdr-modal ${activeModal === 'export' ? 'open' : ''}`}>
        <div className="modal-backdrop" onClick={() => setActiveModal(null)} />
        <div className="modal-box">
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Exportar Expediente</h2>
          <p style={{ marginBottom: 14, fontSize: 14, color: 'var(--text2)' }}>
            Genera un ZIP con cada documento como PDF independiente.
          </p>
          <div style={{ background: '#EBF0F9', padding: 12, borderRadius: 6, border: '1px solid #1B4B8A', fontSize: 12, marginBottom: 18 }}>
            <strong style={{ color: '#1B4B8A' }}>📋 Instrucciones:</strong><br/>
            1. Click en "Descargar ZIP" — puede tardar unos segundos.<br/>
            2. Se descargará un archivo <strong>.zip</strong> con los 15 documentos en PDF.<br/>
            3. Cada PDF tiene el nombre del documento + código TDR.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            <button
              className="btn"
              style={{ background: '#1B4B8A', color: 'white', border: 'none', padding: '12px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, width: '100%', fontSize: 14 }}
              onClick={descargarPDF}
            >
              📦 Descargar ZIP (PDFs separados)
            </button>
            <button
              className="btn"
              style={{ background: '#666', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', width: '100%' }}
              onClick={descargarPDFClasico}
            >
              🖨️ Imprimir / Guardar PDF único
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}