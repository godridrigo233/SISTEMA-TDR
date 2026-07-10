import React, { useEffect, useState } from 'react';
import Header from './Header';
import { User, TdR } from '../types';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Check,
  Download
} from 'lucide-react';

interface ValidacionPageProps {
  user: User;
  tdr: TdR;
  onNavigate: (page: string) => void;
  onValidate: (
    tdrId: string,
    accion: 'Validacion' | 'Observacion',
    observaciones?: string,
    usuarioAdminId?: number
  ) => void;
  onLogout: () => void;
}

type VerificacionStatus = 'pendiente' | 'si' | 'no';
type DocType = 'cv' | 'dni' | 'rnp' | 'ruc' | null;

interface VerificacionItem {
  estado: VerificacionStatus;
  observacion: string;
}

function buildDocUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `http://localhost:4000/${clean}`;
}

// ─── Estilos inline para botones de verificación ─────────────────────────────
// Se usan inline para que Tailwind no los purgue al ser clases dinámicas.
const BTN_SI_ACTIVO: React.CSSProperties = {
  background: '#dcfce7',
  color: '#166534',
  border: '1.5px solid #86efac',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
};
const BTN_SI_INACTIVO: React.CSSProperties = {
  background: '#fff',
  color: '#9ca3af',
  border: '1px solid #e5e7eb',
};
const BTN_NO_ACTIVO: React.CSSProperties = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1.5px solid #fca5a5',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
};
const BTN_NO_INACTIVO: React.CSSProperties = {
  background: '#fff',
  color: '#9ca3af',
  border: '1px solid #e5e7eb',
};
const CARD_RECHAZO: React.CSSProperties = {
  background: '#fff5f5',
  border: '1px solid #fecaca',
};
const CARD_NORMAL: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
};

// ─── ItemVerificacion FUERA del componente principal ─────────────────────────
// CRÍTICO: debe estar fuera para que React no lo recree en cada render.
// Si estuviera dentro, cada tecla causa unmount+remount → cursor al inicio.
const ItemVerificacion = React.memo(({
  itemKey,
  titulo,
  subtitulo,
  verif,
  onToggle,
  onObservacion,
}: {
  itemKey: string;
  titulo: string;
  subtitulo: string;
  verif: { estado: string; observacion: string };
  onToggle: (key: string, valor: 'si' | 'no') => void;
  onObservacion: (key: string, texto: string) => void;
}) => {
  if (!verif) return null;

  return (
    <div
      style={verif.estado === 'no' ? CARD_RECHAZO : CARD_NORMAL}
      className="p-4 rounded-lg transition-all duration-300"
    >
      <h5 className="text-xs font-bold text-gray-900 mb-1">{titulo}</h5>
      <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{subtitulo}</p>

      <div className="flex gap-2">
        <button
          onClick={() => onToggle(itemKey, 'si')}
          style={verif.estado === 'si' ? BTN_SI_ACTIVO : BTN_SI_INACTIVO}
          className="flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all duration-150"
        >
          ✓ Si cumple
        </button>
        <button
          onClick={() => onToggle(itemKey, 'no')}
          style={verif.estado === 'no' ? BTN_NO_ACTIVO : BTN_NO_INACTIVO}
          className="flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all duration-150"
        >
          ⊗ No cumple
        </button>
      </div>

      {verif.estado === 'no' && (
        <textarea
          className="mt-3 w-full p-2 text-xs border border-red-200 rounded outline-none focus:border-red-400 bg-white resize-none"
          rows={2}
          placeholder="Especifique el motivo del rechazo..."
          value={verif.observacion}
          onChange={(e) => onObservacion(itemKey, e.target.value)}
        />
      )}
    </div>
  );
});

