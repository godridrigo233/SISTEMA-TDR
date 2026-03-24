# Sistema de Gestión de TdR - Términos de Referencia

Sistema web moderno para la gestión de Términos de Referencia (TdR) de servicios profesionales en entidades públicas.

## 🎯 Características Principales

### Roles de Usuario

**1. Registrador**
- Crear y editar locadores
- Registrar nuevos TdR mediante formularios
- Gestionar documentos PDF de locadores
- Seleccionar periodo (año y mes)

**2. Administrativo**
- Revisar información registrada
- Editar TdR
- Aprobar u observar TdR
- Visualizar historial de validaciones
- Control total del proceso

## 📱 Pantallas del Sistema

### 1. Login
- Autenticación de usuarios
- Validación de credenciales
- Diseño institucional

### 2. Dashboard
- Vista personalizada según rol
- Resumen de TdR por estado (Pendiente, Aprobado, Observado)
- Accesos rápidos a funciones principales
- Tabla con listado de TdR

### 3. Gestión de Locadores
- Lista completa de locadores
- Formulario de registro con:
  - Datos personales (nombres, apellidos, tipo y número de documento)
  - Información de contacto (teléfono, correo)
  - Datos bancarios (banco, CCI)
  - RUC
- Carga de documentos PDF:
  - CV documentado
  - DNI o Carné de Extranjería
  - Registro Nacional de Proveedores (RNP)
  - Consulta RUC (captura de pantalla)

### 4. Registro de TdR (Formulario Multi-paso)

**Paso 1: Información General**
- Código único del TdR
- Equipo solicitante
- Denominación del servicio
- Objetivo
- Nivel de formación requerido
- Honorarios totales
- Número de armadas
- Periodo (año y mes)
- Selección de locador

**Paso 2: Actividades**
- Lista dinámica de actividades
- Agregar/eliminar actividades
- Descripción de cada actividad

**Paso 3: Entregables y Cronograma**
- Configuración por armada
- Descripción de entregables
- Fechas de entrega
- Montos por armada
- Cálculo automático de totales
- Validación de montos

### 5. Validación Administrativa
- Vista exclusiva para rol Administrativo
- Revisión completa del TdR
- Información del locador asignado
- Botones de acción:
  - Aprobar TdR
  - Observar TdR (requiere observaciones)
- Confirmación de acciones
- Registro en historial

### 6. Detalle de TdR
- Información completa del TdR
- Estado actual
- Datos del locador
- Actividades
- Cronograma de entregables
- Historial de validaciones

### 7. Historial de Validaciones
- Fecha y hora de cada acción
- Usuario que realizó la acción
- Tipo de acción (Aprobado/Observado)
- Observaciones registradas

## 🔐 Credenciales de Prueba

**Registrador:**
- Usuario: `registrador`
- Contraseña: `123456`

**Administrativo:**
- Usuario: `admin`
- Contraseña: `123456`

## 🎨 Características de Diseño

- ✅ Diseño institucional moderno
- ✅ Interfaz limpia y profesional
- ✅ Responsive (adaptable a móviles y tablets)
- ✅ Iconografía clara con Lucide React
- ✅ Formularios guiados paso a paso
- ✅ Flujo intuitivo
- ✅ Validaciones en tiempo real
- ✅ Mensajes de confirmación
- ✅ Indicadores visuales de estado

## 🛠️ Tecnologías Utilizadas

- React 18
- TypeScript
- Tailwind CSS v4
- Lucide React (iconos)

## 📊 Estados de TdR

- **Pendiente** (Amarillo): TdR registrado, en espera de validación
- **Aprobado** (Verde): TdR validado y aprobado por Administrativo
- **Observado** (Rojo): TdR con observaciones que requieren corrección

## 🔄 Flujo de Trabajo

1. **Registrador** crea un nuevo locador con todos sus documentos
2. **Registrador** crea un TdR asociado al locador
3. El TdR queda en estado "Pendiente"
4. **Administrativo** revisa el TdR en la pantalla de validación
5. **Administrativo** puede:
   - Aprobar el TdR → Estado "Aprobado"
   - Observar el TdR → Estado "Observado" (con observaciones)
6. Cada acción queda registrada en el historial

## 📝 Notas Importantes

- Sistema completamente funcional con datos de ejemplo
- Prototipo navegable listo para demostración
- Diseñado para facilitar el desarrollo backend
- Estructura modular y escalable
- Validaciones de formularios implementadas
- Gestión de estados centralizada

## 🚀 Próximos Pasos (Backend)

Para implementar este sistema con un backend real, se recomienda:

1. Integrar con base de datos (PostgreSQL, MySQL)
2. Implementar API REST o GraphQL
3. Sistema de autenticación JWT
4. Almacenamiento de archivos (S3, storage local)
5. Notificaciones por correo electrónico
6. Generación de reportes PDF
7. Logs de auditoría
8. Roles y permisos granulares
