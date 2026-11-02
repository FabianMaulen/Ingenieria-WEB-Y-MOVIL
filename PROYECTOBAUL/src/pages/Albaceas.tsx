import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonSpinner
} from '@ionic/react';
import { personOutline } from 'ionicons/icons';
import AppMenu from '../components/AppMenu';

// Importaciones de los servicios entregados en el zip de integración
import { getAlbaceas, agregarAlbacea } from '../services/albaceas.service';
import { mensajeError } from '../services/api';

export const Albaceas: React.FC = () => {
  const [albaceas, setAlbaceas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para el formulario
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await getAlbaceas();
      setAlbaceas(data);
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!rut.trim() || !nombre.trim() || !correo.trim()) {
      setErrorMsg('Todos los campos son obligatorios');
      return;
    }

    try {
      await agregarAlbacea({
        rut_invitado: rut.trim(),
        nombre_usuario: nombre.trim(),
        correo_usuario: correo.trim(),
        parentesco: 'Familiar' // Valor por defecto si el backend lo requiere
      });
      
      setRut('');
      setNombre('');
      setCorreo('');
      await cargarDatos(); // Recarga la lista tras agregar
    } catch (error) {
      setErrorMsg(mensajeError(error));
    }
  };

  return (
    <>
      <AppMenu />
      <IonPage id="main-content">
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': '#1b2431', '--color': '#ffffff' } as any}>
            <IonButtons slot="start">
              <IonMenuButton color="light" />
            </IonButtons>
            <IonTitle style={{ fontSize: '1rem', fontWeight: '600', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Albaceas Designados
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8fafc' } as any} className="ion-padding">
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Contactos de Confianza
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Personas autorizadas para solicitar la apertura de la bóveda.
            </p>

            {/* Formulario con tu mismo diseño de tarjeta */}
            <form 
              onSubmit={handleAgregar} 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                padding: '20px 24px',
                marginBottom: '24px'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>+ Añadir Nuevo Albacea</h3>
              
              <input 
                type="text" 
                placeholder="RUT (Ej: 12.345.678-9)" 
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <input 
                type="text" 
                placeholder="Nombre Completo" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <input 
                type="email" 
                placeholder="Correo Electrónico" 
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              
              {errorMsg && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 12px 0' }}>{errorMsg}</p>}
              
              <button 
                type="submit" 
                style={{ width: '100%', padding: '12px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' }}
              >
                REGISTRAR CONTACTO
              </button>
            </form>

            {/* Lista Dinámica */}
            {cargando ? (
              <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner name="crescent" /></div>
            ) : (
              albaceas.map((a) => (
                <div
                  key={a.id_albacea || a.rut_invitado}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                    padding: '20px 24px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={personOutline} style={{ fontSize: '1.4rem', color: '#2563eb' }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: '700', fontSize: '1.05rem', color: '#0f172a', margin: '0 0 4px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {a.nombre_usuario || 'Albacea sin nombre'}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        RUT: {a.rut_invitado} | {a.correo_usuario}
                      </p>
                    </div>
                  </div>

                  <span
                    style={{
                      backgroundColor: a.estado === 'Confirmado' ? '#e6f4ea' : '#fef3c7',
                      color: a.estado === 'Confirmado' ? '#0f9d58' : '#d97706',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  >
                    {a.estado || 'Pendiente'}
                  </span>
                </div>
              ))
            )}
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Albaceas;