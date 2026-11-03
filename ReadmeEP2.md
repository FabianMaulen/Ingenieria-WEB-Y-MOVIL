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
| Protección por roles | Middleware JWT | `AppRoutes.tsx` / `RutaProtegida.tsx` | Implementado |
| Check-in (Vigencia) | `POST /api/checkin` | `/dashboard` (`Dashboard.tsx`) | Implementado |
| Gestión de Albaceas | `GET` / `POST /api/albaceas`| `/albaceas` (`Albaceas.tsx`) | Implementado |
| Mensajes Póstumos | `GET` / `POST /api/mensajes` | `/mensajes` (`Mensajes.tsx`) | Implementado |
| Solicitud Apertura | `POST /api/solicitudes` | `/apertura` (`Apertura.tsx`) | Implementado (FormData) |
| Alertas / Cancelación| `GET` / `DELETE /api/solicitudes...` | `/dashboard` (`Dashboard.tsx`) | Implementado |

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

## 3. Tecnologías

| Capa | Tecnología utilizada en Baúl Eterno |
|---|---|
| Frontend | Ionic 8 + React 18 + React Router DOM (v6) |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Autenticación | JSON Web Tokens (`jsonwebtoken`) |
| Comunicación | `axios` para HTTP requests (multipart y JSON) |
| Configuración CORS | Paquete `cors` en Express |

---

## 4. Arquitectura y carpetas reales

```text
PROYECTOBAUL/ (Frontend)
├── .env                  # URL del backend (VITE_API_URL=http://localhost:3000/api)
├── package.json
└── src/
    ├── components/       # AppMenu, HeaderBar, VaultStatusCard
    ├── pages/            # Login, Register, Dashboard, Albaceas, Mensajes, Apertura, etc.
    ├── routes/           # AppRoutes.tsx y RutaProtegida.tsx
    ├── services/         # api.ts (Instancia Axios), auth.service.ts, albaceas.service.ts...
    └── utils/            # rut.ts (Normalización de datos)

backend/ (Servidor)
├── .env                  # Credenciales BD y JWT_SECRET
├── index.js              # Archivo principal y configuración CORS
├── db.js                 # Conexión a PostgreSQL
├── package.json
├── routes/               # auth.routes.js, albaceas.routes.js, etc.
└── middlewares/          # authMiddleware.js
```

---

## 5. Preparación y ejecución local

### 5.1 Base de datos (PostgreSQL)

El proyecto requiere PostgreSQL. Crear una base de datos local y ejecutar el script SQL de creación de tablas incluido en el repositorio.
Configurar las credenciales en el archivo `backend/.env`:
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

Crear el archivo `.env` en la raíz de `PROYECTOBAUL/`:
```env
VITE_API_URL=http://localhost:3000/api
```

Desde la carpeta `PROYECTOBAUL/`:
```bash
npm install --legacy-peer-deps
ionic serve
```
*Nota: Se usa `--legacy-peer-deps` para resolver la compatibilidad estricta entre `@ionic/react-router` y `react-router-dom` v6.*

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
| Roles diferenciados | TITULAR accede al Dashboard/Gestión. ALBACEA accede a Guía/Apertura. |
| bcrypt | Cifrado de contraseñas implementado en registro y login. |
| Secretos de entorno | `VITE_API_URL`, `DB_PASSWORD`, y `JWT_SECRET` en archivos `.env`. |
| Minimización | El JWT solo contiene el `id_usuario` y `rol`. |

---

## 8. Integración frontend–backend

El consumo de la API se realiza mediante `axios` centralizado en `src/services/api.ts`.
* **Intercepción de Tokens:** El archivo `api.ts` inyecta automáticamente el token almacenado en `localStorage` en los headers de cada petición.
* **Manejo de Errores:** Se capturan los códigos de error HTTP del backend y se transforman en mensajes amigables (ej: "Credenciales inválidas") mostrados mediante los componentes de Ionic.

---

## 9. Pruebas funcionales y evidencia EP2

*Se adjunta colección de Postman en el repositorio para validar los endpoints.*

| ID | Petición / escenario | HTTP esperado |
|---|---|---|
| P01 | Registrar usuario TITULAR válido | 201 |
| P02 | Login de usuario con credenciales correctas | 200 |
| P03 | Acceso denegado a dashboard sin token | 401 |
| P04 | Aislamiento: Albacea intenta acceder a `/dashboard` | Redirección a `/guia` |
| P05 | Solicitud de apertura con subida de archivo (Multipart) | 201 |
| P06 | Cancelar solicitud (Titular detiene el proceso) | 200 |

---

## 10. Matriz de cumplimiento EP2

- [x] **EP 2.1 Servidor:** Node.js/Express operativo y configurado.
- [x] **EP 2.2 Base relacional:** PostgreSQL integrado.
- [x] **EP 2.3 API REST:** Endpoints POST, GET, DELETE implementados.
- [x] **EP 2.4 JWT y roles:** Rutas y vistas aisladas para Titulares y Albaceas.
- [x] **EP 2.5 Seguridad:** Datos sensibles excluidos del frontend, tokens manejados correctamente.
- [x] **EP 2.6 Ionic React + backend:** Páginas conectadas usando Axios, States y useEffects.

---
*Desarrollado para la asignatura de Ingeniería Web y Móvil.*