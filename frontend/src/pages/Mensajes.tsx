import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton,
  IonAlert,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  lockClosedOutline,
  mailOpenOutline,
  sparklesOutline,
  trashOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import { getMensajes, crearMensaje, eliminarMensaje, MensajeResumen } from '../services/mensajes.service';
import { getAlbaceas, Albacea } from '../services/albaceas.service';
import { mensajeError } from '../services/api';

const PLANTILLAS = [
  {
    etiqueta: 'Agradecimiento',
    texto: 'Quiero darte las gracias por todo el tiempo compartido y recordarte cuánto significas para mí...',
  },
  {
    etiqueta: 'Instrucciones personales',
    texto: 'Respecto a mis pertenencias y documentos personales, mi deseo es que...',
  },
  {
    etiqueta: 'Accesos y llaves',
    texto: 'Las llaves físicas y respaldos digitales principales se encuentran guardados en...',
  },
];

export const Mensajes: React.FC = () => {
  const [mensajes, setMensajes] = useState<MensajeResumen[]>([]);
  const [albaceas, setAlbaceas] = useState<Albacea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [idEliminar, setIdEliminar] = useState<number | null>(null);

  const [rutDestinatario, setRutDestinatario] = useState('');
  const [contenido, setContenido] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataMensajes, dataAlbaceas] = await Promise.all([getMensajes(), getAlbaceas()]);
      const albaceasActivos = (Array.isArray(dataAlbaceas) ? dataAlbaceas : []).filter(
        (a) => a.estado_validacion !== 'RECHAZADO'
      );
      setMensajes(Array.isArray(dataMensajes) ? dataMensajes : []);
      setAlbaceas(albaceasActivos);

      if (albaceasActivos.length > 0 && !rutDestinatario) {
        setRutDestinatario(albaceasActivos[0].rut);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', mensajeError(error));
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
      setErrorMsg('Debes seleccionar un destinatario y redactar tu mensaje.');
      return;
    }

    try {
      setEnviando(true);
      await crearMensaje(rutDestinatario.trim(), contenido.trim());
      setContenido('');
      setToastMsg('Carta sellada y cifrada con AES-256.');
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
      <HeaderBar title="Mensajes Póstumos" />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-hero-banner">
            <h2>Tu legado en palabras</h2>
            <p>
              Cada carta se cifra con <strong>AES-256</strong> antes de guardarse. Nadie —ni siquiera desde la base de
              datos— puede leerla hasta la apertura oficial de tu bóveda.
            </p>
          </div>

          <form onSubmit={handleGuardar} className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                Redactar carta sellada
              </h3>
              <span className="be-badge be-badge-info">
                <IonIcon icon={lockClosedOutline} /> Cifrado AES-256
              </span>
            </div>

            <div className="be-field">
              <label className="be-label">Destinatario (de tu directorio de albaceas) *</label>
              {albaceas.length === 0 ? (
                <div className="be-badge-warning" style={{ padding: '12px 14px', borderRadius: '10px', fontSize: '0.85rem', lineHeight: 1.45 }}>
                  Aún no tienes albaceas activos. Agrega al menos un contacto en <strong>Albaceas</strong> para poder
                  asignarle cartas selladas.
                </div>
              ) : (
                <select
                  className="be-select"
                  value={rutDestinatario}
                  onChange={(e) => setRutDestinatario(e.target.value)}
                >
                  {albaceas.map((a) => (
                    <option key={a.id_directorio} value={a.rut}>
                      {a.nombre_usuario} ({a.rut}) — {a.parentesco}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="be-field">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--be-text-muted)', marginBottom: '8px' }}>
                <IonIcon icon={sparklesOutline} /> Puntos de partida sugeridos:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PLANTILLAS.map((pl) => (
                  <button
                    key={pl.etiqueta}
                    type="button"
                    className="be-btn be-btn-outline"
                    style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: '999px' }}
                    onClick={() => aplicarPlantilla(pl.texto)}
                    disabled={albaceas.length === 0}
                  >
                    + {pl.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div className="be-field">
              <label className="be-label">Contenido confidencial *</label>
              <textarea
                rows={5}
                className="be-textarea"
                placeholder="Escribe tu mensaje privado aquí..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                disabled={albaceas.length === 0}
              />
            </div>

            {errorMsg && (
              <p style={{ color: 'var(--be-danger)', fontSize: '0.85rem', margin: '0 0 12px 0', fontWeight: 600 }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="be-btn be-btn-primary be-btn-block"
              disabled={enviando || albaceas.length === 0}
            >
              {enviando ? (
                <IonSpinner name="crescent" color="light" />
              ) : (
                <>
                  <IonIcon icon={lockClosedOutline} /> Sellar y guardar mensaje
                </>
              )}
            </button>
          </form>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)', margin: '0 0 12px 0' }}>
            Cartas bajo custodia ({mensajes.length})
          </h3>

          {cargando ? (
            <VaultLoader texto="Verificando cartas selladas..." />
          ) : mensajes.length === 0 ? (
            <div className="be-empty-state">
              <IonIcon icon={mailOpenOutline} style={{ fontSize: '2.3rem', marginBottom: '8px', opacity: 0.55 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Todavía no tienes mensajes póstumos sellados.</p>
            </div>
          ) : (
            mensajes.map((m) => (
              <div key={m.id_mensaje} className="be-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 220px', minWidth: 0 }}>
                  <div className="be-icon-box be-icon-box-accent">
                    <IonIcon icon={documentTextOutline} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--be-text)' }}>
                      Para: {m.nombre_destinatario || `RUT ${m.rut_destinatario}`}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                      RUT: {m.rut_destinatario} · Sellado el {new Date(m.fecha_creacion).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="be-badge be-badge-neutral">
                    <IonIcon icon={lockClosedOutline} /> Sellado
                  </span>
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
              </div>
            ))
          )}
        </div>

        <IonAlert
          isOpen={!!idEliminar}
          onDidDismiss={() => setIdEliminar(null)}
          header="Confirmar eliminación"
          message="¿Deseas eliminar este mensaje póstumo? La carta cifrada se borrará de forma permanente."
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Eliminar', role: 'confirm', handler: () => confirmarEliminar() },
          ]}
        />

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3000}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Mensajes;
