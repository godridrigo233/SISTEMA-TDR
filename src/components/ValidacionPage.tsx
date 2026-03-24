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
    accion: 'Validacion' | 'Observacion', // CORREGIDO: Ahora coincide con el ENUM de la base de datos
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
        if (!res.ok) throw new Error("Error al obtener TDR");
        return res.json();
      })
      .then((data) => {
        setDetalle(data);
        
        const initialVerifs: Record<string, VerificacionItem> = {};

        const forms = data.formacion || [];
        forms.forEach((f: any, index: number) => {
          initialVerifs[`form_${f.id ?? index}`] = { estado: 'pendiente', observacion: '' };
        });

        const exps = (data.experiencia || []).filter((exp: any) => 
          exp.tipo_experiencia?.toLowerCase().includes('espec') || 
          exp.tipoExperiencia?.toLowerCase().includes('espec')
        );
        exps.forEach((exp: any, index: number) => {
          initialVerifs[`exp_${exp.id ?? index}`] = { estado: 'pendiente', observacion: '' };
        });

        setVerificaciones(initialVerifs);
        setLoading(false);

        if (data?.documentos?.cv) {
          setDocVisible('cv');
        } else if (data?.documentos) {
          const firstDoc = Object.keys(data.documentos)[0] as DocType;
          setDocVisible(firstDoc);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [tdr.id]);

  const handleVerificacionChange = (id: string, valor: 'si' | 'no') => {
    setVerificaciones(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        estado: prev[id].estado === valor ? 'pendiente' : valor,
        observacion: prev[id].estado === valor ? '' : prev[id].observacion
      }
    }));
  };

  const handleObservacionChange = (id: string, texto: string) => {
    setVerificaciones(prev => ({
      ...prev,
      [id]: { ...prev[id], observacion: texto }
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
        // CORREGIDO: Evita el "undefined en undefined" leyendo las propiedades correctas de tu backend
        const cargo = exp.cargo || exp.descripcion_trabajo || 'Cargo no especificado';
        const entidad = exp.entidad || exp.entidad_empresa || exp.nombreEntidad || 'Entidad no especificada';
        mensajes.push(`- Experiencia Específica (${cargo} en ${entidad}): ${verificaciones[key].observacion || 'No se encuentra sustento en el CV.'}`);
      }
    });
    
    return mensajes.length > 0 ? "Se encontraron las siguientes observaciones que deben ser subsanadas:\n\n" + mensajes.join("\n") : "";
  };

  const handleConfirm = () => {
    if (showConfirmDialog) {
      // CORREGIDO: Convierte el estado visual ('Aprobado'/'Observado') en la Acción real de BD ('Validacion'/'Observacion')
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
            <button onClick={() => onNavigate('dashboard')} className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
              Volver al Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando documento y criterios...</div>;

  const verificacionesTotales = Object.keys(verificaciones).length;
  const verificacionesCompletadas = Object.values(verificaciones).filter(v => v.estado !== 'pendiente').length;
  
  const todoCompletado = verificacionesTotales > 0 ? verificacionesCompletadas === verificacionesTotales : true;
  const todoCorrecto = verificacionesTotales > 0 ? Object.values(verificaciones).every(v => v.estado === 'si') : true;
  const algunRechazo = Object.values(verificaciones).some(v => v.estado === 'no');

  const documentoUrl = docVisible && detalle?.documentos?.[docVisible]
    ? `http://localhost:4000/${detalle.documentos[docVisible]}`
    : null;

  const nombreCandidato = locador?.apellidos && locador?.nombres 
    ? `${locador.apellidos}, ${locador.nombres}` 
    : 'Candidato';

  return (
    <div className="min-h-screen bg-[#f1efe9] text-[#334155] font-sans flex flex-col">
      <Header user={user} onLogout={onLogout} />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 max-w-[1920px] mx-auto flex flex-col">
        
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full flex-1 h-[calc(100vh-8.5rem)] min-h-[600px]">
          
          {/* ======================= MITAD IZQUIERDA: VISOR DEL DOCUMENTO ======================= */}
          <div className="w-full bg-white shadow-sm border border-gray-200 flex flex-col h-full rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-[#333333] text-white flex justify-between items-center shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Documento Adjunto</p>
                <h2 className="text-base font-bold truncate max-w-md">
                  Documentación — {nombreCandidato}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-[#222] rounded-lg p-1">
                  {['cv', 'dni', 'ruc', 'rnp'].map((tipo) => (
                    detalle?.documentos?.[tipo] && (
                      <button 
                        key={tipo}
                        onClick={() => setDocVisible(tipo as DocType)} 
                        className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase transition-colors ${docVisible === tipo ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                      >
                        {tipo}
                      </button>
                    )
                  ))}
                </div>
                
                {documentoUrl && (
                  <a
                    href={documentoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 flex items-center gap-1.5 text-xs font-bold bg-[#e5e7eb] text-gray-800 px-3 py-1.5 rounded hover:bg-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex-1 w-full bg-[#525659] flex flex-col h-full">
              {documentoUrl ? (
                <iframe 
                  src={documentoUrl} 
                  className="w-full flex-1 h-full border-none block" 
                  title="Visor CV" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 h-full text-gray-300">
                  <FileText className="w-12 h-12 mb-3 opacity-50" />
                  <p>Seleccione un documento para visualizar</p>
                </div>
              )}
            </div>
          </div>

          {/* ======================= MITAD DERECHA: LISTA DE VERIFICACIÓN ======================= */}
          <div className="w-full flex flex-col bg-[#fdfbf7] border border-[#e5e0d8] shadow-sm h-full rounded-xl overflow-hidden">
            
            <div className="p-4 border-b border-[#e5e0d8] bg-white shrink-0">
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
                  className="h-full bg-[#0fa958] rounded-full transition-all duration-500 ease-out"
                  style={{ width: verificacionesTotales > 0 ? `${(verificacionesCompletadas / verificacionesTotales) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

              {/* FORMACIÓN ACADÉMICA */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-[#4f46e5]" />
                  Formación Académica Registrada
                </h4>
                
                {formaciones.length > 0 ? (
                  <div className="space-y-3">
                    {formaciones.map((f: any, idx: number) => {
                      const key = `form_${f.id ?? idx}`;
                      const verif = verificaciones[key];
                      if (!verif) return null;

                      return (
                        <div key={key} className={`p-4 rounded-lg border transition-colors duration-300 ${verif.estado === 'no' ? 'bg-[#fff5f5] border-[#fecaca]' : 'bg-white border-[#e5e7eb]'}`}>
                          <h5 className="text-xs font-bold text-gray-900 mb-1">{f.especialidad}</h5>
                          <p className="text-[11px] text-gray-500 mb-3 leading-relaxed uppercase">
                            {f.centro_estudios} <br/>
                            <span className="font-semibold text-gray-700 capitalize">Grado:</span> {f.grado_obtenido}
                          </p>
                          
                          <div className="flex gap-2">
                            <button onClick={() => handleVerificacionChange(key, 'si')} className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 border ${verif.estado === 'si' ? 'bg-white text-gray-800 border-gray-300 shadow-inner' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>✓ Si cumple</button>
                            <button onClick={() => handleVerificacionChange(key, 'no')} className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 border ${verif.estado === 'no' ? 'bg-white text-gray-800 border-gray-300 shadow-inner' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>⊗ No cumple</button>
                          </div>
                          
                          {verif.estado === 'no' && (
                            <textarea autoFocus className="mt-3 w-full p-2 text-xs border border-red-200 rounded outline-none focus:border-red-400 bg-white transition-all duration-200" placeholder="Especifique el motivo del rechazo..." value={verif.observacion} onChange={(e) => handleObservacionChange(key, e.target.value)} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-white p-4 rounded border border-gray-200">No hay formación académica registrada para validar.</p>
                )}
              </div>

              {/* EXPERIENCIA LABORAL */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-[#1e293b]" />
                  Experiencia Específica Registrada
                </h4>
                
                {experienciasEspecificas.length > 0 ? (
                  <div className="space-y-3">
                    {experienciasEspecificas.map((exp: any, idx: number) => {
                      const key = `exp_${exp.id ?? idx}`;
                      const verif = verificaciones[key];
                      if (!verif) return null;

                      const cargo = exp.cargo || exp.descripcion_trabajo || 'Cargo no especificado';
                      const entidad = exp.entidad || exp.entidad_empresa || exp.nombreEntidad || 'Entidad no especificada';

                      return (
                        <div key={key} className={`p-4 rounded-lg border transition-colors duration-300 ${verif.estado === 'no' ? 'bg-[#fff5f5] border-[#fecaca]' : 'bg-white border-[#e5e7eb]'}`}>
                          <h5 className="text-xs font-bold text-gray-900 mb-1">{cargo}</h5>
                          <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                            <span className="font-semibold text-gray-700">Entidad:</span> {entidad} <br/>
                            <span className="font-semibold text-gray-700">Periodo:</span> {exp.fecha_inicio ? new Date(exp.fecha_inicio).toLocaleDateString('es-ES', { timeZone: 'UTC'}) : '-'} al {exp.fecha_fin ? new Date(exp.fecha_fin).toLocaleDateString('es-ES', { timeZone: 'UTC'}) : 'Actualidad'}
                          </p>
                          
                          <div className="flex gap-2">
                            <button onClick={() => handleVerificacionChange(key, 'si')} className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 border ${verif.estado === 'si' ? 'bg-white text-gray-800 border-gray-300 shadow-inner' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>✓ Si cumple</button>
                            <button onClick={() => handleVerificacionChange(key, 'no')} className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 border ${verif.estado === 'no' ? 'bg-white text-gray-800 border-gray-300 shadow-inner' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>⊗ No cumple</button>
                          </div>
                          
                          {verif.estado === 'no' && (
                            <textarea autoFocus className="mt-3 w-full p-2 text-xs border border-red-200 rounded outline-none focus:border-red-400 bg-white transition-all duration-200" placeholder="Especifique el motivo del rechazo..." value={verif.observacion} onChange={(e) => handleObservacionChange(key, e.target.value)} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-white p-4 rounded border border-gray-200">No hay experiencia específica registrada para validar.</p>
                )}
              </div>

            </div>

            {/* FOOTER: Acciones Finales */}
            <div className="p-4 border-t border-[#e5e0d8] bg-white shrink-0 flex gap-3">
              <button
                onClick={() => {
                  if (!todoCompletado) {
                    alert('Debe completar todas las verificaciones antes de emitir un veredicto.');
                    return;
                  }
                  if (algunRechazo) {
                    setShowConfirmDialog('Observado');
                  } else {
                    alert('Debe marcar al menos un criterio como "No cumple" para observar el documento.');
                  }
                }}
                className={`flex-1 py-3 text-sm font-bold rounded flex justify-center items-center gap-2 transition-colors ${
                  !todoCompletado || !algunRechazo ? 'text-gray-400 border border-gray-300 bg-gray-50 cursor-not-allowed' : 'text-[#b71c1c] border border-[#b71c1c] hover:bg-[#ffebee]'
                }`}
              >
                <XCircle className="w-4 h-4" /> X No apto
              </button>
              
              <button
                onClick={() => {
                  if (!todoCompletado) {
                    alert('Debe completar todas las verificaciones antes de continuar.');
                    return;
                  }
                  if (todoCorrecto) {
                    setShowConfirmDialog('Aprobado');
                  }
                }}
                className={`flex-1 py-3 text-white text-sm font-bold rounded flex justify-center items-center gap-2 transition-colors ${
                  !todoCorrecto ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1b5e20] hover:bg-[#144716]'
                }`}
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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${showConfirmDialog === 'Aprobado' ? 'bg-[#e8f5e9] text-[#1b5e20]' : 'bg-[#ffebee] text-[#b71c1c]'}`}>
                {showConfirmDialog === 'Aprobado' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar {showConfirmDialog === 'Aprobado' ? 'Aprobación' : 'Rechazo'}</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                {showConfirmDialog === 'Aprobado'
                  ? '¿Está seguro que el candidato es APTO? Esta acción quedará registrada en el sistema y se procederá a la entrevista.'
                  : '¿Está seguro que el candidato NO ES APTO? Las observaciones registradas serán enviadas al locador.'}
              </p>
              
              {showConfirmDialog === 'Observado' && compilarObservaciones() && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Observaciones a notificar:</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{compilarObservaciones()}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-2.5 text-white text-sm font-bold rounded transition-colors ${showConfirmDialog === 'Aprobado' ? 'bg-[#1b5e20] hover:bg-[#144716]' : 'bg-[#b71c1c] hover:bg-[#8e1515]'}`}
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowConfirmDialog(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded transition-colors"
                >
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