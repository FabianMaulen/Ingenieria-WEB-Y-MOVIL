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
import { personOutline, trashOutline, peopleOutline } from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import {
  getAlbaceas,
  agregarAlbacea,
  eliminarAlbacea,
  Albacea,
  EstadoValidacionAlbacea,
} from '../services/albaceas.service';
import { mensajeError } from '../services/api';
import { normalizarRut, rutValido, emailValido } from '../utils/rut';

const claseBadgeEstado = (estado: EstadoValidacionAlbacea): string => {
  switch (estado) {
    case 'VALIDADO':
      return 'be-badge be-badge-success';
    case 'INVITADO':
      return 'be-badge be-badge-info';
    case 'RECHAZADO':
      return 'be-badge be-badge-danger';
    default:
      return 'be-badge be-badge-warning';
  }
};

export const Albaceas: React.FC = () => {
  const [albaceas, setAlbaceas] = useState<Albacea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [idEliminar, setIdEliminar] = useState<number | null>(null);

  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [parentesco, setParentesco] = useState('Familiar');

  const rutEsValido = rut.trim().length > 0 && rutValido(rut);
  const mostrarErrorRut = rut.trim().length >= 3 && !rutEsValido;

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

  useIonViewWillEnter(() => {
    cargarDatos();
  });

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim() || !rut.trim() || !email.trim()) {
      setErrorMsg('Nombre completo, RUT y correo electrónico son obligatorios.');
      return;
    }

    if (!rutValido(rut)) {
      setErrorMsg('El RUT ingresado no es válido. Verifica el dígito verificador (Ej: 19876543-0).');
      return;
    }

    if (!emailValido(email)) {
      setErrorMsg('El formato del correo electrónico no es válido.');
      return;
    }

    try {
      setEnviando(true);
      const res = await agregarAlbacea({
        rut_invitado: normalizarRut(rut),
        nombre_albacea: nombre.trim(),
        email_albacea: email.trim().toLowerCase(),
        parentesco: parentesco.trim() || 'Familiar',
      });

      setNombre('');
      setRut('');
      setEmail('');
      setParentesco('Familiar');
      setToastMsg(res.mensaje || 'Albacea designado con éxito.');
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
      await eliminarAlbacea(idEliminar);
      setToastMsg('Albacea eliminado de tu directorio.');
      await cargarDatos();
    } catch (error) {
      setToastMsg(mensajeError(error));
    } finally {
      setIdEliminar(null);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Albaceas Designados" />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-page-header">
            <div>
              <h2 className="be-page-title">Red de Confianza</h2>
              <p className="be-page-subtitle">
                Designa hasta 3 personas autorizadas para solicitar la apertura de tu bóveda. Si aún no tienen cuenta,
                quedan invitadas y se vinculan automáticamente al registrarse con su RUT.
              </p>
            </div>
            <span className="be-badge be-badge-info">{albaceas.length} / 3 registrados</span>
          </div>

          <form onSubmit={handleAgregar} className="be-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
              Designar nuevo albacea
            </h3>

            <div className="be-grid-2">
              <div className="be-field">
                <label className="be-label">Nombre completo *</label>
                <input
                  type="text"
                  className="be-input"
                  placeholder="Ej: Camila Morales"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="be-field">
                <label className="be-label">RUT del albacea *</label>
                <input
                  type="text"
                  className="be-input"
                  placeholder="Ej: 19876543-0"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  onBlur={() => {
                    if (rut.trim()) setRut(normalizarRut(rut));
                  }}
                  style={{
                    borderColor: mostrarErrorRut
                      ? 'var(--be-danger)'
                      : rutEsValido
                      ? 'var(--be-success)'
                      : undefined,
                  }}
                />
                {mostrarErrorRut && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--be-danger)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                    RUT chileno inválido.
                  </span>
                )}
              </div>
            </div>

            <div className="be-grid-2">
              <div className="be-field">
                <label className="be-label">Correo electrónico *</label>
                <input
                  type="email"
                  className="be-input"
                  placeholder="albacea@correo.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="be-field">
                <label className="be-label">Parentesco o relación *</label>
                <select className="be-select" value={parentesco} onChange={(e) => setParentesco(e.target.value)}>
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Cónyuge">Cónyuge</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Abogado/a">Abogado/a</option>
                  <option value="Amigo/a">Amigo/a de Confianza</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <p style={{ color: 'var(--be-danger)', fontSize: '0.85rem', margin: '0 0 12px 0', fontWeight: 600 }}>
                {errorMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(nombre.trim() || rut.trim() || email.trim()) && (
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ flex: '1 1 130px' }}
                  onClick={() => {
                    setNombre('');
                    setRut('');
                    setEmail('');
                    setParentesco('Familiar');
                    setErrorMsg('');
                  }}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="be-btn be-btn-accent"
                style={{ flex: '2 1 200px' }}
                disabled={enviando}
              >
                {enviando ? <IonSpinner name="crescent" color="light" /> : 'Registrar albacea'}
              </button>
            </div>
          </form>

          {cargando ? (
            <VaultLoader texto="Cargando tu red de albaceas..." />
          ) : albaceas.length === 0 ? (
            <div className="be-empty-state">
              <IonIcon icon={peopleOutline} style={{ fontSize: '2.4rem', marginBottom: '8px', opacity: 0.55 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Todavía no has designado contactos de confianza.</p>
            </div>
          ) : (
            albaceas.map((a) => (
              <div key={a.id_directorio} className="be-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 240px', minWidth: 0 }}>
                  <div className="be-icon-box be-icon-box-accent">
                    <IonIcon icon={personOutline} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 3px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--be-text)' }}>
                      {a.nombre_usuario}
                    </h3>
                    <p style={{ margin: '0 0 3px 0', fontSize: '0.82rem', color: 'var(--be-text-muted)' }}>
                      RUT: {a.rut} · {a.correo_usuario}
                    </p>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--be-primary)' }}>
                      {a.parentesco}
                      {a.registrado === false ? ' · Invitado (sin cuenta aún)' : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={claseBadgeEstado(a.estado_validacion)}>{a.estado_validacion}</span>
                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    onClick={() => setIdEliminar(a.id_directorio)}
                    title="Quitar albacea"
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
          message="¿Deseas quitar a este albacea de tu directorio de confianza?"
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Eliminar', role: 'confirm', handler: () => confirmarEliminar() },
          ]}
        />

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3500}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Albaceas;
