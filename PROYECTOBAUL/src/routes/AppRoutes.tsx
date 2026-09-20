import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';

// Componente para proteger rutas privadas en React Router v5
const ProtectedRoute: React.FC<{ component: React.ComponentType<any>; path: string; exact?: boolean }> = ({ component: Component, ...rest }) => {
  const isAuth = localStorage.getItem('auth_token') !== null; // Asegúrate de si guardan 'token' o qué string usan en el Login

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuth ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <IonRouterOutlet>
      {/* Ruta pública */}
      <Route path="/login" component={Login} exact={true} />

      {/* Ruta protegida: exige login obligatorio */}
      <ProtectedRoute path="/dashboard" component={Dashboard} exact={true} />

      {/* Redirección por defecto si entran a la raíz / */}
      <Route exact path="/">
        <Redirect to="/login" />
      </Route>
    </IonRouterOutlet>
  );
};
