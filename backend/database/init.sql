-- Script de poblamiento inicial para la base de datos 'baul_eterno' (PostgreSQL)

BEGIN;

-- Limpieza previa e inserción limpia reseteando contadores de ID
TRUNCATE TABLE usuario, polizas, albaceas, mensajes, solicitudes RESTART IDENTITY CASCADE;

-- Contraseña para todos los usuarios: 123123123
-- Hash bcrypt actual: $2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG

INSERT INTO usuario (id_usuario, nombre, rut, email, password_hash, rol) VALUES
(1, 'Roberto Morales', '12345678-9', 'roberto.morales@correo.cl', '$2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG', 'TITULAR'),
(2, 'Camila Morales', '19876543-2', 'camila.morales@correo.cl', '$2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG', 'ALBACEA'),
(3, 'Diego Cárdenas', '15432987-6', 'diego.cardenas@correo.cl', '$2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG', 'TITULAR'),
(4, 'Marcela Valenzuela', '17654321-K', 'marcela.valenzuela@correo.cl', '$2b$10$lp8jwsBS6uxDTmn3RrCk/.PhbLbdGL.COTetAjyIS/TLsEoKHiSpG', 'ALBACEA');

-- Pólizas asociadas a los Titulares
INSERT INTO polizas (id_usuario, aseguradora, numero_poliza, tipo_seguro, monto_referencial, ubicacion_documento) VALUES
(1, 'Consorcio Nacional', 'POL-8475839', 'Seguro de Vida', '$50.000.000 CLP', 'Cajón derecho del escritorio principal'),
(1, 'BCI Seguros', 'POL-1122334', 'Seguro Automotriz', '$12.000.000 CLP', 'Guantera del vehículo patente AB-123-CD'),
(1, 'Banco de Chile', 'POL-9988776', 'Seguro de Desgravamen', 'Cobertura Hipotecaria Total', 'Notaría San Martín - Escritura pública #402'),
(3, 'Sura', 'POL-5544332', 'Seguro Salud Complementario', '$10.000.000 CLP', 'Carpeta digital en correo corporativo');

-- Albaceas designados por el Titular
INSERT INTO albaceas (id_titular, rut_albacea, nombre, parentesco, email, estado) VALUES
(1, '19876543-2', 'Camila Morales', 'Hija', 'camila.morales@correo.cl', 'VALIDADO'),
(1, '17654321-K', 'Marcela Valenzuela', 'Familiar', 'marcela.valenzuela@correo.cl', 'PENDIENTE'),
(3, '17654321-K', 'Marcela Valenzuela', 'Cónyuge', 'marcela.valenzuela@correo.cl', 'VALIDADO');

-- Mensajes póstumos confidenciales sellados
INSERT INTO mensajes (id_titular, rut_destinatario, titulo, mensaje) VALUES
(1, '19876543-2', 'Carta para mi hija Camila', 'Querida Camila, en esta bóveda dejé organizados todos los trámites financieros y pólizas para resguardar a la familia.'),
(1, '19876543-2', 'Instrucciones escrituras', 'Los documentos originales de la casa están en la caja de seguridad del estudio.'),
(3, '17654321-K', 'Mensaje para Marcela', 'Marcela, los seguros de desgravamen se activan con la copia de la escritura.');

-- Solicitud de prueba para la Alerta del Dashboard
INSERT INTO solicitudes (id_titular, rut_albacea, certificado_url, estado_solicitud, fecha_solicitud) VALUES
(1, '19876543-2', '/uploads/certificado_defuncion_demo.pdf', 'PENDIENTE EN PERIODO DE GRACIA', NOW());

-- Sincronizar el correlativo de la secuencia de 'usuario' al valor máximo insertado (4)
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'), COALESCE(MAX(id_usuario), 1)) FROM usuario;

COMMIT;