import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, sendOutline, headsetOutline, linkOutline } from 'ionicons/icons';
import { enviarMensajeSoporte } from '../services/soporte.service';
import { mensajeError } from '../services/api';

interface SoporteModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriaInicial?: string;
  idSolicitudAsociada?: number | null;
  idReporteAsociado?: number | null;
  referenciaLabel?: string;
  onEnviado?: (mensajeOk: string) => void;
}

export const SoporteModal: React.FC<SoporteModalProps> = ({
  isOpen,
  onClose,
  categoriaInicial = 'Error en apertura de bóveda',
  idSolicitudAsociada = null,
  idReporteAsociado = null,
  referenciaLabel,
  onEnviado,
}) => {
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategoria(categoriaInicial);
      setErrorMsg('');
    }
  }, [isOpen, categoriaInicial]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mensaje.trim().length < 10) {
      setErrorMsg('Cuéntanos un poco más de detalle (al menos 10 caracteres).');
      return;
    }

    try {
      setEnviando(true);
      const res = await enviarMensajeSoporte(categoria, mensaje.trim(), {
        id_solicitud_asociada: idSolicitudAsociada,
        id_reporte_asociado: idReporteAsociado,
      });
      setMensaje('');
      onClose();
      if (onEnviado) {
        onEnviado(res.mensaje || 'Ticket de soporte enviado correctamente.');
      }
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader className="ion-no-border">
        <IonToolbar
          style={
            {
              '--background': 'var(--ion-toolbar-background)',
              '--color': 'var(--ion-toolbar-color)',
            } as React.CSSProperties
          }
        >
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: 700 }}>Contactar a Soporte</IonTitle>
          <button
            type="button"
            slot="end"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'rgba(255,255,255,0.14)',
              border: 'none',
              color: '#ffffff',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              marginRight: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            <IonIcon icon={closeOutline} />
          </button>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <form onSubmit={handleEnviar} style={{ maxWidth: '520px', margin: '8px auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="be-icon-box">
              <IonIcon icon={headsetOutline} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                Crear ticket de soporte
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--be-text-muted)' }}>
                Se genera un número de ticket único con seguimiento en administración y copia a tu correo.
              </p>
            </div>
          </div>

          {referenciaLabel && (
            <div
              className="be-badge-warning"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <IonIcon icon={linkOutline} style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span>Caso vinculado automáticamente: {referenciaLabel}</span>
            </div>
          )}

          <div className="be-field">
            <label className="be-label">Motivo del contacto *</label>
            <select className="be-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="Error en apertura de bóveda">Error o apelación por apertura de bóveda</option>
              <option value="Problema de acceso o cuenta">Problema con mi cuenta o acceso</option>
              <option value="Consulta sobre albaceas o pólizas">Consulta sobre albaceas o pólizas</option>
              <option value="Otro inconveniente">Otro inconveniente</option>
            </select>
          </div>

          <div className="be-field">
            <label className="be-label">Describe lo ocurrido *</label>
            <textarea
              className="be-textarea"
              rows={5}
              maxLength={1500}
              placeholder="Explícanos qué sucedió para revisar y resolver tu caso lo antes posible..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <p style={{ color: 'var(--be-danger)', fontSize: '0.84rem', fontWeight: 600, margin: '0 0 12px 0' }}>
              {errorMsg}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="be-btn be-btn-outline"
              style={{ flex: '1 1 120px' }}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="be-btn be-btn-primary"
              style={{ flex: '2 1 180px' }}
              disabled={enviando}
            >
              {enviando ? (
                <IonSpinner name="crescent" color="light" />
              ) : (
                <>
                  <IonIcon icon={sendOutline} /> Crear ticket y enviar
                </>
              )}
            </button>
          </div>
        </form>
      </IonContent>
    </IonModal>
  );
};

export default SoporteModal;
