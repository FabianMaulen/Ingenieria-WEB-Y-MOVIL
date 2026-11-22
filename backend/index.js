require('dotenv').config();

const app = require('./app');
const { iniciarMotorVigilancia } = require('./services/vigilancia.service');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Baúl Eterno corriendo en el puerto ${PORT}`);
    iniciarMotorVigilancia();
  });
}

module.exports = app;
