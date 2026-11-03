-- Baúl Eterno - Estructura de la base de datos (PostgreSQL)
-- Uso: crear la base `baul_eterno` en pgAdmin, abrir el Query Tool
-- sobre ella y ejecutar este script completo.

CREATE TABLE USUARIO (
  id_usuario SERIAL PRIMARY KEY,
  rut VARCHAR(12) NOT NULL UNIQUE,
  nombre_usuario VARCHAR(150) NOT NULL,
  contrasena_hash VARCHAR(250) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('TITULAR','ALBACEA','ADMIN')),
  fecha_ultimo_checkin DATE NOT NULL DEFAULT CURRENT_DATE,
  correo_usuario VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE DIRECTORIO_ALBACEAS (
  id_directorio SERIAL PRIMARY KEY,
  parentesco VARCHAR(50) NOT NULL,
  estado_validacion VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  id_titular INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  id_usuario_invitado INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
  UNIQUE (id_titular, id_usuario_invitado)
);

CREATE TABLE POLIZA (
  id_poliza SERIAL PRIMARY KEY,
  tipo_seguro VARCHAR(100) NOT NULL,
  aseguradora VARCHAR(100) NOT NULL,
  numero_poliza VARCHAR(100) NOT NULL,
  ubicacion_fisica VARCHAR(200) NOT NULL,
  monto_referencial NUMERIC(14,2) NOT NULL,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

CREATE TABLE MENSAJE_POSTUMO (
  id_mensaje SERIAL PRIMARY KEY,
  fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
  contenido_cifrado TEXT NOT NULL,
  rut_destinatario VARCHAR(12) NOT NULL,
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

CREATE TABLE SOLICITUD_APERTURA (
  id_solicitud SERIAL PRIMARY KEY,
  certificado_defuncion VARCHAR(100) NOT NULL,
  hash_documento VARCHAR(255) NOT NULL,
  estado_solicitud VARCHAR(60) NOT NULL DEFAULT 'PENDIENTE',
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
  id_usuario INT NOT NULL REFERENCES USUARIO(id_usuario),
  id_albacea INT NOT NULL REFERENCES DIRECTORIO_ALBACEAS(id_directorio)
);

CREATE TABLE AUDITORIA (
  id_evento SERIAL PRIMARY KEY,
  accion VARCHAR(255) NOT NULL,
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  direccion_ip VARCHAR(50) NOT NULL,
  id_usuario INT REFERENCES USUARIO(id_usuario)
);

-- Cambios de esquema para RF-05, RF-06 y RF-07

-- RF-07: checklist de pólizas ya tramitadas
ALTER TABLE POLIZA
  ADD COLUMN tramitada BOOLEAN NOT NULL DEFAULT FALSE;

-- RF-05 / RF-06: estados válidos de una solicitud de apertura
ALTER TABLE SOLICITUD_APERTURA
  ADD CONSTRAINT chk_estado_solicitud
  CHECK (estado_solicitud IN ('PENDIENTE', 'CANCELADA', 'APROBADA'));