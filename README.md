# Baúl Eterno - Plataforma de Legado Personal

Plataforma web y móvil de gestión patrimonial preventiva y preservación de memoria digital. Permite a los usuarios registrar en vida sus pólizas de seguro, bienes e instrucciones clave, además de cartas y recuerdos póstumos, liberándolos de manera controlada a sus albaceas designados ante una contingencia.

* **Prototipo Interactivo en Figma:** [Ver Prototipo UI/UX en Figma](https://www.figma.com/proto/EHdQG7y7aMbGVkIzi36fNZ/baul-eterno--copia-?node-id=2-12&starting-point-node-id=2%3A12&t=VKCSrSZArWJPDgmJ-1)
* **Documentación Técnica Adicional:** [Documento de Consideraciones Ionic](https://docs.google.com/document/d/1ikC9UjnSPEvII5PEouwMIieB4Uo4obu91eAkVA_MMxw/edit?usp=sharing)

---

## Tabla de Contenidos

1. [Identificación del Equipo y Responsabilidades](#1-identificación-del-equipo-y-responsabilidades)
2. [Descripción General y Objetivos del Proyecto](#2-descripción-general-y-objetivos-del-proyecto)
3. [Justificación del Problema](#3-justificación-del-problema)
4. [Caracterización de Usuarios Objetivo y Roles](#4-caracterización-de-usuarios-objetivo-y-roles)
5. [Perfiles de Usuario: Proto-Personas y Supuestos](#5-perfiles-de-usuario-proto-personas-y-supuestos)
6. [Especificación de Requerimientos](#6-especificación-de-requerimientos)
7. [Arquitectura de Navegación y Estructura de Carpetas](#7-arquitectura-de-navegación-y-estructura-de-carpetas)
8. [Tecnologías y Herramientas Utilizadas](#8-tecnologías-y-herramientas-utilizadas)
9. [Instrucciones de Instalación y Configuración](#9-instrucciones-de-instalación-y-configuración)
10. [Instrucciones de Ejecución y Guía de Uso](#10-instrucciones-de-ejecución-y-guía-de-uso)
11. [Diagramas, Mockups y Recursos Visuales](#11-diagramas-mockups-y-recursos-visuales)

---

## 1. Identificación del Equipo y Responsabilidades

| Integrante | Rol Principal | Distribución de Responsabilidades |
| :--- | :--- | :--- |
| **Fabián Maulén** | Líder de Proyecto | Modelado y especificación de requerimientos, diseño UI/UX en Figma y coordinación general del equipo. |
| **Iván Ferreira** | Integrador / Servidor | Gestión de ramas en GitHub, configuración del servidor/entorno de ejecución e integración frontend. |
| **Mariana Llime** | Diseñadora UI/UX | Diseño de flujos de interacción, prototipado de pantallas móviles y adaptación web en Figma. |
| **Dania Kristal Ahuelican** | Desarrolladora Frontend | Construcción de componentes modulares, interfaces y vistas en Ionic React con TypeScript. |

---

## 2. Descripción General y Objetivos del Proyecto

### 2.1. Descripción General del Sistema
*Baúl Eterno* es una solución tecnológica diseñada para resolver la desinformación y vulnerabilidad de las familias tras el fallecimiento de un ser querido. Opera como una bóveda digital cifrada donde el usuario titular organiza sus pólizas de seguro (vida, desgravamen, salud laboral, automotriz) e instrucciones de cobro en vida. Los registros permanecen bloqueados hasta que un contacto de confianza («Albacea Digital»), acreditado con su RUT, inicia un protocolo de verificación con certificado de defunción emitido por el Registro Civil, facilitando el cobro oportuno de indemnizaciones y entregando mensajes de despedida sin vulnerar las contraseñas personales del titular.

### 2.2. Objetivos del Proyecto

#### Objetivo General
* Desarrollar una aplicación web y móvil modular y responsiva mediante el framework Ionic con React y un backend relacional, que garantice la custodia estructurada y la entrega asistida de información patrimonial y recuerdos póstumos.

#### Objetivos Específicos
* Modelar e implementar interfaces sobrias, intuitivas y accesibles utilizando componentes nativos de Ionic (`IonPage`, `IonContent`, `IonTabs`, `IonMenu`).
* Construir una arquitectura de navegación con React Router que distinga rutas públicas y privadas protegidas según roles de usuario.
* Diseñar un modelo de base de datos relacional para resguardar la integridad y consistencia de pólizas, contactos de confianza y solicitudes de apertura.
* Implementar mecanismos de seguridad que incluyan autenticación con JWT, hashing de contraseñas con bcrypt y almacenamiento cifrado de datos sensibles.

---

## 3. Justificación del Problema

### 3.1. Contexto
En Chile y Latinoamérica, el fallecimiento de un familiar desata una serie de procesos burocráticos y administrativos complejos en un período de alta vulnerabilidad emocional. Gran parte de la población económicamente activa mantiene contratados diversos seguros (vida, desgravamen vinculados a créditos hipotecarios o de consumo, SOAP, complementarios de salud laboral y seguros comerciales), pero la gestión de estos contratos es fragmentada y carece de comunicación preventiva hacia el núcleo familiar.

### 3.2. Relevancia y Magnitud
* **Pólizas no reclamadas:** Según la Comisión para el Mercado Financiero (CMF), miles de millones de pesos en seguros quedan sin cobrar anualmente porque los herederos desconocen que el causante mantenía una póliza activa al momento del deceso.
* **Insuficiencia del sistema estatal (SISES):** El sistema SISES de la CMF opera de manera reactiva y burocrática, con tiempos de respuesta extensos y limitado a seguros de vida formales, dejando fuera seguros complementarios de salud, pólizas de retail, viajes o inventario de bienes menores.
* **Invasión a la privacidad póstuma:** Ante la desinformación, los deudos se ven forzados a vulnerar los dispositivos físicos (celulares, computadores) o las cuentas personales (correos, nubes) del fallecido intentando adivinar credenciales, transgrediendo el derecho a la intimidad protegido por la Ley N° 19.628.

### 3.3. Consecuencias de la Falta de Solución
* **Pérdida patrimonial:** Pérdida definitiva de indemnizaciones y falta de activación oportuna de seguros de desgravamen, obligando a deudos a costear deudas heredadas o gastos funerarios de emergencia.
* **Sobrecarga cognitiva en el duelo:** Trámites extenuantes donde los familiares deben acudir manualmente institución por institución bancaria consultando por contratos vigentes.
* **Pérdida definitiva de voluntades:** Cartas personales, reflexiones y mensajes de despedida quedan bloqueados o eliminados tras formatear los dispositivos del causante.

---

## 4. Caracterización de Usuarios Objetivo y Roles

### 4.1. Grupos de Usuarios Objetivo y Contexto de Uso

#### Grupo 1: Titulares Preventivos (Adultos Bancarizados)
* **Características:** Personas entre 25 y 65 años económicamente activas con productos financieros y coberturas vigentes.
* **Necesidades:** Centralizar pólizas en un espacio confiable y dejar instrucciones claras sin incurrir en costos notariales elevados.
* **Dificultades:** Falta de tiempo, dispersión de contratos en correos viejos y reticencia a hablar sobre el fallecimiento.
* **Contexto de uso:** Espacios domésticos o laborales en momentos de tranquilidad, principalmente desde computadores personales o tablets en versión web.

#### Grupo 2: Herederos y Beneficiarios (Familiares en Contingencia)
* **Características:** Familiares directos (cónyuges, hijos de 17 años en adelante, hermanos) que asumen la tramitación legal tras la pérdida.
* **Necesidades:** Conocer con rapidez qué pólizas existen para evitar asumir deudas y solventar trámites funerarios.
* **Dificultades:** Agotamiento emocional, desorientación administrativa y desconocimiento de las aseguradoras asociadas.
* **Contexto de uso:** En movilidad mediante la app móvil durante diligencias en sucursales, notarías o el domicilio familiar.

### 4.2. Identificación de Roles en el Sistema
* **Rol Titular:** Usuario registrado y autenticado que administra su baúl en vida: ingresa seguros, redacta cartas privadas, asigna albaceas y valida periódicamente la actividad de su cuenta mediante el check-in.
* **Rol Albacea (Beneficiario Designado):** Contacto de confianza registrado con su RUT por el titular: inicia la solicitud de apertura subiendo el certificado de defunción y consulta la información y mensajes liberados tras la validación.

### 4.3. Criterios de Accesibilidad, Experiencia Tecnológica y Privacidad
* **Experiencia Tecnológica:** Media-baja para titulares mayores; media-alta para beneficiarios jóvenes habituados a ClaveÚnica y trámites móviles.
* **Accesibilidad:** Jerarquía visual clara, contraste balanceado y reducción de pasos para mitigar la sobrecarga cognitiva en momentos de duelo.
* **Privacidad Estricta:** Datos completamente sellados en vida del titular; almacenamiento cifrado (AES-256) en la base de datos.

---

## 5. Perfiles de Usuario: Proto-Personas y Supuestos

### 5.1. Supuestos de Construcción Metodológica
1. Los adultos con más de dos servicios financieros en Chile desconocen las coberturas completas de sus contratos de desgravamen.
2. Los familiares prefieren una guía digital centralizada antes que consultar presencialmente compañía por compañía aseguradora.
3. El titular exige que sus cartas y seguros se mantengan confidenciales hasta su deceso y solo sean vistos por el destinatario indicado.
4. Los adultos mayores suelen delegar trámites notariales y digitales complejos en familiares jóvenes (entre 15 y 35 años).
5. Los profesionales jóvenes con dependientes acumulan pólizas asociadas a hipotecas o salud, pero postergan la planificación formal.

### 5.2. Matriz de Proto-Personas

| Atributo | Proto-Persona 1: Titular Mayor | Proto-Persona 2: Albacea Joven | Proto-Persona 3: Titular Joven | Proto-Persona 4: Albacea Co-titular |
| :--- | :--- | :--- | :--- | :--- |
| **Rol** | Titular | Albacea | Titular | Albacea |
| **Nombre** | Roberto Morales (54 años) | Camila Morales (26 años) | Diego Cárdenas (35 años) | Marcela Valenzuela (34 años) |
| **Ocupación** | Empleado administrativo | Recién titulada | Ingeniero de proyectos | Diseñadora y microempresaria |
| **Objetivo** | Asegurar el cobro de pólizas para no heredar deudas a su familia. | Apertura rápida para cubrir gastos sin trámites a ciegas. | Proteger a su hija pequeña y programar mensajes de despedida. | Extinguir la deuda hipotecaria compartida tras un deceso. |
| **Frustración** | Altos costos de testamentos notariales tradicionales. | Frialdad institucional y desorden en documentos físicos. | Trámites anacrónicos y nula interoperabilidad bancaria. | Desgaste emocional y trámites presenciales prolongados. |
| **Funciones** | RF-01, RF-02, RF-03, RF-04 | RF-05, RF-07 | RF-01, RF-02, RF-03, RF-04 | RF-05, RF-06, RF-07 |
| **Dispositivo** | Web Escritorio (Hogar) | Móvil (Notarías / Sucursales) | Laptop / Móvil (Uso mixto) | Smartphone (Urgencias / Hogar) |

---

## 6. Especificación de Requerimientos

### 6.1. Requerimientos Funcionales (RF)

| ID | Nombre | Rol | Descripción | Pantalla Figma (EP 1.3) |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Registro de pólizas y bienes | Titular | Permite ingresar, editar y listar seguros (vida, salud, automotriz, desgravamen), indicando aseguradora, N° de póliza, monto referencial y ubicación de documentos físicos. | Gestión de Pólizas |
| **RF-02** | Designación de albaceas | Titular | Permite registrar hasta tres contactos de confianza ingresando su RUT, nombre completo, parentesco y correo electrónico para notificarlos. | Directorio de Albaceas |
| **RF-03** | Mensajes póstumos privados | Titular | Permite escribir cartas o notas de despedida asignadas al RUT de un destinatario exclusivo, manteniéndose selladas hasta la apertura. | Redactor de Mensajes |
| **RF-04** | Check-in de vigencia | Titular | Permite confirmar actividad en el sistema mediante un botón de revisión periódica para actualizar la vigencia de custodia de la cuenta. | Estado de la Bóveda |
| **RF-05** | Solicitud de apertura | Albacea | Permite solicitar la liberación del baúl ingresando el RUT del titular y adjuntando en PDF o imagen el certificado de defunción. | Solicitud de Apertura |
| **RF-06** | Cancelación por gracia | Titular | Permite al titular abortar una solicitud indebida mediante un solo clic durante una ventana de gracia configurable. | Alertas de Seguridad |
| **RF-07** | Guía de cobro de seguros | Albacea | Despliega la lista de seguros liberados con canales de contacto de las aseguradoras y un checklist de avance de trámites. | Guía de Trámites |

### 6.2. Requerimientos No Funcionales (RNF)

| ID | Categoría | Nombre | Descripción |
| :--- | :--- | :--- | :--- |
| **RNF-01** | Usabilidad | Diseño directo e intuitivo | Interfaz sobria, legible y accesible; cualquier trámite crítico debe realizarse en un máximo de 3 pasos de navegación. |
| **RNF-02** | Integridad | Validación de integridad de archivos | Todo documento adjunto debe validarse mediante una función hash (SHA-256) al subirse para asegurar que los archivos no se corrompan. |
| **RNF-03** | Seguridad | Cifrado y tokens de acceso | Los mensajes póstumos e instrucciones sensibles deben almacenarse cifrados (AES-256) en la base de datos, con sesiones controladas por JWT firmados. |
| **RNF-04** | Rendimiento | Adaptabilidad multidispositivo | El diseño debe adaptarse a pantallas de escritorio (menú lateral) y dispositivos móviles (pestañas táctiles inferiores). |
| **RNF-05** | Auditoría | Registro inmutable de eventos | El sistema debe almacenar un registro con marca de tiempo e IP de cada solicitud de apertura, alta de albacea y descarga de antecedentes. |

---

## 7. Arquitectura de Navegación y Estructura de Carpetas

### 7.1. Estructura de Directorios del Frontend
Organización modular de componentes, vistas y servicios dentro del proyecto Ionic con React:

```text
PROYECTOBAUL/src/
│
├── components/           # Componentes modulares reutilizables
│   ├── HeaderBar.tsx     # Barra superior con menú hamburguesa y perfiles
│   ├── AppMenu.tsx       # Menú lateral desplegable para navegación general
│   └── VaultStatusCard.tsx # Widget de estado del baúl y acción de check-in
│
├── pages/                # Vistas y pantallas completas asociadas a rutas
│   ├── Login.tsx         # Inicio de sesión con validaciones y feedback de error
│   ├── Dashboard.tsx     # Panel de control y resumen patrimonial
│   ├── Polizas.tsx       # Módulo de administración de pólizas (RF-01)
│   └── Mensajes.tsx      # Redactor de cartas póstumas dirigidas (RF-03)
│
├── routes/               # Configuración de React Router y control de acceso
│   ├── AppRoutes.tsx     # Mapeo de rutas públicas y privadas
│   └── ProtectedRoute.tsx # Componente de guarda para sesiones activas
│
├── theme/                # Configuración de estilos y variables de Ionic
│   └── variables.css     # Paleta cromática corporativa y modo oscuro
│
└── App.tsx               # Contenedor raíz con IonApp e IonReactRouter
```

### 7.2. Arquitectura de Rutas y Flujo de Navegación
* `/login` (Pública): Formulario de acceso al sistema con validaciones de campos obligatorios y formato.
* `/dashboard` (Protegida): Vista principal con estado de bóveda, métricas patrimoniales y ritual de check-in.
* `/polizas` (Protegida): Catálogo de seguros ingresados y registro de nuevas pólizas (RF-01).
* `/mensajes` (Protegida): Gestor de mensajes y cartas póstumas cifradas (RF-03).
* `/` (Redirección): Redirecciona automáticamente hacia `/login` si no existe una sesión activa.

---

## 8. Tecnologías y Herramientas Utilizadas

* **Framework Frontend:** Ionic Framework v7+ con React v18+.
* **Lenguaje:** TypeScript para tipado estricto de componentes y modelos de datos.
* **Empaquetador y Servidor Local:** Vite.
* **Componentes UI:** Librería oficial de Ionic React (`IonPage`, `IonContent`, `IonGrid`, `IonCard`, `IonMenu`, `IonButtons`, `IonFooter`) e iconografía con Ionicons.
* **Control de Rutas:** React Router v6 con soporte para rutas públicas y privadas (`useNavigate`, `Navigate`).
* **Diseño UI/UX:** Figma (construcción manual de bocetos y prototipos navegables en formato móvil y escritorio).
* **Control de Versiones y Gestión:** Git y repositorio público en GitHub organizado en ramas (`frontend` y `backend`).

---

## 9. Instrucciones de Instalación y Configuración

### Requisitos Previos del Sistema
* **Node.js:** Versión 18 LTS o 20 LTS instalada en el sistema.
* **NPM:** Gestor de paquetes incluido con Node.js.
* **Git:** Para control de versiones y gestión de ramas.

### Pasos de Instalación y Configuración

1. **Clonar el repositorio público de GitHub:**
   ```bash
   git clone https://github.com/FabianMaulen/Ingenieria-WEB-Y-MOVIL
   cd PROYECTOBAUL
   ```

2. **Acceder a la rama correspondiente al frontend:**
   ```bash
   git checkout frontend
   ```

3. **Instalar las dependencias exactas del proyecto:**
   ```bash
   npm install
   ```

---

## 10. Instrucciones de Ejecución y Guía de Uso

### 10.1. Ejecución del Entorno de Desarrollo
Para inicializar el servidor local de desarrollo con recarga en caliente:

```bash
npm run dev
```

El servidor quedará activo en la URL local indicada en la consola (por defecto: `http://localhost:5173`).

### 10.2. Guía de Uso y Flujo de Interacción

1. **Inicio de Sesión (`/login`):**
   * Ingrese un identificador (RUT o correo) y una contraseña de al menos 8 caracteres.
   * Si los campos están vacíos o no cumplen el formato, el sistema despliega mensajes de advertencia en color rojo.
   * Al presionar **Ingresar al Baúl**, el sistema almacena un token simulado de autenticación y redirige a la vista principal.

2. **Panel de Control (`/dashboard`):**
   * **Widget de Bóveda:** Permite visualizar el estado de la cuenta (*PROTEGIDA*) y los días restantes para la próxima confirmación.
   * **Ritual de Check-in (RF-04):** Presione el botón **Confirmar Presencia (Check-in)** para reiniciar el contador a 180 días y recibir una confirmación mediante notificación toast.
   * **Resumen Patrimonial:** Tarjetas de acceso rápido para explorar las pólizas registradas (RF-01) y la nómina de albaceas designados (RF-02).
   * **Menú Lateral (`IonMenu`):** Despliegue el menú desde el ícono superior para navegar entre módulos o seleccionar **Cerrar Sesión**, lo que destruye el token y devuelve al usuario a `/login`.

---

## 11. Diagramas, Mockups y Recursos Visuales

### 11.1. Diagrama de Flujo de Navegación (Task Flow)

```text
[ Visitante ] ──► /login (Pública)
                     │
              (Credenciales OK)
                     │
                     ▼
           [ /dashboard (Privada) ] ◄── (Token Activo)
              │
              ├──► [ /polizas ] ── (Gestión de coberturas)
              ├──► [ /albaceas ] ── (Designación de contactos)
              ├──► [ /mensajes ] ── (Redacción de cartas selladas)
              └──► [ Cerrar Sesión ] ──► Limpia token y vuelve a /login
```

### 11.2. Recursos Visuales del Prototipo en Figma
Los wireframes, paleta cromática corporativa y mockups en alta fidelidad tanto para versión móvil (390 × 844 px) como para versión web de escritorio (1440 × 900 px) se encuentran disponibles en el prototipo interactivo público del equipo: