-- Script de poblamiento inicial para la base de datos 'baul_eterno' (PostgreSQL)
-- Sincronizado con el esquema oficial de backend/database/baul_eterno.sql

BEGIN;

-- Limpieza total reseteando identidades y respetando integridad referencial
TRUNCATE TABLE
  AUDITORIA,
  SOLICITUD_APERTURA,
  MENSAJE_POSTUMO,
  INVENTARIO,
  POLIZA,
  DIRECTORIO_ALBACEAS,
  USUARIO
RESTART IDENTITY CASCADE;

-- ============================================================================
-- 1. USUARIO
-- Contraseña para todos los usuarios de prueba: 123123123
-- Hash bcrypt: $2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG
-- Todos los RUT cumplen el formato y dígito verificador chileno (Módulo 11).
-- ============================================================================
INSERT INTO USUARIO (id_usuario, rut, nombre_usuario, contrasena_hash, rol, fecha_ultimo_checkin, correo_usuario) VALUES
(1, '12345678-5', 'Roberto Morales', '$2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG', 'TITULAR', NOW() - INTERVAL '5 days', 'roberto.morales@correo.cl'),
(2, '19876543-0', 'Camila Morales', '$2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG', 'TITULAR', NOW() - INTERVAL '2 days', 'camila.morales@correo.cl'),
(3, '15432987-0', 'Diego Cárdenas', '$2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG', 'TITULAR', NOW() - INTERVAL '10 days', 'diego.cardenas@correo.cl'),
(4, '17654321-3', 'Marcela Valenzuela', '$2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG', 'TITULAR', NOW() - INTERVAL '1 day', 'marcela.valenzuela@correo.cl');

-- ============================================================================
-- 2. DIRECTORIO_ALBACEAS
-- Incluye usuarios ya registrados (VALIDADO / PENDIENTE) y un invitado externo
-- aún no registrado en USUARIO (estado INVITADO, id_usuario_invitado = NULL).
-- ============================================================================
INSERT INTO DIRECTORIO_ALBACEAS
  (id_directorio, nombre_albacea, rut_albacea, email_albacea, parentesco, estado_validacion, fecha_designacion, id_titular, id_usuario_invitado)
VALUES
(1, 'Camila Morales', '19876543-0', 'camila.morales@correo.cl', 'Hijo/a', 'VALIDADO', NOW() - INTERVAL '20 days', 1, 2),
(2, 'Marcela Valenzuela', '17654321-3', 'marcela.valenzuela@correo.cl', 'Familiar', 'PENDIENTE', NOW() - INTERVAL '3 days', 1, 4),
(3, 'Esteban Paredes', '18111222-0', 'esteban.paredes@correo.cl', 'Abogado/a', 'INVITADO', NOW() - INTERVAL '1 day', 1, NULL),
(4, 'Marcela Valenzuela', '17654321-3', 'marcela.valenzuela@correo.cl', 'Cónyuge', 'VALIDADO', NOW() - INTERVAL '15 days', 3, 4);

-- ============================================================================
-- 3. POLIZA
-- ============================================================================
INSERT INTO POLIZA
  (id_poliza, tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial, tramitada, id_usuario)
VALUES
(1, 'Seguro de Vida Individual', 'Consorcio', 'POL-8475839', 'Cajón derecho del escritorio principal', 50000000.00, FALSE, 1),
(2, 'Seguro Automotriz', 'BCI Seguros', 'POL-1122334', 'Guantera del vehículo patente AB-123-CD', 12000000.00, FALSE, 1),
(3, 'Seguro Desgravamen', 'MetLife', 'POL-9988776', 'Notaría San Martín - Escritura pública #402', 85000000.00, FALSE, 1),
(4, 'Seguro Complementario de Salud', 'Sura', 'POL-5544332', 'Carpeta digital en correo corporativo', 10000000.00, FALSE, 3);

-- ============================================================================
-- 4. INVENTARIO
-- Activos digitales y patrimoniales asociados al titular.
-- ============================================================================
INSERT INTO INVENTARIO
  (id_inventario, plataforma, instruccion, categoria, fecha_creacion, id_usuario)
