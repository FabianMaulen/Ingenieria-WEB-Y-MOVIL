/**
 * Motor automático de vigilancia, recordatorios de Check-in y Trigger de liberación.
 * - Procesa vencimientos de plazo de gracia en SOLICITUD_APERTURA y REPORTE_FAMILIAR.
 * - Envía reintentos de confirmación a mitad de plazo y aviso final (48h) al contacto de confianza.
 * - Envía recordatorios progresivos de Check-in (15d, 7d, 48h) y dispara la liberación automática
 *   hacia albaceas validados si el titular supera su frecuencia de Check-in sin responder.
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');
const { registrarAuditoria } = require('../utils/auditoria');
const { descifrarTexto, descifrarBuffer } = require('../utils/cifrado');
const {
  enviarAlertaApertura,
  enviarAvisoContactoConfianza,
  enviarRecordatorioCheckin,
  enviarNotificacionSolicitante,
  enviarTriggerLiberacionAlbaceas,
  enviarCartaPostumaExterna,
} = require('./email.service');

const DIR_BOVEDA_CIFRADA = path.join(__dirname, '..', 'uploads', 'boveda_cifrada');

async function entregarMensajesExternosPorCorreo(idTitular, nombreTitular) {
  const { rows } = await db.query(
    `SELECT id_mensaje, fecha_creacion, contenido_cifrado, nombre_destinatario_externo,
            correo_destinatario, archivo_cifrado, archivo_nombre, archivo_mime
     FROM MENSAJE_POSTUMO
     WHERE id_usuario = $1
       AND rut_destinatario IS NULL
       AND correo_destinatario IS NOT NULL
       AND enviado_por_correo = FALSE`,
    [idTitular]
  );

  let enviados = 0;
  for (const m of rows) {
    try {
      const contenido = descifrarTexto(m.contenido_cifrado);
      const adjuntos = [];
      if (m.archivo_cifrado) {
        const ruta = path.join(DIR_BOVEDA_CIFRADA, path.basename(m.archivo_cifrado));
        if (fs.existsSync(ruta)) {
          const bufferPlano = descifrarBuffer(fs.readFileSync(ruta));
          adjuntos.push({
            filename: m.archivo_nombre || `adjunto-${m.id_mensaje}`,
            content: bufferPlano,
            contentType: m.archivo_mime || 'application/octet-stream',
          });
        }
      }
      await enviarCartaPostumaExterna({
        correoDestinatario: m.correo_destinatario,
        nombreDestinatario: m.nombre_destinatario_externo || 'Estimado/a',
        nombreTitular,
        contenido,
        fechaCreacion: m.fecha_creacion,
        adjuntos,
      });
      await db.query('UPDATE MENSAJE_POSTUMO SET enviado_por_correo = TRUE WHERE id_mensaje = $1', [m.id_mensaje]);
      enviados += 1;
    } catch (err) {
      console.warn(`[ENTREGA CARTA EXTERNA #${m.id_mensaje}]:`, err.message);
    }
  }
  return enviados;
}

async function notificarAlbaceasLiberacion(idTitular, nombreTitular, motivo) {
  const { rows: albaceas } = await db.query(
    `SELECT d.id_directorio,
            COALESCE(u.nombre_usuario, d.nombre_albacea) AS nombre_albacea,
            COALESCE(u.correo_usuario, d.email_albacea) AS correo_albacea
     FROM DIRECTORIO_ALBACEAS d
     LEFT JOIN USUARIO u ON u.id_usuario = d.id_usuario_invitado
     WHERE d.id_titular = $1 AND d.estado_validacion = 'VALIDADO'`,
    [idTitular]
  );

  for (const alb of albaceas) {
    await enviarTriggerLiberacionAlbaceas({
      correoAlbacea: alb.correo_albacea,
      nombreAlbacea: alb.nombre_albacea,
      nombreTitular,
      motivo,
    }).catch(() => {});
  }

  // También entregar cartas póstumas dirigidas a destinatarios externos por correo
  await entregarMensajesExternosPorCorreo(idTitular, nombreTitular).catch(() => {});

  return albaceas;
}

exports.entregarMensajesExternosPorCorreo = entregarMensajesExternosPorCorreo;

/**
 * Ejecuta un ciclo completo e idempotente de vigilancia.
 * Puede ejecutarse periódicamente en segundo plano o bajo demanda desde el Panel Admin.
 */
