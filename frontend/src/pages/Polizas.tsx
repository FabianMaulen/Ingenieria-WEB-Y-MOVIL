import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton,
  IonAlert,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  addOutline,
  documentTextOutline,
  closeOutline,
  shieldCheckmarkOutline,
  trashOutline,
  locationOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import { listarPolizas, crearPoliza, eliminarPoliza, extraerPolizaConIA, Poliza } from '../services/polizas.service';
import { mensajeError } from '../services/api';

export const Polizas: React.FC = () => {
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [extrayendoIA, setExtrayendoIA] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [idEliminar, setIdEliminar] = useState<number | null>(null);

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

  const handleExtraerConIA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('El archivo de póliza no puede superar los 5 MB.');
      e.target.value = '';
      return;
    }

    try {
      setExtrayendoIA(true);
      const datos = await extraerPolizaConIA(file);
      if (datos.tipo_seguro) setTipoSeguro(datos.tipo_seguro);
      if (datos.aseguradora) setAseguradora(datos.aseguradora);
      if (datos.numero_poliza) setNumeroPoliza(datos.numero_poliza);
      if (datos.monto_referencial > 0) setMontoReferencial(String(datos.monto_referencial));
      setToastMsg(datos.observaciones || 'Campos completados automáticamente con IA. Revísalos antes de guardar.');
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setExtrayendoIA(false);
      e.target.value = '';
    }
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!aseguradora.trim() || !numeroPoliza.trim() || !ubicacionFisica.trim()) {
      setErrorMsg('Aseguradora, N° de póliza y ubicación física son obligatorios.');
      return;
    }

    try {
      setEnviando(true);
      await crearPoliza({
        tipo_seguro: tipoSeguro,
        aseguradora: aseguradora.trim(),
        numero_poliza: numeroPoliza.trim(),
        ubicacion_fisica: ubicacionFisica.trim(),
        monto_referencial: parseFloat(montoReferencial) || 0,
      });

      setAseguradora('');
      setNumeroPoliza('');
      setUbicacionFisica('');
      setMontoReferencial('');
      setMostrandoForm(false);
      setToastMsg('Póliza guardada en tu bóveda patrimonial.');
      await cargarDatos();
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!idEliminar) return;
    try {
      await eliminarPoliza(idEliminar);
      setToastMsg('Póliza eliminada de tu bóveda.');
      await cargarDatos();
    } catch (error) {
      setToastMsg(mensajeError(error));
    } finally {
      setIdEliminar(null);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Pólizas y Seguros" />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-page-header">
            <div>
              <h2 className="be-page-title">Pólizas Registradas</h2>
              <p className="be-page-subtitle">
                Coberturas activas documentadas para orientar a tus albaceas al momento de tramitarlas.
              </p>
            </div>

            <button
              type="button"
              className={mostrandoForm ? 'be-btn be-btn-outline' : 'be-btn be-btn-primary'}
              onClick={() => setMostrandoForm(!mostrandoForm)}
            >
              <IonIcon icon={mostrandoForm ? closeOutline : addOutline} />
              {mostrandoForm ? 'Cancelar' : 'Nueva póliza'}
            </button>
          </div>

          {mostrandoForm && (
            <form onSubmit={handleAgregar} className="be-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                  Registrar póliza de seguro
                </h3>

                <label
                  className="be-btn be-btn-outline"
                  style={{ padding: '8px 12px', fontSize: '0.78rem', cursor: extrayendoIA ? 'wait' : 'pointer' }}
                >
                  {extrayendoIA ? (
                    <>
                      <IonSpinner name="crescent" style={{ width: '15px', height: '15px' }} />
                      Leyendo documento...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={sparklesOutline} />
                      Autocompletar desde PDF / Foto (IA)
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={handleExtraerConIA}
                    disabled={extrayendoIA}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className="be-field">
                <label className="be-label">Tipo de seguro *</label>
                <select className="be-select" value={tipoSeguro} onChange={(e) => setTipoSeguro(e.target.value)}>
                  <option value="Seguro de Vida Individual">Seguro de Vida Individual</option>
                  <option value="Seguro Desgravamen">Seguro Desgravamen</option>
                  <option value="Seguro Complementario de Salud">Seguro Complementario de Salud</option>
                  <option value="Seguro Automotriz">Seguro Automotriz</option>
                  <option value="Seguro de Incendio y Sismo">Seguro de Incendio y Sismo</option>
                </select>
              </div>

              <div className="be-grid-2">
                <div className="be-field">
                  <label className="be-label">Compañía aseguradora *</label>
                  <input
                    type="text"
                    className="be-input"
                    placeholder="Ej: Consorcio, BCI Seguros, Sura"
                    value={aseguradora}
                    onChange={(e) => setAseguradora(e.target.value)}
                  />
                </div>

                <div className="be-field">
                  <label className="be-label">N° de póliza *</label>
                  <input
                    type="text"
                    className="be-input"
                    placeholder="Ej: POL-2026-991"
                    value={numeroPoliza}
                    onChange={(e) => setNumeroPoliza(e.target.value)}
                  />
                </div>
              </div>

              <div className="be-grid-2">
                <div className="be-field">
                  <label className="be-label">Ubicación física o digital del documento *</label>
                  <input
                    type="text"
                    className="be-input"
                    placeholder="Ej: Carpeta azul del escritorio"
                    value={ubicacionFisica}
                    onChange={(e) => setUbicacionFisica(e.target.value)}
                  />
                </div>

                <div className="be-field">
                  <label className="be-label">Monto referencial (CLP)</label>
                  <input
                    type="number"
                    min="0"
                    className="be-input"
                    placeholder="Ej: 15000000"
                    value={montoReferencial}
                    onChange={(e) => setMontoReferencial(e.target.value)}
                  />
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: 'var(--be-danger)', fontSize: '0.85rem', margin: '0 0 12px 0', fontWeight: 600 }}>
                  {errorMsg}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ flex: '1 1 130px' }}
                  onClick={() => {
                    setMostrandoForm(false);
                    setErrorMsg('');
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="be-btn be-btn-primary"
                  style={{ flex: '2 1 200px' }}
                  disabled={enviando}
                >
                  {enviando ? <IonSpinner name="crescent" color="light" /> : 'Guardar en bóveda'}
                </button>
              </div>
            </form>
          )}

          {cargando ? (
            <VaultLoader texto="Consultando tus pólizas..." />
          ) : polizas.length === 0 ? (
            <div className="be-empty-state">
              <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '2.5rem', marginBottom: '10px', opacity: 0.55 }} />
              <p style={{ margin: 0, fontSize: '0.92rem' }}>
                Todavía no tienes pólizas registradas. Presiona <strong>Nueva póliza</strong> para comenzar.
              </p>
            </div>
          ) : (
            polizas.map((p) => (
              <div key={p.id_poliza} className="be-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 240px', minWidth: 0 }}>
                  <div className="be-icon-box">
                    <IonIcon icon={documentTextOutline} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--be-text)' }}>
                      {p.aseguradora}{' '}
                      <span style={{ fontWeight: 500, color: 'var(--be-text-muted)' }}>· {p.tipo_seguro}</span>
                    </h3>
                    <p style={{ margin: '0 0 3px 0', fontSize: '0.82rem', color: 'var(--be-text-muted)' }}>
                      N° Póliza: <strong style={{ color: 'var(--be-text)' }}>{p.numero_poliza}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--be-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IonIcon icon={locationOutline} />
                      {p.ubicacion_fisica}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="be-badge be-badge-success">
                    ${Number(p.monto_referencial || 0).toLocaleString('es-CL')}
                  </span>

                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    onClick={() => setIdEliminar(p.id_poliza)}
                    title="Eliminar póliza"
                  >
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </div>
              </div>
            ))
          )}
        </div>

        <IonAlert
          isOpen={!!idEliminar}
          onDidDismiss={() => setIdEliminar(null)}
          header="Confirmar eliminación"
          message="¿Deseas eliminar esta póliza de tu bóveda patrimonial?"
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Eliminar', role: 'confirm', handler: () => confirmarEliminar() },
          ]}
        />

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3000}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Polizas;