VALUES
(1, 'Google Drive / Fotos', 'Descargar respaldo familiar completo y cerrar cuenta', 'Familiar Directo', NOW() - INTERVAL '12 days', 1),
(2, 'Instagram', 'Solicitar conversión de perfil a cuenta conmemorativa', 'Público', NOW() - INTERVAL '10 days', 1),
(3, 'Suscripción Spotify', 'Cancelar cobro recurrente asociado a tarjeta de crédito', 'Financiero', NOW() - INTERVAL '8 days', 1),
(4, 'Cuenta iCloud', 'Respaldar documentos legales almacenados en carpeta Familia', 'Digital', NOW() - INTERVAL '4 days', 3);

-- ============================================================================
-- 5. MENSAJE_POSTUMO
-- Contenido almacenado en formato cifrado IV:CIPHER (AES-256-CBC).
-- ============================================================================
INSERT INTO MENSAJE_POSTUMO
  (id_mensaje, fecha_creacion, contenido_cifrado, rut_destinatario, id_usuario)
VALUES
(1, CURRENT_DATE - INTERVAL '7 days', '00112233445566778899aabbccddeeff:8a4f2c9e1b3d5a7c0e9f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f', '19876543-0', 1),
(2, CURRENT_DATE - INTERVAL '5 days', '112233445566778899aabbccddeeff00:7b3e1d8c2a4f6b0e9d1c3a5b7d9e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a', '19876543-0', 1),
(3, CURRENT_DATE - INTERVAL '3 days', '2233445566778899aabbccddeeff0011:6c2d0e7b1f3a5c9d8e0b2a4c6e8f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b', '17654321-3', 3);

-- ============================================================================
-- 6. SOLICITUD_APERTURA
-- Solicitud pendiente dentro del periodo de gracia para probar la alerta en Dashboard.
-- ============================================================================
INSERT INTO SOLICITUD_APERTURA
  (id_solicitud, certificado_defuncion, hash_documento, estado_solicitud, fecha_solicitud, id_usuario, id_albacea)
VALUES
(1, 'certificado_defuncion_demo.pdf', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'PENDIENTE', NOW(), 1, 1);

-- ============================================================================
-- 7. AUDITORIA
-- ============================================================================
INSERT INTO AUDITORIA (id_evento, accion, fecha_hora, direccion_ip, id_usuario) VALUES
(1, 'Inicialización de cuenta y carga de datos semilla', NOW() - INTERVAL '5 days', '127.0.0.1', 1),
(2, 'Designó a Camila Morales como albacea (VALIDADO)', NOW() - INTERVAL '20 days', '127.0.0.1', 1);

-- ============================================================================
-- Sincronización de todas las secuencias SERIAL con los IDs insertados
-- ============================================================================
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'), COALESCE(MAX(id_usuario), 1)) FROM USUARIO;
SELECT setval(pg_get_serial_sequence('directorio_albaceas', 'id_directorio'), COALESCE(MAX(id_directorio), 1)) FROM DIRECTORIO_ALBACEAS;
SELECT setval(pg_get_serial_sequence('poliza', 'id_poliza'), COALESCE(MAX(id_poliza), 1)) FROM POLIZA;
SELECT setval(pg_get_serial_sequence('inventario', 'id_inventario'), COALESCE(MAX(id_inventario), 1)) FROM INVENTARIO;
SELECT setval(pg_get_serial_sequence('mensaje_postumo', 'id_mensaje'), COALESCE(MAX(id_mensaje), 1)) FROM MENSAJE_POSTUMO;
SELECT setval(pg_get_serial_sequence('solicitud_apertura', 'id_solicitud'), COALESCE(MAX(id_solicitud), 1)) FROM SOLICITUD_APERTURA;
SELECT setval(pg_get_serial_sequence('auditoria', 'id_evento'), COALESCE(MAX(id_evento), 1)) FROM AUDITORIA;

COMMIT;
