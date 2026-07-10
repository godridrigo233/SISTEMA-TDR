import React, { useState, useEffect } from 'react';
import Header from './Header';
import { User, TdR, Actividad, Entregable, NivelFormacion, ExperienciaLaboral } from '../types';
import { ArrowLeft, PlusCircle, Trash2, Upload, FileText, CheckCircle, GraduationCap, Building2, Search, UserCheck, UserPlus, Briefcase } from 'lucide-react';

interface TdrFormPageProps {
  user: User;
  tdrIdToEdit?: number;
  locadores?: any[];
  onNavigate: (page: string) => void;
  onSave: (tdr: TdR) => void;
  onLogout: () => void;
}

export default function TdrFormPage({ user, tdrIdToEdit, locadores, onNavigate, onSave, onLogout }: TdrFormPageProps) {
  const minStep = tdrIdToEdit ? 1 : 0;
  const [currentStep, setCurrentStep] = useState(minStep);
  const [loadingEdit, setLoadingEdit] = useState(!!tdrIdToEdit);

  // ── Tablas maestras desde la BD ──────────────────────────────────
  const [equipos, setEquipos] = useState<{id: number; nombre: string}[]>([]);
  const [periodos, setPeriodos] = useState<{id: number; anio: number; mes: number; nombre_mes: string}[]>([]);

  const [dniSearch, setDniSearch] = useState('');
  const [locadorEncontrado, setLocadorEncontrado] = useState<any>(null);
  const [esNuevoLocador, setEsNuevoLocador] = useState(false);
  const [tdrsLocador, setTdrsLocador] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    codigo: `TDR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    equipoId: undefined,
    descripcionServicio: '',
    plazoEjecucionDias: 0,
    experienciaEspecifica: '',
    totalHonorarios: 0,
    denominacionConvocatoria: '',
    objetivo: '',
    numeroArmadas: 1,
    periodo: { año: new Date().getFullYear(), mes: 'Enero' },
    locadorId: undefined,
    documentosLocador: {},
    actividades: [],
    entregables: [],
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString().split('T')[0],
    creadoPor: user.nombre
  });

  const [locadorData, setLocadorData] = useState<any>({
    apellidos: '', nombres: '', tipoDocumento: '', numeroDocumento: '',
    ruc: '', domicilio: '', genero: '', fechaNacimiento: '',
    estadoCivil: '', nacionalidad: '', lugarNacimiento: '',
    telefonoFijo: '', telefonoCelular: '', correo: '',
    banco: '', cci: '', autorizacionCCI: '',
    nivelesFormacion: [], otrosRequisitosFormacion: '', otraFormacion: '',
    experienciasLaborales: [], colegioProfesional: '', numeroColegiatura: '',
    habilitacionProfesional: '', certificaciones: '', cargoActual: '', fechaCese: ''
  });

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [newActividad, setNewActividad] = useState('');
  const [entregables, setEntregables] = useState<Entregable[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ cv?: File; dni?: File; rnp?: File; ruc?: File; }>({});
  const [existingFiles, setExistingFiles] = useState<any>({});

  const [nivelesFormacion, setNivelesFormacion] = useState<NivelFormacion[]>([]);
  const [newFormacion, setNewFormacion] = useState<Partial<NivelFormacion>>({
    centroEstudios: '', especialidad: '', gradoObtenido: '', fechaInicio: '', fechaFin: '', ciudad: ''
  });

  const [experienciasLaborales, setExperienciasLaborales] = useState<ExperienciaLaboral[]>([]);
  const [newExperiencia, setNewExperiencia] = useState<any>({
    tipoExperiencia: 'General', experienciaAcumulada: '',
    cargo: '', nombreEntidad: '', descripcionTrabajo: '',
    fechaInicio: '', fechaFin: ''
  });

  // ── Cargar tablas maestras desde la BD ───────────────────────────
  useEffect(() => {
    fetch('http://localhost:4000/api/maestros/equipos')
      .then(res => res.json())
      .then(data => setEquipos(data))
      .catch(err => console.error('Error cargando equipos:', err));

    fetch('http://localhost:4000/api/maestros/periodos')
      .then(res => res.json())
      .then(data => setPeriodos(data))
      .catch(err => console.error('Error cargando periodos:', err));
  }, []);

  // ── Cargar TDR para edición ──────────────────────────────────────
  useEffect(() => {
    if (tdrIdToEdit) {
      setLoadingEdit(true);
      fetch(`http://localhost:4000/api/tdrs/${tdrIdToEdit}`)
        .then(res => res.json())
        .then(data => {
          setFormData((prev: any) => ({
            ...prev,
            codigo: data.codigo_unico || prev.codigo,
            equipoId: data.equipo_id,
            denominacionConvocatoria: data.denominacion,
            descripcionServicio: data.objetivo,
            plazoEjecucionDias: data.plazo_ejecucion,
            totalHonorarios: Number(data.honorario_total),
            numeroArmadas: data.total_armadas,
            periodo: { año: data.anio, mes: data.nombre_mes },
            locadorId: data.locador_id
          }));

          if (data.locador) {
            setDniSearch(data.locador.numero_documento);
            setLocadorEncontrado(data.locador);
            setEsNuevoLocador(false);
            setLocadorData({
              id: data.locador.id,
              apellidos: data.locador.apellidos,
              nombres: data.locador.nombres,
              tipoDocumento: data.locador.tipo_documento,
              numeroDocumento: data.locador.numero_documento,
              ruc: data.locador.ruc,
              domicilio: data.locador.domicilio,
              fechaNacimiento: data.locador.fecha_nacimiento?.split('T')[0] || '',
              genero: data.locador.genero,
              estadoCivil: data.locador.estado_civil,
              nacionalidad: data.locador.nacionalidad,
              lugarNacimiento: data.locador.lugar_nacimiento,
              telefonoFijo: data.locador.telefono_fijo || '',
              telefonoCelular: data.locador.telefono_celular || '',
              correo: data.locador.correo_electronico || '',
              banco: data.locador.banco || '',
              cci: data.locador.cci || '',
              autorizacionCCI: data.locador.cci ? 'SI' : 'NO'
            });
          }

          if (data.formacion?.length) {
            setNivelesFormacion(data.formacion.map((f: any) => ({
              id: String(f.id),
              centroEstudios: f.centro_estudios,
              especialidad: f.especialidad,
              gradoObtenido: f.grado_obtenido,
              ciudad: f.ciudad || '',
              fechaInicio: f.fecha_inicio?.split('T')[0] || '',
              fechaFin: f.fecha_fin?.split('T')[0] || ''
            })));
          }

          if (data.experiencia?.length) {
            setExperienciasLaborales(data.experiencia.map((e: any) => ({
              id: String(e.id),
              tipoExperiencia: e.tipo_experiencia || 'General',
              nombreEntidad: e.entidad_empresa,
              cargo: e.cargo || '',
              descripcionTrabajo: e.descripcion_trabajo,
              fechaInicio: e.fecha_inicio?.split('T')[0] || '',
              fechaFin: e.fecha_fin?.split('T')[0] || '',
              experienciaAcumulada: ''
            })));
          }

          if (data.actividades?.length) {
            setActividades(data.actividades.map((a: any) => ({ id: String(a.id), descripcion: a.descripcion })));
          }

          if (data.entregables?.length) {
            setEntregables(data.entregables.map((ent: any) => ({
              id: String(ent.id), armada: ent.nro_armada, descripcion: ent.descripcion,
              fechaInicioArmada: ent.fecha_inicio?.split('T')[0] || '',
              fechaFinArmada: ent.fecha_fin?.split('T')[0] || '',
              monto: Number(ent.monto_pago)
            })));
          }

          if (data.documentos) setExistingFiles(data.documentos);
          setCurrentStep(1);
          setLoadingEdit(false);
        })
        .catch(err => { console.error("Error al cargar TDR:", err); setLoadingEdit(false); });
    }
  }, [tdrIdToEdit]);

  const handleBuscarDNI = async () => {
    if (!dniSearch.trim()) return;
    try {
      const response = await fetch(`http://localhost:4000/api/locadores/dni/${dniSearch}`);
      if (response.status === 404) {
        setLocadorEncontrado(null); setEsNuevoLocador(true); setTdrsLocador([]); return;
      }
      const data = await response.json();
      setLocadorEncontrado(data); setEsNuevoLocador(false);
      setFormData((prev: any) => ({ ...prev, locadorId: Number(data.id) }));
      setLocadorData({
        id: data.id, apellidos: data.apellidos, nombres: data.nombres,
        tipoDocumento: data.tipo_documento, numeroDocumento: data.numero_documento,
        ruc: data.ruc, domicilio: data.domicilio,
        fechaNacimiento: data.fecha_nacimiento?.split("T")[0],
        genero: data.genero, estadoCivil: data.estado_civil,
        nacionalidad: data.nacionalidad, lugarNacimiento: data.lugar_nacimiento,
        telefonoFijo: data.telefono_fijo, telefonoCelular: data.telefono_celular,
        correo: data.correo_electronico, banco: data.banco, cci: data.cci,
        autorizacionCCI: data.autorizacion_cci
      });
      setExperienciasLaborales(
        data.experiencias?.map((exp: any) => ({
          id: String(exp.id), tipoExperiencia: exp.tipo_experiencia,
          nombreEntidad: exp.entidad_empresa, cargo: exp.cargo || '',
          descripcionTrabajo: exp.descripcion_trabajo,
          fechaInicio: exp.fecha_inicio?.split("T")[0],
          fechaFin: exp.fecha_fin?.split("T")[0], experienciaAcumulada: ""
        })) || []
      );
      const tdrResponse = await fetch(`http://localhost:4000/api/tdrs/locador/${data.id}`);
      const tdrData = await tdrResponse.json();
      setTdrsLocador(tdrData);
    } catch (error) {
      console.error(error); alert("Error buscando locador");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData({ ...formData, [parent]: { ...(formData[parent] as any), [child]: value } });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleLocadorChange = (field: string, value: any) => {
    if (field === 'numeroDocumento') { setDniSearch(value); setLocadorEncontrado(null); }
    setLocadorData({ ...locadorData, [field]: value });
  };

  const handleAddActividad = () => {
    if (newActividad.trim()) {
      setActividades([...actividades, { id: Date.now().toString(), descripcion: newActividad }]);
      setNewActividad('');
    }
  };

  const handleRemoveActividad = (id: string) => setActividades(actividades.filter(a => a.id !== id));

  const handleAddFormacion = () => {
    if (newFormacion.centroEstudios && newFormacion.especialidad) {
      setNivelesFormacion([...nivelesFormacion, {
        id: Date.now().toString(),
        centroEstudios: newFormacion.centroEstudios || '',
        especialidad: newFormacion.especialidad || '',
        gradoObtenido: newFormacion.gradoObtenido || '',
        fechaInicio: newFormacion.fechaInicio || '',
        fechaFin: newFormacion.fechaFin || '',
        ciudad: newFormacion.ciudad || ''
      }]);
      setNewFormacion({ centroEstudios: '', especialidad: '', gradoObtenido: '', fechaInicio: '', fechaFin: '', ciudad: '' });
    }
  };

  const handleRemoveFormacion = (id: string) => setNivelesFormacion(nivelesFormacion.filter(f => f.id !== id));

  const handleAddExperiencia = () => {
    if (newExperiencia.nombreEntidad && newExperiencia.descripcionTrabajo) {
      setExperienciasLaborales([...experienciasLaborales, {
        id: Date.now().toString(),
        tipoExperiencia: newExperiencia.tipoExperiencia || 'General',
        experienciaAcumulada: newExperiencia.experienciaAcumulada || '',
        cargo: newExperiencia.cargo || '',
        nombreEntidad: newExperiencia.nombreEntidad || '',
        descripcionTrabajo: newExperiencia.descripcionTrabajo || '',
        fechaInicio: newExperiencia.fechaInicio || '',
        fechaFin: newExperiencia.fechaFin || ''
      }]);
      setNewExperiencia({ tipoExperiencia: 'General', experienciaAcumulada: '', cargo: '', nombreEntidad: '', descripcionTrabajo: '', fechaInicio: '', fechaFin: '' });
    }
  };

  const handleRemoveExperiencia = (id: string) => setExperienciasLaborales(experienciasLaborales.filter(e => e.id !== id));

  const handleArmadasChange = (num: number) => {
    handleInputChange('numeroArmadas', num);
    const newEntregables: Entregable[] = [];
    for (let i = 1; i <= num; i++) {
      const existing = entregables.find(e => e.armada === i);
      newEntregables.push(existing || { id: `${Date.now()}-${i}`, armada: i, descripcion: '', fechaInicioArmada: '', fechaFinArmada: '', monto: 0 });
    }
    setEntregables(newEntregables);
  };

  const handleEntregableChange = (armada: number, field: string, value: any) => {
    setEntregables(entregables.map(e => e.armada === armada ? { ...e, [field]: value } : e));
  };

  const handleFileUpload = (type: 'cv' | 'dni' | 'rnp' | 'ruc', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFiles({ ...uploadedFiles, [type]: file });
      setFormData({ ...formData, documentosLocador: { ...formData.documentosLocador, [type]: file.name } });
    }
  };

  const totalEntregables = entregables.reduce((sum, e) => sum + e.monto, 0);

  const handleSubmit = async () => {
    const camposFaltantes = [];
    if (!formData.codigo) camposFaltantes.push("Código TDR");
    if (!formData.equipoId) camposFaltantes.push("Equipo solicitante");
    if (!formData.denominacionConvocatoria) camposFaltantes.push("Denominación");
    if (!formData.descripcionServicio) camposFaltantes.push("Descripción del servicio");
    if (!formData.plazoEjecucionDias) camposFaltantes.push("Plazo de ejecución");
    if (!formData.totalHonorarios) camposFaltantes.push("Total de honorarios");
    if (camposFaltantes.length > 0) { alert("⚠️ Debe completar:\n\n" + camposFaltantes.join("\n")); return; }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("formacion", JSON.stringify(nivelesFormacion));
      formDataToSend.append("experiencias", JSON.stringify(experienciasLaborales));
      formDataToSend.append("certificaciones", JSON.stringify({
        colegioProfesional: locadorData.colegioProfesional,
        numeroColegiatura: locadorData.numeroColegiatura,
        habilitacionProfesional: locadorData.habilitacionProfesional,
        certificaciones: locadorData.certificaciones
      }));
      formDataToSend.append("codigo", formData.codigo || "");
      formDataToSend.append("locadorId", String(formData.locadorId || ""));
      formDataToSend.append("equipoId", String(formData.equipoId || ""));
      formDataToSend.append("denominacionConvocatoria", formData.denominacionConvocatoria || "");
      formDataToSend.append("descripcionServicio", formData.descripcionServicio || "");
      formDataToSend.append("plazoEjecucionDias", String(formData.plazoEjecucionDias || 0));
      formDataToSend.append("totalHonorarios", String(formData.totalHonorarios || 0));
      formDataToSend.append("numeroArmadas", String(formData.numeroArmadas || 1));
      formDataToSend.append("esNuevoLocador", String(esNuevoLocador));
      formDataToSend.append("locadorData", JSON.stringify(locadorData));
      formDataToSend.append("usuarioCreadorId", String(user.id));
      formDataToSend.append("periodo", JSON.stringify(formData.periodo));
      formDataToSend.append("actividades", JSON.stringify(actividades));
      formDataToSend.append("entregables", JSON.stringify(entregables));

      if (uploadedFiles.cv) formDataToSend.append("cvFile", uploadedFiles.cv);
      if (uploadedFiles.dni) formDataToSend.append("dniFile", uploadedFiles.dni);
      if (uploadedFiles.rnp) formDataToSend.append("rnpFile", uploadedFiles.rnp);
      if (uploadedFiles.ruc) formDataToSend.append("rucFile", uploadedFiles.ruc);

      const isEditing = !!tdrIdToEdit;
      const url = isEditing ? `http://localhost:4000/api/tdrs/${tdrIdToEdit}` : "http://localhost:4000/api/tdrs";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, { method, body: formDataToSend });
      if (!response.ok) throw new Error("Error al guardar TDR");

      alert(`TDR ${isEditing ? 'actualizado' : 'creado'} correctamente ✅`);
      onNavigate("dashboard");
    } catch (error) {
      console.error(error); alert("Error guardando TDR");
    }
  };

  const steps = [
    { num: 0, title: 'Buscar Locador' },
    { num: 1, title: 'Información del TDR' },
    { num: 2, title: 'Actividades y Entregables' },
    { num: 3, title: 'Datos Personales del Locador' },
    { num: 4, title: 'Formación Académica' },
    { num: 5, title: 'Experiencia y Certificaciones' },
    { num: 6, title: 'Documentos' }
  ];

  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos del TdR...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /><span>Volver al Dashboard</span>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {tdrIdToEdit ? 'Edición de TdR Existente' : 'Registro de Nuevo TdR'}
          </h2>
          <p className="text-gray-600 mb-8">
            {tdrIdToEdit ? 'Modifique los campos necesarios y guarde los cambios.' : 'Complete todos los campos requeridos en cada paso'}
          </p>

          {/* Progress Steps */}
          {currentStep > 0 && (
            <div className="mb-10 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[900px]">
                {steps.slice(1).map((step, index) => (
                  <React.Fragment key={step.num}>
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep >= step.num ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-600'}`}>
                        {step.num}
                      </div>
                      <span className={`text-xs mt-2 text-center max-w-[100px] ${currentStep >= step.num ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.slice(1).length - 1 && (
                      <div className={`flex-1 h-1 mx-2 transition-all ${currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* ═══ PASO 0: BÚSQUEDA DNI ═══ */}
          {currentStep === 0 && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Búsqueda de Locador</h3>
                <p className="text-gray-600">Ingrese el DNI para buscar o registrar un locador</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">Número de DNI *</label>
                <div className="flex gap-3">
                  <input type="text" value={dniSearch}
                    onChange={(e) => setDniSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscarDNI()}
                    placeholder="Ingrese el DNI (8 dígitos)" maxLength={8}
                    className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button type="button" onClick={handleBuscarDNI}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition shadow-md">
                    <Search className="w-5 h-5" /><span>Buscar</span>
                  </button>
                </div>
              </div>

              {locadorEncontrado && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-3 rounded-full"><UserCheck className="w-8 h-8 text-green-600" /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-green-900 text-xl mb-3">✅ Locador Encontrado</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div><span className="text-gray-600">Nombre:</span><p className="font-semibold">{locadorEncontrado.nombres} {locadorEncontrado.apellidos}</p></div>
                        <div><span className="text-gray-600">DNI:</span><p className="font-semibold">{locadorEncontrado.numero_documento}</p></div>
                        <div><span className="text-gray-600">RUC:</span><p className="font-semibold">{locadorEncontrado.ruc}</p></div>
                        <div><span className="text-gray-600">Correo:</span><p className="font-semibold">{locadorEncontrado.correo_electronico}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {esNuevoLocador && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-100 p-3 rounded-full"><UserPlus className="w-8 h-8 text-yellow-600" /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-yellow-900 text-xl mb-3">⚠️ Locador No Encontrado</h4>
                      <p className="text-sm text-yellow-800 bg-yellow-100 p-3 rounded-lg">
                        No existe un locador con DNI <strong>{dniSearch}</strong>. Se creará un nuevo registro.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(locadorEncontrado || esNuevoLocador) && (
                <div className="flex justify-center pt-4">
                  <button type="button" onClick={() => setCurrentStep(1)}
                    className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition shadow-md">
                    Continuar con el Registro →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══ PASO 1: INFORMACIÓN DEL TDR ═══ */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">📋 INFORMACIÓN GENERAL DEL TDR</h3>
                <p className="text-sm text-gray-600">Complete los datos del Término de Referencia</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código TdR *</label>
                  <input type="text" value={formData.codigo}
                    onChange={(e) => handleInputChange('codigo', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" readOnly />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Equipo Solicitante *</label>
                  {/* ← Cargado desde BD */}
                  <select value={formData.equipoId || ""}
                    onChange={(e) => handleInputChange('equipoId', Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" required>
                    <option value="">Seleccione un equipo</option>
                    {equipos.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Denominación de la Convocatoria *</label>
                  <input type="text" value={formData.denominacionConvocatoria}
                    onChange={(e) => handleInputChange('denominacionConvocatoria', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: Consultor para el desarrollo de sistema de gestión" required />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Servicio *</label>
                  <textarea value={formData.descripcionServicio}
                    onChange={(e) => handleInputChange('descripcionServicio', e.target.value)}
                    rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Describa detalladamente el servicio..." required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plazo de Ejecución (días) *</label>
                  <input type="number" value={formData.plazoEjecucionDias}
                    onChange={(e) => handleInputChange('plazoEjecucionDias', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    min="1" placeholder="90" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total de Honorarios *</label>
                  <input type="number" value={formData.totalHonorarios}
                    onChange={(e) => handleInputChange('totalHonorarios', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    min="0" step="0.01" placeholder="15000.00" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">N° de Armadas (Pagos) *</label>
                  <input type="number" value={formData.numeroArmadas}
                    onChange={(e) => handleArmadasChange(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    min="1" max="12" required />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experiencia Específica *</label>
                  <textarea value={formData.experienciaEspecifica}
                    onChange={(e) => handleInputChange('experienciaEspecifica', e.target.value)}
                    rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Describa la experiencia específica requerida..." required />
                </div>

                {/* ← Periodo desde BD */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periodo *</label>
                  <select
                    value={`${formData.periodo?.año}-${formData.periodo?.mes}`}
                    onChange={(e) => {
                      const [año, mes] = e.target.value.split('-');
                      handleInputChange('periodo.año', parseInt(año));
                      handleInputChange('periodo.mes', mes);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required>
                    <option value="">Seleccione un periodo</option>
                    {periodos.map(p => (
                      <option key={p.id} value={`${p.anio}-${p.nombre_mes}`}>
                        {p.nombre_mes} {p.anio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PASO 2: ACTIVIDADES Y ENTREGABLES ═══ */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <div className="border-l-4 border-green-600 pl-4 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">✅ Actividades a Realizar</h3>
                  <p className="text-sm text-gray-600">Liste todas las actividades que el locador debe realizar</p>
                </div>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={newActividad}
                    onChange={(e) => setNewActividad(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddActividad()}
                    placeholder="Descripción de la actividad..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button type="button" onClick={handleAddActividad}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition">
                    <PlusCircle className="w-5 h-5" /><span>Agregar</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {actividades.map((act, index) => (
                    <div key={act.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-semibold text-blue-600 mt-1 min-w-[30px]">{index + 1}.</span>
                      <p className="flex-1 text-gray-900">{act.descripcion}</p>
                      <button type="button" onClick={() => handleRemoveActividad(act.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {actividades.length === 0 && (
                    <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p>No hay actividades agregadas</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="border-l-4 border-orange-600 pl-4 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">📦 Entregables y Cronograma de Pagos</h3>
                  <p className="text-sm text-gray-600">Configure los entregables para {formData.numeroArmadas} armada(s)</p>
                </div>
                <div className="space-y-4">
                  {entregables.map((ent) => (
                    <div key={ent.id} className="border-2 border-gray-200 rounded-lg p-6 bg-gradient-to-r from-gray-50 to-white">
                      <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                        <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">{ent.armada}</span>
                        Armada {ent.armada}
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                          <input type="text" value={ent.descripcion}
                            onChange={(e) => handleEntregableChange(ent.armada, 'descripcion', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej: Informe de avance" required />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio *</label>
                          <input type="date" value={ent.fechaInicioArmada}
                            onChange={(e) => handleEntregableChange(ent.armada, 'fechaInicioArmada', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin *</label>
                          <input type="date" value={ent.fechaFinArmada}
                            onChange={(e) => handleEntregableChange(ent.armada, 'fechaFinArmada', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monto (S/) *</label>
                          <input type="number" value={ent.monto}
                            onChange={(e) => handleEntregableChange(ent.armada, 'monto', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            min="0" step="0.01" required />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Entregables</p>
                      <p className="text-2xl font-bold text-blue-600">S/ {totalEntregables.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Honorarios</p>
                      <p className="text-2xl font-bold text-gray-900">S/ {formData.totalHonorarios?.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Diferencia</p>
                      <p className={`text-2xl font-bold ${Math.abs(totalEntregables - (formData.totalHonorarios || 0)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                        S/ {Math.abs(totalEntregables - (formData.totalHonorarios || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {Math.abs(totalEntregables - (formData.totalHonorarios || 0)) > 0.01 && (
                    <p className="text-sm text-red-600 mt-4 text-center font-medium">⚠ Los montos no coinciden.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ PASO 3: DATOS PERSONALES ═══ */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="border-l-4 border-indigo-600 pl-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">👤 DATOS PERSONALES DEL LOCADOR</h3>
                {locadorEncontrado && <p className="text-sm text-blue-600 mt-2">ℹ️ Puede editar todos los campos excepto el DNI</p>}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
                  <input type="text" value={locadorData.apellidos}
                    onChange={(e) => handleLocadorChange('apellidos', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombres *</label>
                  <input type="text" value={locadorData.nombres}
                    onChange={(e) => handleLocadorChange('nombres', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Documento *</label>
                  <select value={locadorData.tipoDocumento}
                    onChange={(e) => handleLocadorChange('tipoDocumento', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    disabled={!!locadorEncontrado} required>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carnet de Extranjería (CE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Documento *</label>
                  <input type="text" value={locadorData.numeroDocumento}
                    onChange={(e) => handleLocadorChange('numeroDocumento', e.target.value)}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${locadorEncontrado ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    disabled={!!locadorEncontrado} maxLength={8} required />
                  {locadorEncontrado && <p className="text-xs text-gray-500 mt-1">🔒 El DNI no puede modificarse</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RUC *</label>
                  <input type="text" value={locadorData.ruc}
                    onChange={(e) => handleLocadorChange('ruc', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    maxLength={11} required />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domicilio *</label>
                  <input type="text" value={locadorData.domicilio}
                    onChange={(e) => handleLocadorChange('domicilio', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: Miraflores, Lima, Lima" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Género *</label>
                  <select value={locadorData.genero} onChange={(e) => handleLocadorChange('genero', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" required>
                    <option value="">Seleccione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
                  <input type="date" value={locadorData.fechaNacimiento}
                    onChange={(e) => handleLocadorChange('fechaNacimiento', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado Civil *</label>
                  <select value={locadorData.estadoCivil} onChange={(e) => handleLocadorChange('estadoCivil', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" required>
                    <option value="">Seleccione...</option>
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                    <option value="Conviviente">Conviviente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nacionalidad *</label>
                  <input type="text" value={locadorData.nacionalidad}
                    onChange={(e) => handleLocadorChange('nacionalidad', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lugar de Nacimiento *</label>
                  <input type="text" value={locadorData.lugarNacimiento}
                    onChange={(e) => handleLocadorChange('lugarNacimiento', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Fijo</label>
                  <input type="tel" value={locadorData.telefonoFijo}
                    onChange={(e) => handleLocadorChange('telefonoFijo', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="01234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Celular *</label>
                  <input type="tel" value={locadorData.telefonoCelular}
                    onChange={(e) => handleLocadorChange('telefonoCelular', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="987654321" required />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico *</label>
                  <input type="email" value={locadorData.correo}
                    onChange={(e) => handleLocadorChange('correo', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>

                <div className="lg:col-span-3 border-t-2 border-gray-200 pt-6 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />Datos Bancarios
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Banco *</label>
                      <select value={locadorData.banco} onChange={(e) => handleLocadorChange('banco', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" required>
                        <option value="">Seleccione banco</option>
                        <option value="Banco de la Nación">Banco de la Nación</option>
                        <option value="BCP">BCP</option>
                        <option value="BBVA">BBVA</option>
                        <option value="Interbank">Interbank</option>
                        <option value="Scotiabank">Scotiabank</option>
                        <option value="Banbif">Banbif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CCI (20 dígitos) *</label>
                      <input type="text" value={locadorData.cci}
                        onChange={(e) => handleLocadorChange('cci', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        maxLength={20} placeholder="00000000000000000000" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Autorización CCI *</label>
                      <div className="flex gap-6 mt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="autorizacionCCI" value="SI"
                            checked={locadorData.autorizacionCCI === 'SI'}
                            onChange={(e) => handleLocadorChange('autorizacionCCI', e.target.value)}
                            className="w-4 h-4 text-blue-600" />
                          <span>Sí</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="autorizacionCCI" value="NO"
                            checked={locadorData.autorizacionCCI === 'NO'}
                            onChange={(e) => handleLocadorChange('autorizacionCCI', e.target.value)}
                            className="w-4 h-4 text-blue-600" />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PASO 4: FORMACIÓN ACADÉMICA ═══ */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" />NIVEL DE FORMACIÓN ACADÉMICA
                </h3>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Agregar Nivel de Formación</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Centro de Estudios *</label>
                    <input type="text" value={newFormacion.centroEstudios}
                      onChange={(e) => setNewFormacion({...newFormacion, centroEstudios: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Universidad o instituto" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                    <input type="text" value={newFormacion.ciudad}
                      onChange={(e) => setNewFormacion({...newFormacion, ciudad: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Lima" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad *</label>
                    <input type="text" value={newFormacion.especialidad}
                      onChange={(e) => setNewFormacion({...newFormacion, especialidad: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Carrera o especialidad" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grado Obtenido *</label>
                    <input type="text" value={newFormacion.gradoObtenido}
                      onChange={(e) => setNewFormacion({...newFormacion, gradoObtenido: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Bachiller/Título/Maestría" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                    <input type="date" value={newFormacion.fechaInicio}
                      onChange={(e) => setNewFormacion({...newFormacion, fechaInicio: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                    <input type="date" value={newFormacion.fechaFin}
                      onChange={(e) => setNewFormacion({...newFormacion, fechaFin: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <button type="button" onClick={handleAddFormacion}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition">
                  <PlusCircle className="w-5 h-5" /><span>Agregar Nivel de Formación</span>
                </button>
              </div>

              <div className="space-y-3">
                {nivelesFormacion.map((f, index) => (
                  <div key={f.id} className="border-2 border-gray-200 rounded-lg p-5 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-bold text-blue-600 text-lg">{index + 1}. {f.centroEstudios}</h5>
                      <button type="button" onClick={() => handleRemoveFormacion(f.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-600">Especialidad:</span><p className="font-medium">{f.especialidad}</p></div>
                      <div><span className="text-gray-600">Grado:</span><p className="font-medium">{f.gradoObtenido}</p></div>
                      <div><span className="text-gray-600">Ciudad:</span><p className="font-medium">{f.ciudad}</p></div>
                      <div><span className="text-gray-600">Periodo:</span><p className="font-medium">{f.fechaInicio} - {f.fechaFin}</p></div>
                    </div>
                  </div>
                ))}
                {nivelesFormacion.length === 0 && (
                  <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay formación académica registrada</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ PASO 5: EXPERIENCIA Y CERTIFICACIONES ═══ */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div className="border-l-4 border-orange-600 pl-4 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Briefcase className="w-6 h-6" />EXPERIENCIA LABORAL
                </h3>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Agregar Experiencia Laboral</h4>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                    <select value={newExperiencia.tipoExperiencia}
                      onChange={(e) => setNewExperiencia({...newExperiencia, tipoExperiencia: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="Selección">Selección</option>
                      <option value="General">General</option>
                      <option value="Específica">Específica</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experiencia Acumulada</label>
                    <input type="text" value={newExperiencia.experienciaAcumulada}
                      onChange={(e) => setNewExperiencia({...newExperiencia, experienciaAcumulada: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ej: 5 años en desarrollo de software" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Entidad *</label>
                    <input type="text" value={newExperiencia.nombreEntidad}
                      onChange={(e) => setNewExperiencia({...newExperiencia, nombreEntidad: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Empresa o institución" />
                  </div>
                  {/* ← NUEVO campo cargo */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cargo *</label>
                    <input type="text" value={newExperiencia.cargo}
                      onChange={(e) => setNewExperiencia({...newExperiencia, cargo: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ej: Desarrollador de Software" />
                  </div>
                  <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Trabajo *</label>
                    <input type="text" value={newExperiencia.descripcionTrabajo}
                      onChange={(e) => setNewExperiencia({...newExperiencia, descripcionTrabajo: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Breve descripción del cargo o funciones" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                    <input type="date" value={newExperiencia.fechaInicio}
                      onChange={(e) => setNewExperiencia({...newExperiencia, fechaInicio: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                    <input type="date" value={newExperiencia.fechaFin}
                      onChange={(e) => setNewExperiencia({...newExperiencia, fechaFin: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <button type="button" onClick={handleAddExperiencia}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition">
                  <PlusCircle className="w-5 h-5" /><span>Agregar Experiencia</span>
                </button>
              </div>

              <div className="space-y-3 mb-8">
                {experienciasLaborales.map((exp, index) => (
                  <div key={exp.id} className="border-2 border-gray-200 rounded-lg p-5 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <h5 className="font-bold text-orange-600 text-lg">{index + 1}. {exp.nombreEntidad}</h5>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">{exp.tipoExperiencia}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveExperiencia(exp.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-600">Cargo:</span><p className="font-medium">{exp.cargo || 'No especificado'}</p></div>
                      <div><span className="text-gray-600">Descripción:</span><p className="font-medium">{exp.descripcionTrabajo}</p></div>
                      <div><span className="text-gray-600">Experiencia:</span><p className="font-medium">{exp.experienciaAcumulada || '-'}</p></div>
                      <div><span className="text-gray-600">Periodo:</span><p className="font-medium">{exp.fechaInicio} - {exp.fechaFin}</p></div>
                    </div>
                  </div>
                ))}
                {experienciasLaborales.length === 0 && (
                  <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay experiencia laboral registrada</p>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-200 pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Certificaciones Profesionales</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colegio Profesional</label>
                    <input type="text" value={locadorData.colegioProfesional}
                      onChange={(e) => handleLocadorChange('colegioProfesional', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Colegiatura</label>
                    <input type="text" value={locadorData.numeroColegiatura}
                      onChange={(e) => handleLocadorChange('numeroColegiatura', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Habilitación Profesional</label>
                    <input type="text" value={locadorData.habilitacionProfesional}
                      onChange={(e) => handleLocadorChange('habilitacionProfesional', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Certificaciones Adicionales</label>
                    <input type="text" value={locadorData.certificaciones}
                      onChange={(e) => handleLocadorChange('certificaciones', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PASO 6: DOCUMENTOS ═══ */}
          {currentStep === 6 && (
            <div className="space-y-8">
              <div className="border-l-4 border-indigo-600 pl-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">📎 DOCUMENTOS REQUERIDOS</h3>
                <p className="text-sm text-gray-600">Adjunte todos los documentos en formato PDF</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  { key: 'cv' as const, label: 'CV Documentado *', color: 'blue', accept: '.pdf' },
                  { key: 'dni' as const, label: 'DNI / CE *', color: 'green', accept: '.pdf' },
                  { key: 'rnp' as const, label: 'Registro Nacional de Proveedores (RNP) *', color: 'purple', accept: '.pdf' },
                  { key: 'ruc' as const, label: 'Consulta RUC *', color: 'orange', accept: '.pdf,image/*' },
                ].map(({ key, label, color, accept }) => (
                  <div key={key} className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition">
                    <div className="flex items-start gap-4">
                      <div className={`bg-${color}-100 p-3 rounded-lg`}>
                        <FileText className={`w-6 h-6 text-${color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{label}</h5>
                        {existingFiles[key] && (
                          <p className="text-green-600 text-xs mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Archivo actual: {existingFiles[key].split('/').pop()}
                          </p>
                        )}
                        <input type="file" accept={accept} onChange={(e) => handleFileUpload(key, e)} className="w-full text-sm" />
                        {uploadedFiles[key] && (
                          <div className="mt-2 flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{uploadedFiles[key]!.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
                <h4 className="font-bold text-lg text-gray-900 mb-4">📊 Resumen del Registro</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-600">Código TDR:</p><p className="font-semibold">{formData.codigo}</p></div>
                  <div><p className="text-gray-600">Denominación:</p><p className="font-semibold">{formData.denominacionConvocatoria}</p></div>
                  <div><p className="text-gray-600">Locador:</p><p className="font-semibold">{locadorData.nombres} {locadorData.apellidos}</p></div>
                  <div><p className="text-gray-600">DNI:</p><p className="font-semibold">{locadorData.numeroDocumento}</p></div>
                  <div><p className="text-gray-600">Total Honorarios:</p><p className="font-semibold">S/ {formData.totalHonorarios?.toFixed(2)}</p></div>
                  <div><p className="text-gray-600">Actividades:</p><p className="font-semibold">{actividades.length} registradas</p></div>
                </div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="flex justify-between mt-10 pt-6 border-t-2 border-gray-200">
            <button type="button"
              onClick={() => setCurrentStep(Math.max(minStep, currentStep - 1))}
              disabled={currentStep === 0 || currentStep === minStep}
              className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
              ← Anterior
            </button>

            {currentStep === 0 ? null : currentStep < 6 ? (
              <button type="button" onClick={() => setCurrentStep(currentStep + 1)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-md">
                Siguiente →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-md flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {tdrIdToEdit ? 'Guardar Cambios' : 'Guardar TdR Completo'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}