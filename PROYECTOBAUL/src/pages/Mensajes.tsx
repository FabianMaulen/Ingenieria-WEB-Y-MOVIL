import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton,
  IonAlert,
  useIonViewWillEnter
} from '@ionic/react';
import { 
  lockClosedOutline, 
  mailOpenOutline, 
  sparklesOutline, 
  trashOutline, 
  heartOutline, 
  documentTextOutline
} from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';

import { getMensajes, crearMensaje, eliminarMensaje, MensajeResumen } from '../services/mensajes.service';
import { getAlbaceas, Albacea } from '../services/albaceas.service';
import { mensajeError } from '../services/api';

export const Mensajes: React.FC = () => {
  const [mensajes, setMensajes] = useState<MensajeResumen[]>([]);
  const [albaceas, setAlbaceas] = useState<Albacea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estado para la alerta de confirmación de eliminación
  const [idEliminar, setIdEliminar] = useState<number | null>(null);

  // Formulario
  const [rutDestinatario, setRutDestinatario] = useState('');
  const [contenido, setContenido] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataMensajes, dataAlbaceas] = await Promise.all([
        getMensajes(),
        getAlbaceas()
      ]);
      setMensajes(Array.isArray(dataMensajes) ? dataMensajes : []);
      setAlbaceas(Array.isArray(dataAlbaceas) ? dataAlbaceas : []);
      
      if (Array.isArray(dataAlbaceas) && dataAlbaceas.length > 0) {
        setRutDestinatario(dataAlbaceas[0].rut);
      }
    } catch (error) {
      console.error('Error al cargar datos:', mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  useIonViewWillEnter(() => {
    cargarDatos();
  });

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!rutDestinatario.trim() || !contenido.trim()) {
      setErrorMsg('Debes seleccionar un destinatario y escribir un mensaje.');
      return;
    }

    try {
      setEnviando(true);
      await crearMensaje(rutDestinatario.trim(), contenido.trim());

      setContenido('');
      setToastMsg('Carta sellada y cifrada con éxito.');
      await cargarDatos();
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!idEliminar) return;
    try {
      await eliminarMensaje(idEliminar);
      setToastMsg('Mensaje póstumo eliminado.');
      await cargarDatos();
    } catch (error) {
      setToastMsg(mensajeError(error));
    } finally {
      setIdEliminar(null);
    }
  };

  const aplicarPlantilla = (texto: string) => {
    setContenido((prev) => (prev ? `${prev}\n\n${texto}` : texto));
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Mensajes Sellados" />

      <IonContent className="ion-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>

          {/* Banner de Contexto y Legado */}
          <div style={{
            backgroundColor: 'var(--ion-color-step-100, rgba(37, 99, 235, 0.08))',
            border: '1px solid var(--ion-color-primary, #2563eb)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '28px',
            color: 'var(--ion-text-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <IonIcon icon={heartOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                Tu Legado de Palabras
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.5', color: 'var(--ion-text-color)' }}>
              Los mensajes póstumos se cifran con <strong>AES-256</strong>. Solo los destinatarios designados en tu Directorio de Albaceas podrán desbloquearlas una vez activada la apertura oficial de tu bóveda.
            </p>
          </div>

          {/* Formulario de Redacción */}
          <form 
            onSubmit={handleGuardar}
            style={{
              backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
              color: 'var(--ion-text-color)',
              borderRadius: '14px',
              border: '1px solid var(--ion-color-step-150, #cbd5e1)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              padding: '24px 28px',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                ✍️ Redactar Nueva Carta Sellada
              </h3>
              <span style={{ 
                fontSize: '0.75rem', 
                backgroundColor: 'var(--ion-color-step-150, #e2e8f0)', 
                color: 'var(--ion-text-color)',
                padding: '4px 10px', 
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '600'
              }}>
                <IonIcon icon={lockClosedOutline} /> AES-256 Encrypted
              </span>
            </div>

            {/* Desplegable de Albaceas Autorizados */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--ion-text-color)' }}>
                Destinatario (Contactos de tu Directorio de Albaceas) *
              </label>
              
              {albaceas.length === 0 ? (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--ion-color-warning-step-100, #fef3c7)',
                  color: 'var(--ion-color-warning-shade, #92400e)',
                  fontSize: '0.85rem'
                }}>
                  ⚠️ No tienes albaceas registrados. Debes agregar al menos un contacto en la sección <strong>Albaceas</strong> para poder asignarle cartas selladas.
                </div>
              ) : (
                <select
                  value={rutDestinatario}
                  onChange={(e) => setRutDestinatario(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    backgroundColor: 'var(--ion-color-step-100, var(--ion-background-color))',
                    color: 'var(--ion-text-color)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {albaceas.map((a) => (
                    <option 
                      key={a.id_directorio} 
                      value={a.rut}
                      style={{
                        backgroundColor: 'var(--ion-card-background, var(--ion-background-color))',
                        color: 'var(--ion-text-color)'
                      }}
                    >
                      {a.nombre_usuario} (RUT: {a.rut}) - {a.parentesco}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Inspiración rápida (Compatible Modo Claro y Oscuro) */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ 
                fontSize: '0.78rem', 
                color: 'var(--ion-color-step-600)', 
                fontWeight: '600', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                marginBottom: '8px' 
              }}>
                <IonIcon icon={sparklesOutline} /> Ideas para iniciar tu redacción:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('Quiero darte las gracias por todo el tiempo compartido y recordarte que...')}
                  style={{
                    backgroundColor: 'var(--ion-color-step-100)',
                    color: 'var(--ion-text-color)',
                    border: '1px solid var(--ion-color-step-200)',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ❤️ Palabras de Agradecimiento
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('Respecto a mis pertenencias y documentos personales, mi deseo es que...')}
                  style={{
                    backgroundColor: 'var(--ion-color-step-100)',
                    color: 'var(--ion-text-color)',
                    border: '1px solid var(--ion-color-step-200)',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  📋 Instrucciones Personales
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('Las llaves y accesos digitales principales los guardo en...')}
                  style={{
                    backgroundColor: 'var(--ion-color-step-100)',
                    color: 'var(--ion-text-color)',
                    border: '1px solid var(--ion-color-step-200)',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔑 Accesos y Claves
                </button>
              </div>
            </div>

            {/* Área de texto para mensaje */}
            <div style={{ marginBottom: '20px' }}>
              <textarea
                rows={6}
                placeholder="Escribe tu mensaje privado aquí..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                disabled={albaceas.length === 0}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                  backgroundColor: 'var(--ion-color-step-100, var(--ion-background-color))',
                  color: 'var(--ion-text-color)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {errorMsg && (
              <p style={{ color: 'var(--ion-color-danger, #ef4444)', fontSize: '0.85rem', margin: '0 0 14px 0' }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || albaceas.length === 0}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: albaceas.length === 0 ? 'var(--ion-color-step-300, #94a3b8)' : 'var(--ion-color-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: albaceas.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {enviando ? <IonSpinner name="crescent" /> : (
                <>
                  <IonIcon icon={lockClosedOutline} /> SELLAR Y GUARDAR MENSAJE
                </>
              )}
            </button>
          </form>

          {/* Lista de Mensajes Custodiados */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--ion-text-color)', marginBottom: '16px' }}>
            📬 Cartas bajo Custodia ({mensajes.length})
          </h3>

          {cargando ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : mensajes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px',
              backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
              borderRadius: '12px',
              border: '1px solid var(--ion-color-step-150, #cbd5e1)',
              color: 'var(--ion-color-step-600, #64748b)'
            }}>
              <IonIcon icon={mailOpenOutline} style={{ fontSize: '2.2rem', marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No tienes mensajes póstumos registrados aún.</p>
            </div>
          ) : (
            mensajes.map((m) => (
              <div
                key={m.id_mensaje}
                style={{
                  backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                  color: 'var(--ion-text-color)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  padding: '18px 22px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--ion-color-step-100, rgba(37, 99, 235, 0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={documentTextOutline} style={{ fontSize: '1.3rem', color: 'var(--ion-color-primary, #2563eb)' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                      Carta para: {m.nombre_destinatario || `RUT ${m.rut_destinatario}`}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--ion-color-step-600, #64748b)' }}>
                      RUT: {m.rut_destinatario} | Creado: {new Date(m.fecha_creacion).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>

                <IonButton
                  fill="clear"
                  color="danger"
                  size="small"
                  onClick={() => setIdEliminar(m.id_mensaje)}
                  title="Eliminar carta"
                >
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </div>
            ))
          )}

        </div>

        {/* Modal Alerta de Confirmación de Borrado */}
        <IonAlert
          isOpen={!!idEliminar}
          onDidDismiss={() => setIdEliminar(null)}
          header="Confirmar eliminación"
          message="¿Estás seguro de que deseas eliminar este mensaje póstumo? La carta sellada será borrada de la bóveda permanentemente."
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Eliminar',
              role: 'confirm',
              handler: () => confirmarEliminar()
            }
          ]}
        />

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default Mensajes;