-- Baúl Eterno - Estructura de la base de datos (PostgreSQL)
-- Uso: crear la base `baul_eterno` en pgAdmin o psql y ejecutar este script completo.

-- ============================================================================
-- 1. USUARIO
-- Todo usuario registrado es titular de su propia bóveda y puede actuar
-- simultáneamente como albacea de terceros si figura en DIRECTORIO_ALBACEAS.
-- ============================================================================
CREATE TABLE IF NOT EXISTS USUARIO (
  id_usuario SERIAL PRIMARY KEY,
  rut VARCHAR(12) NULL UNIQUE
    CONSTRAINT chk_usuario_rut CHECK (rut IS NULL OR rut ~ '^[0-9]{7,8}-[0-9K]$'),
  nombre_usuario VARCHAR(150) NOT NULL,
  contrasena_hash VARCHAR(250) NULL,
  google_id VARCHAR(128) NULL UNIQUE,
  avatar_url TEXT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'TITULAR'
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('TITULAR', 'ALBACEA', 'ADMIN')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  boveda_activa BOOLEAN NOT NULL DEFAULT FALSE,
  terminos_aceptados_en TIMESTAMP NULL,
  fecha_ultimo_checkin TIMESTAMP NOT NULL DEFAULT NOW(),
  frecuencia_checkin_dias INT NOT NULL DEFAULT 180
    CONSTRAINT chk_usuario_frecuencia CHECK (frecuencia_checkin_dias IN (30, 90, 180, 365)),
  plazo_gracia_dias INT NOT NULL DEFAULT 7
    CONSTRAINT chk_usuario_gracia CHECK (plazo_gracia_dias IN (3, 7, 14)),
  correo_usuario VARCHAR(150) NOT NULL UNIQUE,
  correo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  correo_alternativo VARCHAR(150) NULL,
  correo_alternativo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  nombre_contacto_confianza VARCHAR(150) NULL,
  correo_contacto_confianza VARCHAR(150) NULL,
  notificar_recordatorios BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_recordatorio_enviado VARCHAR(30) NULL
);

-- ============================================================================
-- 2. DIRECTORIO_ALBACEAS
-- Permite designar tanto usuarios ya registrados (id_usuario_invitado NOT NULL,
-- estado 'PENDIENTE') como personas aún no registradas (id_usuario_invitado NULL,
-- estado 'INVITADO') para su vinculación automática al registrarse por RUT.
-- ============================================================================
CREATE TABLE IF NOT EXISTS DIRECTORIO_ALBACEAS (
  id_directorio SERIAL PRIMARY KEY,
  nombre_albacea VARCHAR(150) NOT NULL,
  rut_albacea VARCHAR(12) NOT NULL
    CONSTRAINT chk_albacea_rut CHECK (rut_albacea ~ '^[0-9]{7,8}-[0-9K]$'),
  email_albacea VARCHAR(150) NOT NULL,
  parentesco VARCHAR(50) NOT NULL,
  estado_validacion VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
    CONSTRAINT chk_estado_validacion CHECK (estado_validacion IN ('PENDIENTE', 'VALIDADO', 'RECHAZADO', 'INVITADO')),
  fecha_designacion TIMESTAMP NOT NULL DEFAULT NOW(),
  id_titular INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  id_usuario_invitado INT NULL REFERENCES USUARIO(id_usuario) ON DELETE SET NULL,
  UNIQUE (id_titular, rut_albacea)
);

