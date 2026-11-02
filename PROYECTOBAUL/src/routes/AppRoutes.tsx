import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { Polizas } from '../pages/Polizas';
import { Apertura } from '../pages/Apertura';
import { Mensajes } from '../pages/Mensajes';
import { Albaceas } from '../pages/Albaceas';
import { Inventario } from '../pages/Inventario';
import { Guia } from '../pages/Guia';

const ProtectedRoute: React.FC<{ component: React.ComponentType<any>; path: string; exact?: boolean }> = ({ component: Component, ...rest }) => {
  const isAuth = localStorage.getItem('auth_token') !== null;

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuth ? (
          <IonSplitPane 
            contentId="main-content" 
            when="md"
            style={{
              '--side-width': '220px',
              '--side-min-width': '220px',
              '--side-max-width': '220px'
            } as any}
          >
            <Component {...props} />
          </IonSplitPane>
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <IonRouterOutlet>
      {}
      <Route path="/login" component={Login} exact={true} />
      <Route path="/register" component={Register} exact={true} />

      {}
      <ProtectedRoute path="/dashboard" component={Dashboard} exact={true} />
      <ProtectedRoute path="/polizas" component={Polizas} exact={true} />
      <ProtectedRoute path="/albaceas" component={Albaceas} exact={true} />
      <ProtectedRoute path="/mensajes" component={Mensajes} exact={true} />
      <ProtectedRoute path="/inventario" component={Inventario} exact={true} />
      <ProtectedRoute path="/apertura" component={Apertura} exact={true} />
      <ProtectedRoute path="/guia" component={Guia} exact={true} />

      {}
      <Route exact path="/">
        <Redirect to="/login" />
      </Route>
    </IonRouterOutlet>
  );
};

export default AppRoutes;