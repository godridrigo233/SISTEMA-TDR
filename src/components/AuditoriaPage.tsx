import React, { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import Header from './Header';
import { User } from '../types';
import { API_URL } from '../config/api';
import { Search, Filter, RefreshCw, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditoriaPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface AuditEntry {
  id: number;
  usuario_id: number;
  username: string;
  rol: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  descripcion: string;
  ip_address: string;
  created_at: string;
}

const ACCION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  CREAR_TDR: 'bg-green-100 text-green-800',
  ACTUALIZAR_TDR: 'bg-yellow-100 text-yellow-800',
  VALIDAR_TDR: 'bg-emerald-100 text-emerald-800',
  OBSERVAR_TDR: 'bg-orange-100 text-orange-800',
  ELIMINAR_TDR: 'bg-red-100 text-red-800',
  CAMBIAR_PASSWORD: 'bg-purple-100 text-purple-800',
};

const ACCION_LABELS: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  CREAR_TDR: 'Creó TdR',
  ACTUALIZAR_TDR: 'Actualizó TdR',
  VALIDAR_TDR: 'Aprobó TdR',
  OBSERVAR_TDR: 'Observó TdR',
  ELIMINAR_TDR: 'Eliminó TdR',
  CAMBIAR_PASSWORD: 'Cambio de contraseña',
};

export default function AuditoriaPage({ user, onNavigate, onLogout }: AuditoriaPageProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const token = localStorage.getItem('token');

  const cargar = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '30' });
      if (filtroUsuario.trim()) params.set('usuario', filtroUsuario.trim());
      if (filtroAccion.trim()) params.set('accion', filtroAccion.trim());
      if (filtroDesde.trim()) params.set('desde', filtroDesde.trim());
      if (filtroHasta.trim()) params.set('hasta', filtroHasta.trim());

      const res = await fetch(`${API_URL}/auditoria?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error cargando auditoría');
      const data = await res.json();
      setEntries(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error('Error al cargar registros de auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(1); setPage(1); }, [filtroAccion]); // eslint-disable-line

  const buscar = () => { setPage(1); cargar(1); };

  const formatFecha = (f: string) => {
    try {
      return new Date(f).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return f; }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Registro de Auditoría</h1>
              <p className="text-sm text-gray-500">{total} registros encontrados</p>
            </div>
          </div>
          <button onClick={() => cargar(page)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="Usuario..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
              <option value="">Todas las acciones</option>
              <option value="LOGIN">Inicio de sesión</option>
              <option value="CREAR_TDR">Creó TdR</option>
              <option value="ACTUALIZAR_TDR">Actualizó TdR</option>
              <option value="VALIDAR_TDR">Aprobó TdR</option>
              <option value="OBSERVAR_TDR">Observó TdR</option>
              <option value="ELIMINAR_TDR">Eliminó TdR</option>
            </select>
            <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={buscar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No se encontraron registros de auditoría
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuario</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Rol</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Acción</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatFecha(e.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{e.username}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {e.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ACCION_COLORS[e.accion] || 'bg-gray-100 text-gray-700'}`}>
                          {ACCION_LABELS[e.accion] || e.accion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{e.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">
                Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => { setPage(p => Math.max(1, p - 1)); cargar(page - 1); }}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); cargar(page + 1); }}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
