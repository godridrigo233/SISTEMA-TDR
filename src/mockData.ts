import type { User, Locador, TdR } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'registrador',
    password: '123456',
    nombre: 'María González',
    rol: 'Registrador'
  },
  {
    id: '2',
    username: 'admin',
    password: '123456',
    nombre: 'Carlos Rodríguez',
    rol: 'Administrativo'
  }
];

export const mockLocadores: Locador[] = [
  {
    id: '1',
    nombres: 'Juan Carlos',
    apellidos: 'Pérez Sánchez',
    tipoDocumento: 'DNI',
    numeroDocumento: '12345678',
    ruc: '10123456789',
    domicilio: 'San Isidro, Lima, Lima',
    genero: 'Masculino',
    fechaNacimiento: '1985-05-15',
    estadoCivil: 'Casado',
    nacionalidad: 'Peruana',
    lugarNacimiento: 'Lima',
    telefonoFijo: '014567890',
    telefonoCelular: '987654321',
    correo: 'juan.perez@email.com',
    banco: 'Banco de la Nación',
    cci: '01234567890123456789',
    autorizacionCCI: 'SI',
    nivelesFormacion: [],
    otrosRequisitosFormacion: '',
    otraFormacion: '',
    experienciasLaborales: [],
    colegioProfesional: '',
    numeroColegiatura: '',
    habilitacionProfesional: '',
    certificaciones: '',
    cargoActual: '',
    fechaCese: '',
    documentos: {
      cv: 'cv-uploaded.pdf',
      dni: 'dni-uploaded.pdf',
      rnp: 'rnp-uploaded.pdf',
      ruc: 'ruc-uploaded.pdf'
    }
  },
  {
    id: '2',
    nombres: 'Ana María',
    apellidos: 'Torres López',
    tipoDocumento: 'DNI',
    numeroDocumento: '87654321',
    ruc: '10876543219',
    domicilio: 'Miraflores, Lima, Lima',
    genero: 'Femenino',
    fechaNacimiento: '1990-08-22',
    estadoCivil: 'Soltero',
    nacionalidad: 'Peruana',
    lugarNacimiento: 'Arequipa',
    telefonoFijo: '015678901',
    telefonoCelular: '912345678',
    correo: 'ana.torres@email.com',
    banco: 'BCP',
    cci: '00298765432109876543',
    autorizacionCCI: 'SI',
    nivelesFormacion: [],
    otrosRequisitosFormacion: '',
    otraFormacion: '',
    experienciasLaborales: [],
    colegioProfesional: '',
    numeroColegiatura: '',
    habilitacionProfesional: '',
    certificaciones: '',
    cargoActual: '',
    fechaCese: '',
    documentos: {
      cv: 'cv-uploaded.pdf',
      dni: 'dni-uploaded.pdf'
    }
  },
  {
    id: '3',
    nombres: 'Roberto',
    apellidos: 'Mendoza Cruz',
    tipoDocumento: 'CE',
    numeroDocumento: '001234567',
    ruc: '10001234567',
    domicilio: 'Surco, Lima, Lima',
    genero: 'Masculino',
    fechaNacimiento: '1982-03-10',
    estadoCivil: 'Divorciado',
    nacionalidad: 'Venezolana',
    lugarNacimiento: 'Caracas',
    telefonoFijo: '',
    telefonoCelular: '923456789',
    correo: 'roberto.mendoza@email.com',
    banco: 'Interbank',
    cci: '00398765432109876543',
    autorizacionCCI: 'SI',
    nivelesFormacion: [],
    otrosRequisitosFormacion: '',
    otraFormacion: '',
    experienciasLaborales: [],
    colegioProfesional: '',
    numeroColegiatura: '',
    habilitacionProfesional: '',
    certificaciones: '',
    cargoActual: '',
    fechaCese: ''
  }
];

export const mockTdRs: TdR[] = [
  {
    id: '1',
    codigo: 'TDR-2026-001',
    equipoSolicitante: 'Dirección de Sistemas',
    denominacionConvocatoria: 'Consultor en Desarrollo de Software',
    descripcionServicio: 'Desarrollar e implementar módulos del sistema de gestión institucional',
    plazoEjecucionDias: 90,
    experienciaEspecifica: 'Mínimo 3 años en proyectos similares',
    totalHonorarios: 5000,
    denominacion: 'Consultor en Desarrollo de Software',
    objetivo: 'Desarrollar e implementar módulos del sistema de gestión institucional',
    plazoEjecucion: '3 meses',
    perfilRequerido: 'Profesional en Ingeniería de Sistemas con experiencia en desarrollo web full-stack',
    nivelFormacion: 'Universitario completo - Ingeniería de Sistemas',
    experienciaRequerida: 'Mínimo 3 años en proyectos similares',
    lugarPrestacion: 'Oficinas de la entidad',
    formaPago: 'Por entregables',
    otrasCondiciones: 'Disponibilidad inmediata, trabajo en horario de oficina',
    honorarios: 5000,
    numeroArmadas: 3,
    periodo: {
      año: 2026,
      mes: 'Marzo'
    },
    locadorId: '1',
    documentosLocador: {
      cv: 'cv_juan_perez.pdf',
      dni: 'dni_12345678.pdf',
      rnp: 'rnp_certificado.pdf',
      ruc: 'ruc_consulta.pdf'
    },
    actividades: [
      { id: 'a1', descripcion: 'Análisis de requerimientos del sistema' },
      { id: 'a2', descripcion: 'Desarrollo de módulos asignados' },
      { id: 'a3', descripcion: 'Implementación y pruebas' },
      { id: 'a4', descripcion: 'Documentación técnica' }
    ],
    entregables: [
      {
        id: 'e1',
        armada: 1,
        descripcion: 'Documento de análisis y diseño',
        fechaInicioArmada: '2026-03-01',
        fechaFinArmada: '2026-03-10',
        monto: 1500
      },
      {
        id: 'e2',
        armada: 2,
        descripcion: 'Módulos desarrollados y probados',
        fechaInicioArmada: '2026-03-11',
        fechaFinArmada: '2026-03-20',
        monto: 2000
      },
      {
        id: 'e3',
        armada: 3,
        descripcion: 'Sistema implementado y documentación',
        fechaInicioArmada: '2026-03-21',
        fechaFinArmada: '2026-03-30',
        monto: 1500
      }
    ],
    estado: 'Pendiente',
    fechaCreacion: '2026-02-05',
    creadoPor: 'María González',
    historialValidaciones: []
  }
];
