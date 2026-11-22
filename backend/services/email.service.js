const nodemailer = require('nodemailer');

let transporterCache = null;

function estaConfiguradoSmtp() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function obtenerUrlFrontend() {
  return (process.env.FRONTEND_URL || 'http://localhost:8100').split(',')[0].trim();
}

function obtenerTransporter() {
  if (!estaConfiguradoSmtp()) return null;
  if (transporterCache) return transporterCache;

  const port = Number(process.env.SMTP_PORT || 587);
  transporterCache = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporterCache;
}

function envolverPlantillaHtml(titulo, cuerpoHtml, colorHeader = '#173d70') {
  const colorHeader2 = colorHeader === '#991b1b' ? '#dc2626' : '#265ea8';
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f7fb;padding:28px 16px;color:#1e293b;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #d9e2ec;overflow:hidden;">
      <div style="background:linear-gradient(135deg,${colorHeader} 0%,${colorHeader2} 100%);padding:22px 26px;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#d6c0a8;font-weight:700;">Baúl Eterno</div>
        <h2 style="margin:6px 0 0 0;font-size:20px;font-weight:700;">${titulo}</h2>
      </div>
      <div style="padding:24px 26px;font-size:14px;line-height:1.6;color:#334155;">
        ${cuerpoHtml}
      </div>
      <div style="padding:14px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
        Este es un mensaje automático de Baúl Eterno — Plataforma de Legado Personal.
      </div>
    </div>
  </div>`;
}

/**
 * Envía correo de forma segura (no lanza excepción si falla el SMTP para no interrumpir flujos críticos).
 * Si SMTP_USER/SMTP_PASS no están configurados aún, muestra una vista previa en la consola del servidor.
 */
async function enviarCorreo({ para, asunto, html, texto }) {
  const destinatarios = (Array.isArray(para) ? para : [para])
    .map((c) => String(c || '').trim().toLowerCase())
    .filter(Boolean);
  const unicos = [...new Set(destinatarios)];

  if (unicos.length === 0) return { enviado: false, modo: 'sin-destinatario' };

  const transporter = obtenerTransporter();
  if (!transporter) {
    console.log(`\n[EMAIL SIMULADO -> ${unicos.join(', ')}] Asunto: ${asunto}\n${texto || ''}\n`);
    return { enviado: false, modo: 'simulado-consola', destinatarios: unicos };
  }

  try {
    const remitente = process.env.SMTP_FROM || `Baúl Eterno <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
      from: remitente,
      to: unicos.join(', '),
      subject: asunto,
      text: texto,
      html,
    });
    return { enviado: true, modo: 'smtp', messageId: info.messageId, destinatarios: unicos };
  } catch (error) {
    console.error(`[EMAIL ERROR -> ${unicos.join(', ')}]`, error.message);
    return { enviado: false, modo: 'error', error: error.message };
  }
}

exports.enviarBienvenida = async ({ correo, nombre, designacionesVinculadas = 0 }) => {
  const extra =
    designacionesVinculadas > 0
      ? `<p style="background:#eef4fb;border-left:4px solid #1e5091;padding:12px 14px;border-radius:6px;">
           <strong>¡Aviso importante!</strong> Detectamos <strong>${designacionesVinculadas}</strong> designación(es) previa(s) como albacea asociadas a tu RUT. Ya están disponibles en tu <em>Panel Albacea</em>.
         </p>`
      : '';

  return enviarCorreo({
    para: correo,
    asunto: 'Bienvenido a Baúl Eterno — Tu bóveda personal está lista',
    texto: `Hola ${nombre}, tu cuenta en Baúl Eterno fue creada con éxito.${designacionesVinculadas > 0 ? ` Se vincularon ${designacionesVinculadas} designaciones como albacea.` : ''}`,
    html: envolverPlantillaHtml(
      '¡Bienvenido a Baúl Eterno!',
      `<p>Hola <strong>${nombre}</strong>,</p>
       <p>Tu bóveda personal ya se encuentra activa. Desde hoy puedes registrar tus pólizas de seguro, activos digitales, mensajes póstumos cifrados con AES-256 y designar a tus albaceas de confianza.</p>
       ${extra}
       <p>Te recomendamos configurar tu frecuencia de check-in y un correo alternativo o contacto de confianza desde <strong>Ajustes y Clave</strong>.</p>`
    ),
  });
};

exports.enviarConfirmacionCorreo = async ({ correo, nombre, tipo = 'PRINCIPAL', codigo, enlaceConfirmacion }) => {
  const etiqueta = tipo === 'ALTERNATIVO' ? 'correo alternativo de respaldo' : 'correo electrónico principal';
  return enviarCorreo({
    para: correo,
    asunto: `Confirma tu ${etiqueta} — Baúl Eterno`,
    texto: `Hola ${nombre}, confirma tu ${etiqueta} en Baúl Eterno usando el código ${codigo} o abriendo: ${enlaceConfirmacion}`,
    html: envolverPlantillaHtml(
      `Confirma tu ${etiqueta}`,
      `<p>Hola <strong>${nombre}</strong>,</p>
       <p>Para asegurar que recibas oportunamente tus recordatorios de check-in y alertas críticas de seguridad, confirma tu <strong>${etiqueta}</strong> ingresando este código en <em>Ajustes y Clave</em> (válido por 24 horas):</p>
       <div style="text-align:center;margin:20px 0;">
         <span style="display:inline-block;font-size:28px;font-weight:800;letter-spacing:6px;padding:12px 24px;background:#eef3f8;border:1px solid #cbd5e1;border-radius:10px;color:#1e5091;">
           ${codigo}
         </span>
       </div>
       <p style="text-align:center;margin:18px 0;">
         <a href="${enlaceConfirmacion}" style="display:inline-block;background:#1e5091;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:9px;font-weight:700;">
           Confirmar correo automáticamente
         </a>
       </p>
       <p style="font-size:12px;color:#64748b;">Si no registraste este correo en Baúl Eterno, puedes ignorar este mensaje.</p>`
    ),
  });
};

exports.enviarAlertaCambioPassword = async ({ correo, correoAlternativo, nombre }) => {
  const urlApp = obtenerUrlFrontend();
  const fecha = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
  return enviarCorreo({
    para: [correo, correoAlternativo],
    asunto: 'Aviso de seguridad: tu contraseña de Baúl Eterno fue modificada',
    texto: `Hola ${nombre}, te informamos que tu contraseña de Baúl Eterno fue modificada el ${fecha}. Si no fuiste tú, recupérala de inmediato en ${urlApp}/recuperar.`,
    html: envolverPlantillaHtml(
      'Tu contraseña fue actualizada',
      `<p>Hola <strong>${nombre}</strong>,</p>
       <p>Confirmamos que la contraseña de acceso a tu bóveda en <strong>Baúl Eterno</strong> fue cambiada el <strong>${fecha}</strong>.</p>
       <p style="background:#fef3c7;border-left:4px solid #b45309;padding:12px 14px;border-radius:6px;color:#78350f;">
         <strong>¿No reconoces esta actividad?</strong> Restablece tu acceso inmediatamente desde <a href="${urlApp}/recuperar">${urlApp}/recuperar</a>.
       </p>`
    ),
  });
};

exports.enviarInvitacionAlbacea = async ({
  correoAlbacea,
  nombreAlbacea,
  nombreTitular,
  parentesco,
  registrado,
}) => {
  const urlApp = obtenerUrlFrontend();
  const instrucciones = registrado
    ? `<p>Ingresa a tu cuenta de <strong>Baúl Eterno</strong> y cambia al <strong>Panel Albacea</strong> para aceptar o rechazar esta designación.</p>`
    : `<p>Aún no tienes una cuenta en la plataforma. Cuando te registres en <a href="${urlApp}/register">${urlApp}/register</a> usando tu RUT chileno, esta designación se vinculará automáticamente a tu cuenta.</p>`;

  return enviarCorreo({
    para: correoAlbacea,
    asunto: `${nombreTitular} te ha designado como Albacea en Baúl Eterno`,
    texto: `Hola ${nombreAlbacea}, ${nombreTitular} te designó como su albacea (${parentesco}) en Baúl Eterno. Ingresa en ${urlApp} para gestionar tu designación.`,
    html: envolverPlantillaHtml(
      'Has sido designado como Albacea',
      `<p>Hola <strong>${nombreAlbacea}</strong>,</p>
       <p><strong>${nombreTitular}</strong> te ha designado como persona de confianza (<strong>${parentesco}</strong>) en su bóveda de <strong>Baúl Eterno</strong>.</p>
       ${instrucciones}`
    ),
  });
};

exports.enviarRespuestaDesignacion = async ({ correoTitular, nombreTitular, nombreAlbacea, estado }) => {
  const aceptada = estado === 'VALIDADO';
  return enviarCorreo({
    para: correoTitular,
    asunto: `Actualización de Albacea: ${nombreAlbacea} ${aceptada ? 'aceptó' : 'rechazó'} tu designación`,
    texto: `Hola ${nombreTitular}, ${nombreAlbacea} ha ${aceptada ? 'aceptado (VALIDADO)' : 'rechazado (RECHAZADO)'} tu designación como albacea en Baúl Eterno.`,
    html: envolverPlantillaHtml(
      aceptada ? 'Designación de Albacea Confirmada' : 'Designación de Albacea Rechazada',
      `<p>Hola <strong>${nombreTitular}</strong>,</p>
       <p>Te informamos que <strong>${nombreAlbacea}</strong> ha <strong>${aceptada ? 'aceptado' : 'rechazado'}</strong> tu designación como albacea en Baúl Eterno.</p>
       <p>Puedes revisar tu directorio de albaceas en cualquier momento desde tu panel principal.</p>`
    ),
  });
};

exports.enviarAlertaApertura = async ({
  correoTitular,
  correoAlternativo,
  nombreTitular,
  nombreAlbacea,
  plazoHoras = 168,
  esReintento = false,
}) => {
  const urlApp = obtenerUrlFrontend();
  const plazoTexto =
    plazoHoras >= 24 ? `${Math.round(plazoHoras / 24)} día(s) (${plazoHoras} horas)` : `${plazoHoras} horas`;

  return enviarCorreo({
    para: [correoTitular, correoAlternativo],
    asunto: esReintento
      ? 'RECORDATORIO URGENTE: Confirma tu presencia para cancelar apertura de tu Baúl Eterno'
      : 'ALERTA CRÍTICA: Solicitud de apertura registrada en tu Baúl Eterno',
    texto: `ALERTA: ${nombreAlbacea} inició una solicitud de apertura de tu Baúl Eterno. Dispones de ${plazoTexto} para anularla realizando tu check-in en ${urlApp}/dashboard.`,
    html: envolverPlantillaHtml(
      esReintento ? 'Recordatorio Urgente de Seguridad' : 'Alerta Crítica de Seguridad',
      `<p>Hola <strong>${nombreTitular}</strong>,</p>
       <p style="background:#fee2e2;border-left:4px solid #b91c1c;padding:12px 14px;border-radius:6px;color:#7f1d1d;">
         <strong>${nombreAlbacea}</strong> ha ingresado una solicitud de apertura por contingencia sobre tu bóveda.
       </p>
       <p>Para proteger tu información, activamos un <strong>periodo de gracia de ${plazoTexto}</strong>. Si continúas activo y esto fue un error, solo debes ingresar a tu cuenta y presionar <strong>Confirmar Presencia (Check-in)</strong> o <strong>Anular solicitud</strong>.</p>
       <p style="text-align:center;margin:20px 0;">
         <a href="${urlApp}/dashboard" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:9px;font-weight:700;">
           Ir a mi Baúl y confirmar presencia
         </a>
       </p>`,
      '#991b1b'
    ),
  });
};

