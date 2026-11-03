// Guardar como backend/utils/aseguradoras.js

// Catálogo precargado con las principales compañías aseguradoras de Chile.
// Incluye datos de contacto reales para facilitar el trámite del Albacea (RF-07).
const CONTACTOS = {
    'consorcio': { 
        telefono: '600 221 3000', 
        web: 'https://www.consorcio.cl', 
        correo: 'siniestros@consorcio.cl' 
    },
    'bci seguros': { 
        telefono: '600 600 0224', 
        web: 'https://www.bciseguros.cl', 
        correo: 'denuncios@bciseguros.cl' 
    },
    'metlife': { 
        telefono: '600 390 3000', 
        web: 'https://www.metlife.cl', 
        correo: 'contacto@metlife.cl' 
    },
    'sura': { 
        telefono: '600 411 1000', 
        web: 'https://www.segurosura.cl', 
        correo: 'contactosura@suraseguros.cl' 
    },
    'mapfre': { 
        telefono: '600 700 4000', 
        web: 'https://www.mapfre.cl', 
        correo: 'siam@mapfre.cl' 
    },
    'zurich': { // Ex Chilena Consolidada
        telefono: '600 600 8000', 
        web: 'https://www.zurich.cl', 
        correo: 'siniestros@zurich.cl' 
    },
    'falabella': { 
        telefono: '600 390 1000', 
        web: 'https://www.segurosfalabella.com/cl', 
        correo: 'contactoseguros@falabella.cl' 
    },
    'bnp paribas': {
        telefono: '600 484 0000',
        web: 'https://cardif.cl',
        correo: 'atencionclientes@cardif.cl'
    }
};

/**
 * Busca los datos de contacto de una aseguradora.
 * Si no encuentra una coincidencia exacta, busca de forma flexible dentro del texto.
 */
exports.contactoAseguradora = (nombre) => {
    if (!nombre) return null;
    
    const nombreLimpio = String(nombre).trim().toLowerCase();
    
    // 1. Búsqueda exacta directa (Más rápida)
    if (CONTACTOS[nombreLimpio]) {
        return CONTACTOS[nombreLimpio];
    }

    // 2. Búsqueda flexible (Por si el titular escribió "Seguro de auto Mapfre")
    for (const [clave, datos] of Object.entries(CONTACTOS)) {
        if (nombreLimpio.includes(clave)) {
            return datos;
        }
    }

    // 3. Si no hay coincidencias, devuelve null para que el frontend lo maneje
    return null; 
};