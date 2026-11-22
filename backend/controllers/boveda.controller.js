const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { obtenerIp } = require('../utils/validadores');
const { obtenerUrlFrontend } = require('../services/email.service');

// GET /api/boveda/kit-emergencia
// Genera un documento discreto y privado en PDF ("constancia de existencia + QR de acceso").
// NO expone montos, aseguradoras, correos, instrucciones privadas ni cartas selladas.
exports.descargarKitEmergencia = async (req, res) => {
  try {
    const idUsuario = req.user.id;

    const [userRes, conteosRes] = await Promise.all([
      db.query(
        `SELECT id_usuario, rut, nombre_usuario, boveda_activa
         FROM USUARIO
         WHERE id_usuario = $1`,
        [idUsuario]
      ),
      db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM DIRECTORIO_ALBACEAS WHERE id_titular = $1 AND estado_validacion <> 'RECHAZADO') AS total_albaceas,
           (SELECT COUNT(*)::int FROM POLIZA WHERE id_usuario = $1) AS total_polizas,
           (SELECT COUNT(*)::int FROM INVENTARIO WHERE id_usuario = $1) AS total_inventario,
           (SELECT COUNT(*)::int FROM MENSAJE_POSTUMO WHERE id_usuario = $1) AS total_cartas`,
        [idUsuario]
      ),
    ]);

    const titular = userRes.rows[0];
    if (!titular) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    const c = conteosRes.rows[0] || {
      total_albaceas: 0,
      total_polizas: 0,
      total_inventario: 0,
      total_cartas: 0,
    };

    const totalAlbaceas = Number(c.total_albaceas) || 0;
    const totalPolizas = Number(c.total_polizas) || 0;
    const totalInventario = Number(c.total_inventario) || 0;
    const totalCartas = Number(c.total_cartas) || 0;

    const urlBase = obtenerUrlFrontend();
    const urlConsultaFamiliar = `${urlBase}/consulta-familiar`;
    const qrBuffer = await QRCode.toBuffer(urlConsultaFamiliar, {
      type: 'png',
      width: 220,
      margin: 1,
      color: { dark: '#194580', light: '#ffffff' },
    });

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 46 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const azul = '#194580';
      const nogal = '#7a553a';
      const texto = '#1e293b';
      const gris = '#475569';
      const borde = '#cbd5e1';
      const anchoUtil = doc.page.width - 92;

      // Encabezado sobrio y elegante
      doc.rect(0, 0, doc.page.width, 104).fill(azul);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('BAÚL ETERNO', 46, 26);
      doc
        .fillColor('#e2cdb7')
        .font('Helvetica')
        .fontSize(10)
        .text('Resguardo hoy, tranquilidad mañana', 46, 53);
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(11.5)
        .text('AVISO CONFIDENCIAL DE EXISTENCIA DE BÓVEDA', 46, 74);

      const fechaEmision = new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      doc
        .fillColor('#dbeafe')
        .font('Helvetica')
        .fontSize(8.5)
        .text(`Emitido el ${fechaEmision}`, 46, 28, { width: anchoUtil, align: 'right' });
      doc
        .fillColor('#fef3c7')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(
          titular.boveda_activa ? 'ESTADO: BÓVEDA ACTIVA Y SELLADA' : 'ESTADO: EN PREPARACIÓN',
          46,
          44,
          { width: anchoUtil, align: 'right' }
        );

      // Mensaje introductorio breve y humano
      doc.y = 126;
      doc
        .fillColor(texto)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('Si encontraste este documento, lee estas indicaciones', 46, doc.y);
      doc.moveDown(0.4);
      doc
        .fillColor(gris)
        .font('Helvetica')
        .fontSize(10)
        .text(
          `Este documento deja constancia de que ${titular.nombre_usuario} mantiene información patrimonial, instrucciones y/o recuerdos resguardados de forma privada en Baúl Eterno. Por seguridad, aquí NO se incluyen montos, pólizas, contraseñas ni cartas; todos los detalles permanecen cifrados y solo se entregan a las personas autorizadas.`,
          46,
          doc.y,
          { width: anchoUtil, lineGap: 3.5 }
        );

      doc.moveDown(1);

      // Tarjeta de identificación mínima (solo Nombre + RUT)
      const yId = doc.y;
      doc.roundedRect(46, yId, anchoUtil, 54, 8).fillAndStroke('#f8fafc', borde);
      doc.rect(46, yId, 5, 54).fill(nogal);

      doc.fillColor(gris).font('Helvetica-Bold').fontSize(8.5).text('TITULAR DE LA BÓVEDA', 64, yId + 11);
      doc.fillColor(texto).font('Helvetica-Bold').fontSize(12).text(titular.nombre_usuario, 64, yId + 26);

      doc.fillColor(gris).font('Helvetica-Bold').fontSize(8.5).text('RUT PARA CONSULTA', 350, yId + 11);
      doc
        .fillColor(azul)
        .font('Helvetica-Bold')
        .fontSize(12.5)
        .text(titular.rut || 'Consultar en plataforma', 350, yId + 26);

      doc.y = yId + 72;

      // Resumen discreto de existencia (solo conteos, cero datos sensibles)
      doc
        .fillColor(azul)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Contenido resguardado dentro de la bóveda (resumen privado)', 46, doc.y);
      doc.moveDown(0.5);

      const yCards = doc.y;
      const gap = 10;
      const cardW = (anchoUtil - gap * 3) / 4;
      const resumenItems = [
        { valor: String(totalAlbaceas), etiqueta: 'Albacea(s)\ndesignados' },
        { valor: String(totalPolizas), etiqueta: 'Póliza(s)\nde seguro' },
        { valor: String(totalInventario), etiqueta: 'Activo(s) en\ninventario' },
        { valor: String(totalCartas), etiqueta: 'Carta(s) y/o\narchivos' },
      ];

      resumenItems.forEach((item, idx) => {
        const x = 46 + idx * (cardW + gap);
        doc.roundedRect(x, yCards, cardW, 66, 8).fillAndStroke('#f8fafc', borde);
        doc
          .fillColor(azul)
          .font('Helvetica-Bold')
          .fontSize(20)
          .text(item.valor, x, yCards + 10, { width: cardW, align: 'center' });
        doc
          .fillColor(gris)
          .font('Helvetica')
          .fontSize(8.2)
          .text(item.etiqueta, x + 4, yCards + 37, { width: cardW - 8, align: 'center' });
      });

      doc.y = yCards + 88;

      // Bloque protagonista: Código QR grande + pasos claros
      const yQrBox = doc.y;
      doc.roundedRect(46, yQrBox, anchoUtil, 218, 12).fillAndStroke('#eef4fb', '#93b4d8');

      doc
        .fillColor(azul)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('Escanea este código QR para revisar el paso a paso', 64, yQrBox + 18, {
          width: anchoUtil - 36,
        });

      // QR a la derecha con marco blanco
      const qrSize = 140;
      const qrX = doc.page.width - 46 - qrSize - 22;
      const qrY = yQrBox + 48;
      doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8).fillAndStroke('#ffffff', borde);
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // Instrucciones a la izquierda
      const anchoPasos = anchoUtil - qrSize - 64;
      doc
        .fillColor(texto)
        .font('Helvetica-Bold')
        .fontSize(9.8)
        .text('1. Si fuiste designado como Albacea:', 64, yQrBox + 48, { width: anchoPasos });
      doc
        .fillColor(gris)
        .font('Helvetica')
        .fontSize(9)
        .text(
          'Ingresa con tu cuenta a Baúl Eterno, cambia a modo "Albacea" y solicita la apertura de la bóveda para recibir la guía y archivos.',
          64,
          yQrBox + 63,
          { width: anchoPasos, lineGap: 2.5 }
        );

      doc
        .fillColor(texto)
        .font('Helvetica-Bold')
        .fontSize(9.8)
        .text('2. Si eres familiar y aún no tienes cuenta:', 64, yQrBox + 104, { width: anchoPasos });
      doc
        .fillColor(gris)
        .font('Helvetica')
        .fontSize(9)
        .text(
          `Escanea el código QR (o entra al enlace de abajo) e ingresa el RUT ${titular.rut || 'del titular'} para iniciar la consulta familiar.`,
          64,
          yQrBox + 119,
          { width: anchoPasos, lineGap: 2.5 }
        );

      doc
        .fillColor(texto)
        .font('Helvetica-Bold')
        .fontSize(9.8)
        .text('3. Verificación y entrega segura:', 64, yQrBox + 158, { width: anchoPasos });
      doc
        .fillColor(gris)
        .font('Helvetica')
        .fontSize(9)
        .text(
          'Baúl Eterno activará el plazo de gracia de seguridad y liberará los detalles, cartas y archivos únicamente a quienes corresponda.',
          64,
          yQrBox + 173,
          { width: anchoPasos, lineGap: 2.5 }
        );

      // Enlace explícito bajo el bloque QR
      doc.y = yQrBox + 234;
      doc
        .fillColor(gris)
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('Enlace directo al portal familiar:', 46, doc.y, { width: anchoUtil, align: 'center' });
      doc
        .fillColor(azul)
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .text(urlConsultaFamiliar, 46, doc.y + 3, { width: anchoUtil, align: 'center' });

      // Pie de página discreto
      doc
        .fillColor('#64748b')
        .font('Helvetica')
        .fontSize(8.2)
        .text(
          'Guarda este documento en una carpeta física o compártelo solo con personas de tu confianza.\n' +
            'Baúl Eterno · Privacidad garantizada: ningún dato sensible ni archivo cifrado figura impreso en esta hoja.',
          46,
          doc.page.height - 74,
          { width: anchoUtil, align: 'center', lineGap: 3 }
        );

      doc.end();
    });

    await registrarAuditoria('Descargó su aviso/kit de emergencia discreto (PDF con QR)', obtenerIp(req), idUsuario);

    const rutArchivo = (titular.rut || `usuario-${idUsuario}`).replace(/[^0-9kK\-]/g, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Aviso-Boveda-Baul-Eterno-${rutArchivo}.pdf"`
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar Kit de Emergencia PDF:', error);
    return enviarRespuesta(
      res,
      500,
      'Error interno del servidor al generar el Kit de Emergencia en PDF.',
      null
    );
  }
};