exports.enviarAvisoContactoConfianza = async ({
  correoContacto,
  nombreContacto,
  correoTitular,
  correoAlternativo,
  nombreTitular,
  motivo,
  horasRestantes = 48,
}) => {
  const urlApp = obtenerUrlFrontend();
  const saludoContacto = nombreContacto ? `${nombreContacto}` : 'Contacto de confianza';

  const envios = [];
  if (correoContacto) {
    envios.push(
      enviarCorreo({
        para: correoContacto,
        asunto: `AVISO FINAL (48h): Bóveda de ${nombreTitular} próxima a liberarse en Baúl Eterno`,
        texto: `Hola ${saludoContacto}, ${nombreTitular} te registró como contacto de confianza en Baúl Eterno. Motivo: ${motivo}. Quedan aprox. ${horasRestantes} horas antes de la apertura automática. Si ${nombreTitular} está bien, avísale para que ingrese a ${urlApp}/dashboard y realice su Check-in.`,
        html: envolverPlantillaHtml(
          'Aviso Final a Contacto de Confianza (48h)',
          `<p>Hola <strong>${saludoContacto}</strong>,</p>
           <p><strong>${nombreTitular}</strong> te registró como su <strong>persona de confianza</strong> en <strong>Baúl Eterno</strong> para recibir un aviso de última instancia antes de una apertura.</p>
           <p style="background:#fef3c7;border-left:4px solid #b45309;padding:12px 14px;border-radius:6px;color:#78350f;">
             <strong>Motivo:</strong> ${motivo}<br/>
             <strong>Tiempo restante estimado:</strong> ~${horasRestantes} horas antes de la liberación automática.
           </p>
           <p>Si sabes que <strong>${nombreTitular}</strong> se encuentra bien, por favor contáctalo para que ingrese a <a href="${urlApp}/dashboard">Baúl Eterno</a> y confirme su presencia (Check-in) para desactivar la apertura.</p>`,
          '#991b1b'
        ),
      })
    );
  }

  if (correoTitular || correoAlternativo) {
    envios.push(
      enviarCorreo({
        para: [correoTitular, correoAlternativo],
        asunto: 'ÚLTIMO AVISO (48h): Tu Baúl Eterno se liberará si no realizas Check-in',
        texto: `Hola ${nombreTitular}, quedan menos de ${horasRestantes} horas antes de que tu bóveda sea liberada (${motivo}). Ingresa a ${urlApp}/dashboard para realizar Check-in.`,
        html: envolverPlantillaHtml(
          'Último Aviso Antes de Liberación (48h)',
          `<p>Hola <strong>${nombreTitular}</strong>,</p>
           <p style="background:#fee2e2;border-left:4px solid #b91c1c;padding:12px 14px;border-radius:6px;color:#7f1d1d;">
             Quedan aproximadamente <strong>${horasRestantes} horas</strong> antes de la apertura automática de tu bóveda. Motivo: ${motivo}.
           </p>
           <p>También hemos notificado a tu contacto de confianza registrado. Si sigues activo, realiza tu Check-in de inmediato:</p>
           <p style="text-align:center;margin:18px 0;">
             <a href="${urlApp}/dashboard" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:9px;font-weight:700;">
               Confirmar Presencia ahora
             </a>
           </p>`,
          '#991b1b'
        ),
      })
    );
  }

  return Promise.all(envios);
};

exports.enviarRecordatorioCheckin = async ({
  correoTitular,
  correoAlternativo,
  nombreTitular,
  diasRestantes,
  frecuenciaDias,
}) => {
  const urlApp = obtenerUrlFrontend();
  return enviarCorreo({
    para: [correoTitular, correoAlternativo],
    asunto: `Recordatorio de Check-in: quedan ${diasRestantes} día(s) de vigencia en tu Baúl Eterno`,
    texto: `Hola ${nombreTitular}, tu ciclo de vigencia (${frecuenciaDias} días) en Baúl Eterno vence en ${diasRestantes} día(s). Ingresa a ${urlApp}/dashboard para confirmar tu presencia.`,
    html: envolverPlantillaHtml(
      'Recordatorio de Check-in de Vigencia',
      `<p>Hola <strong>${nombreTitular}</strong>,</p>
       <p>Te recordamos que tu ciclo configurado de <strong>${frecuenciaDias} días</strong> en Baúl Eterno vence en <strong>${diasRestantes} día(s)</strong>.</p>
       <p>Si el plazo finaliza sin confirmación de presencia, se activará el protocolo de liberación hacia tus albaceas designados. Renueva tu vigencia con un clic:</p>
       <p style="text-align:center;margin:18px 0;">
         <a href="${urlApp}/dashboard" style="display:inline-block;background:#1e5091;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:9px;font-weight:700;">
           Hacer Check-in ahora
         </a>
       </p>`
    ),
  });
};

