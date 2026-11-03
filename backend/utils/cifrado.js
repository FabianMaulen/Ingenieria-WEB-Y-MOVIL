const crypto = require('crypto');
require('dotenv').config();

// Obtenemos la clave secreta desde las variables de entorno
const SECRET_KEY = process.env.AES_SECRET_KEY;
const ALGORITHM = 'aes-256-cbc';

// Validamos que la clave exista y tenga la longitud correcta (32 bytes para AES-256)
if (!SECRET_KEY || Buffer.from(SECRET_KEY, 'hex').length !== 32) {
    throw new Error('La variable de entorno AES_SECRET_KEY debe estar definida y ser una cadena hexadecimal de 64 caracteres (32 bytes).');
}

const key = Buffer.from(SECRET_KEY, 'hex');

/**
 * Cifra un texto utilizando AES-256-CBC.
 */
function cifrarTexto(textoPlano) {
    // Generamos un Vector de Inicialización (IV) aleatorio de 16 bytes
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let textoCifrado = cipher.update(textoPlano, 'utf8', 'hex');
    textoCifrado += cipher.final('hex');
    
    // Retornamos el IV y el texto cifrado, separados por dos puntos (:)
    return `${iv.toString('hex')}:${textoCifrado}`;
}

/**
 * Descifra un texto previamente cifrado con la función cifrarTexto.
 */
function descifrarTexto(textoCifradoConIV) {
    const partes = textoCifradoConIV.split(':');
    const iv = Buffer.from(partes[0], 'hex');
    const textoCifrado = partes[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let textoDescifrado = decipher.update(textoCifrado, 'hex', 'utf8');
    textoDescifrado += decipher.final('utf8');
    
    return textoDescifrado;
}

module.exports = {
    cifrarTexto,
    descifrarTexto
};