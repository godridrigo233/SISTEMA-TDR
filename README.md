
# SISTEMA TDR

<div align="center">
  <img src="https://img.shields.io/badge/Status-En%20desarrollo-blue" alt="Status" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1" alt="Database" />
</div>

<p align="center">
  Plataforma web para gestionar Términos de Referencia (TdR), locadores, contratantes y procesos de validación de forma centralizada y ordenada.
</p>

## 📌 Descripción general

SISTEMA TDR es una plataforma full-stack orientada a digitalizar y centralizar la gestión de solicitudes y expedientes relacionados con la contratación de servicios. Permite registrar información de los TdR, asociar locadores, controlar estados de aprobación y mantener un flujo de revisión más ordenado para los distintos roles del sistema.

## 🎯 ¿Qué problema resuelve?

Muchas veces la gestión de TdR se realiza de forma dispersa, con información repartida en archivos, correos o procesos manuales. Este sistema busca:

- centralizar la información de los TdR,
- facilitar el registro y seguimiento de solicitudes,
- mejorar la trazabilidad de validaciones y observaciones,
- y apoyar la organización entre contratantes, administradores y personal operativo.

## ✨ Características principales

- Registro y gestión de TdR.
- Asociación de locadores a cada solicitud.
- Gestión de contratantes y perfiles de usuario.
- Validación y observación de TdR por parte de roles administrativos.
- Dashboard con indicadores por estado.
- Subida y manejo de documentos asociados al proceso.
- Auditoría básica de acciones realizadas en el sistema.
- Notificaciones por correo para cambios de estado.

## 🧩 Arquitectura del sistema

El proyecto está dividido en dos partes principales:

- Frontend: React + Vite + TypeScript.
- Backend: Node.js + Express.
- Base de datos: PostgreSQL.
- Almacenamiento de documentos: Supabase Storage.

## 📁 Estructura del proyecto

```text
SISTEMA-TDR/
├── src/                  # Frontend React
├── backend-tdr/         # Backend Node.js/Express
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── config/
│       └── migrations/
└── README.md
```

## 🚀 Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- Node.js
- npm
- PostgreSQL
- Acceso a Supabase (para documentos)

## ⚙️ Instalación

### 1) Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd SISTEMA-TDR
```

### 2) Instalar dependencias del frontend

```bash
npm install
```

### 3) Instalar dependencias del backend

```bash
cd backend-tdr
npm install
```

## ▶️ Ejecución

### Frontend

```bash
npm run dev
```

### Backend

```bash
cd backend-tdr
npm run dev
```

El backend suele correr en el puerto 4000 y el frontend en el puerto 5173.

## 🔐 Variables de entorno

Crea un archivo `.env` en la carpeta `backend-tdr` con las siguientes variables mínimas:

```env
DATABASE_URL=postgres://usuario:password@host:5432/base_de_datos
JWT_SECRET=tu_secreto_jwt
CORS_ORIGIN=http://localhost:5173

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role

SMTP_HOST=smtp.tu-servidor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email
SMTP_PASS=tu-password
SMTP_FROM=tu-email
SMTP_FROM_NAME=Sistema TdR
```

## 👤 Roles del sistema

El sistema contempla diferentes tipos de usuarios:

- Administrador: gestiona usuarios, perfiles y procesos generales.
- Administrativo: revisa y valida TdR.
- Contratante: crea y gestiona solicitudes asociadas a sus procesos.

## 🛠️ Flujo de uso básico

1. Iniciar sesión con un usuario válido.
2. Acceder al dashboard para revisar el estado general de los TdR.
3. Crear o editar un TdR desde la interfaz.
4. Asociar un locador y adjuntar documentos si aplica.
5. Enviar el expediente para revisión o validación.
6. Consultar observaciones y actualizar la información según corresponda.

## 🧪 Tecnologías utilizadas

- React
- Vite
- TypeScript
- React Router
- Tailwind CSS
- Node.js
- Express
- PostgreSQL
- Supabase Storage
- JWT
- Nodemailer

## 🤝 Contribución

Las contribuciones son bienvenidas. Si deseas colaborar:

1. Haz un fork del proyecto.
2. Crea una rama para tu cambio.
3. Realiza tus modificaciones.
4. Envía un pull request con una descripción clara.

## � Próximos pasos sugeridos

- Agregar capturas de pantalla reales del sistema.
- Incluir una demo en vivo o un entorno de pruebas.
- Mejorar la documentación de módulos y flujos internos.
- Añadir pruebas automatizadas para frontend y backend.

## �📄 Nota

Este proyecto sigue en desarrollo y puede requerir ajustes según el entorno de despliegue, configuración de base de datos y credenciales externas.
