import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton,
  useIonViewWillEnter
} from '@ionic/react';
import { 
  addOutline, 
  documentTextOutline, 
  closeOutline, 
  shieldCheckmarkOutline,
  trashOutline 
} from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';

import { listarPolizas, crearPoliza, eliminarPoliza, Poliza } from '../services/polizas.service';
import { mensajeError } from '../services/api';

export const Polizas: React.FC = () => {
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario de nueva póliza
  const [tipoSeguro, setTipoSeguro] = useState('Seguro de Vida Individual');
  const [aseguradora, setAseguradora] = useState('');
  const [numeroPoliza, setNumeroPoliza] = useState('');
  const [ubicacionFisica, setUbicacionFisica] = useState('');
  const [montoReferencial, setMontoReferencial] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await listarPolizas();
      setPolizas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar pólizas:', mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  useIonViewWillEnter(() => {
    cargarDatos();
  });

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!aseguradora.trim() || !numeroPoliza.trim() || !ubicacionFisica.trim()) {
      setErrorMsg('Aseguradora, N° de Póliza y Ubicación Física son obligatorios.');
      return;
    }

    try {
      setEnviando(true);
      await crearPoliza({
        tipo_seguro: tipoSeguro,
        aseguradora: aseguradora.trim(),
        numero_poliza: numeroPoliza.trim(),
        ubicacion_fisica: ubicacionFisica.trim(),
        monto_referencial: parseFloat(montoReferencial) || 0
      });

      setAseguradora('');
      setNumeroPoliza('');
      setUbicacionFisica('');
      setMontoReferencial('');
      setMostrandoForm(false);
      setToastMsg('Póliza ingresada a la bóveda con éxito.');
      await cargarDatos();
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarPoliza(id);
      setToastMsg('Póliza eliminada de la bóveda.');
      await cargarDatos();
    } catch (error) {
      setToastMsg(mensajeError(error));
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Mis Pólizas y Coberturas" />

      <IonContent className="ion-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ 
                fontSize: '1.35rem', 
                fontWeight: '700', 
                color: 'var(--ion-text-color, #0f172a)', 
                margin: '0 0 4px 0' 
              }}>
                Pólizas Registradas
              </h2>
              <p style={{ 
                fontSize: '0.88rem', 
                color: 'var(--ion-text-color, #64748b)', 
                opacity: 0.8,
                margin: 0 
              }}>
                Instrumentos de protección patrimonial activos en tu bóveda.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMostrandoForm(!mostrandoForm)}
              style={{
                backgroundColor: mostrandoForm ? 'var(--ion-color-step-200, #e2e8f0)' : 'var(--ion-color-primary, #2563eb)',
                color: mostrandoForm ? 'var(--ion-text-color, #0f172a)' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IonIcon icon={mostrandoForm ? closeOutline : addOutline} />
              {mostrandoForm ? 'CANCELAR' : 'NUEVA PÓLIZA'}
            </button>
          </div>

          {/* Formulario desplegable */}
          {mostrandoForm && (
            <form
              onSubmit={handleAgregar}
              style={{
                backgroundColor: 'var(--ion-card-background, #ffffff)',
                color: 'var(--ion-text-color, #0f172a)',
                borderRadius: '14px',
                border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                padding: '24px',
                marginBottom: '28px'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: '700' }}>
                + Registrar Póliza de Seguro
              </h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Tipo de Seguro *
                </label>
                <select
                  value={tipoSeguro}
                  onChange={(e) => setTipoSeguro(e.target.value)}
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
                  <option value="Seguro de Vida Individual">Seguro de Vida Individual</option>
                  <option value="Seguro Desgravamen">Seguro Desgravamen</option>
                  <option value="Seguro Complementario de Salud">Seguro Complementario de Salud</option>
                  <option value="Seguro Automotriz">Seguro Automotriz</option>
                  <option value="Seguro de Incendio y Sismo">Seguro de Incendio y Sismo</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Compañía Aseguradora *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: SURA, BCI, Consorcio"
                    value={aseguradora}
                    onChange={(e) => setAseguradora(e.target.value)}
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

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    N° de Póliza *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: POL-2024-991"
                    value={numeroPoliza}
                    onChange={(e) => setNumeroPoliza(e.target.value)}
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
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Ubicación Física del Documento *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cajón principal del escritorio, carpeta azul"
                  value={ubicacionFisica}
                  onChange={(e) => setUbicacionFisica(e.target.value)}
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
                  Monto Referencial ($ CLP)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 15000000"
                  value={montoReferencial}
                  onChange={(e) => setMontoReferencial(e.target.value)}
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

              {errorMsg && (
                <p style={{ color: 'var(--ion-color-danger, #ef4444)', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--ion-color-primary, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {enviando ? <IonSpinner name="crescent" /> : 'GUARDAR EN BÓVEDA'}
              </button>
            </form>
          )}

          {/* Listado dinámico desde la BD */}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : polizas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px',
              backgroundColor: 'var(--ion-card-background, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--ion-color-step-150, #e2e8f0)',
              color: 'var(--ion-text-color, #64748b)'
            }}>
              <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '2.4rem', marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No tienes pólizas registradas en tu bóveda patrimonial.</p>
            </div>
          ) : (
            polizas.map((p) => (
              <div 
                key={p.id_poliza} 
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)',
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
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--ion-color-step-50, #eff6ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={documentTextOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--ion-text-color, #0f172a)', margin: '0 0 4px 0' }}>
                      {p.aseguradora} — <span style={{ fontWeight: '500' }}>{p.tipo_seguro}</span>
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ion-color-step-600, #64748b)', margin: '0 0 2px 0' }}>
                      N° Póliza: <strong>{p.numero_poliza}</strong>
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ion-color-step-500, #94a3b8)', margin: 0 }}>
                      📍 Ubicación: {p.ubicacion_fisica}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span 
                    style={{ 
                      backgroundColor: '#dcfce7', 
                      color: '#166534', 
                      fontWeight: '700', 
                      fontSize: '0.85rem', 
                      padding: '8px 16px', 
                      borderRadius: '20px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ${Number(p.monto_referencial || 0).toLocaleString('es-CL')}
                  </span>

                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    onClick={() => handleEliminar(p.id_poliza)}
                    title="Eliminar póliza"
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
  );
};

export default Polizas;