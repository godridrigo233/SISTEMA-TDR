import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { API_URL } from '../config/api';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tdr_id: number | null;
  tdr_codigo: string | null;
  tipo: string;
  created_at: string;
}

interface Props {
  onNavigate: (page: string, id?: string) => void;
}

export default function NotificationsBell({ onNavigate }: Props) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token');

  const cargar = async () => {
    try {
      const res = await fetch(`${API_URL}/notificaciones?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotificaciones(data.notificaciones);
      setNoLeidas(data.noLeidas);
    } catch { /* silencioso */ }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line
  useEffect(() => {
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    if (abierto) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  const marcarLeida = async (id: number) => {
    try {
      await fetch(`${API_URL}/notificaciones/${id}/leer`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch { /* silencioso */ }
  };

  const marcarTodas = async () => {
    try {
      await fetch(`${API_URL}/notificaciones/leer-todas`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch { /* silencioso */ }
  };

  const formatTiempo = (f: string) => {
    try {
      const diff = Date.now() - new Date(f).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Ahora';
      if (mins < 60) return `${mins}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h`;
      const dias = Math.floor(hrs / 24);
      return `${dias}d`;
    } catch { return ''; }
  };

  const handleClick = (n: Notificacion) => {
    if (!n.leida) marcarLeida(n.id);
    setAbierto(false);
    if (n.tdr_id) onNavigate('tdr-detail', String(n.tdr_id));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto(!abierto)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
        <Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
            {noLeidas > 0 && (
              <button onClick={marcarTodas}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No tienes notificaciones
              </div>
            ) : (
              notificaciones.map(n => (
                <button key={n.id} onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                    !n.leida ? 'bg-blue-50/50' : ''
                  }`}>
                  <div className="flex items-start gap-3">
                    {!n.leida && (
                      <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {n.titulo}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatTiempo(n.created_at)}</span>
                        {n.tdr_codigo && (
                          <span className="text-xs text-blue-500 font-mono">{n.tdr_codigo}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
