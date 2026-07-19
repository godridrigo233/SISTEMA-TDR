import React, { useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import Header from './Header';
import { User } from '../types';
import { UserPlus, CheckCircle, Eye, EyeOff, ArrowLeft, Pencil, Search, Users, Mail, Phone, IdCard } from 'lucide-react';
import { API_URL } from '../config/api';

interface NuevoContratantePageProps {
  user: User;
  currentPage: string;
  editingId?: string | null;
  onNavigate: (page: string, id?: string) => void;
  onLogout: () => void;
}

const VACIO = {
  username: '', password: '', confirmar: '',
  nombres: '', primer_apellido: '', segundo_apellido: '',
  tipo_documento: 'DNI', numero_documento: '',
  ruc: '', correo_electronico: '', telefono_celular: '',
  domicilio: '', lugar_nacimiento: '', fecha_nacimiento: '',
  estado_civil: '', nacionalidad: 'Peruana', banco: '', cci: '',
};

// 🔥 Movemos el componente Input AFUERA del componente principal
// para evitar que React lo destruya y pierda el foco en cada tecla.
const Input = ({
  label, value, onChange, type = 'text', maxLength, placeholder, required = false,
  hint, numeric = false,
}: {
  label: string; value: string; onChange: (val: string) => void; type?: string;
  maxLength?: number; placeholder?: string; required?: boolean;
  hint?: string; numeric?: boolean;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
      {hint && <span className="font-normal text-gray-400 ml-1">({hint})</span>}
    </label>
    <input
      type={type} maxLength={maxLength}
      value={value}
      onChange={e => onChange(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    />
    {maxLength && (
      <p className={`text-right text-xs mt-0.5 ${value.length === maxLength ? 'text-green-600' : 'text-gray-400'}`}>
        {value.length}/{maxLength}
      </p>
    )}
  </div>
);

export default function NuevoContratantePage({ user, currentPage, editingId, onNavigate, onLogout }: NuevoContratantePageProps) {
  const isEditMode = currentPage === 'contratante-edit' && !!editingId;
  const isFormMode = currentPage === 'contratante-new' || isEditMode;

  const [form, setForm]           = useState(VACIO);
  const [errores, setErrores]     = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);
  const [exito, setExito]         = useState(false);
  const [verPass, setVerPass]     = useState(false);
  const [verConf, setVerConf]     = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  const [contratantes, setContratantes] = useState<any[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const token = localStorage.getItem('token');

  const fetchContratantes = async () => {
    setLoadingLista(true);
    try {
      const res = await fetch(`${API_URL}/contratantes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setContratantes(await res.json());
    } catch {
      toast.error('No se pudo cargar la lista de contratantes');
    } finally {
      setLoadingLista(false);
    }
  };

  useEffect(() => {
    if (!isFormMode) fetchContratantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormMode]);

  useEffect(() => {
    setErrores([]);
    setExito(false);

    if (currentPage === 'contratante-new') {
      setForm(VACIO);
    } else if (isEditMode && editingId) {
      setLoadingForm(true);
      fetch(`${API_URL}/contratantes/${editingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setForm({
            username: data.username || '',
            password: '', confirmar: '',
            nombres: data.nombres || '',
            primer_apellido: data.primer_apellido || '',
            segundo_apellido: data.segundo_apellido || '',
            tipo_documento: (data.tipo_documento || 'DNI').trim(),
            numero_documento: data.numero_documento || '',
            ruc: data.ruc || '',
            correo_electronico: data.correo_electronico || '',
            telefono_celular: data.telefono_celular || '',
            domicilio: data.domicilio || '',
            lugar_nacimiento: data.lugar_nacimiento || '',
            fecha_nacimiento: data.fecha_nacimiento ? String(data.fecha_nacimiento).slice(0, 10) : '',
            estado_civil: data.estado_civil || '',
            nacionalidad: data.nacionalidad || 'Peruana',
            banco: data.banco || '',
            cci: data.cci || '',
          });
        })
        .catch(() => toast.error('No se pudo cargar el contratante'))
        .finally(() => setLoadingForm(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, editingId]);

  // Solo admin puede acceder
  if (user.rol !== 'ADMINISTRADOR') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 font-semibold">Acceso restringido — solo administradores.</p>
      </div>
    );
  }

  const set = (field: keyof typeof VACIO, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setErrores([]);
    setExito(false);
  };

  const validar = (): string[] => {
    const e: string[] = [];
    if (!isEditMode) {
      if (!form.username.trim())             e.push('Usuario es requerido');
      if (form.username.includes(' '))       e.push('El usuario no puede tener espacios');
      if (form.password.length < 6)          e.push('La contraseña debe tener al menos 6 caracteres');
      if (form.password !== form.confirmar)  e.push('Las contraseñas no coinciden');
    }
    if (!form.nombres.trim())              e.push('Nombres es requerido');
    if (form.nombres.length > 40)          e.push('Nombres: máximo 40 caracteres');
    if (!form.primer_apellido.trim())      e.push('Primer apellido es requerido');
    if (!form.segundo_apellido.trim())     e.push('Segundo apellido es requerido');
    if (!/^\d{8}$/.test(form.numero_documento))
      e.push('DNI debe tener exactamente 8 dígitos');
    if (!form.correo_electronico || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico))
      e.push('Correo electrónico inválido');
    if (form.ruc && !/^\d{11}$/.test(form.ruc))
      e.push('RUC debe tener 11 dígitos');
    if (form.cci && !/^\d{20}$/.test(form.cci))
      e.push('CCI debe tener 20 dígitos');
    return e;
  };

  const handleGuardar = async () => {
    const e = validar();
    if (e.length > 0) { setErrores(e); return; }

    setSaving(true);
    try {
      const url = isEditMode ? `${API_URL}/contratantes/${editingId}` : `${API_URL}/contratantes`;
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        if (isEditMode) {
          toast.success('Contratante actualizado correctamente');
          onNavigate('contratantes');
        } else {
          setExito(true);
          setForm(VACIO);
          toast.success('Contratante creado correctamente');
        }
      } else {
        setErrores(data.errores || [data.message || 'Error al guardar el contratante']);
      }
    } catch {
      setErrores(['Error de conexión con el servidor']);
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // VISTA: LISTADO
  // ═══════════════════════════════════════════════════════════════
  if (!isFormMode) {
    const filtrados = contratantes.filter(c => {
      if (!busqueda.trim()) return true;
      const q = busqueda.trim().toLowerCase();
      return (
        c.nombres?.toLowerCase().includes(q) ||
        c.primer_apellido?.toLowerCase().includes(q) ||
        c.segundo_apellido?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.correo_electronico?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <button onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm transition">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gestión de Contratantes</h2>
                <p className="text-sm text-gray-500">{contratantes.length} contratante{contratantes.length !== 1 ? 's' : ''} registrado{contratantes.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('contratante-new')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Contratante
            </button>
          </div>

          <div className="relative mb-5 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, usuario o correo..."
              className="pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loadingLista ? (
              <div className="p-12 text-center text-gray-400 text-sm">Cargando contratantes...</div>
            ) : filtrados.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                {busqueda ? 'No se encontraron resultados.' : 'Aún no hay contratantes registrados.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtrados.map(c => (
                  <div key={c.usuario_id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {c.nombres?.[0]?.toUpperCase()}{c.primer_apellido?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {c.primer_apellido} {c.segundo_apellido}, {c.nombres}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1"><IdCard className="w-3 h-3" />@{c.username}</span>
                          {c.correo_electronico && (
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.correo_electronico}</span>
                          )}
                          {c.telefono_celular && (
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefono_celular}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('contratante-edit', String(c.usuario_id))}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition flex-shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VISTA: FORMULARIO (crear / editar)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <button onClick={() => onNavigate('contratantes')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm transition">
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            {isEditMode ? <Pencil className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Editar Contratante' : 'Nuevo Contratante'}</h2>
            <p className="text-sm text-gray-500">{isEditMode ? 'Actualizar datos personales' : 'Crear cuenta y datos personales'}</p>
          </div>
        </div>

        {loadingForm ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400 text-sm">
            Cargando datos...
          </div>
        ) : (
          <>
            {errores.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
                {errores.map((e, i) => <p key={i} className="text-sm text-red-700">• {e}</p>)}
              </div>
            )}

            {exito && (
              <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg flex items-center gap-2 text-green-800 text-sm">
                <CheckCircle className="w-4 h-4" />
                Contratante creado correctamente. Ya puede iniciar sesión.
              </div>
            )}

            {/* ── Credenciales de acceso (solo al crear) ── */}
            {!isEditMode && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  Credenciales de Acceso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Usuario" value={form.username} onChange={val => set('username', val)} placeholder="ej: jmedina" required />

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Contraseña <span className="text-red-500">*</span>
                      <span className="font-normal text-gray-400 ml-1">(mín. 6 caracteres)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={verPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        placeholder="••••••"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" onClick={() => setVerPass(v => !v)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                        {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Confirmar <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={verConf ? 'text' : 'password'}
                        value={form.confirmar}
                        onChange={e => set('confirmar', e.target.value)}
                        placeholder="••••••"
                        className={`w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          form.confirmar && form.confirmar !== form.password
                            ? 'border-red-400'
                            : form.confirmar && form.confirmar === form.password
                              ? 'border-green-400'
                              : 'border-gray-300'
                        }`}
                      />
                      <button type="button" onClick={() => setVerConf(v => !v)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                        {verConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isEditMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
                Editando cuenta <span className="font-semibold">@{form.username}</span>. El usuario y la contraseña no se modifican desde aquí.
              </div>
            )}

            {/* ── Identidad ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Datos de Identidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input label="Nombres" value={form.nombres} onChange={val => set('nombres', val)} maxLength={40} placeholder="Ej: Juan Jose" required />
                </div>
                <Input label="Primer Apellido" value={form.primer_apellido} onChange={val => set('primer_apellido', val)} maxLength={40} placeholder="Ej: Medina"  required />
                <Input label="Segundo Apellido" value={form.segundo_apellido} onChange={val => set('segundo_apellido', val)} maxLength={40} placeholder="Ej: Davalos" required />

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Tipo Doc <span className="text-red-500">*</span>
                  </label>
                  <select value={form.tipo_documento} onChange={e => set('tipo_documento', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="PAS">PAS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    N° Documento <span className="text-red-500">*</span>
                    <span className="font-normal text-gray-400 ml-1">(8 dígitos)</span>
                  </label>
                  <input type="text" inputMode="numeric" maxLength={8}
                    value={form.numero_documento}
                    onChange={e => set('numero_documento', e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678"
                    className={`w-full border rounded-lg px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      form.numero_documento.length === 8 ? 'border-green-400' : 'border-gray-300'
                    }`}
                  />
                  <p className={`text-right text-xs mt-0.5 ${form.numero_documento.length === 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    {form.numero_documento.length}/8
                  </p>
                </div>

                <Input label="Lugar de Nacimiento" value={form.lugar_nacimiento} onChange={val => set('lugar_nacimiento', val)} placeholder="Ej: Lima" />
                <Input label="Fecha de Nacimiento" value={form.fecha_nacimiento} onChange={val => set('fecha_nacimiento', val)} type="date" />

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estado Civil</label>
                  <select value={form.estado_civil} onChange={e => set('estado_civil', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">— Seleccionar —</option>
                    <option value="Soltero">Soltero/a</option>
                    <option value="Casado">Casado/a</option>
                    <option value="Divorciado">Divorciado/a</option>
                    <option value="Viudo">Viudo/a</option>
                    <option value="Conviviente">Conviviente</option>
                  </select>
                </div>

                <Input label="Nacionalidad" value={form.nacionalidad} onChange={val => set('nacionalidad', val)} placeholder="Peruana" />
              </div>
            </div>

            {/* ── Contacto ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input label="Correo Electrónico" value={form.correo_electronico} onChange={val => set('correo_electronico', val)} type="email" placeholder="usuario@dominio.com" required />
                </div>
                <Input label="Teléfono Celular" value={form.telefono_celular} onChange={val => set('telefono_celular', val)} placeholder="999 000 000" numeric />
                <div className="md:col-span-2">
                  <Input label="Domicilio" value={form.domicilio} onChange={val => set('domicilio', val)} placeholder="Av. Ejemplo 123 - Distrito, Provincia, Dpto." />
                </div>
              </div>
            </div>

            {/* ── Fiscal y Bancario ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Datos Fiscales y Bancarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    RUC <span className="font-normal text-gray-400">(11 dígitos)</span>
                  </label>
                  <input type="text" inputMode="numeric" maxLength={11}
                    value={form.ruc}
                    onChange={e => set('ruc', e.target.value.replace(/\D/g, ''))}
                    placeholder="10XXXXXXXXX"
                    className={`w-full border rounded-lg px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      form.ruc.length === 11 ? 'border-green-400' : 'border-gray-300'
                    }`}
                  />
                  <p className={`text-right text-xs mt-0.5 ${form.ruc.length === 11 ? 'text-green-600' : 'text-gray-400'}`}>
                    {form.ruc.length}/11
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Banco</label>
                  <select value={form.banco} onChange={e => set('banco', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">— Seleccionar —</option>
                    <option value="Banco de la Nación">Banco de la Nación</option>
                    <option value="BCP">BCP</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Interbank">Interbank</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="Banbif">Banbif</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    CCI <span className="font-normal text-gray-400">(20 dígitos)</span>
                  </label>
                  <input type="text" inputMode="numeric" maxLength={20}
                    value={form.cci}
                    onChange={e => set('cci', e.target.value.replace(/\D/g, ''))}
                    placeholder="00000000000000000000"
                    className={`w-full border rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      form.cci.length === 20 ? 'border-green-400' : 'border-gray-300'
                    }`}
                  />
                  <p className={`text-right text-xs mt-0.5 ${form.cci.length === 20 ? 'text-green-600' : 'text-gray-400'}`}>
                    {form.cci.length}/20
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between">
              <button onClick={() => onNavigate('contratantes')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={saving}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white transition ${
                  saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {isEditMode ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {saving ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Crear Contratante'}
              </button>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
