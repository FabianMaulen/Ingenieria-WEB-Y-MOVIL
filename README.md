# 📱 Proyecto Full Stack: Baúl Eterno (Ionic React + Node.js/Express + PostgreSQL)

Plataforma Full Stack de resguardo de legado personal, pólizas de seguro, activos digitales y mensajes póstumos cifrados, desarrollada con **Ionic React** en el frontend, **Node.js + Express** en el backend y **PostgreSQL** como motor relacional.

> **Asignatura:** Ingeniería Web y Móvil  
> **Proyecto:** Baúl Eterno — Plataforma de Legado Personal  
> **Modelo funcional:** Cuenta Dual Unificada (Titular + Albacea)

---

## 1. Descripción y alcance

**Baúl Eterno** permite a cualquier usuario registrado administrar su propia bóveda patrimonial (**Modo Titular**: pólizas de seguro, inventario de activos digitales/patrimoniales, mensajes póstumos cifrados con AES-256 y directorio de albaceas) y, simultáneamente, actuar como contacto de confianza (**Panel Albacea**) para terceros que lo designen mediante su RUT.

### Funcionalidades implementadas y conectadas

| Función | Ubicación Backend | Ubicación Frontend | Estado |
|---|---|---|---|
| Registro unificado + vinculación automática por RUT | `POST /api/auth/register` | `/register` (`Register.tsx`) | Implementado |
| Inicio de sesión (correo o RUT) + JWT | `POST /api/auth/login` | `/login` (`Login.tsx`) | Implementado |
| Perfil y contexto dual | `GET /api/auth/perfil` / `/api/perfil` | `AppMenu.tsx` / `Configuracion.tsx` | Implementado |
| Cambio de contraseña verificado con bcrypt | `PUT /api/auth/change-password` | `/configuracion` (`Configuracion.tsx`) | Implementado |
| Protección de rutas e interceptor 401 | `middlewares/auth.js` | `AppRoutes.tsx`, `RutaProtegida.tsx`, `api.ts` | Implementado |
| Check-in de vigencia y anulación de alertas | `GET` / `POST /api/checkin` | `/dashboard` (`Dashboard.tsx`) | Implementado |
| CRUD de Pólizas (paginado) | `/api/polizas` | `/polizas` (`Polizas.tsx`) | Implementado |
| CRUD de Inventario Patrimonial (paginado) | `/api/inventario` | `/inventario` (`Inventario.tsx`) | Implementado |
| Gestión de Albaceas (registrados e invitados) | `GET` / `POST` / `DELETE /api/albaceas` | `/albaceas` (`Albaceas.tsx`) | Implementado |
| Mensajes Póstumos sellados (AES-256-CBC) | `GET` / `POST` / `PUT` / `DELETE /api/mensajes` | `/mensajes` (`Mensajes.tsx`) | Implementado |
| Designaciones recibidas (Aceptar / Rechazar) | `GET /api/guia/designaciones`, `PUT /api/guia/designaciones/:id/responder` | `/guia` (`Guia.tsx`) | Implementado |
| Solicitud de Apertura por Contingencia (Multipart + SHA-256) | `POST /api/solicitudes`, `GET /api/solicitudes/mias` | `/apertura` (`Apertura.tsx`) | Implementado |
| Alertas y cancelación en periodo de gracia | `GET /api/solicitudes/alertas`, `PUT /api/solicitudes/:id/cancelar` | `/dashboard` (`Dashboard.tsx`) | Implementado |
| Guía de cobro de pólizas liberadas y checklist | `GET /api/guia`, `PUT /api/guia/polizas/:id/tramitada` | `/guia` (`Guia.tsx`) | Implementado |

---

## 2. Integrantes, prototipo y trazabilidad

**Integrantes:**
- Fabián Alejandro Maulén González
- Ivan Moises Ferreira
- Dania Ahuelican Calvario
- Mariana Belén Llime Muñoz

