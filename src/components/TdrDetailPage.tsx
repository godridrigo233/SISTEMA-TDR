import React, { useEffect, useState } from "react";
import Header from "./Header";
import { User, TdR } from "../types";
import {
  ArrowLeft, FileText, Calendar, DollarSign, User as UserIcon, Building,
  CheckCircle, AlertCircle, Clock, GraduationCap, Briefcase, FileSignature
} from "lucide-react";

interface TdrDetailPageProps {
  user: User;
  tdr: TdR;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TdrDetailPage({ user, tdr, onNavigate, onLogout }: TdrDetailPageProps) {
  const [detalle, setDetalle] = useState<any>(null);
  const [plantilla, setPlantilla] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'datos' | 'documento'>('datos');
  
  useEffect(() => {
    // Obtenemos los datos del TdR y la Plantilla simultáneamente
    Promise.all([
      fetch(`http://localhost:4000/api/tdrs/${tdr.id}`).then(res => res.json()),
      fetch(`http://localhost:4000/api/plantilla`)
        .then(res => res.ok ? res.json() : null)
        .catch(err => {
          console.warn("⚠️ No se pudo cargar la plantilla (CORS o ruta no existe):", err);
          return null; // Devolvemos null para que la página no se rompa y el TdR sí cargue
        })
    ])
    .then(([dataTdr, dataPlantilla]) => {
      setDetalle(dataTdr);
      setPlantilla(dataPlantilla);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error al cargar la información del TDR:", err);
      setLoading(false);
    });
  }, [tdr.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p>Cargando detalles del TdR...</p>
        </div>
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="p-10 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
           <AlertCircle className="w-10 h-10 mx-auto mb-4"/>
           <p className="font-bold text-lg">No se encontró información del TDR</p>
        </div>
      </div>
    );
  }

  const estadoConfig: any = {
    Pendiente: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
    Aprobado: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
    Observado: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
  };

  const config = estadoConfig[detalle.estado_verificacion] || estadoConfig["Pendiente"];
  const StatusIcon = config.icon;
  
  const totalHonorarios = detalle.entregables?.reduce((acc: number, ent: any) => acc + Number(ent.monto_pago || 0), 0);

  const listaValidaciones = detalle.validaciones || detalle.historial || [];
  const ultimaObservacion = listaValidaciones
    .filter((h: any) => h.estado_resultante === 'Observado' && h.comentario)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  // =========================================================================
  // 🔥 MOTOR DE GENERACIÓN DEL DOCUMENTO (Reemplazo de Variables)
  // =========================================================================
  const reemplazarVariables = (texto: string) => {
    if (!texto || !detalle) return '';
    let res = texto;
    
    // Variables Simples
    res = res.replace(/\[\s*DENOMINACION_SERVICIO\s*\]/g, detalle.denominacion || '---');
    res = res.replace(/\[\s*EQUIPO_SOLICITANTE\s*\]/g, detalle.equipo_nombre || '---');
    res = res.replace(/\[\s*MES_ANIO\s*\]/g, `${detalle.nombre_mes} ${detalle.anio}`);
    res = res.replace(/\[\s*PLAZO_DIAS\s*\]/g, detalle.plazo_ejecucion?.toString() || '---');
    res = res.replace(/\[\s*MONTO_TOTAL\s*\]/g, Number(detalle.honorario_total).toFixed(2));
    res = res.replace(/\[\s*NUMERO_ARMADAS\s*\]/g, detalle.total_armadas?.toString() || '---');

    // Variables de Listas (Formación)
    if (res.includes('[ NIVEL_FORMACION ]')) {
      const formText = detalle.formacion?.map((f:any) => `• ${f.grado_obtenido} en ${f.especialidad}`).join('\n') || 'No especificado';
      res = res.replace(/\[\s*NIVEL_FORMACION\s*\]/g, formText);
    }
    
    // Variables de Listas (Experiencia)
    if (res.includes('[ EXPERIENCIA_ESPECIFICA ]')) {
      const expText = detalle.experiencia?.filter((e:any)=>e.tipo_experiencia==='Especifica')
        .map((e:any) => `• ${e.cargo || e.descripcion_trabajo} en ${e.entidad || e.entidad_empresa}`).join('\n') || 'No especificado';
      res = res.replace(/\[\s*EXPERIENCIA_ESPECIFICA\s*\]/g, expText);
    }

    // Variables de Listas (Actividades)
    if (res.includes('[ LISTA_ACTIVIDADES ]')) {
      const actText = detalle.actividades?.map((a:any, i:number) => `${i + 1}. ${a.descripcion}`).join('\n') || 'No especificado';
      res = res.replace(/\[\s*LISTA_ACTIVIDADES\s*\]/g, actText);
    }

    // Variables de Listas (Entregables)
    if (res.includes('[ TABLA_ENTREGABLES ]')) {
      const entText = detalle.entregables?.map((e:any) => `Armada ${e.nro_armada}: ${e.descripcion} (S/ ${Number(e.monto_pago).toFixed(2)})`).join('\n') || 'No especificado';
      res = res.replace(/\[\s*TABLA_ENTREGABLES\s*\]/g, entText);
    }

    return res;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Botón Volver */}
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 text-gray-600 mb-6 hover:text-blue-600 transition-colors font-medium bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm w-max"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* HEADER DEL TDR */}
          <div className="p-6 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{detalle.codigo_unico}</h2>
              <p className="text-gray-600 mt-1">{detalle.denominacion}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium whitespace-nowrap ${config.color}`}>
              <StatusIcon className="w-5 h-5" /> {detalle.estado_verificacion || "Pendiente"}
            </div>
          </div>

          {/* OBSERVACIONES */}
          {detalle.estado_verificacion === 'Observado' && ultimaObservacion && (
            <div className="p-6 border-b bg-[#fff5f5]">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-[#b71c1c]">
                <AlertCircle className="w-5 h-5" /> Observaciones a Subsanar
              </h3>
              <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                <p className="text-sm text-red-900 whitespace-pre-wrap leading-relaxed">{ultimaObservacion.comentario}</p>
                <div className="mt-3 pt-3 border-t border-red-100">
                  <p className="text-xs text-red-700 font-medium">
                    Registrado por: {ultimaObservacion.admin_nombre || "Administrador"} — {new Date(ultimaObservacion.created_at).toLocaleString('es-PE')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TABS DE NAVEGACIÓN */}
          <div className="flex flex-wrap border-b border-gray-200 bg-gray-50 px-2 sm:px-6 pt-4 gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('datos')}
              className={`px-4 sm:px-6 py-3 font-semibold rounded-t-lg transition-colors flex items-center gap-2 text-sm sm:text-base ${
                activeTab === 'datos' 
                  ? 'bg-white border-t border-x border-gray-200 text-blue-600 shadow-[0_2px_0_0_white] relative z-10' 
                  : 'text-gray-500 hover:bg-gray-200 border-t border-x border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" /> Datos Registrados
            </button>
            <button
              onClick={() => setActiveTab('documento')}
              className={`px-4 sm:px-6 py-3 font-semibold rounded-t-lg transition-colors flex items-center gap-2 text-sm sm:text-base ${
                activeTab === 'documento' 
                  ? 'bg-white border-t border-x border-gray-200 text-blue-600 shadow-[0_2px_0_0_white] relative z-10' 
                  : 'text-gray-500 hover:bg-gray-200 border-t border-x border-transparent'
              }`}
            >
              <FileSignature className="w-4 h-4" /> Documento Final
            </button>
          </div>

          {/* CONTENIDO DE LOS TABS */}
          <div className="p-0 bg-white">
            
            {activeTab === 'datos' ? (
              /* ======================= TAB: DATOS REGISTRADOS ======================= */
              <div className="animate-fadeIn">
                
                {/* INFORMACIÓN GENERAL */}
                <div className="p-6 border-b">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <FileText className="w-5 h-5 text-blue-600" /> Información General
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-gray-500">Equipo Solicitante</label>
                      <p className="flex items-center gap-2 mt-1 font-medium">
                        <Building className="w-4 h-4 text-gray-400" /> {detalle.equipo_nombre || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Periodo</label>
                      <p className="flex items-center gap-2 mt-1 font-medium">
                        <Calendar className="w-4 h-4 text-gray-400" /> <span className="capitalize">{detalle.nombre_mes}</span> {detalle.anio}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Fecha de Creación</label>
                      <p className="mt-1 font-medium">{new Date(detalle.created_at).toLocaleDateString("es-PE")}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Creado Por</label>
                      <p className="mt-1 font-medium">{detalle.creado_por || "—"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-500">Objetivo</label>
                      <p className="mt-1 leading-relaxed">{detalle.objetivo || "Sin objetivo registrado"}</p>
                    </div>
                  </div>
                </div>

                {/* LOCADOR */}
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <UserIcon className="w-5 h-5 text-blue-600" /> Locador Asignado
                  </h3>
                  {detalle.locador ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div><label className="text-sm text-gray-500">Nombre Completo</label><p className="mt-1 font-medium text-gray-900">{detalle.locador.nombres} {detalle.locador.apellidos}</p></div>
                      <div><label className="text-sm text-gray-500">Documento</label><p className="mt-1 font-medium text-gray-900">{detalle.locador.tipo_documento}: {detalle.locador.numero_documento}</p></div>
                      <div><label className="text-sm text-gray-500">RUC</label><p className="mt-1 font-medium text-gray-900">{detalle.locador.ruc}</p></div>
                      <div><label className="text-sm text-gray-500">Correo</label><p className="mt-1 font-medium text-gray-900">{detalle.locador.correo_electronico}</p></div>
                    </div>
                  ) : <p className="text-gray-500 italic">No hay información del locador</p>}
                </div>

                {/* FORMACIÓN Y EXPERIENCIA */}
                <div className="p-6 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Formación */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" /> Formación Académica
                      </h3>
                      {detalle.formacion?.length > 0 ? (
                        <div className="space-y-4">
                          {detalle.formacion.map((f: any) => (
                            <div key={f.id} className="text-sm border border-gray-100 p-3 rounded-lg bg-gray-50">
                              <p className="font-bold text-gray-900 uppercase">{f.especialidad}</p>
                              <p className="text-gray-700 uppercase">{f.centro_estudios} ({f.ciudad})</p>
                              <p className="text-gray-500 mt-1">
                                Grado: <span className="font-medium text-gray-700">{f.grado_obtenido}</span> | Periodo: {f.anio_inicio ? new Date(f.anio_inicio).getFullYear() : '-'} - {f.anio_fin ? new Date(f.anio_fin).getFullYear() : '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-500 italic">No tiene formación registrada</p>}
                    </div>

                    {/* Experiencia */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" /> Experiencia Laboral
                      </h3>
                      {detalle.experiencia?.length > 0 ? (
                        <div className="space-y-4">
                          {detalle.experiencia.map((exp: any) => (
                            <div key={exp.id} className="text-sm border border-gray-100 p-3 rounded-lg bg-gray-50">
                              <p className="font-bold text-gray-900 uppercase">{exp.cargo || exp.descripcion_trabajo}</p>
                              <p className="text-gray-700 uppercase">en {exp.entidad || exp.entidad_empresa}</p>
                              <p className="text-gray-500 mt-1">
                                Periodo: {exp.fecha_inicio ? new Date(exp.fecha_inicio).toLocaleDateString("es-PE", { timeZone: 'UTC'}) : '-'} al {exp.fecha_fin ? new Date(exp.fecha_fin).toLocaleDateString("es-PE", { timeZone: 'UTC'}) : 'Actualidad'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-500 italic">No tiene experiencia registrada</p>}
                    </div>
                  </div>
                </div>

                {/* DOCUMENTOS ADJUNTOS */}
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-4">Documentos Adjuntos</h3>
                  {!detalle.documentos && <p className="text-sm text-gray-500 italic">No hay documentos registrados</p>}
                  <div className="flex flex-wrap gap-4">
                    {detalle.documentos?.cv && (
                      <a href={`http://localhost:4000/${detalle.documentos.cv}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                        📄 Ver CV
                      </a>
                    )}
                    {detalle.documentos?.dni && (
                      <a href={`http://localhost:4000/${detalle.documentos.dni}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                        📄 Ver DNI
                      </a>
                    )}
                    {detalle.documentos?.rnp && (
                      <a href={`http://localhost:4000/${detalle.documentos.rnp}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                        📄 Ver RNP
                      </a>
                    )}
                    {detalle.documentos?.ruc && (
                      <a href={`http://localhost:4000/${detalle.documentos.ruc}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                        📄 Ver RUC
                      </a>
                    )}
                  </div>
                </div>

                {/* ACTIVIDADES */}
                <div className="p-6 border-b">
                  <h3 className="font-semibold mb-4 text-gray-900">Actividades del TDR</h3>
                  {detalle.actividades?.length > 0 ? (
                    <div className="space-y-2">
                      {detalle.actividades.map((act: any, index: number) => (
                        <div key={act.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800">
                          <strong className="text-blue-600 mr-2">{index + 1}.</strong> {act.descripcion}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-500 italic">No hay actividades registradas</p>}
                </div>

                {/* ENTREGABLES */}
                <div className="p-6 border-b">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <DollarSign className="w-5 h-5 text-blue-600" /> Entregables y Cronograma
                  </h3>
                  {detalle.entregables?.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="p-3 font-semibold text-gray-700">Armada</th>
                            <th className="p-3 font-semibold text-gray-700">Descripción</th>
                            <th className="p-3 font-semibold text-gray-700">Inicio</th>
                            <th className="p-3 font-semibold text-gray-700">Fin</th>
                            <th className="p-3 font-semibold text-gray-700 text-right">Monto (S/)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detalle.entregables.map((ent: any) => (
                            <tr key={ent.id} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">Armada {ent.nro_armada}</td>
                              <td className="p-3 text-gray-700">{ent.descripcion}</td>
                              <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(ent.fecha_inicio).toLocaleDateString("es-PE", { timeZone: 'UTC'})}</td>
                              <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(ent.fecha_fin).toLocaleDateString("es-PE", { timeZone: 'UTC'})}</td>
                              <td className="p-3 text-right font-medium text-gray-900 whitespace-nowrap">S/ {Number(ent.monto_pago).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="bg-blue-50 border-t-2 border-blue-200">
                            <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Total Honorarios</td>
                            <td className="p-3 text-right font-bold text-blue-700 whitespace-nowrap">S/ {totalHonorarios.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-gray-500 italic">No hay entregables registrados</p>}
                </div>
              </div>

            ) : (

              /* ======================= TAB: DOCUMENTO GENERADO ======================= */
              <div className="p-4 sm:p-8 bg-[#eef2f6] min-h-[800px] animate-fadeIn">
                {!plantilla ? (
                  <div className="text-center p-10 text-orange-600 bg-orange-50 rounded-lg border border-orange-200 shadow-sm max-w-2xl mx-auto mt-10">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-bold text-xl mb-2">No hay plantilla configurada</p>
                    <p className="text-orange-800">El administrador debe ingresar a la sección "Formato Base TdR" para redactar el esqueleto del documento.</p>
                  </div>
                ) : (
                  /* SIMULACIÓN DE HOJA A4 */
                  <div className="max-w-[210mm] mx-auto bg-white p-12 sm:p-20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-200 min-h-[297mm] text-gray-800 font-serif text-sm sm:text-base leading-relaxed print:shadow-none print:border-none print:p-0">
                    
                    {/* Encabezado Hoja */}
                    <div className="text-center mb-12">
                      <h1 className="font-bold text-xl sm:text-2xl uppercase tracking-wider text-black border-b-2 border-gray-800 pb-4 inline-block px-8">
                        {reemplazarVariables(plantilla.titulo)}
                      </h1>
                    </div>

                    <div className="space-y-8 text-justify">
                      <section>
                        <h2 className="font-bold uppercase tracking-wide mb-3 text-gray-900">1. Objeto de la Contratación</h2>
                        <p className="whitespace-pre-wrap">{reemplazarVariables(plantilla.objeto)}</p>
                      </section>

                      <section>
                        <h2 className="font-bold uppercase tracking-wide mb-3 text-gray-900">2. Finalidad Pública</h2>
                        <p className="whitespace-pre-wrap">{reemplazarVariables(plantilla.finalidad)}</p>
                      </section>

                      <section>
                        <h2 className="font-bold uppercase tracking-wide mb-3 text-gray-900">3. Perfil del Locador</h2>
                        <div className="pl-4 sm:pl-8 border-l-2 border-gray-200">
                          <p className="whitespace-pre-wrap">{reemplazarVariables(plantilla.perfil)}</p>
                        </div>
                      </section>

                      <section>
                        <h2 className="font-bold uppercase tracking-wide mb-3 text-gray-900">4. Actividades a Desarrollar</h2>
                        <div className="pl-4 sm:pl-8 border-l-2 border-gray-200">
                          <p className="whitespace-pre-wrap leading-loose">{reemplazarVariables(plantilla.actividades)}</p>
                        </div>
                      </section>

                      <section>
                        <h2 className="font-bold uppercase tracking-wide mb-3 text-gray-900">5. Entregables y Forma de Pago</h2>
                        <div className="pl-4 sm:pl-8 border-l-2 border-gray-200 mb-6">
                          <p className="whitespace-pre-wrap leading-loose">{reemplazarVariables(plantilla.entregables)}</p>
                        </div>
                        <p className="whitespace-pre-wrap bg-gray-50 p-4 border border-gray-200 italic">{reemplazarVariables(plantilla.formaPago)}</p>
                      </section>

                      <section>
                        <h2 className="font-bold uppercase tracking-wide mb-3 text-gray-900">6. Plazo de Ejecución</h2>
                        <p className="whitespace-pre-wrap">{reemplazarVariables(plantilla.plazo)}</p>
                      </section>

                      <section>
                        <h2 className="font-bold uppercase tracking-wide mb-3 text-gray-900">7. Conformidad del Servicio</h2>
                        <p className="whitespace-pre-wrap">{reemplazarVariables(plantilla.conformidad)}</p>
                      </section>

                      <section>
                        <h2 className="font-bold uppercase tracking-wide mb-3 text-gray-900">8. Penalidades</h2>
                        <p className="whitespace-pre-wrap">{reemplazarVariables(plantilla.penalidades)}</p>
                      </section>
                    </div>

                    {/* Firmas Simuladas */}
                    <div className="mt-24 pt-10 border-t border-gray-300 grid grid-cols-2 gap-8 text-center">
                      <div>
                        <div className="w-48 border-t border-gray-400 mx-auto mb-2"></div>
                        <p className="font-bold text-sm uppercase">El Locador</p>
                        <p className="text-xs text-gray-500 mt-1">{detalle.locador?.nombres} {detalle.locador?.apellidos}</p>
                        <p className="text-xs text-gray-500">DNI: {detalle.locador?.numero_documento}</p>
                      </div>
                      <div>
                        <div className="w-48 border-t border-gray-400 mx-auto mb-2"></div>
                        <p className="font-bold text-sm uppercase">Área Usuaria</p>
                        <p className="text-xs text-gray-500 mt-1">{detalle.equipo_nombre}</p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}