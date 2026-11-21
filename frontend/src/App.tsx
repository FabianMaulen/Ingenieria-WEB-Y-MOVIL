import React, { useEffect, useRef, useState } from 'react';
import { IonApp, IonToast, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { App as CapacitorApp } from '@capacitor/app';
import { AppRoutes } from './routes/AppRoutes';
import { inicializarTema } from './utils/theme';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode por clase (.ion-palette-dark) para control manual + persistencia */
import '@ionic/react/css/palettes/dark.class.css';

/* Sistema de diseño Baúl Eterno */
import './theme/variables.css';

setupIonicReact();
inicializarTema();

const RUTAS_RAIZ = ['/', '/login', '/dashboard', '/guia'];

const App: React.FC = () => {
  const [exitToast, setExitToast] = useState(false);
  const ultimoBackRef = useRef<number>(0);

  // Manejo nativo del botón físico/gestual "Atrás" en dispositivos móviles (Capacitor)
  useEffect(() => {
    let handleRemover: (() => void) | null = null;

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const rutaActual = window.location.pathname;
      const esRaiz = RUTAS_RAIZ.includes(rutaActual);

      if (!esRaiz && canGoBack) {
        window.history.back();
        return;
      }

      if (!esRaiz) {
        const modo = localStorage.getItem('modo_activo');
        window.location.assign(modo === 'ALBACEA' ? '/guia' : '/dashboard');
        return;
      }

      const ahora = Date.now();
      if (ahora - ultimoBackRef.current < 2000) {
        CapacitorApp.exitApp();
      } else {
        ultimoBackRef.current = ahora;
        setExitToast(true);
      }
    })
      .then((listener) => {
        handleRemover = () => listener.remove();
      })
      .catch(() => {
        // Entorno navegador web sin runtime nativo de Capacitor
      });

    return () => {
      if (handleRemover) handleRemover();
    };
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>

      <IonToast
        isOpen={exitToast}
        onDidDismiss={() => setExitToast(false)}
        message="Presiona atrás nuevamente para salir de Baúl Eterno."
        duration={2000}
        position="bottom"
      />
    </IonApp>
  );
};

export default App;
