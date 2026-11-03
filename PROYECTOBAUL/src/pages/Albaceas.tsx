import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton
} from '@ionic/react';
import { personOutline, trashOutline } from 'ionicons/icons';
import { AppMenu } from '../components/AppMenu';
import { HeaderBar } from '../components/HeaderBar';

import { getAlbaceas, agregarAlbacea, eliminarAlbacea, Albacea } from '../services/albaceas.service';
import { mensajeError } from '../services/api';

export const Albaceas: React.FC = () => {
  const [albaceas, setAlbaceas] = useState<Albacea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario
  const [rut, setRut] = useState('');
  const [parentesco, setParentesco] = useState('Familiar');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await getAlbaceas();
      setAlbaceas(Array.isArray(data) ? data : []);
    } catch (error) {
      setToastMsg(mensajeError(error));
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
    
    if (!rut.trim()) {
      setErrorMsg('El RUT del albacea es obligatorio.');
      return;
    }

    try {
      await agregarAlbacea({
        rut_invitado: rut.trim(),
        parentesco: parentesco.trim() || 'Familiar'
      });
      
      setRut('');
      setParentesco('Familiar');
      setToastMsg('Albacea agregado exitosamente.');
      await cargarDatos();
    } catch (error) {
      setErrorMsg(mensajeError(error));
    }
  };

  const handleEliminar = async (id_directorio: number) => {
    try {
      await eliminarAlbacea(id_directorio);
      setToastMsg('Albacea eliminado del directorio.');
      await cargarDatos();
    } catch (error) {
      setToastMsg(mensajeError(error));
    }
  };

  return (
    <>
      <AppMenu />

      <IonPage id="main-content">
        <HeaderBar title="Albaceas Designados" />

        <IonContent className="ion-padding">
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
            <h2 style={{ 
              fontSize: '1.35rem', 
              fontWeight: '700', 
              color: 'var(--ion-text-color, #0f172a)', 
              marginBottom: '4px' 
            }}>
              Contactos de Confianza
            </h2>
            <p style={{ 
              fontSize: '0.88rem', 
              color: 'var(--ion-text-color, #64748b)', 
              opacity: 0.8,
              marginBottom: '24px' 
            }}>
              Personas autorizadas para solicitar la apertura de la bóveda (Máximo 3).
            </p>

            {/* Formulario de registro */}
            <form 
              onSubmit={handleAgregar} 
              style={{
                backgroundColor: 'var(--ion-card-background, #ffffff)',
                color: 'var(--ion-text-color, #0f172a)',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                padding: '20px 24px',
                marginBottom: '24px'
              }}
            >
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: 'var(--ion-text-color, #0f172a)' 
              }}>
                + Designar Nuevo Albacea
              </h3>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  RUT del Usuario Registrado *
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: 98765432-1" 
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    backgroundColor: 'var(--ion-background-color, #f8fafc)',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Parentesco / Relación *
                </label>
                <select
                  value={parentesco}
                  onChange={(e) => setParentesco(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    backgroundColor: 'var(--ion-background-color, #f8fafc)',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Cónyuge">Cónyuge</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Abogado/a">Abogado/a</option>
                  <option value="Amigo/a">Amigo/a de Confianza</option>
                </select>
              </div>
              
              {errorMsg && (
                <p style={{ color: 'var(--ion-color-danger, #ef4444)', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                  {errorMsg}
                </p>
              )}
              
              <button 
                type="submit" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: 'var(--ion-color-warning, #f59e0b)', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: '700',
                  cursor: 'pointer' 
                }}
              >
                REGISTRAR ALBACEA
              </button>
            </form>

            {/* Listado dinámico desde la BD */}
            {cargando ? (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : albaceas.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                backgroundColor: 'var(--ion-card-background, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                color: 'var(--ion-text-color, #64748b)'
              }}>
                <p style={{ margin: 0 }}>No tienes albaceas asignados actualmente.</p>
              </div>
            ) : (
              albaceas.map((a) => (
                <div
                  key={a.id_directorio}
                  style={{
                    backgroundColor: 'var(--ion-card-background, #ffffff)',
                    color: 'var(--ion-text-color, #0f172a)',
                    borderRadius: '12px',
                    border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                    padding: '18px 24px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--ion-color-step-50, #eff6ff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={personOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
                    </div>
                    <div>
                      <h3 style={{ 
                        fontWeight: '700', 
                        fontSize: '1.05rem', 
                        color: 'var(--ion-text-color, #0f172a)', 
                        margin: '0 0 4px 0' 
                      }}>
                        {a.nombre_usuario}
                      </h3>
                      <p style={{ 
                        fontSize: '0.82rem', 
                        color: 'var(--ion-text-color, #64748b)', 
                        opacity: 0.8,
                        margin: 0 
                      }}>
                        RUT: {a.rut} | {a.correo_usuario}
                      </p>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ion-color-primary, #2563eb)' }}>
                        Relación: {a.parentesco}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        backgroundColor: a.estado_validacion === 'APROBADO' ? '#dcfce7' : '#fef3c7',
                        color: a.estado_validacion === 'APROBADO' ? '#166534' : '#92400e',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        borderRadius: '20px'
                      }}
                    >
                      {a.estado_validacion}
                    </span>

                    <IonButton
                      fill="clear"
                      color="danger"
                      size="small"
                      onClick={() => handleEliminar(a.id_directorio)}
                      title="Quitar albacea"
                    >
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </div>
                </div>
              ))
            )}
          </div>

          <IonToast
            isOpen={!!toastMsg}
            onDidDismiss={() => setToastMsg('')}
            message={toastMsg}
            duration={3000}
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Albaceas;