import React from 'react';
import { IonIcon } from '@ionic/react';
import { shieldCheckmarkOutline, alertCircleOutline, lockOpenOutline, checkmarkDoneOutline } from 'ionicons/icons';

interface VaultStatusProps {
  daysLeft: number;
  totalCycleDays?: number;
  status: 'PROTEGIDA' | 'EN_REVISION' | 'LIBERADA';
  onCheckin: () => void;
  loading?: boolean;
}

export const VaultStatusCard: React.FC<VaultStatusProps> = ({
  daysLeft,
  totalCycleDays = 180,
  status,
  onCheckin,
  loading = false,
}) => {
  const ciclo = Math.max(1, totalCycleDays);
  const porcentaje = Math.max(0, Math.min(100, Math.round((daysLeft / ciclo) * 100)));

  const configEstado = {
    PROTEGIDA: {
      badgeClass: 'be-badge be-badge-success',
      label: 'BÓVEDA PROTEGIDA',
      icon: shieldCheckmarkOutline,
      barColor: 'var(--be-success)',
    },
    EN_REVISION: {
      badgeClass: 'be-badge be-badge-warning',
      label: 'EN PERIODO DE GRACIA',
      icon: alertCircleOutline,
      barColor: 'var(--be-warning)',
    },
    LIBERADA: {
      badgeClass: 'be-badge be-badge-danger',
      label: 'BÓVEDA LIBERADA',
      icon: lockOpenOutline,
      barColor: 'var(--be-danger)',
    },
  }[status];

  return (
    <div className="be-card" style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div>
          <span className={configEstado.badgeClass} style={{ marginBottom: '8px' }}>
            <IonIcon icon={configEstado.icon} />
            {configEstado.label}
          </span>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--be-text)' }}>
            Vigencia de tu Bóveda Patrimonial
          </h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--be-font-display)', color: 'var(--be-text)' }}>
            {daysLeft}
          </span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--be-text-muted)', fontWeight: 600 }}>
            {status === 'EN_REVISION' ? 'días de gracia aprox.' : `de ${ciclo} días`}
          </span>
        </div>
      </div>

      {/* Barra visual de vigencia */}
      <div
        style={{
          height: '8px',
          width: '100%',
          backgroundColor: 'var(--be-surface-alt)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${porcentaje}%`,
            backgroundColor: configEstado.barColor,
            borderRadius: '999px',
            transition: 'width 0.35s ease',
          }}
        />
      </div>

      <p style={{ margin: '0 0 18px 0', fontSize: '0.88rem', color: 'var(--be-text-muted)', lineHeight: 1.5 }}>
        Confirma periódicamente tu actividad para mantener tu legado sellado por un nuevo ciclo de{' '}
        <strong style={{ color: 'var(--be-text)' }}>{ciclo} días</strong> y desactivar cualquier alerta pendiente.
        Puedes cambiar esta frecuencia en <strong>Ajustes y Clave</strong>.
      </p>

      <button
        type="button"
        className="be-btn be-btn-accent be-btn-block"
        onClick={onCheckin}
        disabled={loading}
      >
        <IonIcon icon={checkmarkDoneOutline} style={{ fontSize: '1.15rem' }} />
        {loading ? 'Confirmando presencia...' : 'Confirmar Presencia (Check-in)'}
      </button>
    </div>
  );
};

export default VaultStatusCard;