exports.ejecutarCicloVigilancia = async () => {
  const resumen = {
    solicitudes_aprobadas: 0,
    reportes_validados: 0,
    reintentos_enviados: 0,
    avisos_48h_enviados: 0,
    recordatorios_checkin: 0,
    triggers_vencimiento_checkin: 0,
  };

  // --------------------------------------------------------------------------
  // 1. SOLICITUD_APERTURA pendientes (albaceas registrados)
  // --------------------------------------------------------------------------
  const solRes = await db.query(
    `SELECT s.id_solicitud, s.id_usuario, s.fecha_solicitud,
            COALESCE(s.plazo_gracia_horas, u.plazo_gracia_dias * 24, 168) AS plazo_horas,
            s.ultimo_aviso_etapa,
            EXTRACT(EPOCH FROM (NOW() - s.fecha_solicitud)) / 3600.0 AS horas_transcurridas,
            u.nombre_usuario AS nombre_titular, u.correo_usuario, u.correo_alternativo,
            u.nombre_contacto_confianza, u.correo_contacto_confianza,
            COALESCE(a.nombre_usuario, d.nombre_albacea) AS nombre_albacea,
            COALESCE(a.correo_usuario, d.email_albacea) AS correo_albacea
     FROM SOLICITUD_APERTURA s
     JOIN USUARIO u ON u.id_usuario = s.id_usuario
     JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
     LEFT JOIN USUARIO a ON a.id_usuario = d.id_usuario_invitado
     WHERE s.estado_solicitud = 'PENDIENTE'`
  );

  for (const s of solRes.rows) {
    const transcurridas = Number(s.horas_transcurridas) || 0;
    const plazo = Number(s.plazo_horas) || 168;
    const restantes = Math.max(0, plazo - transcurridas);

    if (restantes <= 0) {
      await db.query(
        `UPDATE SOLICITUD_APERTURA
         SET estado_solicitud = 'APROBADA', ultimo_aviso_etapa = 'LIBERADA'
         WHERE id_solicitud = $1`,
        [s.id_solicitud]
      );
      await registrarAuditoria(
        `Solicitud #${s.id_solicitud} aprobada automáticamente al vencer el plazo de gracia (${plazo}h)`,
        'sistema',
        s.id_usuario
      );
      await notificarAlbaceasLiberacion(
        s.id_usuario,
        s.nombre_titular,
        `vencimiento del plazo de gracia (${Math.round(plazo / 24)} días) sin respuesta del titular`
      );
      resumen.solicitudes_aprobadas += 1;
    } else if (restantes <= 48 && s.ultimo_aviso_etapa !== '48H_CONFIANZA') {
      await enviarAvisoContactoConfianza({
        correoContacto: s.correo_contacto_confianza,
        nombreContacto: s.nombre_contacto_confianza,
        correoTitular: s.correo_usuario,
        correoAlternativo: s.correo_alternativo,
        nombreTitular: s.nombre_titular,
        motivo: `Solicitud de apertura iniciada por albacea ${s.nombre_albacea}`,
        horasRestantes: Math.max(1, Math.round(restantes)),
      }).catch(() => {});

      await db.query(
        `UPDATE SOLICITUD_APERTURA SET ultimo_aviso_etapa = '48H_CONFIANZA' WHERE id_solicitud = $1`,
        [s.id_solicitud]
      );
      resumen.avisos_48h_enviados += 1;
    } else if (
      transcurridas >= plazo / 2 &&
      (!s.ultimo_aviso_etapa || s.ultimo_aviso_etapa === 'INICIAL')
    ) {
      await enviarAlertaApertura({
        correoTitular: s.correo_usuario,
        correoAlternativo: s.correo_alternativo,
        nombreTitular: s.nombre_titular,
        nombreAlbacea: s.nombre_albacea,
        plazoHoras: Math.max(1, Math.round(restantes)),
        esReintento: true,
      }).catch(() => {});

      await db.query(
        `UPDATE SOLICITUD_APERTURA SET ultimo_aviso_etapa = 'RECORDATORIO' WHERE id_solicitud = $1`,
        [s.id_solicitud]
      );
      resumen.reintentos_enviados += 1;
    }
  }

  // --------------------------------------------------------------------------
  // 2. REPORTE_FAMILIAR activos (familiares externos sin cuenta)
  // --------------------------------------------------------------------------
  const repRes = await db.query(
    `SELECT r.id_reporte, r.id_titular_encontrado, r.nombre_familiar, r.correo_familiar, r.parentesco,
            r.fecha_reporte, r.ultimo_aviso_etapa,
            COALESCE(r.plazo_gracia_horas, u.plazo_gracia_dias * 24, 168) AS plazo_horas,
            EXTRACT(EPOCH FROM (NOW() - r.fecha_reporte)) / 3600.0 AS horas_transcurridas,
            u.nombre_usuario AS nombre_titular, u.correo_usuario, u.correo_alternativo,
            u.nombre_contacto_confianza, u.correo_contacto_confianza
     FROM REPORTE_FAMILIAR r
     JOIN USUARIO u ON u.id_usuario = r.id_titular_encontrado
     WHERE r.estado_reporte IN ('RECIBIDO', 'EN_REVISION')`
  );

  for (const r of repRes.rows) {
    const transcurridas = Number(r.horas_transcurridas) || 0;
    const plazo = Number(r.plazo_horas) || 168;
    const restantes = Math.max(0, plazo - transcurridas);

    if (restantes <= 0) {
      await db.query(
        `UPDATE REPORTE_FAMILIAR
         SET estado_reporte = 'VALIDADO', ultimo_aviso_etapa = 'LIBERADA'
         WHERE id_reporte = $1`,
        [r.id_reporte]
      );
      await registrarAuditoria(
        `Reporte familiar #${r.id_reporte} validado automáticamente al vencer el plazo de gracia (${plazo}h) sin respuesta del titular`,
        'sistema',
        r.id_titular_encontrado
      );
      await enviarNotificacionSolicitante({
        correoSolicitante: r.correo_familiar,
        nombreSolicitante: r.nombre_familiar,
        nombreTitular: r.nombre_titular,
        estado: 'APROBADA',
        detalle: `El plazo de gracia de ${Math.round(plazo / 24)} días concluyó sin respuesta del titular. Tu reporte #${r.id_reporte} fue validado y el equipo/albaceas fueron notificados para el proceso de entrega de la bóveda.`,
      }).catch(() => {});
      await notificarAlbaceasLiberacion(
        r.id_titular_encontrado,
        r.nombre_titular,
        `reporte familiar #${r.id_reporte} sin respuesta del titular tras ${Math.round(plazo / 24)} días`
      );
      resumen.reportes_validados += 1;
    } else if (restantes <= 48 && r.ultimo_aviso_etapa !== '48H_CONFIANZA') {
      await enviarAvisoContactoConfianza({
        correoContacto: r.correo_contacto_confianza,
        nombreContacto: r.nombre_contacto_confianza,
        correoTitular: r.correo_usuario,
        correoAlternativo: r.correo_alternativo,
        nombreTitular: r.nombre_titular,
        motivo: `Reporte de contingencia enviado por ${r.nombre_familiar} (${r.parentesco})`,
        horasRestantes: Math.max(1, Math.round(restantes)),
      }).catch(() => {});

      await db.query(
        `UPDATE REPORTE_FAMILIAR SET ultimo_aviso_etapa = '48H_CONFIANZA' WHERE id_reporte = $1`,
        [r.id_reporte]
      );
      resumen.avisos_48h_enviados += 1;
    } else if (
      transcurridas >= plazo / 2 &&
      (!r.ultimo_aviso_etapa || r.ultimo_aviso_etapa === 'INICIAL')
    ) {
      await enviarAlertaApertura({
        correoTitular: r.correo_usuario,
        correoAlternativo: r.correo_alternativo,
        nombreTitular: r.nombre_titular,
        nombreAlbacea: `${r.nombre_familiar} (Familiar externo - ${r.parentesco})`,
        plazoHoras: Math.max(1, Math.round(restantes)),
        esReintento: true,
      }).catch(() => {});

      await db.query(
        `UPDATE REPORTE_FAMILIAR SET ultimo_aviso_etapa = 'RECORDATORIO' WHERE id_reporte = $1`,
        [r.id_reporte]
      );
      resumen.reintentos_enviados += 1;
    }
  }

  // --------------------------------------------------------------------------
  // 3. Vigilancia periódica de Check-in (Trigger por vencimiento)
  // --------------------------------------------------------------------------
  const usrRes = await db.query(
    `SELECT id_usuario, nombre_usuario, correo_usuario, correo_alternativo,
            nombre_contacto_confianza, correo_contacto_confianza,
            frecuencia_checkin_dias, ultimo_recordatorio_enviado,
            EXTRACT(EPOCH FROM (NOW() - fecha_ultimo_checkin)) / 86400.0 AS dias_transcurridos
     FROM USUARIO
     WHERE activo = TRUE
       AND boveda_activa = TRUE
       AND notificar_recordatorios = TRUE
       AND rol <> 'ADMIN'`
  );

  for (const u of usrRes.rows) {
    const frecuencia = Number(u.frecuencia_checkin_dias) || 180;
    const transcurridos = Number(u.dias_transcurridos) || 0;
    const diasRestantes = frecuencia - transcurridos;
    const etapa = u.ultimo_recordatorio_enviado;

    if (diasRestantes <= 0 && etapa !== 'VENCIDO') {
      await db.query(`UPDATE USUARIO SET ultimo_recordatorio_enviado = 'VENCIDO' WHERE id_usuario = $1`, [
        u.id_usuario,
      ]);

      // Si el titular tiene al menos un albacea validado y no hay solicitud activa, crear apertura automática
      const albaceasValidos = await db.query(
        `SELECT id_directorio FROM DIRECTORIO_ALBACEAS
         WHERE id_titular = $1 AND estado_validacion = 'VALIDADO'
         ORDER BY id_directorio ASC`,
        [u.id_usuario]
      );

      if (albaceasValidos.rows.length > 0) {
        const yaActiva = await db.query(
          `SELECT 1 FROM SOLICITUD_APERTURA
           WHERE id_usuario = $1 AND estado_solicitud IN ('PENDIENTE', 'APROBADA') LIMIT 1`,
          [u.id_usuario]
        );
        if (yaActiva.rows.length === 0) {
          await db.query(
            `INSERT INTO SOLICITUD_APERTURA
               (certificado_defuncion, hash_documento, estado_solicitud, plazo_gracia_horas, ultimo_aviso_etapa, id_usuario, id_albacea)
             VALUES ('TRIGGER_INACTIVIDAD', 'LIBERACION_AUTOMATICA_CHECKIN', 'APROBADA', 0, 'LIBERADA', $1, $2)`,
            [u.id_usuario, albaceasValidos.rows[0].id_directorio]
          );
        }

        await notificarAlbaceasLiberacion(
          u.id_usuario,
          u.nombre_usuario,
          `vencimiento del ciclo de Check-in (${frecuencia} días) sin confirmación de actividad`
        );
      }

      await registrarAuditoria(
        `Trigger automático: ciclo de Check-in (${frecuencia} días) venció sin respuesta del titular`,
        'sistema',
        u.id_usuario
      );
      resumen.triggers_vencimiento_checkin += 1;
    } else if (diasRestantes <= 2 && diasRestantes > 0 && !['48H', 'VENCIDO'].includes(etapa)) {
      await enviarAvisoContactoConfianza({
        correoContacto: u.correo_contacto_confianza,
        nombreContacto: u.nombre_contacto_confianza,
        correoTitular: u.correo_usuario,
        correoAlternativo: u.correo_alternativo,
        nombreTitular: u.nombre_usuario,
        motivo: `Vencimiento inminente del ciclo de Check-in (${frecuencia} días)`,
        horasRestantes: Math.max(1, Math.round(diasRestantes * 24)),
      }).catch(() => {});

      await db.query(`UPDATE USUARIO SET ultimo_recordatorio_enviado = '48H' WHERE id_usuario = $1`, [
        u.id_usuario,
      ]);
      resumen.avisos_48h_enviados += 1;
    } else if (diasRestantes <= 7 && diasRestantes > 2 && !['7D', '48H', 'VENCIDO'].includes(etapa)) {
      await enviarRecordatorioCheckin({
        correoTitular: u.correo_usuario,
        correoAlternativo: u.correo_alternativo,
        nombreTitular: u.nombre_usuario,
        diasRestantes: Math.ceil(diasRestantes),
        frecuenciaDias: frecuencia,
      }).catch(() => {});

      await db.query(`UPDATE USUARIO SET ultimo_recordatorio_enviado = '7D' WHERE id_usuario = $1`, [
        u.id_usuario,
      ]);
      resumen.recordatorios_checkin += 1;
    } else if (diasRestantes <= 15 && diasRestantes > 7 && !etapa) {
      await enviarRecordatorioCheckin({
        correoTitular: u.correo_usuario,
        correoAlternativo: u.correo_alternativo,
        nombreTitular: u.nombre_usuario,
        diasRestantes: Math.ceil(diasRestantes),
        frecuenciaDias: frecuencia,
      }).catch(() => {});

      await db.query(`UPDATE USUARIO SET ultimo_recordatorio_enviado = '15D' WHERE id_usuario = $1`, [
        u.id_usuario,
      ]);
      resumen.recordatorios_checkin += 1;
    }
  }

  return resumen;
};

let intervaloVigilancia = null;

exports.iniciarMotorVigilancia = () => {
  if (intervaloVigilancia || process.env.NODE_ENV === 'test') return;

  // Primera revisión diferida 15s tras arrancar el servidor
  const inicio = setTimeout(() => {
    exports.ejecutarCicloVigilancia().catch((err) => {
      console.warn('[MOTOR VIGILANCIA]:', err.message);
    });
  }, 15000);
  if (typeof inicio.unref === 'function') inicio.unref();

  // Revisiones periódicas cada 30 minutos
  intervaloVigilancia = setInterval(() => {
    exports.ejecutarCicloVigilancia().catch((err) => {
      console.warn('[MOTOR VIGILANCIA]:', err.message);
    });
  }, 30 * 60 * 1000);
  if (typeof intervaloVigilancia.unref === 'function') intervaloVigilancia.unref();
};
