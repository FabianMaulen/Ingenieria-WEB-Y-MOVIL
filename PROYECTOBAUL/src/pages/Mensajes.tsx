import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonFooter,
  IonToolbar,
  IonIcon,
  IonBadge
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  settingsOutline,
  addOutline,
  lockClosedOutline,
  trashOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { AppMenu } from '../components/AppMenu';

interface Mensaje {
  id: number;
  destinatario: string;
  rut: string;
  titulo: string;
  contenido: string;
  fecha: string;
}

export const Mensajes: React.FC = () => {
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 1,
      destinatario: 'María González',
      rut: '18.452.311-K',
      titulo: 'Carta de despedida y palabras personales',
      contenido: 'Querida María, te dejo este mensaje grabado...',
      fecha: '15/09/2026'
    }
  ]);

  const [form, setForm] = useState({ destinatario: '', rut: '', titulo: '', contenido: '' });
  const [mostrarForm, setMostrarForm] = useState(false);

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destinatario || !form.rut || !form.titulo) return;
    setMensajes([
      ...mensajes,
      { id: Date.now(), ...form, fecha: new Date().toLocaleDateString() }
    ]);
    setForm({ destinatario: '', rut: '', titulo: '', contenido: '' });
    setMostrarForm(false);
  };

  const handleEliminar = (id: number) => {
    setMensajes(mensajes.filter(m => m.id !== id));
  };

  return (
    <>
      <AppMenu />
      <IonPage id="main-content">
        <HeaderBar title="Mensajes Póstumos" />

        <IonContent className="ion-padding">
          <IonGrid className="ion-no-padding">
            <IonRow style={{ marginBottom: '16px', alignItems: 'center' }}>
              <IonCol size="8">
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Mensajes Póstumos</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#888' }}>Custodia cifrada (RF-03)</p>
              </IonCol>
              <IonCol size="4" className="ion-text-end">
                <IonButton size="small" color="primary" onClick={() => setMostrarForm(!mostrarForm)}>
                  <IonIcon slot="start" icon={addOutline} />
                  {mostrarForm ? 'Cerrar' : 'Redactar'}
                </IonButton>
              </IonCol>
            </IonRow>

            {mostrarForm && (
              <IonCard className="ion-no-margin ion-margin-bottom">
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.1rem' }}>Redactar Mensaje Sellado</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <form onSubmit={handleAgregar}>
                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Nombre del Beneficiario *</IonLabel>
                      <IonInput
                        value={form.destinatario}
                        placeholder="Ej. María González"
                        onIonInput={e => setForm({ ...form, destinatario: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">RUT del Beneficiario *</IonLabel>
                      <IonInput
                        value={form.rut}
                        placeholder="Ej. 12.345.678-9"
                        onIonInput={e => setForm({ ...form, rut: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Título / Asunto *</IonLabel>
                      <IonInput
                        value={form.titulo}
                        placeholder="Ej. Instrucciones y palabras especiales"
                        onIonInput={e => setForm({ ...form, titulo: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Mensaje Privado</IonLabel>
                      <IonTextarea
                        rows={4}
                        value={form.contenido}
                        placeholder="Escribe el contenido cifrado..."
                        onIonInput={e => setForm({ ...form, contenido: e.detail.value! })}
                      />
                    </IonItem>

                    <IonButton expand="block" type="submit" color="success" className="ion-margin-top">
                      Sellar y Guardar
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>
            )}

            {mensajes.map(m => (
              <IonCard key={m.id} className="ion-no-margin ion-margin-bottom">
                <IonCardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IonBadge color="warning">
                          <IonIcon icon={lockClosedOutline} style={{ marginRight: '4px' }} />
                          SELLADO
                        </IonBadge>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{m.fecha}</span>
                      </div>
                      <IonCardTitle style={{ fontSize: '1.2rem', marginTop: '6px' }}>{m.titulo}</IonCardTitle>
                    </div>
                    <IonButton fill="clear" color="danger" size="small" onClick={() => handleEliminar(m.id)}>
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Destinatario:</strong> {m.destinatario} ({m.rut})</p>
                  <p style={{ fontSize: '0.8rem', color: '#aaa', fontStyle: 'italic', marginTop: '8px' }}>
                    "Este mensaje se encuentra encriptado y solo se liberará al confirmarse la apertura de la bóveda."
                  </p>
                </IonCardContent>
              </IonCard>
            ))}
          </IonGrid>
        </IonContent>

        <IonFooter>
          <IonToolbar color="light">
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <IonButton fill="clear" color="medium" onClick={() => navigate('/dashboard')} style={{ display: 'flex', flexDirection: 'column' }}>
                <IonIcon icon={homeOutline} />
                <IonLabel style={{ fontSize: '0.7rem' }}>Inicio</IonLabel>
              </IonButton>

              <IonButton fill="clear" color="medium" onClick={() => navigate('/polizas')} style={{ display: 'flex', flexDirection: 'column' }}>
                <IonIcon icon={shieldCheckmarkOutline} />
                <IonLabel style={{ fontSize: '0.7rem' }}>Pólizas</IonLabel>
              </IonButton>

              <IonButton fill="clear" color="medium" onClick={() => navigate('/dashboard')} style={{ display: 'flex', flexDirection: 'column' }}>
                <IonIcon icon={peopleOutline} />
                <IonLabel style={{ fontSize: '0.7rem' }}>Albaceas</IonLabel>
              </IonButton>

              <IonButton fill="clear" color="medium" onClick={() => navigate('/dashboard')} style={{ display: 'flex', flexDirection: 'column' }}>
                <IonIcon icon={settingsOutline} />
                <IonLabel style={{ fontSize: '0.7rem' }}>Ajustes</IonLabel>
              </IonButton>
            </div>
          </IonToolbar>
        </IonFooter>
      </IonPage>
    </>
  );
};