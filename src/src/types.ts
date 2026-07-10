export interface User {
  id: string;
  username: string;
  password: string;
  nombre: string;
  rol: 'Registrador' | 'Administrativo';
}

export interface Locador {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE';
  numeroDocumento: string;
  ruc: string;
  telefono: string;
  correo: string;
  banco: string;
  cci: string;
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
  fechaEntrega: string;
  monto: number;
}

export interface TdR {
  id: string;
  codigo: string;
  equipoSolicitante: string;
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
  ultima_observacion?: string | null; 
  historialValidaciones?: HistorialValidacion[];
}

export interface HistorialValidacion {
  fecha: string;
  usuario: string;
  accion: string;
  observaciones: string;
}