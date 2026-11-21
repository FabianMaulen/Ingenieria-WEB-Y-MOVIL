const nodemailer = require('nodemailer');

let transporterCache = null;

function estaConfiguradoSmtp() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
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

function envolverPlantillaHtml(titulo, cuerpoHtml) {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f7fb;padding:28px 16px;color:#1e293b;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #d9e2ec;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#173d70 0%,#265ea8 100%);padding:22px 26px;color:#ffffff;">
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
  if (!para) return { enviado: false, modo: 'sin-destinatario' };

  const transporter = obtenerTransporter();
  if (!transporter) {
    console.log(`\n[EMAIL SIMULADO -> ${para}] Asunto: ${asunto}\n${texto || ''}\n`);
    return { enviado: false, modo: 'simulado-consola' };
  }

  try {
    const remitente = process.env.SMTP_FROM || `Baúl Eterno <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
      from: remitente,
      to: para,
      subject: asunto,
      text: texto,
      html,
    });
    return { enviado: true, modo: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR -> ${para}]`, error.message);
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
       <p>Recuerda realizar tu check-in periódico para mantener tu bóveda vigente y protegida.</p>`
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
  const urlApp = (process.env.FRONTEND_URL || 'http://localhost:8100').split(',')[0].trim();
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

exports.enviarAlertaApertura = async ({ correoTitular, nombreTitular, nombreAlbacea, plazoHoras }) => {
  const urlApp = (process.env.FRONTEND_URL || 'http://localhost:8100').split(',')[0].trim();
  return enviarCorreo({
    para: correoTitular,
    asunto: 'ALERTA CRÍTICA: Solicitud de apertura registrada en tu Baúl Eterno',
    texto: `ALERTA: ${nombreAlbacea} inició una solicitud de apertura de tu Baúl Eterno. Dispones de ${plazoHoras} horas para anularla ingresando a ${urlApp}/dashboard.`,
    html: envolverPlantillaHtml(
      'Alerta Crítica de Seguridad',
      `<p>Hola <strong>${nombreTitular}</strong>,</p>
       <p style="background:#fee2e2;border-left:4px solid #b91c1c;padding:12px 14px;border-radius:6px;color:#7f1d1d;">
         <strong>${nombreAlbacea}</strong> ha ingresado una solicitud de apertura por contingencia sobre tu bóveda.
       </p>
       <p>Dispones de un periodo de gracia de <strong>${plazoHoras} horas</strong> para anular esta solicitud con un clic desde tu <a href="${urlApp}/dashboard">Panel Principal</a> o realizando un check-in de presencia.</p>`
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

exports.estaConfiguradoSmtp = estaConfiguradoSmtp;
