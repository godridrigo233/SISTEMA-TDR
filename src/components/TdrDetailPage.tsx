import React, { useEffect, useState } from "react";
import Header from "./Header";
import { User, TdR } from "../types";
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  User as UserIcon,
  Building,
  CheckCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  Briefcase
} from "lucide-react";

interface TdrDetailPageProps {
  user: User;
  tdr: TdR;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TdrDetailPage({
  user,
  tdr,
  onNavigate,
  onLogout,
}: TdrDetailPageProps) {
  const [detalle, setDetalle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`http://localhost:4000/api/tdrs/${tdr.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error al obtener TDR");
        }
        return res.json();
      })
      .then((data) => {
        setDetalle(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [tdr.id]);

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Cargando detalles del TdR...</div>;
  }

  if (!detalle) {
    return (
      <div className="p-10 text-center text-red-500">
        No se encontró información del TDR
      </div>
    );
  }

  const estadoConfig: any = {
    Pendiente: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
    },
    Aprobado: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    Observado: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: AlertCircle,
    },
  };

  const config = estadoConfig[detalle.estado_verificacion] || estadoConfig["Pendiente"];
  const StatusIcon = config.icon;
  
  const totalHonorarios = detalle.entregables?.reduce(
    (acc: number, ent: any) => acc + Number(ent.monto_pago || 0),
    0
  );

  // 🔥 CORRECCIÓN: Leemos de 'validaciones' en lugar de 'historial'
  const listaValidaciones = detalle.validaciones || detalle.historial || [];

  // Extraer la observación más reciente
  const ultimaObservacion = listaValidaciones
    .filter((h: any) => h.estado_resultante === 'Observado' && h.comentario)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 text-gray-600 mb-6 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>

        <div className="bg-white rounded-lg shadow border">

          {/* HEADER */}
          <div className="p-6 border-b">
            <div className="flex justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {detalle.codigo_unico}
                </h2>
                <p className="text-gray-600 mt-1">
                  {detalle.denominacion}
                </p>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 border rounded font-medium ${config.color}`}>
                <StatusIcon className="w-5 h-5" />
                {detalle.estado_verificacion || "Pendiente"}
              </div>
            </div>
          </div>

          {/* OBSERVACIONES DEL TDR */}
          {detalle.estado_verificacion === 'Observado' && ultimaObservacion && (
            <div className="p-6 border-b bg-[#fff5f5]">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-[#b71c1c]">
                <AlertCircle className="w-5 h-5" />
                Observaciones a Subsanar
              </h3>
              <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                <p className="text-sm text-red-900 whitespace-pre-wrap leading-relaxed">
                  {ultimaObservacion.comentario}
                </p>
                <div className="mt-3 pt-3 border-t border-red-100">
                  <p className="text-xs text-red-700 font-medium">
                    Registrado por: {ultimaObservacion.admin_nombre || "Administrador"} — {new Date(ultimaObservacion.created_at).toLocaleString('es-PE')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INFORMACIÓN GENERAL */}
          <div className="p-6 border-b">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <FileText className="w-5 h-5 text-blue-600" />
              Información General
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">Equipo Solicitante</label>
                <p className="flex items-center gap-2 mt-1 font-medium">
                  <Building className="w-4 h-4 text-gray-400" />
                  {detalle.equipo_nombre || "—"}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Periodo</label>
                <p className="flex items-center gap-2 mt-1 font-medium">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="capitalize">{detalle.nombre_mes}</span> {detalle.anio}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Fecha de Creación</label>
                <p className="mt-1 font-medium">
                  {new Date(detalle.created_at).toLocaleDateString("es-PE")}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Creado Por</label>
                <p className="mt-1 font-medium">{detalle.creado_por || "—"}</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-500">Objetivo</label>
                <p className="mt-1 leading-relaxed">{detalle.objetivo || "Sin objetivo registrado"}</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-500">
                  Nivel de Formación
                </label>
                <p className="mt-1 font-medium">
                  {detalle.nivel_formacion_requerido} {detalle.titulo_obtenido_requerido ? `- ${detalle.titulo_obtenido_requerido}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* LOCADOR */}
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <UserIcon className="w-5 h-5 text-blue-600" />
              Locador Asignado
            </h3>

            {detalle.locador ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500">Nombre Completo</label>
                  <p className="mt-1 font-medium text-gray-900">
                    {detalle.locador.nombres} {detalle.locador.apellidos}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Documento</label>
                  <p className="mt-1 font-medium text-gray-900">
                    {detalle.locador.tipo_documento}: {detalle.locador.numero_documento}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">RUC</label>
                  <p className="mt-1 font-medium text-gray-900">{detalle.locador.ruc}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Correo</label>
                  <p className="mt-1 font-medium text-gray-900">{detalle.locador.correo_electronico}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay información del locador</p>
            )}
          </div>

          {/* FORMACIÓN Y EXPERIENCIA */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Formación Académica */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Formación Académica
                </h3>
                {detalle.formacion?.length > 0 ? (
                  <div className="space-y-4">
                    {detalle.formacion.map((f: any) => (
                      <div key={f.id} className="text-sm">
                        <p className="font-bold text-gray-900 uppercase">{f.especialidad}</p>
                        <p className="text-gray-700 uppercase">{f.centro_estudios} ({f.ciudad})</p>
                        <p className="text-gray-500 mt-1">
                          Grado: <span className="font-medium text-gray-700">{f.grado_obtenido}</span> | Periodo: {f.anio_inicio ? new Date(f.anio_inicio).getFullYear() : '-'} - {f.anio_fin ? new Date(f.anio_fin).getFullYear() : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No tiene formación registrada</p>
                )}
              </div>

              {/* Experiencia Laboral */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Experiencia Laboral
                </h3>
                {detalle.experiencia?.length > 0 ? (
                  <div className="space-y-4">
                    {detalle.experiencia.map((exp: any) => (
                      <div key={exp.id} className="text-sm">
                        <p className="font-bold text-gray-900 uppercase">{exp.cargo || exp.descripcion_trabajo}</p>
                        <p className="text-gray-700 uppercase">en {exp.entidad || exp.entidad_empresa}</p>
                        <p className="text-gray-500 mt-1">
                          Periodo: {exp.fecha_inicio ? new Date(exp.fecha_inicio).toLocaleDateString("es-PE", { timeZone: 'UTC'}) : '-'} al {exp.fecha_fin ? new Date(exp.fecha_fin).toLocaleDateString("es-PE", { timeZone: 'UTC'}) : 'Actualidad'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No tiene experiencia registrada</p>
                )}
              </div>

            </div>
          </div>

          {/* DOCUMENTOS ADJUNTOS */}
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4">Documentos Adjuntos</h3>
            {!detalle.documentos && (
              <p className="text-sm text-gray-500 italic">No hay documentos registrados</p>
            )}
            <div className="flex flex-wrap gap-4">
              {detalle.documentos?.cv && (
                <a
                  href={`http://localhost:4000/${detalle.documentos.cv}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  📄 Ver / Descargar CV
                </a>
              )}
              {detalle.documentos?.dni && (
                <a
                  href={`http://localhost:4000/${detalle.documentos.dni}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  📄 Ver / Descargar DNI
                </a>
              )}
              {detalle.documentos?.rnp && (
                <a
                  href={`http://localhost:4000/${detalle.documentos.rnp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  📄 Ver / Descargar RNP
                </a>
              )}
              {detalle.documentos?.ruc && (
                <a
                  href={`http://localhost:4000/${detalle.documentos.ruc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  📄 Ver / Descargar RUC
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
                  <div key={act.id} className="p-3 bg-gray-50 rounded text-sm text-gray-800">
                    <strong className="text-blue-600">{index + 1}.</strong> {act.descripcion}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No hay actividades registradas</p>
            )}
          </div>

          {/* ENTREGABLES */}
          <div className="p-6 border-b">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Entregables y Cronograma de Pagos
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
                        <td className="p-3 text-gray-600 whitespace-nowrap">
                          {new Date(ent.fecha_inicio).toLocaleDateString("es-PE", { timeZone: 'UTC'})}
                        </td>
                        <td className="p-3 text-gray-600 whitespace-nowrap">
                          {new Date(ent.fecha_fin).toLocaleDateString("es-PE", { timeZone: 'UTC'})}
                        </td>
                        <td className="p-3 text-right font-medium text-gray-900 whitespace-nowrap">
                          S/ {Number(ent.monto_pago).toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {/* 🔥 FILA TOTAL */}
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        Total Honorarios
                      </td>
                      <td className="p-3 text-right font-bold text-blue-700 whitespace-nowrap">
                        S/ {totalHonorarios.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No hay entregables registrados</p>
            )}
          </div>
            
           
        </div>
      </main>
    </div>
  );
}