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
  trashOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { AppMenu } from '../components/AppMenu';

interface Poliza {
  id: number;
  tipo: string;
  aseguradora: string;
  numeroPoliza: string;
  monto: string;
  ubicacion: string;
}

export const Polizas: React.FC = () => {
  const navigate = useNavigate();
  const [polizas, setPolizas] = useState<Poliza[]>([
    { id: 1, tipo: 'Seguro de Vida', aseguradora: 'SURA', numeroPoliza: 'POL-99231', monto: '$50.000.000 CLP', ubicacion: 'Caja fuerte Casa' },
    { id: 2, tipo: 'Seguro de Salud', aseguradora: 'Consalud', numeroPoliza: 'SAL-11204', monto: 'Cobertura 100%', ubicacion: 'Carpeta Digital Drive' }
  ]);

  const [form, setForm] = useState({ tipo: '', aseguradora: '', numeroPoliza: '', monto: '', ubicacion: '' });
  const [mostrarForm, setMostrarForm] = useState(false);

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipo || !form.aseguradora) return;
    setPolizas([...polizas, { id: Date.now(), ...form }]);
    setForm({ tipo: '', aseguradora: '', numeroPoliza: '', monto: '', ubicacion: '' });
    setMostrarForm(false);
  };

  const handleEliminar = (id: number) => {
    setPolizas(polizas.filter(p => p.id !== id));
  };

  return (
    <>
      <AppMenu />
      <IonPage id="main-content">
        <HeaderBar title="Pólizas y Seguros" />

        <IonContent className="ion-padding">
          <IonGrid className="ion-no-padding">
            <IonRow style={{ marginBottom: '16px', alignItems: 'center' }}>
              <IonCol size="8">
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Pólizas y Bienes</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#888' }}>Gestión patrimonial (RF-01)</p>
              </IonCol>
              <IonCol size="4" className="ion-text-end">
                <IonButton size="small" color="primary" onClick={() => setMostrarForm(!mostrarForm)}>
                  <IonIcon slot="start" icon={addOutline} />
                  {mostrarForm ? 'Cerrar' : 'Nuevo'}
                </IonButton>
              </IonCol>
            </IonRow>

            {mostrarForm && (
              <IonCard className="ion-no-margin ion-margin-bottom">
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.1rem' }}>Registrar Nueva Póliza</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <form onSubmit={handleAgregar}>
                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Tipo de Seguro o Bien *</IonLabel>
                      <IonInput
                        value={form.tipo}
                        placeholder="Ej. Seguro de Vida / Propiedad"
                        onIonInput={e => setForm({ ...form, tipo: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Aseguradora / Institución *</IonLabel>
                      <IonInput
                        value={form.aseguradora}
                        placeholder="Ej. SURA / BancoEstado"
                        onIonInput={e => setForm({ ...form, aseguradora: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">N° Póliza / Identificador</IonLabel>
                      <IonInput
                        value={form.numeroPoliza}
                        placeholder="Ej. POL-123456"
                        onIonInput={e => setForm({ ...form, numeroPoliza: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Monto / Cobertura Estimada</IonLabel>
                      <IonInput
                        value={form.monto}
                        placeholder="Ej. $10.000.000 CLP"
                        onIonInput={e => setForm({ ...form, monto: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Ubicación del Documento</IonLabel>
                      <IonInput
                        value={form.ubicacion}
                        placeholder="Ej. Cajón escritorio / Google Drive"
                        onIonInput={e => setForm({ ...form, ubicacion: e.detail.value! })}
                      />
                    </IonItem>

                    <IonButton expand="block" type="submit" color="success" className="ion-margin-top">
                      Guardar Póliza
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>
            )}

            {polizas.map(p => (
              <IonCard key={p.id} className="ion-no-margin ion-margin-bottom">
                <IonCardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <IonCardSubtitle>{p.aseguradora}</IonCardSubtitle>
                      <IonCardTitle style={{ fontSize: '1.2rem' }}>{p.tipo}</IonCardTitle>
                    </div>
                    <IonButton fill="clear" color="danger" size="small" onClick={() => handleEliminar(p.id)}>
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>N° Póliza:</strong> {p.numeroPoliza || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Monto:</strong> {p.monto || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Ubicación:</strong> {p.ubicacion || 'No especificada'}</p>
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

              <IonButton fill="clear" color="primary" onClick={() => navigate('/polizas')} style={{ display: 'flex', flexDirection: 'column' }}>
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