const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { obtenerIp } = require('../utils/validadores');
const { obtenerUrlFrontend } = require('../services/email.service');

const formatearClp = (valor) => `$${Math.round(Number(valor) || 0).toLocaleString('es-CL')} CLP`;

// GET /api/boveda/kit-emergencia
// Genera al vuelo el Kit de Emergencia Patrimonial en formato PDF con código QR al portal familiar.
exports.descargarKitEmergencia = async (req, res) => {
  try {
    const idUsuario = req.user.id;

    const [userRes, albaceasRes, polizasRes, inventarioRes, mensajesRes] = await Promise.all([
      db.query(
        `SELECT id_usuario, rut, nombre_usuario, correo_usuario, correo_verificado,
                correo_alternativo, nombre_contacto_confianza, correo_contacto_confianza,
                boveda_activa, terminos_aceptados_en, frecuencia_checkin_dias, plazo_gracia_dias,
                fecha_ultimo_checkin
         FROM USUARIO
         WHERE id_usuario = $1`,
        [idUsuario]
      ),
      db.query(
        `SELECT COALESCE(u.nombre_usuario, d.nombre_albacea) AS nombre,
                COALESCE(u.correo_usuario, d.email_albacea) AS correo,
                d.rut_albacea, d.parentesco, d.estado_validacion
         FROM DIRECTORIO_ALBACEAS d
         LEFT JOIN USUARIO u ON u.id_usuario = d.id_usuario_invitado
         WHERE d.id_titular = $1 AND d.estado_validacion <> 'RECHAZADO'
         ORDER BY d.id_directorio ASC`,
        [idUsuario]
      ),
      db.query(
        `SELECT tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica,
                monto_referencial, (documento_cifrado IS NOT NULL) AS tiene_documento
         FROM POLIZA
         WHERE id_usuario = $1
         ORDER BY id_poliza ASC`,
        [idUsuario]
      ),
      db.query(
        `SELECT plataforma, categoria, instruccion
         FROM INVENTARIO
         WHERE id_usuario = $1
         ORDER BY id_inventario ASC`,
        [idUsuario]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total_cartas
         FROM MENSAJE_POSTUMO
         WHERE id_usuario = $1`,
        [idUsuario]
      ),
    ]);

    const titular = userRes.rows[0];
    if (!titular) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    const albaceas = albaceasRes.rows || [];
    const polizas = polizasRes.rows || [];
    const inventario = inventarioRes.rows || [];
    const totalCartas = Number(mensajesRes.rows[0]?.total_cartas) || 0;

    const urlBase = obtenerUrlFrontend();
    const urlConsultaFamiliar = `${urlBase}/consulta-familiar`;
    const qrBuffer = await QRCode.toBuffer(urlConsultaFamiliar, {
      type: 'png',
      width: 140,
      margin: 1,
      color: { dark: '#194580', light: '#ffffff' },
    });

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const azul = '#194580';
      const nogal = '#7a553a';
      const texto = '#1e293b';
      const gris = '#64748b';
      const borde = '#cbd5e1';
      const anchoUtil = doc.page.width - 84;

      // Encabezado oficial
      doc.rect(0, 0, doc.page.width, 96).fill(azul);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('BAÚL ETERNO', 42, 24);
      doc
        .fillColor('#e2cdb7')
        .font('Helvetica')
        .fontSize(9.5)
        .text('Resguardo hoy, tranquilidad mañana', 42, 49);
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('KIT DE EMERGENCIA PATRIMONIAL', 42, 68);

      const fechaEmision = new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      doc
        .fillColor('#dbeafe')
        .font('Helvetica')
        .fontSize(8.5)
        .text(`Emitido el ${fechaEmision}`, 42, 26, { width: anchoUtil, align: 'right' });
      doc
        .fillColor('#fef3c7')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(
          titular.boveda_activa ? 'ESTADO: BÓVEDA ACTIVA Y SELLADA' : 'ESTADO: EN PREPARACIÓN',
          42,
          42,
          { width: anchoUtil, align: 'right' }
        );

      doc.y = 114;

      const dibujarTituloSeccion = (titulo) => {
        if (doc.y > 700) doc.addPage();
        doc.moveDown(0.3);
        const yTitulo = doc.y;
        doc.rect(42, yTitulo, 4, 14).fill(nogal);
        doc
          .fillColor(azul)
          .font('Helvetica-Bold')
          .fontSize(11.5)
          .text(titulo, 52, yTitulo + 1);
        doc.moveDown(0.5);
      };

      // 1. Datos del Titular y Protocolo de Vigencia
      dibujarTituloSeccion('1. Identificación del Titular y Protocolo de Vigencia');
      const yBox1 = doc.y;
      doc.roundedRect(42, yBox1, anchoUtil, 82, 6).fillAndStroke('#f8fafc', borde);

      doc.fillColor(texto).font('Helvetica-Bold').fontSize(9.5).text('Titular:', 54, yBox1 + 10);
      doc.font('Helvetica').text(`${titular.nombre_usuario}`, 108, yBox1 + 10);
      doc.font('Helvetica-Bold').text('RUT:', 330, yBox1 + 10);
      doc.font('Helvetica').text(`${titular.rut || 'Sin registrar'}`, 365, yBox1 + 10);

      doc.font('Helvetica-Bold').text('Correo:', 54, yBox1 + 28);
      doc
        .font('Helvetica')
        .text(
          `${titular.correo_usuario}${titular.correo_alternativo ? `  |  Respaldo: ${titular.correo_alternativo}` : ''}`,
          108,
          yBox1 + 28,
          { width: anchoUtil - 70 }
        );

      doc.font('Helvetica-Bold').text('Vigencia:', 54, yBox1 + 46);
      doc
        .font('Helvetica')
        .text(
          `Check-in cada ${titular.frecuencia_checkin_dias || 180} días  ·  Plazo de gracia: ${titular.plazo_gracia_dias || 7} días`,
          108,
          yBox1 + 46
        );

      doc.font('Helvetica-Bold').text('Aviso 48h:', 54, yBox1 + 63);
      doc
        .font('Helvetica')
        .text(
          titular.correo_contacto_confianza
            ? `${titular.nombre_contacto_confianza || 'Contacto de confianza'} (${titular.correo_contacto_confianza})`
            : 'No configurado aún',
          108,
          yBox1 + 63
        );

      doc.y = yBox1 + 92;

      // 2. Red de Albaceas Designados
      dibujarTituloSeccion(`2. Red de Albaceas Designados (${albaceas.length} de 5)`);
      if (albaceas.length === 0) {
        doc
          .fillColor(gris)
          .font('Helvetica-Oblique')
          .fontSize(9)
          .text('Aún no se han designado albaceas en esta bóveda.', 48);
      } else {
        albaceas.forEach((a, idx) => {
          if (doc.y > 740) doc.addPage();
          doc
            .fillColor(texto)
            .font('Helvetica-Bold')
            .fontSize(9.2)
            .text(`${idx + 1}. ${a.nombre} (${a.parentesco})`, 48, doc.y, { continued: true })
            .fillColor(gris)
            .font('Helvetica')
            .text(` — RUT ${a.rut_albacea} · ${a.correo} · Estado: ${a.estado_validacion}`);
        });
      }
      doc.moveDown(0.5);

      // 3. Resumen de Pólizas de Seguro
      const sumaCobertura = polizas.reduce((acc, p) => acc + (Number(p.monto_referencial) || 0), 0);
      dibujarTituloSeccion(
        `3. Resumen de Pólizas de Seguro (${polizas.length} · Cobertura ref.: ${formatearClp(sumaCobertura)})`
      );
      if (polizas.length === 0) {
        doc
          .fillColor(gris)
          .font('Helvetica-Oblique')
          .fontSize(9)
          .text('No hay pólizas registradas al momento de emitir este documento.', 48);
      } else {
        polizas.forEach((p, idx) => {
          if (doc.y > 725) doc.addPage();
          doc
            .fillColor(texto)
            .font('Helvetica-Bold')
            .fontSize(9.2)
            .text(`${idx + 1}. ${p.aseguradora} — ${p.tipo_seguro}`, 48, doc.y, { continued: true })
            .fillColor(azul)
            .text(` (${formatearClp(p.monto_referencial)})`);
          doc
            .fillColor(gris)
            .font('Helvetica')
            .fontSize(8.5)
            .text(
              `   Póliza N° ${p.numero_poliza}  ·  Ubicación: ${p.ubicacion_fisica}${p.tiene_documento ? '  ·  [Respaldo digital cifrado adjunto]' : ''}`,
              48
            );
          doc.moveDown(0.2);
        });
      }
      doc.moveDown(0.4);

      // 4. Inventario Digital y Cartas Póstumas
      dibujarTituloSeccion(`4. Inventario Digital (${inventario.length}) y Cartas Póstumas Selladas (${totalCartas})`);
      if (inventario.length === 0) {
        doc
          .fillColor(gris)
          .font('Helvetica-Oblique')
          .fontSize(9)
          .text('No hay activos registrados en el inventario digital al emitir este documento.', 48);
      } else {
        inventario.forEach((item, idx) => {
          if (doc.y > 730) doc.addPage();
          const resumenInstr = String(item.instruccion || '').replace(/\s+/g, ' ').slice(0, 140);
          doc
            .fillColor(texto)
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(`${idx + 1}. ${item.plataforma} [${item.categoria}]: `, 48, doc.y, { continued: true })
            .fillColor(gris)
            .font('Helvetica')
            .text(resumenInstr + (String(item.instruccion || '').length > 140 ? '...' : ''));
        });
      }
      doc.moveDown(0.35);
      doc
        .fillColor(nogal)
        .font('Helvetica-Bold')
        .fontSize(8.8)
        .text(
          `Custodia de cartas póstumas: ${totalCartas} carta(s) cifrada(s) resguardada(s). Por privacidad, su contenido jamás se imprime aquí y solo se revela tras la liberación oficial de la bóveda.`,
          48,
          doc.y,
          { width: anchoUtil - 12 }
        );
      doc.moveDown(0.7);

      // 5. Instrucciones para la familia + Código QR
      if (doc.y > 620) doc.addPage();
      dibujarTituloSeccion('5. Cómo activar la apertura en caso de contingencia');
      const yQrBox = doc.y;
      doc.roundedRect(42, yQrBox, anchoUtil, 118, 8).fillAndStroke('#f1f5f9', borde);

      doc.image(qrBuffer, doc.page.width - 42 - 108, yQrBox + 11, { width: 96, height: 96 });

      const anchoTextoQr = anchoUtil - 135;
      doc
        .fillColor(texto)
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text('Pasos para Albaceas o Familiares:', 54, yQrBox + 12, { width: anchoTextoQr });
      doc
        .fillColor(gris)
        .font('Helvetica')
        .fontSize(8.5)
        .text(
          `1. Si eres Albacea registrado, ingresa con tu cuenta a Baúl Eterno, cambia a modo "Albacea" y presiona "Solicitar apertura".\n` +
            `2. Si eres un familiar aún sin cuenta, escanea el código QR o ingresa a:\n   ${urlConsultaFamiliar}\n` +
            `3. Ingresa el RUT del titular (${titular.rut || 'registrado'}) y adjunta el certificado de defunción para iniciar el plazo de gracia y liberar la guía de cobro.`,
          54,
          yQrBox + 29,
          { width: anchoTextoQr, lineGap: 3 }
        );

      doc.y = yQrBox + 130;
      doc
        .fillColor('#94a3b8')
        .font('Helvetica')
        .fontSize(7.8)
        .text(
          'Documento de orientación confidencial generado por Baúl Eterno. No contiene contraseñas ni el texto de cartas póstumas selladas. Guarda esta copia en un lugar seguro.',
          42,
          Math.min(doc.y, doc.page.height - 56),
          { width: anchoUtil, align: 'center' }
        );

      doc.end();
    });

    await registrarAuditoria('Descargó su Kit de Emergencia patrimonial en PDF', obtenerIp(req), idUsuario);

    const rutArchivo = (titular.rut || `usuario-${idUsuario}`).replace(/[^0-9kK\-]/g, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Kit-Emergencia-Baul-Eterno-${rutArchivo}.pdf"`
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
