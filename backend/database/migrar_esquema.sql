-- Migración no destructiva para actualizar una base 'baul_eterno' existente
-- al esquema refactorizado (preserva usuarios, pólizas, albaceas y mensajes actuales).

BEGIN;

-- 1. Normalizar RUTs existentes en USUARIO y MENSAJE_POSTUMO al formato XXXXXXXX-Y
UPDATE USUARIO
SET rut = regexp_replace(upper(regexp_replace(rut, '[^0-9kK]', '', 'g')), '^([0-9]{7,8})([0-9K])$', '\1-\2')
WHERE rut !~ '^[0-9]{7,8}-[0-9K]$';

UPDATE MENSAJE_POSTUMO
SET rut_destinatario = regexp_replace(upper(regexp_replace(rut_destinatario, '[^0-9kK]', '', 'g')), '^([0-9]{7,8})([0-9K])$', '\1-\2')
WHERE rut_destinatario !~ '^[0-9]{7,8}-[0-9K]$';

-- 2. Actualizar tipo de fecha_ultimo_checkin a TIMESTAMP
ALTER TABLE USUARIO
  ALTER COLUMN fecha_ultimo_checkin TYPE TIMESTAMP USING fecha_ultimo_checkin::timestamp,
  ALTER COLUMN fecha_ultimo_checkin SET DEFAULT NOW();

-- 3. Evolucionar DIRECTORIO_ALBACEAS para soportar invitaciones por RUT sin registro previo
ALTER TABLE DIRECTORIO_ALBACEAS
  ADD COLUMN IF NOT EXISTS nombre_albacea VARCHAR(150),
  ADD COLUMN IF NOT EXISTS rut_albacea VARCHAR(12),
  ADD COLUMN IF NOT EXISTS email_albacea VARCHAR(150),
  ADD COLUMN IF NOT EXISTS fecha_designacion TIMESTAMP NOT NULL DEFAULT NOW();

UPDATE DIRECTORIO_ALBACEAS d
SET nombre_albacea = COALESCE(d.nombre_albacea, u.nombre_usuario),
    rut_albacea = COALESCE(d.rut_albacea, u.rut),
    email_albacea = COALESCE(d.email_albacea, u.correo_usuario)
FROM USUARIO u
WHERE d.id_usuario_invitado = u.id_usuario
  AND (d.nombre_albacea IS NULL OR d.rut_albacea IS NULL OR d.email_albacea IS NULL);

ALTER TABLE DIRECTORIO_ALBACEAS
  ALTER COLUMN nombre_albacea SET NOT NULL,
  ALTER COLUMN rut_albacea SET NOT NULL,
  ALTER COLUMN email_albacea SET NOT NULL,
  ALTER COLUMN id_usuario_invitado DROP NOT NULL;

-- Normalizar estados previos antes del CHECK
UPDATE DIRECTORIO_ALBACEAS
SET estado_validacion = 'VALIDADO'
WHERE UPPER(estado_validacion) IN ('APROBADO', 'ACEPTADO', 'ACEPTADA');

UPDATE DIRECTORIO_ALBACEAS
SET estado_validacion = 'PENDIENTE'
WHERE estado_validacion NOT IN ('PENDIENTE', 'VALIDADO', 'RECHAZADO', 'INVITADO');

-- Reemplazar restricción UNIQUE antigua por (id_titular, rut_albacea)
ALTER TABLE DIRECTORIO_ALBACEAS
  DROP CONSTRAINT IF EXISTS directorio_albaceas_id_titular_id_usuario_invitado_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'directorio_albaceas_id_titular_rut_albacea_key'
  ) THEN
    ALTER TABLE DIRECTORIO_ALBACEAS
      ADD CONSTRAINT directorio_albaceas_id_titular_rut_albacea_key UNIQUE (id_titular, rut_albacea);
  END IF;
END $$;

