import React, { useEffect, useState } from 'react';
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
  Search,
  Trash2,
  CalendarRange,
} from 'lucide-react';

interface DashboardProps {
  user: User;
  tdrs: TdR[];
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
  onFilterChange?: (filters: { search?: string; estado?: string; fechaDesde?: string; fechaHasta?: string; contratante?: string }) => void;
  onDeleteTdr?: (id: string) => void;
}

export default function Dashboard({ user, tdrs, onNavigate, onLogout, onFilterChange, onDeleteTdr }: DashboardProps) {
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [contratanteFiltro, setContratanteFiltro] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange?.({ search, estado: estadoFiltro, fechaDesde, fechaHasta, contratante: contratanteFiltro });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, estadoFiltro, fechaDesde, fechaHasta, contratanteFiltro]);

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
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido, {user.nombre}
          </h2>
          <p className="text-gray-600">Panel de control - {user.rol}</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-gray-800">{tdrs.length}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendientes}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Aprobados</p>
                <p className="text-3xl font-bold text-green-600">{aprobados}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Observados</p>
                <p className="text-3xl font-bold text-red-600">{observados}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        {(user.rol !== 'ADMINISTRATIVO') && (
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

              {/* Solo ADMINISTRADOR: Locadores */}
              {user.rol === 'ADMINISTRADOR' && (
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

              {/* Contratantes — solo ADMINISTRADOR */}
              {user.rol === 'ADMINISTRADOR' && (
                <button
                  onClick={() => onNavigate('contratantes')}
                  className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition group"
                >
                  <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Gestión de Contratantes</p>
                    <p className="text-sm text-gray-500">Crear y editar cuentas de acceso</p>
                  </div>
                </button>
              )}

            </div>
          </div>
        )}

        {/* Accesos rápidos - ADMINISTRATIVO (solo Formato Base) */}
        {(user.rol === 'ADMINISTRATIVO' || user.rol === 'ADMINISTRADOR') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>
        )}

        {/* Lista de TdR */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="font-semibold text-gray-900">
              {user.rol === 'ADMINISTRADOR' ? 'TdR para Validación' : user.rol === 'ADMINISTRATIVO' ? 'TdR para Validación' : 'Mis TdR Registrados'}
            </h3>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Código o denominación..."
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Observado">Observado</option>
              </select>

              <div className="flex items-center gap-1">
                <CalendarRange className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  title="Desde"
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  title="Hasta"
                />
              </div>

              {(user.rol === 'ADMINISTRADOR' || user.rol === 'ADMINISTRATIVO') && (
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contratanteFiltro}
                    onChange={e => setContratanteFiltro(e.target.value)}
                    placeholder="Contratante..."
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-44 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Denominación</th>
                  {(user.rol === 'ADMINISTRADOR' || user.rol === 'ADMINISTRATIVO') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contratante</th>
                  )}
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
                    {(user.rol === 'ADMINISTRADOR' || user.rol === 'ADMINISTRATIVO') && (
                      <td className="px-6 py-4 text-sm text-gray-600">{(tdr as any).contratante ?? '—'}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600">{tdr.equipoSolicitante}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tdr.periodo.mes} {tdr.periodo.año}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor[(tdr.estado ?? tdr.estado_verificacion) as string]}`}>
                          {tdr.estado ?? tdr.estado_verificacion}
                        </span>
                        {/* Observación visible para el contratante cuando está Observado */}
                        {user.rol === 'CONTRATANTE' &&
                         (tdr.estado ?? tdr.estado_verificacion) === 'Observado' &&
                         tdr.ultima_observacion && (
                          <div className="mt-1.5 max-w-xs">
                            <p className="text-xs font-semibold text-red-500 uppercase mb-0.5 tracking-wide">Observación:</p>
                            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 leading-snug">
                              {tdr.ultima_observacion}
                            </p>
                          </div>
                        )}
                      </div>
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

                        {user.rol === 'CONTRATANTE' && tdr.estado === 'Pendiente' && (
                          <button
                            onClick={() => {
                              if (window.confirm('¿Eliminar este TdR? Esta acción no se puede deshacer.')) {
                                onDeleteTdr?.(String(tdr.id));
                              }
                            }}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1"
                            title="Eliminar TdR"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar</span>
                          </button>
                        )}

                        {(user.rol === 'ADMINISTRATIVO' || user.rol === 'ADMINISTRADOR') && (tdr.estado === 'Pendiente' || tdr.estado === 'Observado') && (
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
                {tdrs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      No se encontraron TdR con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}