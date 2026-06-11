import React, { useState, useEffect } from 'react';
import Header from './Header';
import { User } from '../types';
import { User as UserIcon, CreditCard, Phone, MapPin, Briefcase } from 'lucide-react';

interface MiPerfilPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface Perfil {
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string;
  tipo_documento: string;
  numero_documento: string;
  ruc: string;
  correo_electronico: string;
  telefono_celular: string;
  domicilio: string;
  lugar_nacimiento: string;
  fecha_nacimiento: string;
  estado_civil: string;
  nacionalidad: string;
  banco: string;
  cci: string;
  username: string;
}

const API_URL = 'http://localhost:4000/api';

export default function MiPerfilPage({ user, onNavigate, onLogout }: MiPerfilPageProps) {
  const [perfil, setPerfil]   = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API_URL}/contratantes/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('No se encontró el perfil');
        return res.json();
      })
      .then(data => setPerfil(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── helpers ──────────────────────────────────────────────────────
  const Campo = ({ label, value }: { label: string; value?: string }) => (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-900 font-medium">
        {value || <span className="text-gray-400 font-normal italic">No registrado</span>}
      </p>
    </div>
  );

  const formatFecha = (fecha?: string) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-PE', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch { return fecha; }
  };

  // ── render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center py-32">
          <p className="text-gray-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
            <p className="text-yellow-800 font-medium mb-2">Perfil no encontrado</p>
            <p className="text-yellow-700 text-sm">
              Sus datos personales aún no han sido registrados en el sistema.
              Contacte al administrador.
            </p>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-6 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            ← Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Encabezado del perfil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {perfil.primer_apellido} {perfil.segundo_apellido}, {perfil.nombres}
              </h2>
              <p className="text-sm text-gray-500">
                @{perfil.username} · {user.rol}
              </p>
            </div>
          </div>
        </div>

        {/* Sección: Identidad */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <UserIcon className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Datos de Identidad</h3>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Campo label="Nombres"          value={perfil.nombres} />
            <Campo label="Primer Apellido"  value={perfil.primer_apellido} />
            <Campo label="Segundo Apellido" value={perfil.segundo_apellido} />
            <Campo
              label="Documento"
              value={`${perfil.tipo_documento?.trim()} N° ${perfil.numero_documento}`}
            />
            <Campo label="Lugar de Nacimiento" value={perfil.lugar_nacimiento} />
            <Campo label="Fecha de Nacimiento" value={formatFecha(perfil.fecha_nacimiento)} />
            <Campo label="Estado Civil"    value={perfil.estado_civil} />
            <Campo label="Nacionalidad"    value={perfil.nacionalidad} />
          </div>
        </div>

        {/* Sección: Contacto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Phone className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Contacto</h3>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Campo label="Correo Electrónico" value={perfil.correo_electronico} />
            </div>
            <Campo label="Teléfono Celular" value={perfil.telefono_celular} />
            <div className="col-span-2">
              <Campo label="Domicilio" value={perfil.domicilio} />
            </div>
          </div>
        </div>

        {/* Sección: Fiscal y Bancario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Datos Fiscales y Bancarios</h3>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Campo label="RUC"   value={perfil.ruc} />
            <Campo label="Banco" value={perfil.banco} />
            <div className="col-span-2">
              <Campo label="CCI (Código de Cuenta Interbancario)" value={perfil.cci} />
            </div>
          </div>
        </div>

        {/* Volver */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          ← Volver al Panel
        </button>

      </main>
    </div>
  );
}