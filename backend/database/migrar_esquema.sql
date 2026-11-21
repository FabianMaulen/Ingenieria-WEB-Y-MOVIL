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

COMMIT;
