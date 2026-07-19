import React, { useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import Header from './Header';
import { User } from '../types';
import { ArrowLeft, Users, Search, Pencil, IdCard, Mail, Save, X, Trash2 } from 'lucide-react';
import { API_URL } from '../config/api';

interface LocadoresPageProps {
  user: User;
  currentPage: string; 
  editingId?: string | null;
  onNavigate: (page: string, id?: string) => void;
  onLogout: () => void;
}

export default function LocadoresPage({ 
  user, currentPage, editingId, onNavigate, onLogout
}: LocadoresPageProps) {    

  const [locadores, setLocadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [busqueda, setBusqueda] = useState('');

  const [formData, setFormData] = useState<any>({
    nombres: '',
    apellidos: '',
    tipoDocumento: '',
    numeroDocumento: '',
    ruc: '',
    domicilio: '',
    telefono_celular: '', 
    correo_electronico: '', 
    banco: '',
    cci: ''
  });

  const canEdit = user.rol === 'CONTRATANTE' || user.rol === 'ADMINISTRADOR';
  const isAdmin = user.rol === 'ADMINISTRADOR';
  const token = localStorage.getItem('token') || '';
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  /* =========================
     OBTENER LOCADORES
  ==========================*/
  const fetchLocadores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/locadores`, { headers: authHeaders });
      const data = await res.json();
      setLocadores(data);
    } catch (error) {
      console.error("Error cargando locadores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocadores(); }, []);

  /* =========================
     NUEVO / EDITAR
  ==========================*/
  useEffect(() => {

    if (currentPage === 'locador-new') {
      setFormData({
        nombres: '',
        apellidos: '',
        tipoDocumento: '',
        numeroDocumento: '',
        ruc: '',
        domicilio: '',
        telefono_celular: '',
        correo_electronico: '',
        banco: '',
        cci: ''
      });
      setUploadedDocs({});
      setShowForm(true);
    }

    else if (currentPage === 'locador-edit' && editingId) {

      fetch(`${API_URL}/locadores/${editingId}`, { headers: authHeaders })
        .then(res => res.json())
        .then(data => {
          setFormData({
            nombres: data.nombres,
            apellidos: data.apellidos,
            tipoDocumento: data.tipo_documento,
            numeroDocumento: data.numero_documento,
            ruc: data.ruc,
            domicilio: data.domicilio,
            telefono_celular: data.telefono_celular,
            correo_electronico: data.correo_electronico,
            banco: data.banco,
            cci: data.cci
          });
          setShowForm(true);
        });

    } else {
      setShowForm(false);
    }

  }, [currentPage, editingId]);

  /* =========================
     VALIDACIÓN
  ==========================*/
  const validateDocumento = () => {
    if (!formData.nombres?.trim() || !formData.apellidos?.trim()) {
      toast.error("Nombres y apellidos son obligatorios.");
      return false;
    }

    if (formData.tipoDocumento === 'DNI' && formData.numeroDocumento.length !== 8) {
      toast.error("El DNI debe tener exactamente 8 dígitos.");
      return false;
    }

    if (formData.tipoDocumento === 'CE' && formData.numeroDocumento.length !== 9) {
      toast.error("El Carnet de Extranjería debe tener exactamente 9 dígitos.");
      return false;
    }

    if (formData.ruc && formData.ruc.length !== 11) {
      toast.error("El RUC debe tener exactamente 11 dígitos.");
      return false;
    }

    if (formData.correo_electronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_electronico)) {
      toast.error("El correo electrónico no es válido.");
      return false;
    }

    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    if (['numeroDocumento', 'ruc', 'telefono_celular', 'cci'].includes(field)) {
      if (!/^\d*$/.test(value)) return;
    }

    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  /* =========================
     GUARDAR
  ==========================*/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDocumento()) return;

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `${API_URL}/locadores/${editingId}`
      : `${API_URL}/locadores`;

    const dataToSend = {
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      tipo_documento: formData.tipoDocumento,
      numero_documento: formData.numeroDocumento,
      ruc: formData.ruc,
      domicilio: formData.domicilio,
      telefono_celular: formData.telefono_celular,
      correo_electronico: formData.correo_electronico,
      banco: formData.banco,
      cci: formData.cci
    };

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(dataToSend)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Error guardando locador');
      }

      onNavigate('locadores');
      fetchLocadores();
      toast.success(editingId ? 'Locador actualizado correctamente' : 'Locador creado correctamente');

    } catch (error: any) {
      toast.error(error?.message || "Error guardando locador");
    }
  };

  /* =========================
     ELIMINAR
  ==========================*/
  const handleDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`${API_URL}/locadores/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Locador eliminado correctamente');
      fetchLocadores();
    } catch {
      toast.error('No se pudo eliminar el locador');
    }
  };

  /* =========================
     FORMULARIO
  ==========================*/
  if (showForm && canEdit) {
    const Campo = ({
      label, value, onChange, type = 'text', maxLength, placeholder, required = false,
      hint, numeric = false, colSpan = false,
    }: {
      label: string; value: string; onChange: (val: string) => void; type?: string;
      maxLength?: number; placeholder?: string; required?: boolean;
      hint?: string; numeric?: boolean; colSpan?: boolean;
    }) => (
      <div className={colSpan ? 'md:col-span-2' : ''}>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
          {hint && <span className="font-normal text-gray-400 ml-1">({hint})</span>}
        </label>
        <input
          type={type} maxLength={maxLength} required={required}
          value={value}
          onChange={e => onChange(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
    );

    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <button onClick={() => onNavigate('locadores')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm transition">
            <ArrowLeft className="w-4 h-4" /> Volver al listado
          </button>

          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {editingId ? <Pencil className="w-5 h-5 text-blue-600" /> : <Users className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Actualizar Locador' : 'Nuevo Locador'}</h2>
              <p className="text-sm text-gray-500">Datos personales y bancarios del locador</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Datos de Identidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Campo label="Nombres" value={formData.nombres} onChange={v => handleInputChange('nombres', v)} placeholder="Ej: Juan Carlos" required />
                <Campo label="Apellidos" value={formData.apellidos} onChange={v => handleInputChange('apellidos', v)} placeholder="Ej: Pérez Gómez" required />

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo Documento</label>
                  <select value={formData.tipoDocumento}
                    onChange={e => handleInputChange('tipoDocumento', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="DNI">DNI</option>
                    <option value="CE">Carnet de Extranjería</option>
                  </select>
                </div>
                <Campo label="Número Documento" value={formData.numeroDocumento}
                  onChange={v => handleInputChange('numeroDocumento', v)}
                  maxLength={formData.tipoDocumento === 'DNI' ? 8 : 9} numeric required />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Campo label="Correo Electrónico" value={formData.correo_electronico} onChange={v => handleInputChange('correo_electronico', v)} type="email" colSpan required />
                <Campo label="Teléfono" value={formData.telefono_celular} onChange={v => handleInputChange('telefono_celular', v)} numeric required />
                <Campo label="Domicilio" value={formData.domicilio} onChange={v => handleInputChange('domicilio', v)} colSpan required />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Datos Fiscales y Bancarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Campo label="RUC" value={formData.ruc} onChange={v => handleInputChange('ruc', v)} maxLength={11} numeric hint="11 dígitos" required />
                <Campo label="Banco" value={formData.banco} onChange={v => handleInputChange('banco', v)} required />
                <Campo label="CCI" value={formData.cci} onChange={v => handleInputChange('cci', v)} maxLength={20} numeric hint="20 dígitos" colSpan required />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button type="button"
                onClick={() => onNavigate('locadores')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button type="submit"
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition">
                <Save className="w-4 h-4" />
                {editingId ? 'Guardar Cambios' : 'Crear Locador'}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  /* =========================
     LISTADO
  ==========================*/
  const filtrados = locadores.filter(l => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    return (
      l.nombres?.toLowerCase().includes(q) ||
      l.apellidos?.toLowerCase().includes(q) ||
      l.numero_documento?.toLowerCase().includes(q) ||
      l.ruc?.toLowerCase().includes(q) ||
      l.correo_electronico?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestión de Locadores</h2>
              <p className="text-sm text-gray-500">{locadores.length} locador{locadores.length !== 1 ? 'es' : ''} registrado{locadores.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => onNavigate('locador-new')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm transition"
            >
              <Users className="w-4 h-4" />
              Nuevo Locador
            </button>
          )}
        </div>

        <div className="relative mb-5 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, documento, RUC o correo..."
            className="pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Cargando locadores...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              {busqueda ? 'No se encontraron resultados.' : 'Aún no hay locadores registrados.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtrados.map((locador) => (
                <div key={locador.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {locador.nombres?.[0]?.toUpperCase()}{locador.apellidos?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {locador.nombres} {locador.apellidos}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <IdCard className="w-3 h-3" />
                          {locador.tipo_documento} {locador.numero_documento}
                        </span>
                        {locador.ruc && <span>RUC {locador.ruc}</span>}
                        {locador.correo_electronico && (
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{locador.correo_electronico}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canEdit && (
                      <button
                        onClick={() => onNavigate('locador-edit', String(locador.id))}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(locador.id, `${locador.nombres} ${locador.apellidos}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}