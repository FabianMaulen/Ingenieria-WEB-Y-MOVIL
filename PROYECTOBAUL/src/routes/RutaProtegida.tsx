import React from 'react';
import { Navigate } from 'react-router-dom';
import { usuarioGuardado, Rol } from '../services/auth.service';

interface Props { roles?: Rol[]; children: React.ReactElement; }

// Sin sesión -> /login. Con rol incorrecto -> pantalla de inicio de su rol.
export const RutaProtegida: React.FC<Props> = ({ roles, children }) => {
  const usuario = usuarioGuardado();
  if (!usuario || !localStorage.getItem('token')) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={usuario.rol === 'ALBACEA' ? '/solicitud' : '/dashboard'} replace />;
  }
  return children;
};
