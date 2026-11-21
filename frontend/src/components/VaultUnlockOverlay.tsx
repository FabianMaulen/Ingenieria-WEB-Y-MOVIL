import React from 'react';
import { VaultChestIcon } from './VaultChestIcon';

interface VaultUnlockOverlayProps {
  visible: boolean;
  nombre?: string;
}

/**
 * Animación de apertura del Baúl al iniciar sesión exitosamente.
 */
export const VaultUnlockOverlay: React.FC<VaultUnlockOverlayProps> = ({ visible, nombre }) => {
  if (!visible) return null;

  return (
    <div className="be-unlock-overlay" role="status" aria-live="polite">
      <VaultChestIcon size={116} mode="opening" />
      <h2 style={{ margin: '4px 0 0 0', fontFamily: 'var(--be-font-serif)', fontSize: '1.55rem', color: '#ffffff' }}>
        {nombre ? `Abriendo el baúl de ${nombre}` : 'Abriendo tu Baúl Eterno'}
      </h2>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(226, 238, 255, 0.85)' }}>
        Verificando custodia y cifrado AES-256...
      </p>
    </div>
  );
};

export default VaultUnlockOverlay;
