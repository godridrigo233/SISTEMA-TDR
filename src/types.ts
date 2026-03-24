export interface User {
  id: string;
  username: string;
  password: string;
  nombre: string;
  rol: 'Registrador' | 'Administrativo';
}

export interface NivelFormacion {
  id: string;
  centroEstudios: string;
  especialidad: string;
  gradoObtenido: string;
  fechaInicio: string;
  fechaFin: string;
  ciudad: string;
}

export interface ExperienciaLaboral {
  id: string;
  tipoExperiencia: 'Selección' | 'General' | 'Específica';
  experienciaAcumulada: string;
  nombreEntidad: string;
  descripcionTrabajo: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface Locador {
  id: string;
  apellidos: string;
  nombres: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  ruc: string;
  domicilio: string;
  genero: 'Masculino' | 'Femenino' | 'Otro';
  fechaNacimiento: string;
  estadoCivil: 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo' | 'Conviviente';
  nacionalidad: string;
  lugarNacimiento: string;
  telefonoFijo: string;
  telefonoCelular: string;
  correo: string;
  banco: string;
  cci: string;
  autorizacionCCI: 'SI' | 'NO';
  
  // Formación académica
  nivelesFormacion: NivelFormacion[];
  otrosRequisitosFormacion: string;
  otraFormacion: string;
  
  // Experiencia laboral
  experienciasLaborales: ExperienciaLaboral[];
  
  // Profesional
  colegioProfesional: string;
  numeroColegiatura: string;
  habilitacionProfesional: string;
  certificaciones: string;
  
  // Datos adicionales
  cargoActual: string;
  fechaCese: string;
  
  // Documentos
  documentos?: {
    cv?: File | string;
    dni?: File | string;
    rnp?: File | string;
    ruc?: File | string;
  };
}

export interface Actividad {
  id: string;
  descripcion: string;
}

export interface Entregable {
  id: string;
  armada: number;
  descripcion: string;
  fechaInicioArmada: string;
  fechaFinArmada: string;
  monto: number;
}

export interface TdR {
  id: string;
  codigo: string;
  
  // Información del TDR
  equipoSolicitante: string;
  denominacionConvocatoria: string;
  descripcionServicio: string;
  plazoEjecucionDias: number;
  experienciaEspecifica: string;
  totalHonorarios: number;
  
  // Campos heredados (mantener compatibilidad)
  denominacion: string;
  objetivo: string;
  plazoEjecucion: string;
  perfilRequerido: string;
  nivelFormacion: string;
  experienciaRequerida: string;
  lugarPrestacion: string;
  formaPago: string;
  otrasCondiciones: string;
  honorarios: number;
  numeroArmadas: number;
  
  periodo: {
    año: number;
    mes: string;
  };
  
  locadorId: string;
  
  documentosLocador?: {
    cv?: File | string;
    dni?: File | string;
    rnp?: File | string;
    ruc?: File | string;
  };
  
  actividades: Actividad[];
  entregables: Entregable[];
  estado: 'Pendiente' | 'Aprobado' | 'Observado';
  fechaCreacion: string;
  creadoPor: string;
  historialValidaciones?: HistorialValidacion[];
}

export interface HistorialValidacion {
  fecha: string;
  usuario: string;
  accion: string;
  observaciones: string;
}
