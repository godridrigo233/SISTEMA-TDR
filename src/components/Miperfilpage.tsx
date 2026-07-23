import React, { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import Header from './Header';
import { User } from '../types';
import { User as UserIcon, CreditCard, Phone, Pencil, X, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config/api';

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
  </div>
);

export default function MiPerfilPage({ user, onNavigate, onLogout }: MiPerfilPageProps) {
  const [perfil, setPerfil]   = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Perfil | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [erroresPassword, setErroresPassword] = useState<string[]>([]);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({ actual: false, nueva: false, confirmar: false });

  const token = localStorage.getItem('token');

  const cargarPerfil = () => {
    setLoading(true);
    fetch(`${API_URL}/contratantes/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('No se encontró el perfil');
        return res.json();
      })
      .then(data => {
        setPerfil(data);
        setForm({ ...data, fecha_nacimiento: data.fecha_nacimiento ? String(data.fecha_nacimiento).slice(0, 10) : '' });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarPerfil(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: keyof Perfil, val: string) => {
    setForm(prev => prev ? { ...prev, [field]: val } : prev);
    setErrores([]);
  };

  const validar = (): string[] => {
    if (!form) return ['Formulario no disponible'];
    const e: string[] = [];
    if (!form.nombres?.trim())            e.push('Nombres es requerido');
    if (!form.primer_apellido?.trim())    e.push('Primer apellido es requerido');
    if (!form.segundo_apellido?.trim())   e.push('Segundo apellido es requerido');
    if (!/^\d{8}$/.test(form.numero_documento || ''))
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
    if (!form) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/contratantes/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Perfil actualizado correctamente');
        setEditando(false);
        cargarPerfil();
      } else {
        setErrores(data.errores || [data.message || 'Error al guardar el perfil']);
      }
    } catch {
      setErrores(['Error de conexión con el servidor']);
    } finally {
      setSaving(false);
    }
  };

  const cancelarEdicion = () => {
    if (perfil) setForm({ ...perfil, fecha_nacimiento: perfil.fecha_nacimiento ? String(perfil.fecha_nacimiento).slice(0, 10) : '' });
    setErrores([]);
    setEditando(false);
  };

  const validarPassword = (): string[] => {
    const e: string[] = [];
    if (!passwordForm.actual) e.push('Debe ingresar su contraseña actual');
    if (!passwordForm.nueva) e.push('Debe ingresar la nueva contraseña');
    if (passwordForm.nueva.length < 6) e.push('La nueva contraseña debe tener al menos 6 caracteres');
    if (passwordForm.nueva !== passwordForm.confirmar) e.push('Las contraseñas no coinciden');
    if (passwordForm.actual && passwordForm.nueva && passwordForm.actual === passwordForm.nueva)
      e.push('La nueva contraseña debe ser diferente a la actual');
    return e;
  };

  const handleCambiarPassword = async () => {
    const e = validarPassword();
    if (e.length > 0) { setErroresPassword(e); return; }

    setSavingPassword(true);
    try {
      const res = await fetch(`${API_URL}/contratantes/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ passwordActual: passwordForm.actual, passwordNueva: passwordForm.nueva }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Contraseña actualizada correctamente');
        setCambiandoPassword(false);
        setPasswordForm({ actual: '', nueva: '', confirmar: '' });
        setErroresPassword([]);
      } else {
        setErroresPassword([data.message || 'Error al cambiar contraseña']);
      }
    } catch {
      setErroresPassword(['Error de conexión con el servidor']);
    } finally {
      setSavingPassword(false);
    }
  };

  // ── helpers de solo-lectura ──────────────────────────────────────
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
        <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !perfil || !form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6">
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
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Encabezado del perfil */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-sm p-6 mb-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UserIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {perfil.primer_apellido} {perfil.segundo_apellido}, {perfil.nombres}
                </h2>
                <p className="text-sm text-blue-100">
                  @{perfil.username} · {user.rol}
                </p>
              </div>
            </div>
            {!editando && (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium transition backdrop-blur-sm"
              >
                <Pencil className="w-4 h-4" />
                Editar Perfil
              </button>
            )}
          </div>
        </div>

        {editando && errores.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
            {errores.map((e, i) => <p key={i} className="text-sm text-red-700">• {e}</p>)}
          </div>
        )}

        {!editando ? (
          <>
            {/* Sección: Identidad */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
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

            {/* Sección: Seguridad — Cambio de Contraseña */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Seguridad</h3>
                </div>
                {!cambiandoPassword && (
                  <button
                    onClick={() => setCambiandoPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                  >
                    Cambiar Contraseña
                  </button>
                )}
              </div>

              {!cambiandoPassword ? (
                <p className="text-sm text-gray-500">Su contraseña puede ser cambiada en cualquier momento desde esta sección.</p>
              ) : (
                <div className="space-y-4">
                  {erroresPassword.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      {erroresPassword.map((e, i) => <p key={i} className="text-sm text-red-700">• {e}</p>)}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contraseña Actual <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword.actual ? 'text' : 'password'}
                        value={passwordForm.actual}
                        onChange={e => { setPasswordForm(p => ({ ...p, actual: e.target.value })); setErroresPassword([]); }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Ingrese su contraseña actual"
                      />
                      <button type="button" onClick={() => setShowPassword(p => ({ ...p, actual: !p.actual }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword.actual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nueva Contraseña <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword.nueva ? 'text' : 'password'}
                        value={passwordForm.nueva}
                        onChange={e => { setPasswordForm(p => ({ ...p, nueva: e.target.value })); setErroresPassword([]); }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button type="button" onClick={() => setShowPassword(p => ({ ...p, nueva: !p.nueva }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword.nueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Confirmar Nueva Contraseña <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword.confirmar ? 'text' : 'password'}
                        value={passwordForm.confirmar}
                        onChange={e => { setPasswordForm(p => ({ ...p, confirmar: e.target.value })); setErroresPassword([]); }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Repita la nueva contraseña"
                      />
                      <button type="button" onClick={() => setShowPassword(p => ({ ...p, confirmar: !p.confirmar }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword.confirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={() => { setCambiandoPassword(false); setPasswordForm({ actual: '', nueva: '', confirmar: '' }); setErroresPassword([]); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                      Cancelar
                    </button>
                    <button onClick={handleCambiarPassword} disabled={savingPassword}
                      className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition ${savingPassword ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {savingPassword ? 'Guardando...' : 'Actualizar Contraseña'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              ← Volver al Panel
            </button>
          </>
        ) : (
          <>
            {/* ── Identidad (editable) ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Datos de Identidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input label="Nombres" value={form.nombres} onChange={val => set('nombres', val)} required />
                </div>
                <Input label="Primer Apellido" value={form.primer_apellido} onChange={val => set('primer_apellido', val)} required />
                <Input label="Segundo Apellido" value={form.segundo_apellido} onChange={val => set('segundo_apellido', val)} required />

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo Doc <span className="text-red-500">*</span></label>
                  <select value={form.tipo_documento?.trim()} onChange={e => set('tipo_documento', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="PAS">PAS</option>
                  </select>
                </div>
                <Input label="N° Documento" value={form.numero_documento} onChange={val => set('numero_documento', val.replace(/\D/g, ''))} maxLength={8} numeric hint="8 dígitos" required />

                <Input label="Lugar de Nacimiento" value={form.lugar_nacimiento || ''} onChange={val => set('lugar_nacimiento', val)} />
                <Input label="Fecha de Nacimiento" value={form.fecha_nacimiento || ''} onChange={val => set('fecha_nacimiento', val)} type="date" />

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estado Civil</label>
                  <select value={form.estado_civil || ''} onChange={e => set('estado_civil', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">— Seleccionar —</option>
                    <option value="Soltero">Soltero/a</option>
                    <option value="Casado">Casado/a</option>
                    <option value="Divorciado">Divorciado/a</option>
                    <option value="Viudo">Viudo/a</option>
                    <option value="Conviviente">Conviviente</option>
                  </select>
                </div>
                <Input label="Nacionalidad" value={form.nacionalidad || ''} onChange={val => set('nacionalidad', val)} />
              </div>
            </div>

            {/* ── Contacto (editable) ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input label="Correo Electrónico" value={form.correo_electronico} onChange={val => set('correo_electronico', val)} type="email" required />
                </div>
                <Input label="Teléfono Celular" value={form.telefono_celular || ''} onChange={val => set('telefono_celular', val.replace(/\D/g, ''))} numeric />
                <div className="md:col-span-2">
                  <Input label="Domicilio" value={form.domicilio || ''} onChange={val => set('domicilio', val)} />
                </div>
              </div>
            </div>

            {/* ── Fiscal y Bancario (editable) ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Datos Fiscales y Bancarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="RUC" value={form.ruc || ''} onChange={val => set('ruc', val.replace(/\D/g, ''))} maxLength={11} numeric hint="11 dígitos" />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Banco</label>
                  <select value={form.banco || ''} onChange={e => set('banco', e.target.value)}
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
                  <Input label="CCI" value={form.cci || ''} onChange={val => set('cci', val.replace(/\D/g, ''))} maxLength={20} numeric hint="20 dígitos" />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between">
              <button onClick={cancelarEdicion}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={saving}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white transition ${
                  saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
