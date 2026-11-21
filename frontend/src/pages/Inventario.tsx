import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonToast,
  IonSpinner,
  IonButton,
  IonIcon,
  IonAlert,
  useIonViewWillEnter,
} from '@ionic/react';
import { trashOutline, folderOpenOutline, layersOutline } from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import { mensajeError } from '../services/api';
import {
  listarInventario,
  crearActivoInventario,
  eliminarActivoInventario,
  ActivoInventario,
  CategoriaInventario,
} from '../services/inventario.service';

const CATEGORIAS: CategoriaInventario[] = [
  'Digital',
  'Financiero',
  'Familiar Directo',
  'Público',
  'Físico',
  'General',
];

const claseBadgeCategoria = (cat: CategoriaInventario): string => {
  switch (cat) {
    case 'Financiero':
      return 'be-badge be-badge-warning';
    case 'Familiar Directo':
      return 'be-badge be-badge-success';
    case 'Digital':
      return 'be-badge be-badge-info';
    default:
      return 'be-badge be-badge-neutral';
  }
};

export const Inventario: React.FC = () => {
  const [activos, setActivos] = useState<ActivoInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [plataforma, setPlataforma] = useState('');
  const [instruccion, setInstruccion] = useState('');
  const [categoria, setCategoria] = useState<CategoriaInventario>('Digital');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [idEliminar, setIdEliminar] = useState<number | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await listarInventario();
      setActivos(Array.isArray(data) ? data : []);
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
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

    if (!plataforma.trim() || !instruccion.trim()) {
      setErrorMsg('La plataforma y la instrucción póstuma son obligatorias.');
      return;
    }

    try {
      setEnviando(true);
      await crearActivoInventario({
        plataforma: plataforma.trim(),
        instruccion: instruccion.trim(),
        categoria,
      });

      setPlataforma('');
      setInstruccion('');
      setCategoria('Digital');
      setToastColor('success');
      setToastMsg('Activo guardado en tu inventario patrimonial.');
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
      await eliminarActivoInventario(idEliminar);
      setToastColor('success');
      setToastMsg('Activo eliminado del inventario.');
      await cargarDatos();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setIdEliminar(null);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Inventario Patrimonial" />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-page-header">
            <div>
              <h2 className="be-page-title">Activos Digitales y Bienes</h2>
              <p className="be-page-subtitle">
                Indica qué hacer con tus cuentas, suscripciones, archivos en la nube y pertenencias clave.
              </p>
            </div>
          </div>

          <form onSubmit={handleAgregar} className="be-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
              Registrar nuevo activo
            </h3>

            <div className="be-grid-2">
              <div className="be-field">
                <label className="be-label">Plataforma o bien *</label>
                <input
                  type="text"
                  className="be-input"
                  placeholder="Ej: Google Drive, Instagram, Spotify"
                  value={plataforma}
                  onChange={(e) => setPlataforma(e.target.value)}
                  required
                />
              </div>

              <div className="be-field">
                <label className="be-label">Categoría</label>
                <select
                  className="be-select"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaInventario)}
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="be-field">
              <label className="be-label">Instrucción póstuma *</label>
              <input
                type="text"
                className="be-input"
                placeholder="Ej: Descargar fotos familiares y cancelar suscripción"
                value={instruccion}
                onChange={(e) => setInstruccion(e.target.value)}
                required
              />
            </div>

            {errorMsg && (
              <p style={{ color: 'var(--be-danger)', fontSize: '0.85rem', margin: '0 0 12px 0', fontWeight: 600 }}>
                {errorMsg}
              </p>
            )}

            <button type="submit" className="be-btn be-btn-primary be-btn-block" disabled={enviando}>
              {enviando ? <IonSpinner name="crescent" color="light" /> : 'Agregar al inventario'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
              Inventario registrado ({activos.length})
            </h3>
          </div>

          {cargando ? (
            <VaultLoader texto="Abriendo tu inventario patrimonial..." />
          ) : activos.length === 0 ? (
            <div className="be-empty-state">
              <IonIcon icon={folderOpenOutline} style={{ fontSize: '2.4rem', marginBottom: '8px', opacity: 0.55 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Aún no has registrado activos en tu inventario.</p>
            </div>
          ) : (
            activos.map((a) => (
              <div key={a.id_inventario} className="be-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 240px', minWidth: 0 }}>
                  <div className="be-icon-box">
                    <IonIcon icon={layersOutline} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--be-text)' }}>
                      {a.plataforma}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--be-text-muted)', lineHeight: 1.45 }}>
                      {a.instruccion}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={claseBadgeCategoria(a.categoria)}>{a.categoria}</span>
                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    onClick={() => setIdEliminar(a.id_inventario)}
                    title="Eliminar activo"
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
          message="¿Deseas eliminar este activo de tu inventario patrimonial?"
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
          color={toastColor}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Inventario;
