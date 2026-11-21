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
import { trashOutline, folderOpenOutline } from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';
import { mensajeError } from '../services/api';
import {
  listarInventario,
  crearActivoInventario,
  eliminarActivoInventario,
  ActivoInventario,
  CategoriaInventario,
} from '../services/inventario.service';

const CATEGORIAS: CategoriaInventario[] = [
  'General',
  'Financiero',
  'Familiar Directo',
  'Público',
  'Digital',
  'Físico',
];

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
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
          {/* Formulario de nuevo activo */}
          <div
            style={{
              backgroundColor: 'var(--ion-card-background, #ffffff)',
              color: 'var(--ion-text-color, #0f172a)',
              borderRadius: '16px',
              border: '1px solid var(--ion-color-step-150, #e2e8f0)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '28px 32px',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 20px 0' }}>
              + Nuevo Activo Digital o Patrimonial
            </h2>

            <form onSubmit={handleAgregar}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Plataforma o Bien *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Google Drive / Fotos, Instagram, Cuenta Bancaria"
                  value={plataforma}
                  onChange={(e) => setPlataforma(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    backgroundColor: 'var(--ion-color-step-100, #f8fafc)',
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Instrucción Póstuma *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Descargar respaldo familiar y cerrar cuenta"
                  value={instruccion}
                  onChange={(e) => setInstruccion(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    backgroundColor: 'var(--ion-color-step-100, #f8fafc)',
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaInventario)}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    backgroundColor: 'var(--ion-color-step-100, #f8fafc)',
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 12px 0' }}>{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={enviando}
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  cursor: enviando ? 'not-allowed' : 'pointer',
                }}
              >
                {enviando ? <IonSpinner name="crescent" /> : 'AGREGAR AL INVENTARIO'}
              </button>
            </form>
          </div>

          {/* Listado desde PostgreSQL */}
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '16px' }}>
            Inventario Registrado ({activos.length})
          </h2>

          {cargando ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : activos.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px',
                backgroundColor: 'var(--ion-card-background, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                color: 'var(--ion-color-step-600, #64748b)',
              }}
            >
              <IonIcon icon={folderOpenOutline} style={{ fontSize: '2.4rem', marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Aún no has registrado activos en tu inventario.</p>
            </div>
          ) : (
            activos.map((a) => (
              <div
                key={a.id_inventario}
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                  padding: '18px 24px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1.05rem', margin: '0 0 4px 0' }}>{a.plataforma}</h3>
                  <p style={{ fontSize: '0.84rem', opacity: 0.78, margin: 0 }}>{a.instruccion}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      backgroundColor: a.categoria === 'Financiero' ? '#f3e8ff' : '#e2e8f0',
                      color: a.categoria === 'Financiero' ? '#7e22ce' : '#334155',
                      fontWeight: '600',
                      fontSize: '0.78rem',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.categoria}
                  </span>

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
    </IonPage>
  );
};

export default Inventario;