export default function ValidacionPage({ user, tdr, onNavigate, onValidate, onLogout }: ValidacionPageProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState<'Aprobado' | 'Observado' | null>(null);
  const [docVisible, setDocVisible] = useState<DocType>(null);
  const [detalle, setDetalle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verificaciones, setVerificaciones] = useState<Record<string, VerificacionItem>>({});

  const locador = detalle?.locador || tdr?.locador || tdr?.locadorId;
  const formaciones = detalle?.formacion || [];
  const experienciasEspecificas = (detalle?.experiencia || []).filter((exp: any) =>
    exp.tipo_experiencia?.toLowerCase().includes('espec') ||
    exp.tipoExperiencia?.toLowerCase().includes('espec')
  );

  useEffect(() => {
    fetch(`http://localhost:4000/api/tdrs/${tdr.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener TDR');
        return res.json();
      })
      .then((data) => {
        setDetalle(data);

        const initialVerifs: Record<string, VerificacionItem> = {};
        (data.formacion || []).forEach((f: any, index: number) => {
          initialVerifs[`form_${f.id ?? index}`] = { estado: 'pendiente', observacion: '' };
        });
        (data.experiencia || [])
          .filter((exp: any) =>
            exp.tipo_experiencia?.toLowerCase().includes('espec') ||
            exp.tipoExperiencia?.toLowerCase().includes('espec')
          )
          .forEach((exp: any, index: number) => {
            initialVerifs[`exp_${exp.id ?? index}`] = { estado: 'pendiente', observacion: '' };
          });
        setVerificaciones(initialVerifs);

        const docs = data?.documentos;
        if (docs) {
          const prioridad: DocType[] = ['cv', 'dni', 'ruc', 'rnp'];
          const primero = prioridad.find((tipo) => !!docs[tipo as string]);
          setDocVisible(primero ?? (Object.keys(docs)[0] as DocType) ?? null);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [tdr.id]);

  const handleVerificacionChange = (id: string, valor: 'si' | 'no') => {
    setVerificaciones((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        estado: prev[id].estado === valor ? 'pendiente' : valor,
        observacion: prev[id].estado === valor ? '' : prev[id].observacion,
      },
    }));
  };

  const handleObservacionChange = (id: string, texto: string) => {
    setVerificaciones((prev) => ({
      ...prev,
      [id]: { ...prev[id], observacion: texto },
    }));
  };

  const compilarObservaciones = () => {
    const mensajes: string[] = [];
    formaciones.forEach((f: any, idx: number) => {
      const key = `form_${f.id ?? idx}`;
      if (verificaciones[key]?.estado === 'no') {
        mensajes.push(`- Formación (${f.especialidad}): ${verificaciones[key].observacion || 'No se encuentra sustento en el CV.'}`);
      }
    });
    experienciasEspecificas.forEach((exp: any, idx: number) => {
      const key = `exp_${exp.id ?? idx}`;
      if (verificaciones[key]?.estado === 'no') {
        const cargo = exp.cargo || exp.descripcion_trabajo || 'Cargo no especificado';
        const entidad = exp.entidad || exp.entidad_empresa || exp.nombreEntidad || 'Entidad no especificada';
        mensajes.push(`- Experiencia Específica (${cargo} en ${entidad}): ${verificaciones[key].observacion || 'No se encuentra sustento en el CV.'}`);
      }
    });
    return mensajes.length > 0
      ? 'Se encontraron las siguientes observaciones que deben ser subsanadas:\n\n' + mensajes.join('\n')
      : '';
  };

  const handleConfirm = () => {
    if (showConfirmDialog) {
      const accionBackend = showConfirmDialog === 'Aprobado' ? 'Validacion' : 'Observacion';
      onValidate(tdr.id, accionBackend, compilarObservaciones(), user.id);
      setShowConfirmDialog(null);
    }
  };

  if (user.rol !== 'ADMINISTRATIVO') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="font-semibold text-red-900 mb-2">Acceso Restringido</h3>
            <button onClick={() => onNavigate('dashboard')}
              className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
              Volver al Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando documento y criterios...</div>;

  const verificacionesTotales = Object.keys(verificaciones).length;
  const verificacionesCompletadas = Object.values(verificaciones).filter((v) => v.estado !== 'pendiente').length;
  const todoCompletado = verificacionesTotales > 0 ? verificacionesCompletadas === verificacionesTotales : true;
  const todoCorrecto = verificacionesTotales > 0 ? Object.values(verificaciones).every((v) => v.estado === 'si') : true;
  const algunRechazo = Object.values(verificaciones).some((v) => v.estado === 'no');

  const documentoUrl = docVisible && detalle?.documentos?.[docVisible]
    ? buildDocUrl(detalle.documentos[docVisible])
    : null;

  const nombreCandidato = locador?.apellidos && locador?.nombres
    ? `${locador.apellidos}, ${locador.nombres}`
    : 'Candidato';

  // ItemVerificacion se define fuera del componente (ver abajo del archivo)
  // para evitar que React lo recree en cada render y pierda el cursor del textarea

  return (
    <div className="min-h-screen bg-[#f1efe9] text-[#334155] font-sans flex flex-col">
      <Header user={user} onLogout={onLogout} />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 max-w-[1920px] mx-auto flex flex-col">

        <div className="flex justify-between items-center mb-4">
          <button onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full flex-1 h-[calc(100vh-8.5rem)] min-h-[600px]">

          {/* ════ IZQUIERDA: VISOR ════ */}
          <div className="w-full bg-white shadow-sm border border-gray-200 flex flex-col h-full rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-[#333333] text-white flex justify-between items-center shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Documento Adjunto</p>
                <h2 className="text-base font-bold truncate max-w-md">Documentación — {nombreCandidato}</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-[#222] rounded-lg p-1">
                  {(['cv', 'dni', 'ruc', 'rnp'] as DocType[]).map((tipo) =>
                    detalle?.documentos?.[tipo!] ? (
                      <button
                        key={tipo}
                        onClick={() => setDocVisible(tipo)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase transition-colors ${
                          docVisible === tipo ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tipo}
                      </button>
                    ) : null
                  )}
                </div>
                {documentoUrl && (
                  <a href={documentoUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-2 flex items-center gap-1.5 text-xs font-bold bg-[#e5e7eb] text-gray-800 px-3 py-1.5 rounded hover:bg-white transition-colors">
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </a>
                )}
              </div>
            </div>
            <div className="flex-1 w-full bg-[#525659] flex flex-col h-full">
              {documentoUrl ? (
                <iframe key={documentoUrl} src={documentoUrl}
                  className="w-full flex-1 h-full border-none block" title="Visor documento" />
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 h-full text-gray-300">
                  <FileText className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">Seleccione un documento para visualizar</p>
                </div>
              )}
            </div>
          </div>

          {/* ════ DERECHA: VERIFICACIÓN ════ */}
          <div className="w-full flex flex-col bg-[#fdfbf7] border border-[#e5e0d8] shadow-sm h-full rounded-xl overflow-hidden">

            {/* Cabecera progreso */}
            <div className="p-4 border-b border-[#e5e0d8] bg-white shrink-0">
              {/* Aviso si el contratante ya reenvió tras observación */}
              {detalle?.validaciones?.some((v: any) => v.accion === 'Edicion') &&
               detalle?.validaciones?.some((v: any) => v.accion === 'Observacion') && (
                <div style={{
                  background: '#fff7ed', border: '1px solid #fed7aa',
                  borderRadius: 6, padding: '8px 12px', marginBottom: 12,
                  fontSize: 11, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <span>🔄</span>
                  <span><strong>El contratante corrigió y reenvió</strong> este TdR tras la observación anterior. Revise los cambios antes de validar.</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lista de Verificación</h3>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">Criterios a contrastar con el CV</p>
                </div>
                <div className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded text-xs font-bold">
                  {verificacionesCompletadas} / {verificacionesTotales} verificados
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: verificacionesTotales > 0
                      ? `${(verificacionesCompletadas / verificacionesTotales) * 100}%`
                      : '0%',
                    background: '#0fa958',
                  }}
                />
              </div>
            </div>

            {/* Lista scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

              {/* FORMACIÓN */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-[#4f46e5]" />
                  Formación Académica Registrada
                </h4>
                {formaciones.length > 0 ? (
                  <div className="space-y-3">
                    {formaciones.map((f: any, idx: number) => (
                      <ItemVerificacion
                        key={`form_${f.id ?? idx}`}
                        itemKey={`form_${f.id ?? idx}`}
                        titulo={f.especialidad}
                        subtitulo={`${f.centro_estudios} — Grado: ${f.grado_obtenido}`}
                        verif={verificaciones[`form_${f.id ?? idx}`]}
                        onToggle={handleVerificacionChange}
                        onObservacion={handleObservacionChange}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-white p-4 rounded border border-gray-200">
                    No hay formación académica registrada para validar.
                  </p>
                )}
              </div>

              {/* EXPERIENCIA ESPECÍFICA */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-[#1e293b]" />
                  Experiencia Específica Registrada
                </h4>
                {experienciasEspecificas.length > 0 ? (
                  <div className="space-y-3">
                    {experienciasEspecificas.map((exp: any, idx: number) => {
                      const cargo = exp.cargo || exp.descripcion_trabajo || 'Cargo no especificado';
                      const entidad = exp.entidad || exp.entidad_empresa || exp.nombreEntidad || 'Entidad no especificada';
                      const fechaInicio = exp.fecha_inicio
                        ? new Date(exp.fecha_inicio).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : '-';
                      const fechaFin = exp.fecha_fin
                        ? new Date(exp.fecha_fin).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : 'Actualidad';
                      return (
                        <ItemVerificacion
                          key={`exp_${exp.id ?? idx}`}
                          itemKey={`exp_${exp.id ?? idx}`}
                          titulo={cargo}
                          subtitulo={`Entidad: ${entidad} — Periodo: ${fechaInicio} al ${fechaFin}`}
                          verif={verificaciones[`exp_${exp.id ?? idx}`]}
                          onToggle={handleVerificacionChange}
                          onObservacion={handleObservacionChange}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-white p-4 rounded border border-gray-200">
                    No hay experiencia específica registrada para validar.
                  </p>
                )}
              </div>
            </div>

            {/* ── HISTORIAL DE REVISIONES ──────────────────────────── */}
            {detalle?.validaciones?.length > 0 && (
              <div className="px-4 pb-4">
                <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-[#e5e7eb]">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Historial de Revisiones
                    </h4>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {[...detalle.validaciones].reverse().map((v: any, i: number) => {
                      const esEdicion    = v.accion === 'Edicion';
                      const esAprobado   = v.accion === 'Validacion';
                      const esObservado  = v.accion === 'Observacion';
                      const fecha = v.created_at
                        ? new Date(v.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '';
                      return (
                        <div key={i} className="px-3 py-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '1px 7px',
                              borderRadius: 10,
                              background: esAprobado ? '#dcfce7' : esObservado ? '#fee2e2' : '#f3f4f6',
                              color: esAprobado ? '#166534' : esObservado ? '#991b1b' : '#6b7280',
                            }}>
                              {esEdicion ? '✏️ Editado' : esAprobado ? '✓ Aprobado' : '⚠ Observado'}
                            </span>
                            <span className="text-[10px] text-gray-400">{fecha}</span>
                          </div>
                          {v.comentario && (
                            <p className="text-xs text-gray-600 leading-relaxed pl-1">
                              {v.comentario}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Footer botones */}
            <div className="p-4 border-t border-[#e5e0d8] bg-white shrink-0 flex gap-3">
              <button
                disabled={!todoCompletado || !algunRechazo}
                onClick={() => {
                  if (!todoCompletado) { alert('Complete todas las verificaciones primero.'); return; }
                  setShowConfirmDialog('Observado');
                }}
                style={!todoCompletado || !algunRechazo
                  ? { cursor: 'not-allowed', color: '#d1d5db', border: '1px solid #e5e7eb', background: '#f9fafb' }
                  : { cursor: 'pointer', color: '#b71c1c', border: '1px solid #b71c1c', background: '#fff' }
                }
                className="flex-1 py-3 text-sm font-bold rounded flex justify-center items-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" /> X No apto
              </button>

              <button
                disabled={!todoCompletado || !todoCorrecto}
                onClick={() => {
                  if (!todoCompletado) { alert('Complete todas las verificaciones primero.'); return; }
                  if (todoCorrecto) setShowConfirmDialog('Aprobado');
                }}
                style={!todoCompletado || !todoCorrecto
                  ? { cursor: 'not-allowed', background: '#e5e7eb', color: '#9ca3af' }
                  : { cursor: 'pointer', background: '#1b5e20', color: '#fff' }
                }
                className="flex-1 py-3 text-sm font-bold rounded flex justify-center items-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" /> ✓ Apto para entrevista
              </button>
            </div>
          </div>
        </div>

        {/* DIÁLOGO CONFIRMAR */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div style={{
                width: 48, height: 48, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                background: showConfirmDialog === 'Aprobado' ? '#e8f5e9' : '#ffebee',
                color: showConfirmDialog === 'Aprobado' ? '#1b5e20' : '#b71c1c',
              }}>
                {showConfirmDialog === 'Aprobado'
                  ? <CheckCircle className="w-6 h-6" />
                  : <AlertTriangle className="w-6 h-6" />
                }
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Confirmar {showConfirmDialog === 'Aprobado' ? 'Aprobación' : 'Rechazo'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                {showConfirmDialog === 'Aprobado'
                  ? '¿Está seguro que el candidato es APTO? Esta acción quedará registrada en el sistema.'
                  : '¿Está seguro que el candidato NO ES APTO? Las observaciones serán enviadas al locador.'}
              </p>
              {showConfirmDialog === 'Observado' && compilarObservaciones() && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Observaciones a notificar:</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{compilarObservaciones()}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleConfirm}
                  style={{ background: showConfirmDialog === 'Aprobado' ? '#1b5e20' : '#b71c1c', color: '#fff' }}
                  className="flex-1 py-2.5 text-sm font-bold rounded transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setShowConfirmDialog(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}