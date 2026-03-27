import React, { useState, useEffect } from 'react';
import Header from './Header';
import { User } from '../types';
import { 
  ArrowLeft, 
  Save, 
  Settings, 
  Info,
  Variable
} from 'lucide-react';

interface TdrTemplatePageProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// 🔥 LA SOLUCIÓN: Este componente debe estar AFUERA de la función principal
const AutoTextArea = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="mb-6 w-full">
    <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide border-b-2 border-gray-200 pb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y"
      rows={value ? Math.max(3, value.split('\n').length) : 3}
    />
  </div>
);

export default function TdrTemplatePage({ user, onNavigate, onLogout }: TdrTemplatePageProps) {
  const [template, setTemplate] = useState({
    titulo: '',
    objeto: '',
    finalidad: '',
    perfil: '',
    actividades: '',
    entregables: '',
    plazo: '',
    formaPago: '',
    penalidades: '',
    conformidad: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlantilla = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/plantilla');
        if (res.ok) {
          const data = await res.json();
          setTemplate(data);
        } else {
          console.error("No se encontró la plantilla en la base de datos");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlantilla();
  }, []);

  const handleTemplateChange = (field: string, value: string) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:4000/api/plantilla', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (!res.ok) throw new Error('Error al guardar en el servidor');

      alert("Plantilla del TdR actualizada correctamente ✅\nTodos los nuevos TdR utilizarán este formato.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar la plantilla. Verifique su conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  if (user.rol !== 'ADMINISTRATIVO') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-red-600">Acceso Restringido</h2>
          <p className="mt-2 text-gray-600">Solo los administradores pueden editar el formato del TdR.</p>
          <button onClick={() => onNavigate('dashboard')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1efe9] text-[#334155] font-sans pb-12">
      <Header user={user} onLogout={onLogout} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* BARRA SUPERIOR (Título y Botón) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 transition-colors text-sm font-bold rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600 hidden sm:block" />
              Configuración Formato TdR
            </h1>
          </div>
          
          <button
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Guardando...' : 'Guardar Formato'}
          </button>
        </div>

        {/* ESTRUCTURA PRINCIPAL */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          
          {/* PANEL IZQUIERDO: VARIABLES */}
          <div className="w-full lg:w-1/3 xl:w-4/12 space-y-6 lg:sticky lg:top-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-orange-900">¿Cómo funciona?</h3>
                  <p className="text-sm text-orange-800 mt-1 leading-relaxed">
                    Edita el texto a la derecha. Para datos que varían por cada contrato, copia y pega estas <strong>variables</strong>.
                  </p>
                </div>
              </div>
              
              <div className="p-5 max-h-[600px] overflow-y-auto custom-scrollbar">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Variable className="w-4 h-4" /> Variables Disponibles
                </h4>
                
                <div className="space-y-4">
                  {[
                    { tag: '[ DENOMINACION_SERVICIO ]', desc: 'Nombre del cargo o servicio.' },
                    { tag: '[ EQUIPO_SOLICITANTE ]', desc: 'Área que solicita (Ej. Planificación).' },
                    { tag: '[ MES_ANIO ]', desc: 'Periodo de ejecución (Ej. Enero 2026).' },
                    { tag: '[ NIVEL_FORMACION ]', desc: 'Formación exigida en el perfil.' },
                    { tag: '[ EXPERIENCIA_ESPECIFICA ]', desc: 'Años y tipo de experiencia.' },
                    { tag: '[ LISTA_ACTIVIDADES ]', desc: 'Se reemplaza por las actividades numeradas.' },
                    { tag: '[ TABLA_ENTREGABLES ]', desc: 'Se reemplaza por el cuadro de armadas y fechas.' },
                    { tag: '[ PLAZO_DIAS ]', desc: 'Días calendario del contrato.' },
                    { tag: '[ MONTO_TOTAL ]', desc: 'Honorario total en Soles (S/).' },
                    { tag: '[ NUMERO_ARMADAS ]', desc: 'Cantidad de pagos.' }
                  ].map((v, i) => (
                    <div key={i} className="group p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors">
                      <code className="text-xs font-bold text-orange-700 bg-orange-100/50 px-2 py-1 rounded block w-full mb-1.5 break-all">
                        {v.tag}
                      </code>
                      <p className="text-xs text-gray-600">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PANEL DERECHO: FORMULARIO */}
          <div className="w-full lg:w-2/3 xl:w-8/12 bg-white shadow-md rounded-xl border border-gray-200 p-6 sm:p-10 min-h-[800px]">
            
            <div className="text-center mb-10 pb-6 border-b-2 border-gray-900 w-full">
              <input 
                type="text" 
                value={template.titulo || ''}
                onChange={(e) => handleTemplateChange('titulo', e.target.value)}
                className="w-full text-center text-xl font-black text-gray-900 uppercase focus:bg-gray-50 focus:ring-2 focus:ring-blue-200 outline-none p-2 rounded transition-colors"
              />
            </div>

            <div className="space-y-2 w-full">
              <AutoTextArea 
                label="1. Objeto de la Contratación" 
                value={template.objeto || ''} 
                onChange={(val) => handleTemplateChange('objeto', val)} 
              />
              <AutoTextArea 
                label="2. Finalidad Pública" 
                value={template.finalidad || ''} 
                onChange={(val) => handleTemplateChange('finalidad', val)} 
              />
              <AutoTextArea 
                label="3. Perfil del Locador" 
                value={template.perfil || ''} 
                onChange={(val) => handleTemplateChange('perfil', val)} 
              />
              
              <div className="mb-6 w-full">
                <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide border-b-2 border-gray-200 pb-1">
                  4. Actividades a Desarrollar
                </label>
                <p className="text-sm text-gray-600 mb-2 italic">Texto introductorio de actividades:</p>
                <textarea
                  value={template.actividades || ''}
                  onChange={(e) => handleTemplateChange('actividades', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
                  rows={4}
                />
              </div>

              <div className="mb-6 w-full">
                <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide border-b-2 border-gray-200 pb-1">
                  5. Entregables y Forma de Pago
                </label>
                <textarea
                  value={template.entregables || ''}
                  onChange={(e) => handleTemplateChange('entregables', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y mb-3"
                  rows={3}
                />
                <AutoTextArea 
                  label="Monto y Cronograma" 
                  value={template.formaPago || ''} 
                  onChange={(val) => handleTemplateChange('formaPago', val)} 
                />
              </div>

              <AutoTextArea 
                label="6. Plazo de Ejecución" 
                value={template.plazo || ''} 
                onChange={(val) => handleTemplateChange('plazo', val)} 
              />
              <AutoTextArea 
                label="7. Conformidad del Servicio" 
                value={template.conformidad || ''} 
                onChange={(val) => handleTemplateChange('conformidad', val)} 
              />
              <AutoTextArea 
                label="8. Penalidades" 
                value={template.penalidades || ''} 
                onChange={(val) => handleTemplateChange('penalidades', val)} 
              />
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}