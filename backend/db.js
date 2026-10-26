const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.connect()
    .then(() => console.log('Conexión a PostgreSQL establecida con éxito'))
    .catch(err => console.error('Error al conectar con la base de datos', err.stack));

module.exports = pool;