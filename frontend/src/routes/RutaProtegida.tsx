import React from 'react';
import { Navigate } from 'react-router-dom';
import { AUTH_TOKEN_KEY, Rol, usuarioGuardado } from '../services/auth.service';

interface Props {
  roles?: Rol[];
  children: React.ReactElement;
}

/**
 * Protege rutas privadas validando la existencia de 'auth_token' en localStorage
 * y, opcionalmente, restricciones de rol (en el modelo dual todos los usuarios
 * registrados pueden operar como Titular y como Albacea).
 */
export const RutaProtegida: React.FC<Props> = ({ roles, children }) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const usuario = usuarioGuardado();
  const rolActual = (usuario?.rol || localStorage.getItem('user_rol') || 'TITULAR') as Rol;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(rolActual)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RutaProtegida;
