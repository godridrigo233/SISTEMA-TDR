import React from 'react';
import Header from './Header';
import { User, TdR } from '../types';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  PlusCircle,
  Eye,
  Edit,
  UserCircle,
  UserPlus,
} from 'lucide-react';

interface DashboardProps {
  user: User;
  tdrs: TdR[];
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
}

export default function Dashboard({ user, tdrs, onNavigate, onLogout }: DashboardProps) {
  const pendientes = tdrs.filter(t => t.estado === 'Pendiente').length;
  const aprobados  = tdrs.filter(t => t.estado === 'Aprobado').length;
  const observados = tdrs.filter(t => t.estado === 'Observado').length;

  const estadoColor: Record<string, string> = {
    'Pendiente': 'bg-yellow-100 text-yellow-800',
    'Aprobado':  'bg-green-100 text-green-800',
    'Observado': 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido, {user.nombre}
          </h2>
          <p className="text-gray-600">Panel de control - {user.rol}</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">TdR Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendientes}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">TdR Aprobados</p>
                <p className="text-3xl font-bold text-green-600">{aprobados}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">TdR Observados</p>
                <p className="text-3xl font-bold text-red-600">{observados}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* SOLO CONTRATANTE: Nuevo TdR */}
            {user.rol === 'CONTRATANTE' && (
              <button
                onClick={() => onNavigate('tdr-new')}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition group"
              >
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Nuevo TdR</p>
                  <p className="text-sm text-gray-500">Registrar nuevo Término de Referencia</p>
                </div>
              </button>
            )}

            {/* CONTRATANTE Y ADMINISTRATIVO: Locadores */}
            {(user.rol === 'CONTRATANTE' || user.rol === 'ADMINISTRATIVO') && (
              <button
                onClick={() => onNavigate('locadores')}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition group"
              >
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Gestión de Locadores</p>
                  <p className="text-sm text-gray-500">Crear y editar locadores</p>
                </div>
              </button>
            )}

            {/* SOLO ADMINISTRATIVO: Plantilla TdR */}
            {user.rol === 'ADMINISTRATIVO' && (
              <button
                onClick={() => onNavigate('template-editor')}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition group"
              >
                <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Formato Base TdR</p>
                  <p className="text-sm text-gray-500">Modificar la plantilla principal</p>
                </div>
              </button>
            )}

            {/* Mi Perfil — solo CONTRATANTE */}
            {user.rol === 'CONTRATANTE' && (
              <button
                onClick={() => onNavigate('mi-perfil')}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition group"
              >
                <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Mi Perfil</p>
                  <p className="text-sm text-gray-500">Mis datos personales para el expediente</p>
                </div>
              </button>
            )}

            {/* Nuevo Contratante — solo ADMINISTRATIVO */}
            {user.rol === 'ADMINISTRATIVO' && (
              <button
                onClick={() => onNavigate('nuevo-contratante')}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition group"
              >
                <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Nuevo Contratante</p>
                  <p className="text-sm text-gray-500">Crear cuenta de acceso</p>
                </div>
              </button>
            )}

          </div>
        </div>

        {/* Lista de TdR */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              {user.rol === 'ADMINISTRATIVO' ? 'TdR para Validación' : 'Mis TdR Registrados'}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Denominación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tdrs.map((tdr) => (
                  <tr key={tdr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tdr.codigo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tdr.denominacion}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tdr.equipoSolicitante}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tdr.periodo.mes} {tdr.periodo.año}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor[tdr.estado]}`}>
                        {tdr.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-4">

                        <button
                          onClick={() => onNavigate('tdr-detail', String(tdr.id))}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </button>

                        {user.rol === 'CONTRATANTE' && tdr.estado !== 'Aprobado' && (
                          <button
                            onClick={() => onNavigate('tdr-edit', String(tdr.id))}
                            className="text-orange-600 hover:text-orange-800 flex items-center gap-1"
                            title="Editar TdR"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Editar</span>
                          </button>
                        )}

                        {user.rol === 'ADMINISTRATIVO' && (tdr.estado === 'Pendiente' || tdr.estado === 'Observado') && (
                          <button
                            onClick={() => onNavigate('validacion', String(tdr.id))}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                            title="Validar"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Validar</span>
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}