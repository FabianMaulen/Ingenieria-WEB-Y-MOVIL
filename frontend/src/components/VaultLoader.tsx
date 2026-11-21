import React from 'react';
import { VaultChestIcon } from './VaultChestIcon';

interface VaultLoaderProps {
  texto?: string;
}

/**
 * Indicador de carga temático: Baúl entreabriéndose suavemente con luz azul celestial.
 */
export const VaultLoader: React.FC<VaultLoaderProps> = ({ texto = 'Abriendo bóveda...' }) => {
  return (
    <div className="be-vault-loader" role="status" aria-live="polite">
      <VaultChestIcon size={64} mode="breathing" />
      <span className="be-vault-loader-label">{texto}</span>
    </div>
  );
};

export default VaultLoader;
