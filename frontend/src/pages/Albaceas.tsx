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
import { personOutline, trashOutline } from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';
import {
  getAlbaceas,
  agregarAlbacea,
  eliminarAlbacea,
  Albacea,
  EstadoValidacionAlbacea,
} from '../services/albaceas.service';
import { mensajeError } from '../services/api';
import { normalizarRut, rutValido, emailValido } from '../utils/rut';

const obtenerEstiloEstado = (estado: EstadoValidacionAlbacea) => {
  switch (estado) {
    case 'VALIDADO':
      return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'INVITADO':
      return { backgroundColor: '#dbeafe', color: '#1e40af' };
    case 'RECHAZADO':
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    default:
      return { backgroundColor: '#fef3c7', color: '#92400e' };
  }
};

export const Albaceas: React.FC = () => {
  const [albaceas, setAlbaceas] = useState<Albacea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [idEliminar, setIdEliminar] = useState<number | null>(null);

  // Formulario
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
      setToastMsg(res.mensaje || 'Albacea designado exitosamente.');
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
      setToastMsg('Albacea eliminado del directorio.');
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
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              color: 'var(--ion-text-color, #0f172a)',
              marginBottom: '4px',
            }}
          >
            Contactos de Confianza
          </h2>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--ion-text-color, #64748b)',
              opacity: 0.8,
              marginBottom: '24px',
            }}
          >
            Designa hasta 3 personas autorizadas para gestionar la apertura de tu bóveda. Puedes invitar a personas
            aún no registradas: se vincularán automáticamente cuando creen su cuenta con su RUT.
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
              marginBottom: '24px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--ion-text-color, #0f172a)',
              }}
            >
              + Designar Nuevo Albacea
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Camila Morales"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    backgroundColor: 'var(--ion-color-step-100, var(--ion-background-color, #f8fafc))',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  RUT del Albacea *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 19876543-0"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  onBlur={() => {
                    if (rut.trim()) setRut(normalizarRut(rut));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${
                      mostrarErrorRut ? '#ef4444' : rutEsValido ? '#16a34a' : 'var(--ion-color-step-200, #cbd5e1)'
                    }`,
                    backgroundColor: 'var(--ion-color-step-100, var(--ion-background-color, #f8fafc))',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {mostrarErrorRut && (
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', display: 'block', marginTop: '3px' }}>
                    RUT chileno inválido.
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  placeholder="Ej: albacea@correo.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    backgroundColor: 'var(--ion-color-step-100, var(--ion-background-color, #f8fafc))',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
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
                    backgroundColor: 'var(--ion-color-step-100, var(--ion-background-color, #f8fafc))',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box',
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
                backgroundColor: 'var(--ion-color-warning, #f59e0b)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: enviando ? 'not-allowed' : 'pointer',
              }}
            >
              {enviando ? <IonSpinner name="crescent" /> : 'REGISTRAR ALBACEA'}
            </button>
          </form>

          {/* Listado dinámico desde la BD */}
          {cargando ? (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : albaceas.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px',
                backgroundColor: 'var(--ion-card-background, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                color: 'var(--ion-text-color, #64748b)',
              }}
            >
              <p style={{ margin: 0 }}>No tienes albaceas asignados actualmente.</p>
            </div>
          ) : (
            albaceas.map((a) => {
              const badgeStyle = obtenerEstiloEstado(a.estado_validacion);
              return (
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
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--ion-color-step-50, #eff6ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IonIcon icon={personOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontWeight: '700',
                          fontSize: '1.05rem',
                          color: 'var(--ion-text-color, #0f172a)',
                          margin: '0 0 4px 0',
                        }}
                      >
                        {a.nombre_usuario}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--ion-text-color, #64748b)',
                          opacity: 0.8,
                          margin: 0,
                        }}
                      >
                        RUT: {a.rut} | {a.correo_usuario}
                      </p>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ion-color-primary, #2563eb)' }}>
                        Relación: {a.parentesco}
                        {a.registrado === false ? ' • Pendiente de registro en la app' : ''}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        ...badgeStyle,
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        padding: '6px 12px',
                        borderRadius: '20px',
                      }}
                    >
                      {a.estado_validacion}
                    </span>

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
              );
            })
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
    </IonPage>
  );
};

export default Albaceas;