exports.enviarNotificacionSolicitante = async ({
  correoSolicitante,
  nombreSolicitante,
  nombreTitular,
  estado,
  detalle,
}) => {
  const urlApp = obtenerUrlFrontend();
  const configuracion = {
    RECIBIDA: {
      asunto: 'Solicitud de apertura recibida — Baúl Eterno',
      titulo: 'Solicitud de Apertura Registrada',
      color: '#173d70',
    },
    CANCELADA_TITULAR: {
      asunto: 'Solicitud anulada: el titular confirmó estar activo — Baúl Eterno',
      titulo: 'Solicitud Anulada por el Titular',
      color: '#173d70',
    },
    APROBADA: {
      asunto: 'Bóveda liberada: solicitud de apertura aprobada — Baúl Eterno',
      titulo: 'Apertura de Bóveda Aprobada',
      color: '#173d70',
    },
    RECHAZADA: {
      asunto: 'Actualización de reporte de contingencia — Baúl Eterno',
      titulo: 'Reporte de Contingencia Rechazado',
      color: '#991b1b',
    },
  }[estado] || {
    asunto: 'Actualización de solicitud — Baúl Eterno',
    titulo: 'Actualización de Solicitud',
    color: '#173d70',
  };

  return enviarCorreo({
    para: correoSolicitante,
    asunto: configuracion.asunto,
    texto: `Hola ${nombreSolicitante}, actualización sobre la bóveda de ${nombreTitular}: ${detalle}`,
    html: envolverPlantillaHtml(
      configuracion.titulo,
      `<p>Hola <strong>${nombreSolicitante}</strong>,</p>
       <p>${detalle}</p>
       <p>Puedes consultar la plataforma en <a href="${urlApp}">${urlApp}</a>.</p>`,
      configuracion.color
    ),
  });
};

exports.enviarTriggerLiberacionAlbaceas = async ({
  correoAlbacea,
  nombreAlbacea,
  nombreTitular,
  motivo,
}) => {
  const urlApp = obtenerUrlFrontend();
  return enviarCorreo({
    para: correoAlbacea,
    asunto: `Bóveda de ${nombreTitular} liberada — Acceso disponible en Guía de Cobro`,
    texto: `Hola ${nombreAlbacea}, la bóveda de ${nombreTitular} fue liberada (${motivo}). Ingresa a ${urlApp}/guia para revisar pólizas, inventario y mensajes póstumos.`,
    html: envolverPlantillaHtml(
      'Bóveda Liberada — Acceso Habilitado',
      `<p>Hola <strong>${nombreAlbacea}</strong>,</p>
       <p>Te informamos que la bóveda patrimonial de <strong>${nombreTitular}</strong> ha quedado liberada (<strong>${motivo}</strong>).</p>
       <p>Ya puedes ingresar a tu <strong>Panel Albacea → Guía de Cobro</strong> para consultar las pólizas registradas, el inventario digital y los mensajes póstumos dirigidos a tu RUT:</p>
       <p style="text-align:center;margin:18px 0;">
         <a href="${urlApp}/guia" style="display:inline-block;background:#1e5091;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:9px;font-weight:700;">
           Abrir Guía de Cobro
         </a>
       </p>`
    ),
  });
};