-- ============================================================================
-- 3. POLIZA (RF-01 / RF-07)
-- Instrumentos de seguro registrados por el usuario titular.
-- ============================================================================
CREATE TABLE IF NOT EXISTS POLIZA (
  id_poliza SERIAL PRIMARY KEY,
  tipo_seguro VARCHAR(100) NOT NULL,
  aseguradora VARCHAR(100) NOT NULL,
  numero_poliza VARCHAR(100) NOT NULL,
  ubicacion_fisica VARCHAR(200) NOT NULL,
  monto_referencial NUMERIC(14,2) NOT NULL DEFAULT 0
    CONSTRAINT chk_poliza_monto CHECK (monto_referencial >= 0),
  tramitada BOOLEAN NOT NULL DEFAULT FALSE,
  documento_cifrado VARCHAR(180) NULL,
  documento_nombre VARCHAR(200) NULL,
  documento_mime VARCHAR(80) NULL,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

-- ============================================================================
-- 4. INVENTARIO
-- Respaldo real en base de datos para los activos digitales y patrimoniales
-- gestionados en la vista Inventario.tsx del frontend.
-- ============================================================================
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

-- ============================================================================
-- 5. MENSAJE_POSTUMO (RF-03 / RNF-03)
-- Cartas cifradas con AES-256-CBC cuyo destinatario se identifica por RUT.
-- ============================================================================
CREATE TABLE IF NOT EXISTS MENSAJE_POSTUMO (
  id_mensaje SERIAL PRIMARY KEY,
  fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
  contenido_cifrado TEXT NOT NULL,
  rut_destinatario VARCHAR(12) NULL
    CONSTRAINT chk_mensaje_rut CHECK (rut_destinatario IS NULL OR rut_destinatario ~ '^[0-9]{7,8}-[0-9K]$'),
  nombre_destinatario_externo VARCHAR(150) NULL,
  correo_destinatario VARCHAR(150) NULL,
  enviado_por_correo BOOLEAN NOT NULL DEFAULT FALSE,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  CONSTRAINT chk_mensaje_destinatario CHECK (rut_destinatario IS NOT NULL OR correo_destinatario IS NOT NULL)
);

-- ============================================================================
-- 6. SOLICITUD_APERTURA (RF-05 / RF-06)
-- Proceso formal de contingencia iniciado por un albacea validado.
-- ============================================================================
CREATE TABLE IF NOT EXISTS SOLICITUD_APERTURA (
  id_solicitud SERIAL PRIMARY KEY,
  certificado_defuncion VARCHAR(100) NOT NULL,
  hash_documento VARCHAR(255) NOT NULL,
  estado_solicitud VARCHAR(60) NOT NULL DEFAULT 'PENDIENTE'
    CONSTRAINT chk_estado_solicitud CHECK (estado_solicitud IN ('PENDIENTE', 'CANCELADA', 'APROBADA')),
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
  plazo_gracia_horas INT NOT NULL DEFAULT 168,
  ultimo_aviso_etapa VARCHAR(30) NULL,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  id_albacea INT NOT NULL REFERENCES DIRECTORIO_ALBACEAS(id_directorio) ON DELETE CASCADE
);

-- ============================================================================
-- 7. AUDITORIA (RNF-05)
-- Bitácora de eventos críticos de seguridad y trazabilidad.
-- ============================================================================
CREATE TABLE IF NOT EXISTS AUDITORIA (
  id_evento SERIAL PRIMARY KEY,
  accion VARCHAR(255) NOT NULL,
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  direccion_ip VARCHAR(50) NOT NULL,
  id_usuario INT REFERENCES USUARIO(id_usuario) ON DELETE SET NULL
);

-- ============================================================================
-- 8. RESET_PASSWORD_TOKEN
-- Tokens temporales hasheados (SHA-256) para recuperación de contraseña.
-- ============================================================================
CREATE TABLE IF NOT EXISTS RESET_PASSWORD_TOKEN (
  id_token SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. REPORTE_FAMILIAR
-- Reportes de contingencia enviados por familiares aún no registrados en la app.
-- ============================================================================
CREATE TABLE IF NOT EXISTS REPORTE_FAMILIAR (
  id_reporte SERIAL PRIMARY KEY,
  rut_titular_consultado VARCHAR(12) NOT NULL
    CONSTRAINT chk_reporte_rut_titular CHECK (rut_titular_consultado ~ '^[0-9]{7,8}-[0-9K]$'),
  id_titular_encontrado INT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  nombre_familiar VARCHAR(150) NOT NULL,
  rut_familiar VARCHAR(12) NOT NULL
    CONSTRAINT chk_reporte_rut_familiar CHECK (rut_familiar ~ '^[0-9]{7,8}-[0-9K]$'),
  correo_familiar VARCHAR(150) NOT NULL,
  parentesco VARCHAR(50) NOT NULL,
  certificado_archivo VARCHAR(120) NOT NULL,
  hash_documento VARCHAR(255) NOT NULL,
  folio_extraido VARCHAR(100) NULL,
  estado_reporte VARCHAR(30) NOT NULL DEFAULT 'RECIBIDO'
    CONSTRAINT chk_estado_reporte CHECK (
      estado_reporte IN ('RECIBIDO', 'EN_REVISION', 'VALIDADO', 'RECHAZADO', 'CANCELADO_TITULAR')
    ),
  plazo_gracia_horas INT NOT NULL DEFAULT 168,
  ultimo_aviso_etapa VARCHAR(30) NULL,
  fecha_reporte TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. EMAIL_VERIFICACION_TOKEN
-- Códigos/tokens temporales para confirmar correo principal o alternativo.
-- ============================================================================
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

-- ============================================================================
-- 11. TICKET_SOPORTE
-- Tickets de soporte y apelaciones trazables asociados a solicitudes o reportes.
-- ============================================================================
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

-- Índices recomendados para consultas frecuentes
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
