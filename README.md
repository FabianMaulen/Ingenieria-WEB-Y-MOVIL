# 📱 Proyecto Full Stack: Baúl Eterno (Ionic React + Node.js/Express)

Este proyecto incluye un **frontend en Ionic + React** y un **backend en Node.js con Express**, conectados mediante una API REST y respaldados por una base de datos PostgreSQL.

> **Asignatura:** Ingeniería Web y Móvil  
> **Entrega:** EP2 — Integración frontend, backend y autenticación  
> **Proyecto:** Baúl Eterno - Plataforma de Legado Personal  

---

## 1. Descripción y alcance

"Baúl Eterno" es una plataforma que permite a los usuarios (Titulares) resguardar información crítica sobre sus seguros y redactar mensajes póstumos confidenciales. Estos datos permanecen sellados y solo son accesibles por sus contactos de confianza (Albaceas) mediante un proceso formal de apertura por contingencia (fallecimiento).

### Funcionalidades implementadas y conectadas

| Función | Ubicación Backend | Ubicación Frontend | Estado |
|---|---|---|---|
| Registro de usuarios | `POST /api/auth/register` | `/register` (`Register.tsx`) | Implementado |
| Inicio de sesión y JWT | `POST /api/auth/login` | `/login` (`Login.tsx`) | Implementado |
| Protección por rutas y roles | Middleware JWT | `AppRoutes.tsx` / `RutaProtegida.tsx` | Implementado |
| Check-in (Vigencia) | `POST /api/checkin` | `/dashboard` (`Dashboard.tsx`) | Implementado |
| Gestión de Albaceas | `GET` / `POST /api/albaceas` | `/albaceas` (`Albaceas.tsx`) | Implementado |
| Mensajes Póstumos | `GET` / `POST /api/mensajes` | `/mensajes` (`Mensajes.tsx`) | Implementado |
| Solicitud Apertura | `POST /api/solicitudes` | `/apertura` (`Apertura.tsx`) | Implementado (FormData) |
| Alertas / Cancelación | `GET` / `DELETE /api/solicitudes...` | `/dashboard` (`Dashboard.tsx`) | Implementado |
| Cambio de Contraseña | Pendiente endpoint backend | `/configuracion` (`Configuracion.tsx`) | Vista maquetada (Conexión pendiente) |

---

## 2. Integrantes, prototipo y trazabilidad

**Integrantes:**
- Fabián Alejandro Maulén González
- Ivan Moises Ferreira
- Dania Ahuelican Calvario
- Mariana Belén Llime Muñoz