**Figma:** [Prototipo interactivo en Figma](https://www.figma.com/proto/s6G2EQV48I6itrofIrnfEL/Baul-Eterno?node-id=0-1&t=US5Hg77S9L3U4a1T-1)

**Relación con requerimientos:** Cubre RF-01 a RF-07 (gestión de pólizas, inventario, directorio de albaceas con invitaciones externas, mensajería sellada AES-256, check-in, apertura por contingencia con periodo de gracia y guía de cobro) y RNF-01 a RNF-05 (seguridad, integridad SHA-256, cifrado AES-256, auditoría).

---

## 3. Tecnologías y dependencias

| Capa | Tecnología |
|---|---|
| Frontend | Ionic 9 (`@ionic/react` ^9.0.4) + React 19 + React Router DOM (`^6.30.6`) + `@ionic/react-router` (`^9.0.10`) + TypeScript |
| Backend | Node.js + Express 5 + Arquitectura MVC (Rutas + Controladores + Middlewares + Utils) |
| Base de datos | PostgreSQL (`pg`) |
| Seguridad | `helmet`, `cors` (lista blanca por entorno), `express-rate-limit`, `jsonwebtoken`, `bcrypt`, `crypto` (AES-256-CBC y SHA-256) |
| Comunicación HTTP | `axios` (timeout 10s, interceptores de JWT y 401, soporte `multipart/form-data`) |

> **Nota de compatibilidad en Frontend:** Se mantiene `@ionic/react-router` v9 junto con `react-router-dom` v6 para utilizar `useNavigate` y `<Routes>` de forma nativa con Vite y TypeScript.

---

## 4. Arquitectura de carpetas

```text
Ingenieria-WEB-Y-MOVIL/
├── .gitignore
├── README.md
├── backend/                          # Servidor Node.js / Express
│   ├── .env                          # Variables locales (ignorado por Git)
│   ├── .env.example                  # Plantilla de variables de entorno
│   ├── .gitignore
│   ├── db.js                         # Pool de conexión PostgreSQL
│   ├── index.js                      # Entrada Express, Helmet, CORS, rutas y manejo global de errores JSON
│   ├── package.json                  # Scripts start/dev apuntando a index.js
│   ├── controllers/                  # Lógica de negocio y consultas SQL (MVC)
│   │   ├── albaceas.controller.js
│   │   ├── auth.controller.js
│   │   ├── checkin.controller.js
│   │   ├── guia.controller.js
│   │   ├── inventario.controller.js
│   │   ├── mensajes.controller.js
│   │   ├── polizas.controller.js
│   │   └── solicitudes.controller.js
│   ├── database/
│   │   ├── baul_eterno.sql           # DDL completo (tablas, FKs, CHECKs e índices)
│   │   └── init.sql                  # Poblamiento semilla sincronizado + reset de secuencias
│   ├── middlewares/
│   │   └── auth.js                   # verificarToken (JWT) y soloRol
│   ├── routes/                       # Definición limpia de endpoints y middlewares
│   │   ├── albaceas.routes.js
│   │   ├── auth.routes.js
│   │   ├── checkin.routes.js
│   │   ├── guia.routes.js
│   │   ├── inventario.routes.js
│   │   ├── mensajes.routes.js
│   │   ├── polizas.routes.js
│   │   └── solicitudes.routes.js
│   └── utils/
│       ├── aseguradoras.js           # Directorio de contactos de aseguradoras en Chile
│       ├── auditoria.js              # Registro en tabla AUDITORIA (RNF-05)
│       ├── cifrado.js                # Cifrado/descifrado AES-256-CBC
│       ├── respuesta.js              # Formato estándar { mensaje, data, meta? }
│       ├── solicitudes.js            # Aprobación automática al vencer plazo de gracia
│       └── validadores.js            # Validación de RUT chileno (Módulo 11), email, IDs y paginación
│
└── frontend/                         # Aplicación Frontend Ionic React
    ├── .env                          # URL de la API local (ignorado por Git)
    ├── .env.example                  # Plantilla de entorno frontend
    ├── .gitignore
    ├── package.json
    └── src/
        ├── components/               # AppMenu (con selector Titular/Albacea), HeaderBar, VaultStatusCard
        ├── pages/                    # Login, Register, Dashboard, Polizas, Inventario, Albaceas, Mensajes, Guia, Apertura, Configuracion
        ├── routes/                   # AppRoutes.tsx y RutaProtegida.tsx
        ├── services/                 # api.ts + servicios por módulo (incluye inventario.service.ts)
        └── utils/                    # rut.ts (normalización/validación RUT Módulo 11 y email)
```

---

## 5. Modelo de Base de Datos (PostgreSQL)

El esquema relacional definido en [`backend/database/baul_eterno.sql`](backend/database/baul_eterno.sql) consta de **7 tablas**:

### Entidades y cardinalidades

1. **`USUARIO` (1) → (N) `POLIZA`**: Un usuario titular puede registrar múltiples pólizas de seguro (`ON DELETE CASCADE`).
2. **`USUARIO` (1) → (N) `INVENTARIO`**: Un usuario titular puede registrar múltiples activos digitales o patrimoniales con instrucciones póstumas (`ON DELETE CASCADE`).
3. **`USUARIO` (1) → (N) `MENSAJE_POSTUMO`**: Un usuario redacta múltiples cartas póstumas cifradas con AES-256 asociadas al `rut_destinatario` de un albacea (`ON DELETE CASCADE`).
4. **`USUARIO` (N) ↔ (M) `USUARIO` vía `DIRECTORIO_ALBACEAS`**:
   - `id_titular` (`NOT NULL`, FK a `USUARIO`, `ON DELETE CASCADE`): dueño de la bóveda.
   - `id_usuario_invitado` (`NULL`, FK a `USUARIO`, `ON DELETE SET NULL`): opcional para permitir designar personas **aún no registradas** (`estado_validacion = 'INVITADO'`). Se vincula automáticamente por `rut_albacea` al registrarse.
   - Restricción `UNIQUE (id_titular, rut_albacea)` que impide duplicar un mismo contacto en el directorio de un titular.
5. **`USUARIO` (1) → (N) `SOLICITUD_APERTURA` ← (1) `DIRECTORIO_ALBACEAS`**: Registra solicitudes de apertura iniciadas por un albacea validado (`id_albacea`) sobre la bóveda de un titular (`id_usuario`), guardando el archivo y su huella `SHA-256`.
6. **`USUARIO` (1) → (N) `AUDITORIA`**: Bitácora inmutable de acciones críticas (`ON DELETE SET NULL`).

### Restricciones de integridad (`CHECK`)

| Tabla | Restricción | Regla aplicada |
|---|---|---|
| `USUARIO` | `chk_usuario_rut` | `rut ~ '^[0-9]{7,8}-[0-9K]$'` |
| `USUARIO` | `chk_usuario_rol` | `rol IN ('TITULAR', 'ALBACEA', 'ADMIN')` |
| `DIRECTORIO_ALBACEAS` | `chk_albacea_rut` | `rut_albacea ~ '^[0-9]{7,8}-[0-9K]$'` |
| `DIRECTORIO_ALBACEAS` | `chk_estado_validacion` | `estado_validacion IN ('PENDIENTE', 'VALIDADO', 'RECHAZADO', 'INVITADO')` |
| `POLIZA` | `chk_poliza_monto` | `monto_referencial >= 0` |
| `INVENTARIO` | `chk_inventario_categoria` | `categoria IN ('General', 'Financiero', 'Familiar Directo', 'Público', 'Digital', 'Físico')` |
| `MENSAJE_POSTUMO` | `chk_mensaje_rut` | `rut_destinatario ~ '^[0-9]{7,8}-[0-9K]$'` |
| `SOLICITUD_APERTURA` | `chk_estado_solicitud` | `estado_solicitud IN ('PENDIENTE', 'CANCELADA', 'APROBADA')` |

---

## 6. Preparación y ejecución local

### 6.1 Base de datos PostgreSQL

1. Crear la base de datos local `baul_eterno`.
2. Ejecutar [`backend/database/baul_eterno.sql`](backend/database/baul_eterno.sql) para crear tablas, restricciones e índices.
3. Ejecutar [`backend/database/init.sql`](backend/database/init.sql) para cargar los usuarios y datos de prueba (contraseña de prueba: `123123123`).

### 6.2 Variables de entorno

#### Backend (`backend/.env`)
Copia `backend/.env.example` a `backend/.env` y define tus valores locales:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto HTTP del servidor Express | `3000` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `tu_password_segura` |
| `DB_NAME` | Nombre de la base de datos | `baul_eterno` |
| `JWT_SECRET` | Secreto HMAC para firmar tokens JWT | 64 caracteres hex aleatorios |
| `JWT_EXPIRES_IN` | Duración del token JWT | `2h` |
| `AES_SECRET_KEY` | Clave de cifrado AES-256-CBC para mensajes póstumos (**exactamente 64 caracteres hex = 32 bytes**) | `openssl rand -hex 32` |
| `PLAZO_GRACIA_HORAS` | Horas del periodo de gracia antes de aprobar apertura automáticamente | `72` |
| `FRONTEND_URL` | Origen(es) permitidos por CORS (separados por coma) | `http://localhost:5173` |

#### Frontend (`frontend/.env`)
Copia `frontend/.env.example` a `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 6.3 Iniciar backend

```bash
cd backend
npm install
npm run dev   # o npm start
```

### 6.4 Iniciar frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 7. Documentación de la API REST

**URL base:** `http://localhost:3000/api`

Todas las respuestas de la API siguen el **contrato JSON unificado**:
```json
{
  "mensaje": "Descripción del resultado",
  "data": {},
  "meta": { "total": 10, "limit": 20, "offset": 0 }
}
```
*(El campo `meta` se incluye en listados paginados o resúmenes).*

### Tabla completa de endpoints

| Módulo | Método | Ruta | Objetivo | Auth JWT |
|---|---|---|---|---|
| Sistema | `GET` | `/api/test` | Verificar disponibilidad de Express | No |
| Sistema | `GET` | `/api/health` | Verificar conexión con PostgreSQL | No |
| Auth | `POST` | `/api/auth/register` | Registrar usuario y vincular invitaciones por RUT | No |
| Auth | `POST` | `/api/auth/login` | Iniciar sesión (correo o RUT) con rate-limit | No |
| Auth | `GET` | `/api/auth/perfil` | Obtener perfil y resumen de designaciones | Sí |
| Auth | `PUT` | `/api/auth/change-password` | Cambiar contraseña verificando la actual | Sí |
| Pólizas | `GET` | `/api/polizas?limit=&offset=` | Listar pólizas propias (paginado) | Sí |
| Pólizas | `GET` | `/api/polizas/:id` | Obtener una póliza propia por ID | Sí |
| Pólizas | `POST` | `/api/polizas` | Registrar nueva póliza | Sí |
| Pólizas | `PUT` | `/api/polizas/:id` | Actualizar póliza existente | Sí |
| Pólizas | `DELETE` | `/api/polizas/:id` | Eliminar póliza | Sí |
| Inventario | `GET` | `/api/inventario?limit=&offset=` | Listar activos digitales/patrimoniales (paginado) | Sí |
| Inventario | `GET` | `/api/inventario/:id` | Obtener un activo por ID | Sí |
| Inventario | `POST` | `/api/inventario` | Crear activo en inventario | Sí |
| Inventario | `PUT` | `/api/inventario/:id` | Actualizar activo en inventario | Sí |
| Inventario | `DELETE` | `/api/inventario/:id` | Eliminar activo del inventario | Sí |
| Albaceas | `GET` | `/api/albaceas?limit=&offset=` | Listar directorio de albaceas del titular (paginado) | Sí |
| Albaceas | `POST` | `/api/albaceas` | Designar albacea (registrado o invitado por RUT) | Sí |
| Albaceas | `DELETE` | `/api/albaceas/:id` | Eliminar albacea del directorio | Sí |
| Mensajes | `GET` | `/api/mensajes?limit=&offset=` | Listar metadatos de mensajes sellados (paginado) | Sí |
| Mensajes | `POST` | `/api/mensajes` | Cifrar (AES-256) y guardar mensaje póstumo | Sí |
| Mensajes | `PUT` | `/api/mensajes/:id` | Reescribir y volver a cifrar mensaje propio | Sí |
| Mensajes | `DELETE` | `/api/mensajes/:id` | Eliminar mensaje póstumo | Sí |
| Check-in | `GET` | `/api/checkin` | Consultar último check-in y días transcurridos | Sí |
| Check-in | `POST` | `/api/checkin` | Confirmar presencia y anular solicitudes pendientes | Sí |
| Solicitudes | `POST` | `/api/solicitudes` | Iniciar apertura (`multipart/form-data`: `rut_titular`, `certificado`) | Sí |
| Solicitudes | `GET` | `/api/solicitudes/mias` | Ver solicitudes de apertura enviadas como albacea | Sí |
| Solicitudes | `GET` | `/api/solicitudes/alertas` | Ver alertas de apertura sobre la bóveda del titular | Sí |
| Solicitudes | `PUT` | `/api/solicitudes/:id/cancelar` | Cancelar solicitud pendiente en periodo de gracia | Sí |
| Guía Albacea | `GET` | `/api/guia/designaciones` | Listar titulares que designaron al usuario como albacea | Sí |
| Guía Albacea | `PUT` | `/api/guia/designaciones/:id/responder` | Aceptar (`VALIDADO`) o rechazar (`RECHAZADO`) designación | Sí |
| Guía Albacea | `GET` | `/api/guia` | Consultar pólizas liberadas tras apertura `APROBADA` | Sí |
| Guía Albacea | `PUT` | `/api/guia/polizas/:id/tramitada` | Marcar o desmarcar póliza como tramitada | Sí |

### Ejemplos de Request y Response

#### 1. `POST /api/auth/login`
**Request:**
```json
{
  "correo_usuario": "roberto.morales@correo.cl",
  "password": "123123123"
}
```
**Response (`200 OK`):**
```json
{
  "mensaje": "Inicio de sesión exitoso.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "rut": "12345678-5",
      "nombre": "Roberto Morales",
      "correo": "roberto.morales@correo.cl",
      "rol": "TITULAR",
      "es_albacea": false,
      "designaciones_pendientes": 0,
      "designaciones_validadas": 0,
      "total_designaciones": 0
    }
  }
}
```

#### 2. `PUT /api/auth/change-password`
**Request:**
```json
{
  "passwordActual": "123123123",
  "nuevaPassword": "NuevaClaveSegura2026"
}
```
**Response (`200 OK`):**
```json
{
  "mensaje": "Contraseña actualizada exitosamente.",
  "data": null
}
```

#### 3. `POST /api/albaceas` (Invitación a persona no registrada)
**Request:**
```json
{
  "rut_invitado": "18111222-0",
  "nombre_albacea": "Esteban Paredes",
  "email_albacea": "esteban.paredes@correo.cl",
  "parentesco": "Abogado/a"
}
```
**Response (`201 Created`):**
```json
{
  "mensaje": "Invitación registrada. Cuando esta persona cree su cuenta con este RUT, la designación se vinculará automáticamente.",
  "data": {
    "id_directorio": 3,
    "nombre_usuario": "Esteban Paredes",
    "rut": "18111222-0",
    "correo_usuario": "esteban.paredes@correo.cl",
    "parentesco": "Abogado/a",
    "estado_validacion": "INVITADO",
    "registrado": false
  }
}
```

#### 4. `PUT /api/guia/designaciones/2/responder`
**Request:**
```json
{
  "estado": "VALIDADO"
}
```
**Response (`200 OK`):**
```json
{
  "mensaje": "Designación aceptada correctamente. Ahora figuras como albacea validado.",
  "data": {
    "id_directorio": 2,
    "id_titular": 1,
    "parentesco": "Familiar",
    "estado_validacion": "VALIDADO"
  }
}
```

#### 5. `GET /api/polizas?limit=10&offset=0`
**Response (`200 OK`):**
```json
{
  "mensaje": "Pólizas obtenidas correctamente.",
  "data": [
    {
      "id_poliza": 1,
      "tipo_seguro": "Seguro de Vida Individual",
      "aseguradora": "Consorcio",
      "numero_poliza": "POL-8475839",
      "ubicacion_fisica": "Cajón derecho del escritorio principal",
      "monto_referencial": "50000000.00",
      "tramitada": false,
      "id_usuario": 1
    }
  ],
  "meta": {
    "total": 3,
    "limit": 10,
    "offset": 0
  }
}
```

#### 6. `POST /api/inventario`
**Request:**
```json
{
  "plataforma": "Google Drive / Fotos",
  "instruccion": "Descargar respaldo familiar y cerrar cuenta",
  "categoria": "Familiar Directo"
}
```
**Response (`201 Created`):**
```json
{
  "mensaje": "Activo agregado al inventario con éxito.",
  "data": {
    "id_inventario": 1,
    "plataforma": "Google Drive / Fotos",
    "instruccion": "Descargar respaldo familiar y cerrar cuenta",
    "categoria": "Familiar Directo",
    "fecha_creacion": "2026-11-21T04:00:00.000Z"
  }
}
```

---

## 8. Seguridad, Hardening y Limitaciones Conocidas

| Control | Implementación en Baúl Eterno |
|---|---|
| Cabeceras HTTP seguras | `helmet` activado globalmente en `backend/index.js`. |
| Mitigación de fuerza bruta | `express-rate-limit` en `POST /api/auth/login` (máximo 10 intentos cada 15 minutos por IP). |
| CORS estricto | Orígenes permitidos restringidos mediante `FRONTEND_URL`. |
| Contraseñas | Hasheadas con `bcrypt` (10 rondas) en registro y cambio de clave. |
| Cifrado de mensajes póstumos | `AES-256-CBC` con IV aleatorio de 16 bytes por mensaje (`AES_SECRET_KEY`). |
| Integridad de certificados | Huella criptográfica `SHA-256` almacenada al recibir el certificado de defunción. |
| Validación de entradas | RUT chileno (formato + dígito verificador Módulo 11), correo electrónico, IDs numéricos enteros (`400 Bad Request`), JSON global error handler. |
| Interceptor HTTP 401 | En frontend (`api.ts`), cualquier sesión expirada limpia `localStorage` y redirige a `/login`. |

> **Limitación conocida — Cierre de sesión *stateless* con JWT:** Al utilizar JSON Web Tokens sin lista de revocación en servidor (*stateless*), el cierre de sesión elimina el token del navegador (`localStorage`), pero un token previamente capturado permanecerá técnicamente válido ante el backend hasta su expiración natural configurada en `JWT_EXPIRES_IN` (**2 horas**). Para mitigación futura en producción se recomienda implementar una *denylist* en Redis o tokens de corta duración con *refresh tokens* rotatorios.

---

## 9. Matriz de cumplimiento

- [x] **EP 2.1 Servidor:** Node.js/Express operativo con arquitectura MVC, Helmet, CORS estricto, rate-limiting y manejo global de errores JSON.
- [x] **EP 2.2 Base relacional:** PostgreSQL con esquema normalizado (7 tablas incluyendo `INVENTARIO`), restricciones `CHECK`, soporte de albaceas invitados y script `init.sql` sincronizado.
- [x] **EP 2.3 API REST:** Endpoints CRUD completos y paginados bajo formato estándar `{ mensaje, data, meta? }` con validación estricta de IDs y entradas.
- [x] **EP 2.4 JWT y modelo dual:** Autenticación JWT con expiración de 2h, cambio de contraseña, y alternancia fluida entre **Mi Baúl (Titular)** y **Panel Albacea**.
- [x] **EP 2.5 Seguridad:** Secretos aislados fuera de Git (`.gitignore` + `.env.example`), cifrado AES-256, SHA-256, `bcrypt` y auditoría de eventos críticos.
- [x] **EP 2.6 Ionic React + backend:** Todas las vistas (`Dashboard`, `Polizas`, `Inventario`, `Albaceas`, `Mensajes`, `Guia`, `Apertura`, `Configuracion`, `Login`, `Register`) integradas con Axios y validación en tiempo real.
- [x] **EP 2.7 Documentación y calidad:** `README.md` actualizado con árbol de directorios real, variables de entorno (`AES_SECRET_KEY`, `FRONTEND_URL`), modelo de BD, ejemplos de API y limitaciones conocidas documentadas.

---
*Desarrollado para la asignatura de Ingeniería Web y Móvil.*
