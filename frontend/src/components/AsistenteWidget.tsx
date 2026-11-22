import React, { useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  chatbubbleEllipsesOutline,
  closeOutline,
  sendOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { preguntarAsistente } from '../services/asistente.service';
import { mensajeError } from '../services/api';

interface MensajeChat {
  emisor: 'usuario' | 'asistente';
  texto: string;
}

const PREGUNTAS_RAPIDAS = [
  '¿Cómo funciona el Check-in de 180 días?',
  '¿Puedo invitar a un albacea sin cuenta?',
  '¿Cómo se protegen mis mensajes póstumos?',
  '¿Qué pasa durante el periodo de gracia de 72h?',
];

export const AsistenteWidget: React.FC = () => {
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      emisor: 'asistente',
      texto:
        '¡Hola! Soy el asistente orientador de Baúl Eterno. Pregúntame sobre pólizas, albaceas, cifrado AES-256, check-in o aperturas.',
    },
  ]);

  const enviarConsulta = async (textoPregunta: string) => {
    const limpio = textoPregunta.trim();
    if (!limpio || cargando) return;

    setMensajes((prev) => [...prev, { emisor: 'usuario', texto: limpio }]);
    setConsulta('');
    setCargando(true);

    try {
      const res = await preguntarAsistente(limpio);
      setMensajes((prev) => [...prev, { emisor: 'asistente', texto: res.respuesta }]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        { emisor: 'asistente', texto: `No pude responder ahora: ${mensajeError(error)}` },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* Botón flotante discreto (posicionado por encima de MobileBottomNav en móvil) */}
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          title="Asistente de ayuda de Baúl Eterno"
          aria-label="Abrir asistente de ayuda"
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '74px',
            zIndex: 900,
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(135deg, #194580 0%, #2763b0 100%)',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(25, 69, 128, 0.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.45rem',
          }}
        >
          <IonIcon icon={chatbubbleEllipsesOutline} />
        </button>
      )}

      {/* Panel flotante de orientación */}
      {abierto && (
        <div
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '72px',
            zIndex: 950,
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: 'min(500px, calc(100vh - 130px))',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--be-surface)',
            color: 'var(--be-text)',
            border: '1px solid var(--be-border)',
            borderRadius: '18px',
            boxShadow: 'var(--be-shadow-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Cabecera */}
          <div
            style={{
              background: 'var(--be-hero-bg)',
              color: '#ffffff',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={sparklesOutline} style={{ fontSize: '1.15rem', color: '#d8c3ae' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Guía Baúl Eterno (IA)</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.82 }}>Orientación rápida de la plataforma</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
              style={{
                background: 'rgba(255, 255, 255, 0.14)',
                border: 'none',
                color: '#ffffff',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
              }}
            >
              <IonIcon icon={closeOutline} />
            </button>
          </div>

          {/* Historial de mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {mensajes.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.emisor === 'usuario' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '10px 13px',
                  borderRadius: m.emisor === 'usuario' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  backgroundColor:
                    m.emisor === 'usuario' ? 'var(--be-primary)' : 'var(--be-surface-alt)',
                  color: m.emisor === 'usuario' ? '#ffffff' : 'var(--be-text)',
                  fontSize: '0.84rem',
                  lineHeight: 1.48,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.texto}
              </div>
            ))}

            {cargando && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: '12px', backgroundColor: 'var(--be-surface-alt)' }}>
                <IonSpinner name="dots" />
              </div>
            )}

            {/* Sugerencias rápidas al inicio */}
            {mensajes.length <= 2 && !cargando && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {PREGUNTAS_RAPIDAS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => enviarConsulta(q)}
                    style={{
                      backgroundColor: 'var(--be-primary-soft)',
                      color: 'var(--be-primary)',
                      border: '1px solid var(--be-border)',
                      borderRadius: '999px',
                      padding: '5px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input de consulta */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarConsulta(consulta);
            }}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '10px 12px',
              borderTop: '1px solid var(--be-border)',
              backgroundColor: 'var(--be-surface)',
            }}
          >
            <input
              type="text"
              className="be-input"
              style={{ padding: '9px 12px', fontSize: '0.85rem' }}
              placeholder="Escribe tu duda sobre la app..."
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              className="be-btn be-btn-primary"
              style={{ padding: '9px 13px' }}
              disabled={cargando || !consulta.trim()}
              aria-label="Enviar consulta"
            >
              <IonIcon icon={sendOutline} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AsistenteWidget;