exports.enviarRecuperacionPassword = async ({ correo, nombre, codigo, enlaceReset }) => {
  return enviarCorreo({
    para: correo,
    asunto: 'Recuperación de contraseña — Baúl Eterno',
    texto: `Hola ${nombre}, tu código de recuperación de Baúl Eterno es: ${codigo} (válido por 30 minutos). Enlace directo: ${enlaceReset}`,
    html: envolverPlantillaHtml(
      'Recupera el acceso a tu bóveda',
      `<p>Hola <strong>${nombre}</strong>,</p>
       <p>Recibimos una solicitud para restablecer tu contraseña de <strong>Baúl Eterno</strong>. Usa el siguiente código temporal (válido por 30 minutos):</p>
       <div style="text-align:center;margin:20px 0;">
         <span style="display:inline-block;font-size:28px;font-weight:800;letter-spacing:6px;padding:12px 24px;background:#eef3f8;border:1px solid #cbd5e1;border-radius:10px;color:#1e5091;">
           ${codigo}
         </span>
       </div>
       <p>También puedes restablecerla directamente desde este enlace: <a href="${enlaceReset}">${enlaceReset}</a></p>
       <p style="font-size:12px;color:#64748b;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>`
    ),
  });
};

exports.enviarMensajeSoporte = async ({
  codigoTicket,
  nombreUsuario,
  correoUsuario,
  rutUsuario,
  categoria,
  mensaje,
  referenciaCaso,
}) => {
  const correoSoporte = process.env.SMTP_USER;
  const envios = [];
  const tag = codigoTicket ? `[${codigoTicket}] ` : '';
  const lineaRef = referenciaCaso ? `<br/><strong>Caso asociado:</strong> ${referenciaCaso}` : '';

  if (correoSoporte) {
    envios.push(
      enviarCorreo({
        para: correoSoporte,
        asunto: `${tag}[Soporte Baúl Eterno] ${categoria} — ${nombreUsuario}`,
        texto: `Ticket: ${codigoTicket || 'N/A'}\nUsuario: ${nombreUsuario} (${correoUsuario}, RUT ${rutUsuario || 'Sin RUT'})\nCategoría: ${categoria}${referenciaCaso ? `\nCaso asociado: ${referenciaCaso}` : ''}\n\nMensaje:\n${mensaje}`,
        html: envolverPlantillaHtml(
          `Ticket de Soporte ${codigoTicket || ''}: ${categoria}`,
          `<p><strong>Ticket:</strong> ${codigoTicket || 'Sin código'}<br/>
           <strong>Usuario:</strong> ${nombreUsuario}<br/>
           <strong>Correo:</strong> ${correoUsuario}<br/>
           <strong>RUT:</strong> ${rutUsuario || 'Sin RUT registrado'}${lineaRef}</p>
           <div style="background:#f8fafc;border-left:4px solid #1e5091;padding:12px 14px;border-radius:6px;white-space:pre-wrap;">${mensaje}</div>`
        ),
      })
    );
  }

  if (correoUsuario) {
    envios.push(
      enviarCorreo({
        para: correoUsuario,
        asunto: `${tag}Recibimos tu solicitud de soporte: ${categoria} — Baúl Eterno`,
        texto: `Hola ${nombreUsuario}, registramos tu ticket ${codigoTicket || ''} (${categoria}). Nuestro equipo revisará tu caso y te responderá a la brevedad.`,
        html: envolverPlantillaHtml(
          `Ticket ${codigoTicket || ''} registrado`,
          `<p>Hola <strong>${nombreUsuario}</strong>,</p>
           <p>Confirmamos la recepción de tu ticket <strong>${codigoTicket || ''}</strong> bajo la categoría <strong>${categoria}</strong>${referenciaCaso ? ` (asociado a <strong>${referenciaCaso}</strong>)` : ''}. Nuestro equipo revisará el caso y te responderá a este correo a la brevedad.</p>
           <p style="font-size:12px;color:#64748b;">Detalle enviado: "${mensaje.slice(0, 240)}${mensaje.length > 240 ? '...' : ''}"</p>`
        ),
      })
    );
  }

  return Promise.all(envios);
};

