import React, { useEffect, useState, useRef } from 'react';
import Header from './Header';
import { User, TdR } from '../types';
import {
  FileText,
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
  MessageSquare,
  BarChart3,
  Filter,
  List,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_URL } from '../config/api';

interface DashboardProps {
  user: User;
  tdrs: TdR[];
  onNavigate: (page: string, params?: any) => void;
  onLogout: () => void;
  onFilterChange?: (filters: { search?: string; estado?: string; fechaDesde?: string; fechaHasta?: string; contratante?: string }) => void;
  onDeleteTdr?: (id: string) => void;
}

const CHART_COLORS: Record<string, string> = {
  'Pendiente': '#eab308',
  'Aprobado': '#16a34a',
  'Observado': '#dc2626',
};

function ChartTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div style={{
      background: '#1f2937', color: '#f9fafb', borderRadius: '8px',
      padding: '10px 14px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{name}</p>
      <p style={{ margin: 0, opacity: 0.85 }}>
        {value} TdR ({p.porcentaje}%)
      </p>
    </div>
  );
}

export default function Dashboard({ user, tdrs, onNavigate, onLogout, onFilterChange, onDeleteTdr }: DashboardProps) {
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [contratanteFiltro, setContratanteFiltro] = useState('');
  const [observacionAbierta, setObservacionAbierta] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<'lista' | 'dashboard'>('lista');
  const [chartInicio, setChartInicio] = useState('');
  const [chartFin, setChartFin] = useState('');
  const [chartEquipo, setChartEquipo] = useState('');
  const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    if (user.rol === 'ADMINISTRADOR' || user.rol === 'ADMINISTRATIVO') {
      fetch(`${API_URL}/maestros/equipos`)
        .then(res => res.json())
        .then(data => setEquipos(data))
        .catch(() => {});
    }
  }, [user.rol]);

  useEffect(() => {
    if (!observacionAbierta) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setObservacionAbierta(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [observacionAbierta]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange?.({ search, estado: estadoFiltro, fechaDesde, fechaHasta, contratante: contratanteFiltro });
    }, 300);
  }, [search, estadoFiltro, fechaDesde, fechaHasta, contratanteFiltro]);

  const pendientes = tdrs.filter(t => t.estado === 'Pendiente').length;
  const aprobados  = tdrs.filter(t => t.estado === 'Aprobado').length;
  const observados = tdrs.filter(t => t.estado === 'Observado').length;

  const estadoColor: Record<string, string> = {
    'Pendiente': 'bg-yellow-100 text-yellow-800',
    'Aprobado':  'bg-green-100 text-green-800',
    'Observado': 'bg-red-100 text-red-800',
  };

  const tdrsFiltrados = tdrs.filter(t => {
    const estado = t.estado ?? (t as any).estado_verificacion;
    const created = (t as any).created_at || '';
    const matchInicio = !chartInicio || created >= chartInicio;
    const matchFin = !chartFin || created.slice(0, 10) <= chartFin;
    const matchEquipo = !chartEquipo || t.equipoSolicitante === chartEquipo;
    return matchInicio && matchFin && matchEquipo;
  });

  const totalFiltrados = tdrsFiltrados.length || 1;
  const chartData = ['Pendiente', 'Aprobado', 'Observado'].map(estado => {
    const cant = tdrsFiltrados.filter(t => (t.estado ?? (t as any).estado_verificacion) === estado).length;
    return {
      name: estado,
      value: cant,
      porcentaje: Math.round((cant / Math.max(tdrsFiltrados.length, 1)) * 100),
    };
  });

  const puedeVerChart = user.rol === 'ADMINISTRADOR' || user.rol === 'ADMINISTRATIVO';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenido, {user.nombre}
            </h2>
            <p className="text-gray-600">Panel de control - {user.rol}</p>
          </div>

          {puedeVerChart && (
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('lista')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
                Lista de TdR
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          )}
        </div>

        {activeTab === 'lista' && (
          <>
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

            {user.rol !== 'ADMINISTRATIVO' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.rol === 'CONTRATANTE' && (
                    <button onClick={() => onNavigate('tdr-new')}
                      className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition group">
                      <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center">
                        <PlusCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Nuevo TdR</p>
                        <p className="text-sm text-gray-500">Registrar nuevo Término de Referencia</p>
                      </div>
                    </button>
                  )}
                  {user.rol === 'CONTRATANTE' && (
                    <button onClick={() => onNavigate('mi-perfil')}
                      className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition group">
                      <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Mi Perfil</p>
                        <p className="text-sm text-gray-500">Mis datos personales para el expediente</p>
                      </div>
                    </button>
                  )}
                  {user.rol === 'ADMINISTRADOR' && (
                    <button onClick={() => onNavigate('contratantes')}
                      className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition group">
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

            {(user.rol === 'ADMINISTRATIVO' || user.rol === 'ADMINISTRADOR') && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => onNavigate('template-editor')}
                    className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition group">
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="font-semibold text-gray-900">
                  {user.rol === 'ADMINISTRADOR' ? 'TdR para Validación' : user.rol === 'ADMINISTRATIVO' ? 'TdR para Validación' : 'Mis TdR Registrados'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Código o denominación..."
                      className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Observado">Observado</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <CalendarRange className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" title="Desde" />
                    <span className="text-gray-400 text-sm">-</span>
                    <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" title="Hasta" />
                  </div>
                  {(user.rol === 'ADMINISTRADOR' || user.rol === 'ADMINISTRATIVO') && (
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" value={contratanteFiltro} onChange={e => setContratanteFiltro(e.target.value)}
                        placeholder="Contratante..."
                        className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-44 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codigo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Denominacion</th>
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
                          <td className="px-6 py-4 text-sm text-gray-600">{(tdr as any).contratante ?? '-'}</td>
                        )}
                        <td className="px-6 py-4 text-sm text-gray-600">{tdr.equipoSolicitante}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {tdr.periodo.mes} {tdr.periodo.año}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor[(tdr.estado ?? tdr.estado_verificacion) as string]}`}>
                              {tdr.estado ?? tdr.estado_verificacion}
                            </span>
                            {user.rol === 'CONTRATANTE' &&
                             (tdr.estado ?? tdr.estado_verificacion) === 'Observado' &&
                             tdr.ultima_observacion && (
                              <div className="relative flex-shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setObservacionAbierta(observacionAbierta === tdr.id ? null : tdr.id); }}
                                  className="p-1 rounded-full hover:bg-red-100 transition"
                                  title="Ver observacion del revisor">
                                  <MessageSquare className="w-4 h-4 text-red-500" />
                                </button>
                                {observacionAbierta === tdr.id && (
                                  <div ref={popoverRef} className="absolute left-0 bottom-full mb-2 z-50" style={{ minWidth: '280px' }}>
                                    <div style={{ background: '#1f2937', color: '#f9fafb', borderRadius: '10px', padding: '12px 14px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)', fontSize: '12px', lineHeight: '1.6' }}>
                                      <p style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observacion del revisor</p>
                                      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{tdr.ultima_observacion}</p>
                                    </div>
                                    <div style={{ position: 'absolute', left: '10px', bottom: '-6px', width: '12px', height: '12px', background: '#1f2937', transform: 'rotate(45deg)' }} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-4">
                            <button onClick={() => onNavigate('tdr-detail', String(tdr.id))}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1" title="Ver detalle">
                              <Eye className="w-4 h-4" /> <span>Ver</span>
                            </button>
                            {user.rol === 'CONTRATANTE' && tdr.estado !== 'Aprobado' && (
                              <button onClick={() => onNavigate('tdr-edit', String(tdr.id))}
                                className="text-orange-600 hover:text-orange-800 flex items-center gap-1" title="Editar TdR">
                                <Edit className="w-4 h-4" /> <span>Editar</span>
                              </button>
                            )}
                            {user.rol === 'CONTRATANTE' && tdr.estado === 'Pendiente' && (
                              <button
                                onClick={() => { if (window.confirm('Eliminar este TdR? Esta accion no se puede deshacer.')) { onDeleteTdr?.(String(tdr.id)); } }}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1" title="Eliminar TdR">
                                <Trash2 className="w-4 h-4" /> <span>Eliminar</span>
                              </button>
                            )}
                            {(user.rol === 'ADMINISTRATIVO' || user.rol === 'ADMINISTRADOR') && (tdr.estado === 'Pendiente' || tdr.estado === 'Observado') && (
                              <button onClick={() => onNavigate('validacion', String(tdr.id))}
                                className="text-green-600 hover:text-green-800 flex items-center gap-1" title="Validar">
                                <CheckCircle className="w-4 h-4" /> <span>Validar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tdrs.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No se encontraron TdR con los filtros aplicados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'dashboard' && puedeVerChart && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Filtros del Dashboard</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha Inicio</label>
                  <input type="date" value={chartInicio} onChange={e => setChartInicio(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha Fin</label>
                  <input type="date" value={chartFin} onChange={e => setChartFin(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Equipo</label>
                  <select value={chartEquipo} onChange={e => setChartEquipo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Todos los equipos</option>
                    {equipos.map(eq => (
                      <option key={eq.id} value={eq.nombre}>{eq.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total filtrado</p>
                <p className="text-3xl font-bold text-gray-800">{tdrsFiltrados.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Pendientes</p>
                <p className="text-3xl font-bold" style={{ color: '#eab308' }}>{tdrsFiltrados.filter(t => (t.estado ?? (t as any).estado_verificacion) === 'Pendiente').length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Aprobados</p>
                <p className="text-3xl font-bold" style={{ color: '#16a34a' }}>{tdrsFiltrados.filter(t => (t.estado ?? (t as any).estado_verificacion) === 'Aprobado').length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Observados</p>
                <p className="text-3xl font-bold" style={{ color: '#dc2626' }}>{tdrsFiltrados.filter(t => (t.estado ?? (t as any).estado_verificacion) === 'Observado').length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Distribucion de Estados</h3>
              <p className="text-xs text-gray-500 mb-6">Porcentaje de TdR segun su estado actual</p>

              {tdrsFiltrados.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No hay TdR con los filtros aplicados.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      innerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, porcentaje }) => `${name} ${porcentaje}%`}
                      labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                      style={{ fontSize: '12px', fontWeight: 600 }}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={CHART_COLORS[entry.name]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