-- 4. Agregar restricciones CHECK de integridad y formato RUT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_usuario_rut') THEN
    ALTER TABLE USUARIO ADD CONSTRAINT chk_usuario_rut CHECK (rut ~ '^[0-9]{7,8}-[0-9K]$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_albacea_rut') THEN
    ALTER TABLE DIRECTORIO_ALBACEAS ADD CONSTRAINT chk_albacea_rut CHECK (rut_albacea ~ '^[0-9]{7,8}-[0-9K]$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_estado_validacion') THEN
    ALTER TABLE DIRECTORIO_ALBACEAS ADD CONSTRAINT chk_estado_validacion
      CHECK (estado_validacion IN ('PENDIENTE', 'VALIDADO', 'RECHAZADO', 'INVITADO'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mensaje_rut') THEN
    ALTER TABLE MENSAJE_POSTUMO ADD CONSTRAINT chk_mensaje_rut CHECK (rut_destinatario ~ '^[0-9]{7,8}-[0-9K]$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_poliza_monto') THEN
    ALTER TABLE POLIZA ADD CONSTRAINT chk_poliza_monto CHECK (monto_referencial >= 0);
  END IF;
END $$;

-- 5. Crear tabla INVENTARIO si no existe
CREATE TABLE IF NOT EXISTS INVENTARIO (
  id_inventario SERIAL PRIMARY KEY,
  plataforma VARCHAR(150) NOT NULL,
  instruccion TEXT NOT NULL,
  categoria VARCHAR(60) NOT NULL DEFAULT 'General'
    CONSTRAINT chk_inventario_categoria CHECK (
      categoria IN ('General', 'Financiero', 'Familiar Directo', 'Público', 'Digital', 'Físico')
    ),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

-- 6. Tabla de recuperación de contraseña (tokens temporales hasheados)
CREATE TABLE IF NOT EXISTS RESET_PASSWORD_TOKEN (
  id_token SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6b. Soporte OAuth 2.0 con Google (usuarios sin contraseña local y RUT completable)
ALTER TABLE USUARIO
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ALTER COLUMN contrasena_hash DROP NOT NULL,
  ALTER COLUMN rut DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuario_google_id_key') THEN
    ALTER TABLE USUARIO ADD CONSTRAINT usuario_google_id_key UNIQUE (google_id);
  END IF;
END $$;

ALTER TABLE USUARIO DROP CONSTRAINT IF EXISTS chk_usuario_rut;
ALTER TABLE USUARIO ADD CONSTRAINT chk_usuario_rut CHECK (rut IS NULL OR rut ~ '^[0-9]{7,8}-[0-9K]$');

-- 6c. Reportes de contingencia enviados por familiares externos
CREATE TABLE IF NOT EXISTS REPORTE_FAMILIAR (
  id_reporte SERIAL PRIMARY KEY,
  rut_titular_consultado VARCHAR(12) NOT NULL
    CONSTRAINT chk_reporte_rut_titular CHECK (rut_titular_consultado ~ '^[0-9]{7,8}-[0-9K]$'),
  id_titular_encontrado INT NULL REFERENCES USUARIO(id_usuario) ON DELETE SET NULL,
  nombre_familiar VARCHAR(150) NOT NULL,
  rut_familiar VARCHAR(12) NOT NULL
    CONSTRAINT chk_reporte_rut_familiar CHECK (rut_familiar ~ '^[0-9]{7,8}-[0-9K]$'),
  correo_familiar VARCHAR(150) NOT NULL,
  parentesco VARCHAR(50) NOT NULL,
  certificado_archivo VARCHAR(120) NOT NULL,
  hash_documento VARCHAR(255) NOT NULL,
  folio_extraido VARCHAR(100) NULL,
  estado_reporte VARCHAR(30) NOT NULL DEFAULT 'RECIBIDO'
    CONSTRAINT chk_estado_reporte CHECK (estado_reporte IN ('RECIBIDO', 'EN_REVISION', 'VALIDADO', 'RECHAZADO')),
  fecha_reporte TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6d. Preferencias de vigilancia, correos de respaldo, estado activo y verificación de correos
ALTER TABLE USUARIO
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS frecuencia_checkin_dias INT NOT NULL DEFAULT 180,
  ADD COLUMN IF NOT EXISTS plazo_gracia_dias INT NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS correo_alternativo VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS correo_alternativo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nombre_contacto_confianza VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS correo_contacto_confianza VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS notificar_recordatorios BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ultimo_recordatorio_enviado VARCHAR(30) NULL;

-- Cuentas creadas con Google ya tienen correo verificado por Google
UPDATE USUARIO SET correo_verificado = TRUE WHERE google_id IS NOT NULL AND correo_verificado = FALSE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_usuario_frecuencia') THEN
    ALTER TABLE USUARIO ADD CONSTRAINT chk_usuario_frecuencia CHECK (frecuencia_checkin_dias IN (30, 90, 180, 365));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_usuario_gracia') THEN
    ALTER TABLE USUARIO ADD CONSTRAINT chk_usuario_gracia CHECK (plazo_gracia_dias IN (3, 7, 14));
  END IF;
END $$;

-- Evolución de SOLICITUD_APERTURA (plazo configurable, tracking de avisos y ON DELETE CASCADE en id_albacea)
ALTER TABLE SOLICITUD_APERTURA
  ADD COLUMN IF NOT EXISTS plazo_gracia_horas INT NOT NULL DEFAULT 168,
  ADD COLUMN IF NOT EXISTS ultimo_aviso_etapa VARCHAR(30) NULL;

ALTER TABLE SOLICITUD_APERTURA DROP CONSTRAINT IF EXISTS solicitud_apertura_id_albacea_fkey;
ALTER TABLE SOLICITUD_APERTURA
  ADD CONSTRAINT solicitud_apertura_id_albacea_fkey
  FOREIGN KEY (id_albacea) REFERENCES DIRECTORIO_ALBACEAS(id_directorio) ON DELETE CASCADE;

-- Evolución de REPORTE_FAMILIAR (plazo configurable, tracking de avisos y estado CANCELADO_TITULAR)
ALTER TABLE REPORTE_FAMILIAR
  ADD COLUMN IF NOT EXISTS plazo_gracia_horas INT NOT NULL DEFAULT 168,
  ADD COLUMN IF NOT EXISTS ultimo_aviso_etapa VARCHAR(30) NULL;

ALTER TABLE REPORTE_FAMILIAR DROP CONSTRAINT IF EXISTS chk_estado_reporte;
ALTER TABLE REPORTE_FAMILIAR
  ADD CONSTRAINT chk_estado_reporte
  CHECK (estado_reporte IN ('RECIBIDO', 'EN_REVISION', 'VALIDADO', 'RECHAZADO', 'CANCELADO_TITULAR'));

-- Tabla de tokens de confirmación de correo principal / alternativo
CREATE TABLE IF NOT EXISTS EMAIL_VERIFICACION_TOKEN (
  id_token SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL
    CONSTRAINT chk_verif_tipo CHECK (tipo IN ('PRINCIPAL', 'ALTERNATIVO')),
  correo_destino VARCHAR(150) NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6e. Mensajes póstumos a personas externas (por correo sin cuenta) + Tickets de Soporte trazables
ALTER TABLE MENSAJE_POSTUMO
  ALTER COLUMN rut_destinatario DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS nombre_destinatario_externo VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS correo_destinatario VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS enviado_por_correo BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE MENSAJE_POSTUMO DROP CONSTRAINT IF EXISTS chk_mensaje_rut;
ALTER TABLE MENSAJE_POSTUMO
  ADD CONSTRAINT chk_mensaje_rut CHECK (rut_destinatario IS NULL OR rut_destinatario ~ '^[0-9]{7,8}-[0-9K]$');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mensaje_destinatario') THEN
    ALTER TABLE MENSAJE_POSTUMO
      ADD CONSTRAINT chk_mensaje_destinatario CHECK (rut_destinatario IS NOT NULL OR correo_destinatario IS NOT NULL);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS TICKET_SOPORTE (
  id_ticket SERIAL PRIMARY KEY,
  codigo_ticket VARCHAR(24) NOT NULL UNIQUE,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  categoria VARCHAR(80) NOT NULL,
  mensaje TEXT NOT NULL,
  estado_ticket VARCHAR(30) NOT NULL DEFAULT 'ABIERTO'
    CONSTRAINT chk_estado_ticket CHECK (estado_ticket IN ('ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO')),
  respuesta_admin TEXT NULL,
  id_solicitud_asociada INT NULL REFERENCES SOLICITUD_APERTURA(id_solicitud) ON DELETE SET NULL,
  id_reporte_asociado INT NULL REFERENCES REPORTE_FAMILIAR(id_reporte) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6f. Activación consciente de bóveda (configuración mínima + aceptación de condiciones)
ALTER TABLE USUARIO
  ADD COLUMN IF NOT EXISTS boveda_activa BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terminos_aceptados_en TIMESTAMP NULL;

-- Mantener activas las cuentas existentes que ya tienen al menos 1 registro propio o son ADMIN
UPDATE USUARIO u
SET boveda_activa = TRUE,
    terminos_aceptados_en = COALESCE(u.terminos_aceptados_en, NOW())
WHERE u.boveda_activa = FALSE
  AND (
    u.rol = 'ADMIN'
    OR EXISTS (SELECT 1 FROM POLIZA p WHERE p.id_usuario = u.id_usuario)
    OR EXISTS (SELECT 1 FROM INVENTARIO i WHERE i.id_usuario = u.id_usuario)
    OR EXISTS (SELECT 1 FROM MENSAJE_POSTUMO m WHERE m.id_usuario = u.id_usuario)
    OR EXISTS (SELECT 1 FROM DIRECTORIO_ALBACEAS d WHERE d.id_titular = u.id_usuario)
  );

-- 7. Índices recomendados
CREATE INDEX IF NOT EXISTS idx_directorio_titular ON DIRECTORIO_ALBACEAS(id_titular);
CREATE INDEX IF NOT EXISTS idx_directorio_rut ON DIRECTORIO_ALBACEAS(rut_albacea);
CREATE INDEX IF NOT EXISTS idx_directorio_invitado ON DIRECTORIO_ALBACEAS(id_usuario_invitado);
CREATE INDEX IF NOT EXISTS idx_poliza_usuario ON POLIZA(id_usuario);
CREATE INDEX IF NOT EXISTS idx_inventario_usuario ON INVENTARIO(id_usuario);
CREATE INDEX IF NOT EXISTS idx_mensaje_usuario ON MENSAJE_POSTUMO(id_usuario);
CREATE INDEX IF NOT EXISTS idx_solicitud_usuario ON SOLICITUD_APERTURA(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reset_token_usuario ON RESET_PASSWORD_TOKEN(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON RESET_PASSWORD_TOKEN(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verif_usuario ON EMAIL_VERIFICACION_TOKEN(id_usuario);
CREATE INDEX IF NOT EXISTS idx_email_verif_hash ON EMAIL_VERIFICACION_TOKEN(token_hash);
CREATE INDEX IF NOT EXISTS idx_ticket_usuario ON TICKET_SOPORTE(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ticket_solicitud ON TICKET_SOPORTE(id_solicitud_asociada);
CREATE INDEX IF NOT EXISTS idx_ticket_reporte ON TICKET_SOPORTE(id_reporte_asociado);

COMMIT;
