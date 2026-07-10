import React, { useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import Header from './Header';
import { User } from '../types';
import { ArrowLeft, FileText, Upload, CheckCircle } from 'lucide-react';

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

  /* =========================
     OBTENER LOCADORES
  ==========================*/
  const fetchLocadores = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/locadores');
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

      fetch(`http://localhost:4000/api/locadores/${editingId}`)
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
      ? `http://localhost:4000/api/locadores/${editingId}`
      : `http://localhost:4000/api/locadores`;

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
        headers: { 'Content-Type': 'application/json' },
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
     FORMULARIO
  ==========================*/
  if (showForm && canEdit) {
    return (
      <div className="min-h-screen bg-white">
        <Header user={user} onLogout={onLogout} />
        <main className="max-w-5xl mx-auto px-6 py-10">

          <button onClick={() => onNavigate('locadores')}
            className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-800 transition text-sm">
            <ArrowLeft size={16} /> Volver
          </button>

          <h1 className="text-2xl font-bold mb-8">
            {editingId ? 'Actualizar Locador' : 'Nuevo Locador'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">

            <div className="grid md:grid-cols-2 gap-6">

              <input required placeholder="Nombres"
                value={formData.nombres}
                onChange={e => handleInputChange('nombres', e.target.value)}
                className="border p-3 rounded-lg" />

              <input required placeholder="Apellidos"
                value={formData.apellidos}
                onChange={e => handleInputChange('apellidos', e.target.value)}
                className="border p-3 rounded-lg" />

              <select value={formData.tipoDocumento}
                onChange={e => handleInputChange('tipoDocumento', e.target.value)}
                className="border p-3 rounded-lg">
                <option value="DNI">DNI</option>
                <option value="CE">Carnet de Extranjería</option>
              </select>

              <input required
                placeholder="Número Documento"
                maxLength={formData.tipoDocumento === 'DNI' ? 8 : 9}
                value={formData.numeroDocumento}
                onChange={e => handleInputChange('numeroDocumento', e.target.value)}
                className="border p-3 rounded-lg" />

              <input required placeholder="RUC"
                maxLength={11}
                value={formData.ruc}
                onChange={e => handleInputChange('ruc', e.target.value)}
                className="border p-3 rounded-lg" />

              <input required placeholder="Teléfono"
                value={formData.telefono_celular}
                onChange={e => handleInputChange('telefono_celular', e.target.value)}
                className="border p-3 rounded-lg" />

              <input required type="email" placeholder="Correo"
                value={formData.correo_electronico}
                onChange={e => handleInputChange('correo_electronico', e.target.value)}
                className="border p-3 rounded-lg md:col-span-2" />

              <input required placeholder="Domicilio"
                value={formData.domicilio}
                onChange={e => handleInputChange('domicilio', e.target.value)}
                className="border p-3 rounded-lg md:col-span-2" />

              <input required placeholder="Banco"
                value={formData.banco}
                onChange={e => handleInputChange('banco', e.target.value)}
                className="border p-3 rounded-lg" />

              <input required placeholder="CCI"
                maxLength={20}
                value={formData.cci}
                onChange={e => handleInputChange('cci', e.target.value)}
                className="border p-3 rounded-lg" />

            </div>

            <div className="flex gap-4 pt-6 border-t">
              <button type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>

              <button type="button"
                onClick={() => onNavigate('locadores')}
                className="bg-gray-200 px-8 py-3 rounded-lg">
                Cancelar
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
  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-6 py-10">
          <button
                    onClick={() => onNavigate("dashboard")}
                    className="flex items-center gap-2 text-gray-600 mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Dashboard
                  </button>
        <h2 className="text-2xl font-bold mb-6">Gestión de Locadores</h2>

        <table className="w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Documento</th>
              <th className="p-3">RUC</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {locadores.map((locador) => (
              <tr key={locador.id} className="border-t">
                <td className="p-3">{locador.nombres} {locador.apellidos}</td>
                <td className="px-6 py-5 text-slate-600 font-medium uppercase">
                  {locador.tipo_documento}:{locador.numero_documento}
                </td>
                <td className="p-3">{locador.ruc}</td>
                <td className="p-3">{locador.correo_electronico}</td>
                <td className="p-3">
                  <button
                    onClick={() => onNavigate('locador-edit', String(locador.id))}
                    className="text-blue-600">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </main>
    </div>
  );
}