# Baúl Eterno - Plataforma de Legado Personal

> **Proyecto Semestral:** Relicario / Legado / Baúl Eterno  
> **Recursos:** [Documento de Consideraciones Ionic](https://docs.google.com/document/d/1ikC9UjnSPEvII5PEouwMIieB4Uo4obu91eAkVA_MMxw/edit?usp=sharing)

---

## Tabla de Contenidos

- [1. Justificación del Problema](#1-justificación-del-problema)
  - [1.1. Contexto](#11-contexto)
  - [1.2. Relevancia y Magnitud](#12-relevancia-y-magnitud)
  - [1.3. Consecuencias de la Falta de Solución](#13-consecuencias-de-la-falta-de-solución)
- [2. Caracterización de Usuarios Objetivo y Roles](#2-caracterización-de-usuarios-objetivo-y-roles)
  - [2.1. Grupos de Usuarios Objetivo y Contexto de Uso](#21-grupos-de-usuarios-objetivo-y-contexto-de-uso)
  - [2.2. Identificación de Roles en el Sistema](#22-identificación-de-roles-en-el-sistema)
  - [2.3. Criterios de Accesibilidad, Experiencia Tecnológica y Privacidad](#23-criterios-de-accesibilidad-experiencia-tecnológica-y-privacidad)
- [3. Perfiles de Usuario: Proto-Personas](#3-perfiles-de-usuario-proto-personas)
  - [3.1. Supuestos de Construcción Metodológica](#31-supuestos-de-construcción-metodológica)
  - [3.2. Proto-Persona 1: Titular del Baúl](#32-proto-persona-1-titular-del-baúl)
  - [3.3. Proto-Persona 2: Albacea y Beneficiaria](#33-proto-persona-2-albacea-y-beneficiaria)
  - [3.4. Proto-Persona 3: Titular del Baúl](#34-proto-persona-3-titular-del-baúl)
  - [3.5. Proto-Persona 4: Albacea y Beneficiaria](#35-proto-persona-4-albacea-y-beneficiaria)
- [4. Especificación de Requerimientos del Sistema](#4-especificación-de-requerimientos-del-sistema)
  - [4.1. Requerimientos Funcionales](#41-requerimientos-funcionales)
  - [4.2. Requerimientos No Funcionales](#42-requerimientos-no-funcionales)

---

## 1. Justificación del Problema

### 1.1. Contexto

En Chile y Latinoamérica, la muerte de un familiar detona de forma inmediata una serie de procesos burocráticos y administrativos complejos en un período de alta vulnerabilidad emocional. Gran parte de la población económicamente activa mantiene contratados o activos diversos instrumentos financieros de cobertura: seguros de vida, seguros de desgravamen vinculados a créditos de consumo e hipotecarios, seguros automotrices (SOAP y coberturas completas), seguros complementarios de salud laboral y pólizas asociadas a tarjetas del retail (Falabella, Ripley, Cencosud). Sin embargo, la gestión de estos contratos es dispersa, fragmentada y carece de un canal unificado de comunicación preventiva hacia el núcleo familiar.

### 1.2. Relevancia y Magnitud

* **Pólizas no reclamadas y opacidad del sistema:** De acuerdo con la Comisión para el Mercado Financiero (CMF), anualmente se acumulan miles de millones de pesos en pólizas de seguro no cobradas debido a que los herederos o beneficiarios ignoran la existencia del contrato al momento del deceso.
* **Limitaciones del marco estatal (SISES):** Si bien el Estado chileno implementó el Sistema de Información de Seguros de Vida y Desgravamen (SISES) gestionado por la CMF, este opera como un mecanismo reactivo, burocrático, con tiempos de respuesta que pueden superar los 30 días hábiles y limitado exclusivamente a seguros de vida y desgravamen inscritos formalmente, excluyendo microseguros comerciales, seguros complementarios de salud, pólizas de viaje o bienes patrimoniales menores.
* **Conflicto ético de privacidad póstuma:** Ante la incertidumbre documental, los deudos se ven empujados a vulnerar los dispositivos físicos (teléfonos inteligentes, computadores) o las cuentas personales (Google Drive, WhatsApp, correos electrónicos) de la persona fallecida intentando adivinar contraseñas para encontrar antecedentes financieros o fotografías de recuerdo. Esto vulnera el derecho a la privacidad póstuma consagrado conceptualmente en el marco de la Ley N° 19.628 sobre Protección de la Vida Privada.

### 1.3. Consecuencias de la Falta de Solución

* **Impacto socioeconómico negativo:** Pérdida definitiva de indemnizaciones y falta de activación oportuna de seguros de desgravamen, lo que obliga a familias de clase media o vulnerables a asumir deudas crediticias heredadas o gastos fúnebres de emergencia.
* **Sobrecarga cognitiva en el duelo:** Tramitación engorrosa donde los herederos deben acudir banco por banco e institución por institución solicitando certificados de existencia de productos.
* **Extravío irreversible del legado emocional:** Cartas, consejos, mensajes póstumos y memorias digitales quedan inaccesibles para siempre tras el bloqueo o formateo de dispositivos personales.

---

## 2. Caracterización de Usuarios Objetivo y Roles

### 2.1. Grupos de Usuarios Objetivo y Contexto de Uso

#### Grupo 1: Titulares Preventivos (Adultos Bancarizados)
* **Características:** Personas entre 25 y 65 años económicamente activas con productos financieros vigentes (cuentas corrientes, tarjetas de retail, seguros automotrices, créditos con desgravamen).
* **Necesidades:** Unificar contratos dispersos en un solo lugar confiable y delegar instrucciones claras a sus familias sin incurrir en costos notariales elevados.
* **Dificultades:** Falta de tiempo para organizar documentos, dispersión de pólizas en correos electrónicos y reticencia psicológica a discutir el fallecimiento con sus cercanos.
* **Contexto de uso:** Espacios domésticos o laborales en momentos de tranquilidad, principalmente desde computadores personales o tablets (versión web).

#### Grupo 2: Herederos y Beneficiarios (Familiares en Duelo)
* **Características:** Familiares directos (hijos mayores de edad idealmente, cónyuges, hermanos) que enfrentan la pérdida reciente de un ser querido y deben asumir trámites legales.
* **Necesidades:** Conocer con certeza qué beneficios, coberturas o pólizas dejó el causante para evitar asumir deudas y solventar gastos funerarios.
* **Dificultades:** Bloqueo emocional, desorientación frente a trámites en notarías o bancos y desconocimiento de las entidades aseguradoras donde el causante tenía contratos.
* **Contexto de uso:** En movilidad (versión móvil) durante gestiones urgentes en sucursales, notarías o el domicilio familiar.

### 2.2. Identificación de Roles en el Sistema

* **Rol Titular:** Usuario registrado y autenticado que administra su bóveda en vida. Sus tareas dentro del sistema son registrar seguros, ingresar instrucciones patrimoniales, redactar mensajes confidenciales, asignar albaceas y validar periódicamente la vigencia de su cuenta mediante el ritual de check-in.
* **Rol Albacea (Beneficiario Designado):** Contacto de confianza previamente registrado mediante su RUT por el titular. Sus tareas son iniciar la solicitud formal de apertura adjuntando el certificado de defunción del Registro Civil, recibir las credenciales temporales de liberación y consultar la guía interactiva de pólizas y mensajes que le fueron asignados.

> **Nota técnica:** El rol tradicional de "Administrador" queda acotado a nivel de sistema para auditoría de base de datos y soporte técnico, pero los roles que modelan el negocio son Titular y Albacea.

### 2.3. Criterios de Accesibilidad, Experiencia Tecnológica y Privacidad

* **Nivel Estimado de Experiencia Tecnológica:** Rango medio a bajo para los titulares (acostumbrados a aplicaciones bancarias básicas y mensajería) y medio-alto para los albaceas (habituales en plataformas de gestión digital y uso de ClaveÚnica).
* **Accesibilidad:** Interfaz construida con contraste visual óptimo, tipografías legibles y reducción de carga cognitiva, fundamental para usuarios que interactúan bajo estrés emocional en situaciones de duelo.
* **Seguridad y Privacidad Estricta:** Aislamiento total de datos. Ningún albacea puede consultar información mientras el titular esté con vida. Los mensajes personales se resguardan cifrados (AES-256) en la base de datos y solo son descifrables tras la aprobación de la solicitud de apertura.

---

## 3. Perfiles de Usuario: Proto-Personas

### 3.1. Supuestos de Construcción Metodológica

1. Los adultos con más de dos productos bancarios o comerciales en Chile desconocen las cláusulas completas de sus seguros de desgravamen o complementarios.
2. Los familiares prefieren una lista ordenada y digital de aseguradoras antes que recorrer físicamente las compañías solicitando certificados.
3. El usuario busca un resguardo privado selectivo que no comprometa el resto de sus archivos personales en la nube.
4. Ante contingencias familiares o decesos, los adultos mayores suelen presentar resistencia tecnológica o tecnofobia frente a plataformas digitales, delegando la totalidad de las gestiones administrativas, bancarias y notariales en familiares jóvenes (entre 15 y 35 años).
5. Los profesionales jóvenes (25 a 40 años) acumulan coberturas financieras vinculadas a créditos hipotecarios o seguros de salud familiares, pero postergan la planificación formal creyendo erróneamente que la gestión patrimonial es exclusiva de edades avanzadas.

### 3.2. Proto-Persona 1: Titular del Baúl

| Campo | Detalle |
| :--- | :--- |
| **Rol** | Titular |
| **Nombre Ficticio** | Roberto Morales (54 años) |
| **Ocupación / Situación** | Empleado administrativo, casado, padre de dos hijos universitarios. |
| **Características generales** | Ordenado con sus finanzas del día a día, pero con pólizas guardadas en correos viejos y carpetas físicas que nadie más revisa. |
| **Objetivos de uso** | Garantizar que si fallece imprevistamente, su familia cobre los seguros correspondientes para pagar sus compromisos financieros y recibir un mensaje de despedida. |
| **Frustraciones** | Los costos de redactar un testamento notarial son excesivos; le preocupa que su familia quede vulnerable y desinformada ante los bancos. |
| **Funcionalidades que utilizará** | RF-01 (Registro de pólizas), RF-02 (Designación de albaceas), RF-03 (Mensajes póstumos), RF-04 (Check-in de vigencia). |
| **Dispositivos y contexto** | Computador de escritorio (versión Web) en su hogar un fin de semana para registrar datos con calma. |

### 3.3. Proto-Persona 2: Albacea y Beneficiaria

| Campo | Detalle |
| :--- | :--- |
| **Rol** | Albacea |
| **Nombre Ficticio** | Camila Morales (26 años) |
| **Ocupación / Situación** | Hija mayor de Roberto, recién titulada, maneja con soltura aplicaciones móviles y trámites web. |
| **Características generales** | Resolutiva y pragmática, suele ayudar a sus padres con trámites por internet y gestiones bancarias. |
| **Objetivos de uso** | Iniciar la apertura del baúl digital de su padre tras su fallecimiento para saber exactamente a qué compañías aseguradoras acudir sin trámites a ciegas. |
| **Frustraciones** | El desgaste emocional de las semanas posteriores al fallecimiento sumado a la frialdad de las instituciones financieras pidiendo documentos que no sabe dónde encontrar. |
| **Funcionalidades que utilizará** | RF-05 (Solicitud de apertura con certificado de defunción), RF-07 (Guía interactiva de cobro de seguros). |
| **Dispositivos y contexto** | Teléfono móvil personal (versión móvil) durante trámites notariales o desde el centro médico. |

### 3.4. Proto-Persona 3: Titular del Baúl

| Campo | Detalle |
| :--- | :--- |
| **Rol** | Titular |
| **Nombre Ficticio** | Diego Cárdenas (35 años) |
| **Ocupación / Situación** | Ingeniero en proyectos, casado con Marcela y padre de una hija de 4 años. Trabaja bajo modalidad híbrida. |
| **Características generales** | Altamente familiarizado con aplicaciones bancarias, plataformas de inversión digital y herramientas en la nube. Mantiene un crédito hipotecario con seguro de desgravamen, seguro automotriz de cobertura completa y seguro complementario de salud corporativo. |
| **Objetivos de uso** | Centralizar los números de póliza y entidades de sus seguros de salud e hipoteca, registrar la ubicación de documentos notariales y programar mensajes de despedida dirigidos a su hija para fechas significativas. |
| **Frustraciones** | Considera que los procesos notariales tradicionales son anacrónicos y costosos; le frustra la falta de interoperabilidad entre bancos y aseguradoras; teme que su familia pierda beneficios económicos por no conocer los contratos vigentes. |
| **Funcionalidades que utilizará** | RF-01 (Registro de pólizas y bienes), RF-02 (Designación de albaceas), RF-03 (Mensajes póstumos privados), RF-04 (Check-in de vigencia). |
| **Dispositivos y contexto** | Computador portátil durante jornadas laborales para la carga inicial estructurada, y aplicación móvil (Ionic) para confirmar notificaciones y el ritual de revisión semestral. |

### 3.5. Proto-Persona 4: Albacea y Beneficiaria

| Campo | Detalle |
| :--- | :--- |
| **Rol** | Albacea (y eventual co-titular) |
| **Nombre Ficticio** | Marcela Valenzuela (34 años) |
| **Ocupación / Situación** | Diseñadora de vestuario y microempresaria, cónyuge de Diego. |
| **Características generales** | Pragmática, habituada a resolver trámites cotidianos mediante aplicaciones móviles y ClaveÚnica. Dentro de su núcleo familiar extenso, es quien usualmente gestiona trámites digitales para sus padres y familiares mayores que evitan usar plataformas en línea. |
| **Objetivos de uso** | Iniciar la solicitud de apertura de la bóveda mediante el certificado de defunción digital y seguir el checklist de trámites para extinguir la deuda de la vivienda compartida. |
| **Frustraciones** | Falta de tiempo para trámites presenciales prolongados; el desgaste emocional que implica lidiar con ejecutivos bancarios durante un duelo; la resistencia de parientes mayores que desconfían de las gestiones en línea y prefieren delegar en ella todas las diligencias. |
| **Funcionalidades que utilizará** | RF-05 (Solicitud de apertura por contingencia), RF-06 (Alertas y seguimiento de validación), RF-07 (Guía interactiva de cobro de seguros). |
| **Dispositivos y contexto** | Teléfono inteligente (app Ionic React) en cualquier momento y lugar (clínicas, notarías o el hogar). |

---

## 4. Especificación de Requerimientos del Sistema

### 4.1. Requerimientos Funcionales

| ID | Nombre | Rol | Descripción | Pantalla Figma (EP 1.3) |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Registro de pólizas y bienes | Titular | Permite ingresar, editar y listar seguros (vida, salud, automotriz, desgravamen), indicando aseguradora, N° de póliza, monto referencial y ubicación de documentos físicos. | Gestión de Pólizas |
| **RF-02** | Designación de albaceas | Titular | Permite agregar hasta tres contactos de confianza ingresando su RUT, nombre completo, parentesco y correo electrónico para notificarlos. | Directorio de Albaceas |
| **RF-03** | Mensajes póstumos privados | Titular | Permite escribir cartas o notas de despedida asociadas al RUT de un beneficiario puntual, manteniéndose selladas hasta la apertura. | Redactor de Mensajes |
| **RF-04** | Check-in de vigencia | Titular | Permite confirmar actividad en el sistema mediante un botón de revisión periódica para actualizar el estado activo de la cuenta. | Estado de la Bóveda |
| **RF-05** | Solicitud de apertura | Albacea | Permite solicitar la liberación del cofre ingresando el RUT del titular y adjuntando en PDF o foto el certificado de defunción. | Solicitud de Apertura |
| **RF-06** | Cancelación por gracia | Titular | Altera el flujo ante una apertura indebida: notifica al titular y le permite frenar el proceso con un solo clic dentro de un plazo límite. | Alertas de Seguridad |
| **RF-07** | Guía de cobro de seguros | Albacea | Muestra la lista de seguros liberados con datos de contacto de cada compañía y un checklist para marcar las pólizas ya tramitadas. | Guía de Trámites |

### 4.2. Requerimientos No Funcionales

| ID | Categoría | Nombre | Descripción |
| :--- | :--- | :--- | :--- |
| **RNF-01** | Usabilidad | Diseño intuitivo y directo | La interfaz debe ser sobria, legible y accesible; cualquier trámite o consulta esencial debe completarse en un máximo de 3 pasos de navegación. |
| **RNF-02** | Integridad | Respaldo y validación de archivos | Los documentos y pólizas adjuntadas deben verificarse mediante hash ($SHA-256$) al subirse para asegurar que ningún archivo se corrompa en el almacenamiento. |
| **RNF-03** | Seguridad | Cifrado y tokens de acceso | Los mensajes póstumos e instrucciones sensibles deben almacenarse cifrados ($AES-256$) en la base de datos, gestionando las sesiones con tokens JWT firmados. |
| **RNF-04** | Rendimiento | Adaptabilidad multidispositivo | El diseño debe responder de forma fluida tanto en navegadores de escritorio (menú lateral) como en teléfonos móviles (pestañas táctiles inferiores). |
| **RNF-05** | Auditoría | Registro de eventos críticos | El sistema debe guardar un historial inmutable con fecha, hora e IP de cada solicitud de apertura, alta de albacea y descarga de documentos. |