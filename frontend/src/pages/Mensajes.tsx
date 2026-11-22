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
  mailOutline,
  peopleOutline,
} from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import { getMensajes, crearMensaje, eliminarMensaje, MensajeResumen } from '../services/mensajes.service';
import { getAlbaceas, Albacea } from '../services/albaceas.service';
import { mensajeError } from '../services/api';
import { emailValido } from '../utils/rut';

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

  const [tipoDestinatario, setTipoDestinatario] = useState<'ALBACEA' | 'EXTERNO'>('ALBACEA');
  const [rutDestinatario, setRutDestinatario] = useState('');
  const [nombreExterno, setNombreExterno] = useState('');
  const [correoExterno, setCorreoExterno] = useState('');
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
      } else if (albaceasActivos.length === 0) {
        setTipoDestinatario('EXTERNO');
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

    if (!contenido.trim()) {
      setErrorMsg('Debes redactar el contenido de tu mensaje.');
      return;
    }

    if (tipoDestinatario === 'ALBACEA') {
      if (!rutDestinatario.trim()) {
        setErrorMsg('Debes seleccionar un albacea destinatario.');
        return;
      }
    } else {
      if (nombreExterno.trim().length < 2) {
        setErrorMsg('Ingresa el nombre del destinatario.');
        return;
      }
      if (!emailValido(correoExterno)) {
        setErrorMsg('Ingresa un correo electrónico válido para entregar la carta.');
        return;
      }
    }

    try {
      setEnviando(true);
      if (tipoDestinatario === 'ALBACEA') {
        await crearMensaje({
          tipo_destinatario: 'ALBACEA',
          rut_destinatario: rutDestinatario.trim(),
          contenido: contenido.trim(),
        });
      } else {
        await crearMensaje({
          tipo_destinatario: 'EXTERNO',
          nombre_destinatario: nombreExterno.trim(),
          correo_destinatario: correoExterno.trim().toLowerCase(),
          contenido: contenido.trim(),
        });
      }

      setContenido('');
      setNombreExterno('');
      setCorreoExterno('');
      setToastMsg('Carta sellada y resguardada con cifrado de alto estándar.');
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

  const sinAlbaceasEnModoAlbacea = tipoDestinatario === 'ALBACEA' && albaceas.length === 0;

  return (
    <IonPage id="main-content">
      <HeaderBar title="Mensajes Póstumos" />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-hero-banner">
            <h2>Tu legado en palabras</h2>
            <p>
              Cada carta se resguarda con <strong>cifrado de alto estándar de seguridad</strong> antes de guardarse.
              Puedes dejar cartas a tus albaceas o a cualquier persona mediante su correo electrónico (sin que necesite
              cuenta).
            </p>
          </div>

          <form onSubmit={handleGuardar} className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                Redactar carta sellada
              </h3>
              <span className="be-badge be-badge-info">
                <IonIcon icon={lockClosedOutline} /> Cifrado de alto estándar
              </span>
            </div>

            {/* Selector de tipo de destinatario */}
            <div className="be-field">
              <label className="be-label">¿A quién va dirigida esta carta? *</label>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  padding: '4px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--be-surface-alt)',
                  border: '1px solid var(--be-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setTipoDestinatario('ALBACEA')}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: tipoDestinatario === 'ALBACEA' ? 'var(--be-primary)' : 'transparent',
                    color: tipoDestinatario === 'ALBACEA' ? '#ffffff' : 'var(--be-text-muted)',
                  }}
                >
                  <IonIcon icon={peopleOutline} /> Albacea designado
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDestinatario('EXTERNO')}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: tipoDestinatario === 'EXTERNO' ? 'var(--be-primary)' : 'transparent',
                    color: tipoDestinatario === 'EXTERNO' ? '#ffffff' : 'var(--be-text-muted)',
                  }}
                >
                  <IonIcon icon={mailOutline} /> Persona externa (por correo)
                </button>
              </div>
            </div>

            {tipoDestinatario === 'ALBACEA' ? (
              <div className="be-field">
                <label className="be-label">Destinatario (de tu directorio de albaceas) *</label>
                {albaceas.length === 0 ? (
                  <div className="be-badge-warning" style={{ padding: '12px 14px', borderRadius: '10px', fontSize: '0.84rem', lineHeight: 1.45 }}>
                    Aún no tienes albaceas registrados. Puedes agregar uno en <strong>Albaceas</strong> o cambiar arriba
                    a <strong>Persona externa (por correo)</strong> para escribirle a cualquier persona ahora mismo.
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
            ) : (
              <div className="be-grid-2">
                <div className="be-field">
                  <label className="be-label">Nombre del destinatario *</label>
                  <input
                    type="text"
                    className="be-input"
                    placeholder="Ej: María José Soto"
                    value={nombreExterno}
                    onChange={(e) => setNombreExterno(e.target.value)}
                  />
                </div>
                <div className="be-field">
                  <label className="be-label">Correo electrónico de entrega *</label>
                  <input
                    type="email"
                    className="be-input"
                    placeholder="destinatario@correo.cl"
                    value={correoExterno}
                    onChange={(e) => setCorreoExterno(e.target.value)}
                  />
                  <span style={{ display: 'block', fontSize: '0.73rem', color: 'var(--be-text-muted)', marginTop: '4px' }}>
                    No necesita cuenta: la carta se enviará a este correo únicamente al liberarse tu bóveda.
                  </span>
                </div>
              </div>
            )}

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
                    disabled={sinAlbaceasEnModoAlbacea}
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
                disabled={sinAlbaceasEnModoAlbacea}
              />
            </div>

            {errorMsg && (
              <p style={{ color: 'var(--be-danger)', fontSize: '0.85rem', margin: '0 0 12px 0', fontWeight: 600 }}>
                {errorMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {contenido.trim().length > 0 && (
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ flex: '1 1 140px' }}
                  onClick={() => {
                    setContenido('');
                    setErrorMsg('');
                  }}
                >
                  Descartar borrador
                </button>
              )}
              <button
                type="submit"
                className="be-btn be-btn-primary"
                style={{ flex: '2 1 200px' }}
                disabled={enviando || sinAlbaceasEnModoAlbacea}
              >
                {enviando ? (
                  <IonSpinner name="crescent" color="light" />
                ) : (
                  <>
                    <IonIcon icon={lockClosedOutline} /> Sellar y guardar mensaje
                  </>
                )}
              </button>
            </div>
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
                    <IonIcon icon={m.es_externo ? mailOutline : documentTextOutline} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--be-text)' }}>
                      Para: {m.nombre_destinatario || (m.rut_destinatario ? `RUT ${m.rut_destinatario}` : m.correo_destinatario)}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                      {m.es_externo
                        ? `Correo externo: ${m.correo_destinatario}`
                        : `Albacea · RUT: ${m.rut_destinatario}`}{' '}
                      · Sellado el {new Date(m.fecha_creacion).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {m.es_externo && (
                    <span className={m.enviado_por_correo ? 'be-badge be-badge-success' : 'be-badge be-badge-info'}>
                      {m.enviado_por_correo ? 'Entregado' : 'Envío por correo'}
                    </span>
                  )}
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
