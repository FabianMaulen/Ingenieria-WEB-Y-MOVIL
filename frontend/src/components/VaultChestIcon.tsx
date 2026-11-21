import React from 'react';

interface VaultChestIconProps {
  size?: number;
  mode?: 'static' | 'breathing' | 'opening';
}

/**
 * Emblema SVG artesanal del Baúl / Cofre:
 * Madera nogal cálida + herrajes metálicos acero/plata + luz azul serena al abrirse.
 */
export const VaultChestIcon: React.FC<VaultChestIconProps> = ({ size = 56, mode = 'static' }) => {
  const modeClass =
    mode === 'opening' ? 'be-chest-opening' : mode === 'breathing' ? 'be-chest-breathing' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className={modeClass}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="beWoodBody" x1="12" y1="36" x2="68" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B6345" />
          <stop offset="100%" stopColor="#5C3D28" />
        </linearGradient>
        <linearGradient id="beWoodLid" x1="10" y1="16" x2="70" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9D7250" />
          <stop offset="100%" stopColor="#6D4B33" />
        </linearGradient>
        <linearGradient id="beSteel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <radialGradient id="beCelestialLight" cx="50%" cy="65%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#7CC2FF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#1D5196" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo de luz celestial que emerge al entreabrirse el baúl */}
      <ellipse
        cx="40"
        cy="34"
        rx="28"
        ry="18"
        fill="url(#beCelestialLight)"
        className="be-chest-light"
        style={{ opacity: mode === 'static' ? 0.18 : 0.75 }}
      />

      {/* Base del baúl */}
      <rect x="13" y="37" width="54" height="29" rx="5" fill="url(#beWoodBody)" stroke="#472E1D" strokeWidth="1.5" />

      {/* Bandas metálicas verticales en base */}
      <rect x="21" y="37" width="6" height="29" fill="url(#beSteel)" />
      <rect x="53" y="37" width="6" height="29" fill="url(#beSteel)" />

      {/* Borde metálico inferior */}
      <rect x="13" y="61" width="54" height="5" rx="2" fill="url(#beSteel)" />

      {/* Tapa abatible del baúl */}
      <g className="be-chest-lid">
        <path
          d="M12 36C12 24.5 21 18 40 18C59 18 68 24.5 68 36H12Z"
          fill="url(#beWoodLid)"
          stroke="#472E1D"
          strokeWidth="1.5"
        />
        {/* Bandas metálicas sobre la tapa */}
        <path d="M21 22.5C23 21.5 25 20.8 27 20.2V36H21V22.5Z" fill="url(#beSteel)" />
        <path d="M53 20.2C55 20.8 57 21.5 59 22.5V36H53V20.2Z" fill="url(#beSteel)" />
        {/* Franja metálica de cierre */}
        <rect x="11" y="33" width="58" height="4.5" rx="2" fill="url(#beSteel)" />
      </g>

      {/* Cerradura central metálica */}
      <rect x="34.5" y="34" width="11" height="13" rx="3" fill="url(#beSteel)" stroke="#475569" strokeWidth="1.2" />
      <circle cx="40" cy="39.5" r="2" fill="#1D5196" />
      <path d="M40 41.2V44.2" stroke="#1D5196" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

export default VaultChestIcon;
