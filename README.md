# Ingenieria-WEB-Y-MOVIL
# Baúl Eterno - Plataforma de Legado Personal 

## 1. Identificación de los Integrantes
* **Fabián Alejandro Maulén González** 
* **Ivan Moises Ferreira** 
* **DANIA AHUELICAN CALVARIO** 
* **MARIANA BELEN LLIME MUÑOZ**

## 2. Distribución de Responsabilidades
* **Fabián Alejandro Maulén González:** []
* **[Ivan Moises Ferreira]:** 
* **[DANIA AHUELICAN CALVARIO]:** []
* **[MARIANA BELEN LLIME MUÑOZ]:** []

## 3. Descripción General del Sistema
Plataforma orientada a resguardar información patrimonial y legal en vida, actuando como una bóveda digital preventiva. Permite a las personas estructurar y organizar sus seguros, cuentas y documentos sensibles, garantizando que sus beneficiarios designados puedan acceder a esta información en caso de fallecimiento.

## 4. Problema o Necesidad que Aborda
Existe una gran desinformación familiar respecto a bienes intangibles y pólizas de seguros contratadas por un difunto. Las aseguradoras no siempre notifican proactivamente a los beneficiarios, provocando que los seguros no se cobren, se pierda patrimonio familiar y los deudos enfrenten altos niveles de estrés burocrático y legal al no saber por dónde empezar los trámites.

## 5. Objetivos del Proyecto
* Centralizar el registro de patrimonio, bienes y seguros en una plataforma estructurada.
* Disminuir la asimetría de información entre instituciones financieras y beneficiarios.
* Agilizar los trámites póstumos mediante guías claras y acceso a documentos validados.
* Crear un entorno seguro y confiable para que los usuarios puedan guardar sus recuerdos mas preciados.

## 6. Principales Funcionalidades
El sistema contempla tres roles diferenciados (Titular, Albacea y Administrador) que interactúan a través de las siguientes funciones principales:
* Registro, edición y listado de pólizas y bienes patrimoniales.
* Designación y gestión de albaceas (contactos de confianza).
* Redacción y encriptación de mensajes póstumos privados.
* Visualización de guía de cobro de seguros para los beneficiarios.
* Apartado de visualizacion de recuerdos(fotos,videos, mensajes).

## 7. Tecnologías y Herramientas Utilizadas
* Por definir

## 8. Requerimientos del Sistema

### Requerimientos Funcionales (RF)
| ID | Nombre | Descripción |
|---|---|---|
| **RF-01** | Registro de pólizas y bienes | Permite al Titular ingresar, editar y listar seguros, indicando aseguradora, N° de póliza, monto y ubicación física. |
| **RF-02** | Designación de albaceas | Permite al Titular agregar contactos de confianza ingresando RUT, nombre, parentesco y correo. |
| **RF-03** | Mensajes póstumos privados | Permite al Titular escribir notas asociadas al RUT de un beneficiario, selladas hasta la apertura de la bóveda. |
| **RF-04** | Check-in de vigencia | Permite confirmar actividad en la plataforma mediante un botón de revisión periódica. |
| **RF-05** | Solicitud de apertura | Permite al Albacea solicitar la liberación ingresando el RUT del titular y adjuntando certificado de defunción. |
| **RF-06** | Cancelación por gracia | Notifica al titular ante una solicitud de apertura, permitiéndole frenar el proceso en un plazo límite. |
| **RF-07** | Guía de cobro de seguros | Muestra al Albacea la lista de seguros liberados con datos de contacto y un checklist de trámites. |

### Requerimientos No Funcionales (RNF)
| ID | Categoría | Descripción |
|---|---|---|
| **RNF-01** | Usabilidad | Trámites esenciales deben completarse en un máximo de 3 pasos de navegación. |
| **RNF-02** | Integridad | Verificación de documentos mediante hash (SHA-256) al subirse al sistema. |
| **RNF-03** | Seguridad | Almacenamiento cifrado (AES-256) y gestión de sesiones mediante tokens JWT. |
| **RNF-04** | Rendimiento | Diseño responsivo y fluido en navegadores de escritorio y teléfonos móviles. |
| **RNF-05** | Auditoría | Registro inmutable con fecha, hora e IP de todos los eventos críticos del sistema. |

## 9. Instrucciones de Instalación y Configuración
