const crypto = require('crypto');
require('dotenv').config();

// Obtenemos la clave secreta desde las variables de entorno
const SECRET_KEY = process.env.AES_SECRET_KEY;
const ALGORITHM = 'aes-256-cbc';

// Validamos que la clave exista y tenga la longitud correcta (32 bytes para AES-256)
if (!SECRET_KEY || Buffer.from(SECRET_KEY, 'hex').length !== 32) {
  throw new Error(
    'La variable de entorno AES_SECRET_KEY debe estar definida y ser una cadena hexadecimal de 64 caracteres (32 bytes).'
  );
}

const key = Buffer.from(SECRET_KEY, 'hex');

/**
 * Cifra un texto utilizando AES-256-CBC.
 */
function cifrarTexto(textoPlano) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let textoCifrado = cipher.update(textoPlano, 'utf8', 'hex');
  textoCifrado += cipher.final('hex');

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

/**
 * Cifra un archivo binario (Buffer) en reposo con AES-256-CBC.
 * Prefija el IV aleatorio de 16 bytes al inicio del buffer cifrado.
 */
function cifrarBuffer(bufferPlano) {
  if (!Buffer.isBuffer(bufferPlano)) {
    throw new Error('Se esperaba un Buffer para cifrar el archivo.');
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const cifrado = Buffer.concat([cipher.update(bufferPlano), cipher.final()]);
  return Buffer.concat([iv, cifrado]);
}

/**
 * Descifra en memoria un Buffer previamente cifrado con cifrarBuffer.
 */
function descifrarBuffer(bufferCifradoConIv) {
  if (!Buffer.isBuffer(bufferCifradoConIv) || bufferCifradoConIv.length <= 16) {
    throw new Error('El archivo cifrado está corrupto o incompleto.');
  }
  const iv = bufferCifradoConIv.subarray(0, 16);
  const contenidoCifrado = bufferCifradoConIv.subarray(16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(contenidoCifrado), decipher.final()]);
}

module.exports = {
  cifrarTexto,
  descifrarTexto,
  cifrarBuffer,
  descifrarBuffer,
};
