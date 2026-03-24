import type { User, Locador, TdR } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'registrador',
    password: 'registrador123',
    nombre: 'María García',
    rol: 'Registrador'
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123',
    nombre: 'Carlos Rodríguez',
    rol: 'Administrativo'
  }
];

export const mockLocadores: Locador[] = [
  {
    id: '1',
    nombres: 'Juan Carlos',
    apellidos: 'Pérez López',
    tipoDocumento: 'DNI',
    numeroDocumento: '12345678',
    ruc: '10123456789',
    telefono: '987654321',
    correo: 'juan.perez@email.com',
    banco: 'Banco de la Nación',
    cci: '01234567890123456789'
  }
];

export const mockTdRs: TdR[] = [
  {
    id: '1',
    codigo: 'TDR-2026-001',
    equipoSolicitante: 'Equipo de Tecnología',
    denominacion: 'Desarrollo de Sistema Web',
    objetivo: 'Implementar sistema de gestión documental',
    plazoEjecucion: '3 meses',
    perfilRequerido: 'Profesional en Ingeniería de Sistemas con experiencia en desarrollo web full-stack',
    nivelFormacion: 'Titulado',
    experienciaRequerida: 'Mínimo 3 años en proyectos similares',
    lugarPrestacion: 'Oficinas de la entidad',
    formaPago: 'Por entregables',
    otrasCondiciones: 'Disponibilidad inmediata, trabajo en horario de oficina',
    honorarios: 5000,
    numeroArmadas: 3,
    periodo: {
      año: 2026,
      mes: 'Febrero'
    },
    locadorId: '1',
    documentosLocador: {
      cv: 'cv_juan_perez.pdf',
      dni: 'dni_12345678.pdf',
      rnp: 'rnp_certificado.pdf',
      ruc: 'ruc_consulta.pdf'
    },
    actividades: [
      { id: '1', descripcion: 'Análisis de requerimientos' },
      { id: '2', descripcion: 'Diseño de arquitectura' },
      { id: '3', descripcion: 'Desarrollo e implementación' }
    ],
    entregables: [
      {
        id: '1',
        armada: 1,
        descripcion: 'Documento de análisis',
        fechaEntrega: '2026-02-28',
        monto: 1500
      },
      {
        id: '2',
        armada: 2,
        descripcion: 'Prototipo funcional',
        fechaEntrega: '2026-03-31',
        monto: 2000
      },
      {
        id: '3',
        armada: 3,
        descripcion: 'Sistema completo',
        fechaEntrega: '2026-04-30',
        monto: 1500
      }
    ],
    estado: 'Pendiente',
    fechaCreacion: '2026-02-10',
    creadoPor: 'María García',
    historialValidaciones: []
  }
];