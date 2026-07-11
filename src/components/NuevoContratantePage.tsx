import React, { useState } from 'react';
import Header from './Header';
import { User } from '../types';
import { UserPlus, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config/api';

interface NuevoContratantePageProps {
  user: User;
  onNavigate: (page: string) => void;
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

// 🔥 CORRECCIÓN: Movemos el componente Input AFUERA del componente principal
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
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {maxLength && (
      <p className={`text-right text-xs mt-0.5 ${value.length === maxLength ? 'text-green-600' : 'text-gray-400'}`}>
        {value.length}/{maxLength}
      </p>
    )}
  </div>
);

export default function NuevoContratantePage({ user, onNavigate, onLogout }: NuevoContratantePageProps) {
  const [form, setForm]           = useState(VACIO);
  const [errores, setErrores]     = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);
  const [exito, setExito]         = useState(false);
  const [verPass, setVerPass]     = useState(false);
  const [verConf, setVerConf]     = useState(false);

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
    if (!form.username.trim())             e.push('Usuario es requerido');
    if (form.username.includes(' '))       e.push('El usuario no puede tener espacios');
    if (form.password.length < 6)          e.push('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.confirmar)  e.push('Las contraseñas no coinciden');
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
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/contratantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setExito(true);
        setForm(VACIO);
      } else {
        setErrores(data.errores || [data.message || 'Error al crear el contratante']);
      }
    } catch {
      setErrores(['Error de conexión con el servidor']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nuevo Contratante</h2>
            <p className="text-sm text-gray-500">Crear cuenta y datos personales</p>
          </div>
        </div>

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

        {/* ── Credenciales de acceso ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Credenciales de Acceso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Se actualizó la prop "value" y "onChange" */}
            <Input label="Usuario" value={form.username} onChange={val => set('username', val)} placeholder="ej: jmedina" required />

            {/* Password con ojo */}
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

            {/* Confirmar */}
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

        {/* ── Identidad ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
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
          <button onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            ← Volver al Panel
          </button>
          <button onClick={handleGuardar} disabled={saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white transition ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            <UserPlus className="w-4 h-4" />
            {saving ? 'Creando...' : 'Crear Contratante'}
          </button>
        </div>

      </main>
    </div>
  );
}