**Figma:** [Prototipo interactivo en Figma](https://www.figma.com/proto/s6G2EQV48I6itrofIrnfEL/Baul-Eterno?node-id=0-1&t=US5Hg77S9L3U4a1T-1)

**Relación con EP1:** Se han implementado las interfaces y flujos que responden a los requerimientos RF-01 a RF-07 documentados en el informe inicial (Gestión patrimonial, albaceas, mensajería sellada y contingencia).

---

## 3. Tecnologías y alineación de dependencias

| Capa | Tecnología utilizada en Baúl Eterno |
|---|---|
| Frontend | Ionic 9 + React 19 + React Router DOM (v6.30.6) + `@ionic/react-router` (^9.0.10) |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Autenticación | JSON Web Tokens (`jsonwebtoken`) + `bcrypt` |
| Comunicación | `axios` para HTTP requests (multipart y JSON) |
| Configuración CORS | Paquete `cors` en Express |

> **Nota de compatibilidad en Frontend:** Se utiliza `@ionic/react-router` en su versión 9 junto a `react-router-dom` v6 para habilitar el uso nativo del hook `useNavigate` en todo el proyecto frontend sin conflictos de compilación en Vite.

---

## 4. Arquitectura de carpetas

```text
PROYECTOBAUL/ (Frontend)
├── .env                  # URL del backend (VITE_API_URL=http://localhost:3000/api)
├── package.json
└── src/
    ├── components/       # AppMenu, HeaderBar, VaultStatusCard, etc.
    ├── pages/            # Login, Register, Dashboard, Albaceas, Mensajes, Apertura, etc.
    ├── routes/           # AppRoutes.tsx y RutaProtegida.tsx
    ├── services/         # api.ts (Instancia Axios), auth.service.ts, albaceas.service.ts...
    └── utils/            # rut.ts (Normalización de datos)

backend/ (Servidor)
├── .env                  # Credenciales BD y JWT_SECRET
├── index.js              # Archivo principal y configuración CORS
├── db.js                 # Conexión a PostgreSQL
├── package.json
├── database/             # Scripts SQL de base de datos
│   ├── baul_eterno.sql   # Creación de tablas y estructura DDL
│   └── init.sql          # Inyección de datos de prueba (Poblamiento inicial)
├── routes/               # auth.routes.js, albaceas.routes.js, etc.
└── middlewares/          # authMiddleware.js
```

---

## 5. Preparación y ejecución local

### 5.1 Base de datos (PostgreSQL)

1. Crear una base de datos PostgreSQL local nombrada `baul_eterno`.
2. Ejecutar el script `backend/database/baul_eterno.sql` para crear las tablas y restricciones de la base de datos.
3. Ejecutar el script `backend/database/init.sql` para realizar la inyección inicial de datos de prueba.
4. Configurar las credenciales en el archivo `backend/.env`:
```env
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=baul_eterno
JWT_SECRET=tu_secreto_seguro
```

### 5.2 Iniciar backend

Desde la carpeta `backend/`:
```bash
npm install
npm run dev
```
El servidor quedará expuesto en `http://localhost:3000`.

### 5.3 Iniciar frontend

1. Crear el archivo `.env` en la raíz de `PROYECTOBAUL/`:
```env
VITE_API_URL=http://localhost:3000/api
```

2. Ejecutar la instalación limpia y levantar el servidor dev:
```bash
npm install --legacy-peer-deps
npx vite --force
npm run dev
```
*Nota: Se recomienda `--legacy-peer-deps` al instalar dependencias para prevenir advertencias de peer dependencies entre las herramientas de empaquetado de Ionic y React 19.*

---

## 6. Documentación de la API (Endpoints principales)

**URL base:** `http://localhost:3000/api`

| Método | Ruta | Objetivo | Token |
|---|---|---|---|
| POST | `/auth/register` | Registrar usuario (Titular/Albacea) | No |
| POST | `/auth/login` | Iniciar sesión y obtener JWT | No |
| GET  | `/albaceas` | Listar albaceas del titular | Sí |
| POST | `/solicitudes` | Crear solicitud de apertura (Multipart) | Sí (Albacea) |
| GET  | `/solicitudes/alertas`| Ver solicitudes pendientes de cancelación | Sí (Titular) |

---

## 7. Seguridad y JWT

| Control EP2 | En este proyecto |
|---|---|
| JWT con expiración | Implementado en backend. |
| Rutas protegidas | Frontend protegido con `RutaProtegida.tsx`. Backend con `authMiddleware`. |
| Roles diferenciados | TITULAR accede a Dashboard/Gestión. ALBACEA accede a Guía/Apertura. |
| bcrypt | Cifrado de contraseñas implementado en registro y login. |
| Secretos de entorno | `VITE_API_URL`, `DB_PASSWORD`, y `JWT_SECRET` en archivos `.env`. |
| Minimización | El JWT solo contiene el `id_usuario` y `rol`. |

---

## 8. Observaciones y Alcance de la Entrega (EP2)

Para transparencia de la evaluación de esta entrega intermedia, se registran los siguientes puntos de alcance y trabajo pendiente planificado para la entrega final:

1. **Gestión de Roles y Alternancia (Panel Albacea):**
   - En esta entrega, la navegación responde al rol estático asignado al usuario (`TITULAR` o `ALBACEA`). La funcionalidad para que un mismo usuario registrado pueda actuar simultáneamente como Titular de su propia bóveda y responder invitaciones como Albacea de otros usuarios se encuentra maquetada y será consolidada en la entrega final.

2. **Registro previo para designar Albaceas:**
   - En la versión actual de la API, la designación de un albacea requiere que su RUT coincida con un usuario registrado en el sistema. El flujo de invitación externa (enviar correo a un albacea no registrado para asignación automática posterior) queda agendado para la versión final.

3. **Formulario de Cambio de Contraseña (`Configuracion.tsx`):**
   - La interfaz de usuario para actualización de claves se encuentra disponible en la pestaña de Ajustes, pero la interacción requiere la integración del endpoint `/api/auth/change-password` en el servidor backend (programado para la entrega final).

---

## 9. Matriz de cumplimiento EP2

- [x] **EP 2.1 Servidor:** Node.js/Express operativo y configurado.
- [x] **EP 2.2 Base relacional:** PostgreSQL integrado.
- [x] **EP 2.3 API REST:** Endpoints POST, GET, DELETE implementados.
- [x] **EP 2.4 JWT y roles:** Rutas y vistas aisladas para Titulares y Albaceas.
- [x] **EP 2.5 Seguridad:** Datos sensibles excluidos del frontend, tokens manejados correctamente.
- [x] **EP 2.6 Ionic React + backend:** Páginas conectadas usando Axios, States y useEffects.

---
*Desarrollado para la asignatura de Ingeniería Web y Móvil.*