exports.enviarRespuestaTicketSoporte = async ({
  correoUsuario,
  nombreUsuario,
  codigoTicket,
  estadoTicket,
  respuestaAdmin,
}) => {
  return enviarCorreo({
    para: correoUsuario,
    asunto: `[${codigoTicket}] Actualización de tu ticket de soporte (${estadoTicket}) — Baúl Eterno`,
    texto: `Hola ${nombreUsuario}, tu ticket ${codigoTicket} pasó a estado ${estadoTicket}. Respuesta de soporte: ${respuestaAdmin || 'Caso revisado por administración.'}`,
    html: envolverPlantillaHtml(
      `Actualización de Ticket ${codigoTicket}`,
      `<p>Hola <strong>${nombreUsuario}</strong>,</p>
       <p>Tu ticket de soporte <strong>${codigoTicket}</strong> fue actualizado a estado <strong>${estadoTicket}</strong>.</p>
       ${
         respuestaAdmin
           ? `<div style="background:#eef4fb;border-left:4px solid #1e5091;padding:12px 14px;border-radius:6px;white-space:pre-wrap;">${respuestaAdmin}</div>`
           : ''
       }
       <p style="margin-top:14px;">Puedes revisar el estado de tu bóveda ingresando a tu cuenta en Baúl Eterno.</p>`
    ),
  });
};

exports.enviarCartaPostumaExterna = async ({
  correoDestinatario,
  nombreDestinatario,
  nombreTitular,
  contenido,
  fechaCreacion,
}) => {
  const fechaTexto = fechaCreacion
    ? new Date(fechaCreacion).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';
  return enviarCorreo({
    para: correoDestinatario,
    asunto: `Mensaje personal resguardado de ${nombreTitular} — Baúl Eterno`,
    texto: `Hola ${nombreDestinatario},\n\n${nombreTitular} dejó un mensaje privado resguardado para ti en Baúl Eterno${fechaTexto ? ` (redactado el ${fechaTexto})` : ''}.\n\n---\n${contenido}\n---`,
    html: envolverPlantillaHtml(
      `Un mensaje personal de ${nombreTitular}`,
      `<p>Hola <strong>${nombreDestinatario}</strong>,</p>
       <p>Te escribimos desde <strong>Baúl Eterno</strong> con mucho respeto. <strong>${nombreTitular}</strong> resguardó esta carta privada para que te fuera entregada al momento de liberarse su bóveda${fechaTexto ? ` (sellada el ${fechaTexto})` : ''}:</p>
       <div style="background:#f8fafc;border:1px solid #d9e2ec;border-left:4px solid #8b6343;padding:16px 18px;border-radius:8px;white-space:pre-wrap;color:#1e293b;margin:18px 0;font-size:14.5px;line-height:1.65;">${contenido}</div>
       <p style="font-size:12px;color:#64748b;">Esta carta se mantuvo cifrada y confidencial hasta la liberación autorizada de la bóveda.</p>`
    ),
  });
};

exports.enviarAvisoLiberacionTitular = async ({ correoTitular, correoAlternativo, nombreTitular, detalle }) => {
  const urlApp = obtenerUrlFrontend();
  return enviarCorreo({
    para: [correoTitular, correoAlternativo],
    asunto: 'AVISO IMPORTANTE: Tu Baúl Eterno fue marcado como liberado',
    texto: `Hola ${nombreTitular}, ${detalle}. Si esto fue un error y te encuentras activo, ingresa a ${urlApp}/dashboard y contacta inmediatamente a soporte.`,
    html: envolverPlantillaHtml(
      'Tu bóveda fue liberada',
      `<p>Hola <strong>${nombreTitular}</strong>,</p>
       <p style="background:#fee2e2;border-left:4px solid #b91c1c;padding:12px 14px;border-radius:6px;color:#7f1d1d;">
         ${detalle}
       </p>
       <p>Si te encuentras activo y consideras que esto es un error, ingresa a tu cuenta y utiliza la opción <strong>Contactar a Soporte</strong> de inmediato.</p>
       <p style="text-align:center;margin:18px 0;">
         <a href="${urlApp}/dashboard" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:9px;font-weight:700;">
           Revisar mi bóveda
         </a>
       </p>`,
      '#991b1b'
    ),
  });
};

exports.estaConfiguradoSmtp = estaConfiguradoSmtp;
exports.obtenerUrlFrontend = obtenerUrlFrontend;
