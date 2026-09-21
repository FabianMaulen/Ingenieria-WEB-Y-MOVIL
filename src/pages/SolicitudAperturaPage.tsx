import React, { useState, useRef } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonIcon } from '@ionic/react';
import { trashOutline, documentTextOutline } from 'ionicons/icons';

export const SolicitudAperturaPage: React.FC = () => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setArchivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Apertura por Contingencia</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="dashboard-content">
        <div className="page-container">
          
          <div className="custom-card">
            <div className="section-header">
              <h2>Solicitud de Liberación</h2>
              <p>Adjunta el certificado de defunción para validar la solicitud ante la plataforma.</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <IonInput 
                label="RUT del Titular" 
                labelPlacement="floating" 
                fill="outline" 
                className="custom-input"
                placeholder="12345678-9" 
              />
              
              {}
              <div style={{ marginBottom: '24px', marginTop: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
                  Certificado de Defunción (PDF o Imagen):
                </label>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,image/*" 
                  style={{ display: 'none' }} 
                />

                {!archivo ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        backgroundColor: '#e2e8f0',
                        color: '#334155',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Seleccionar archivo
                    </button>
                    <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Ningún archivo seleccionado
                    </span>
                  </div>
                ) : (
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      backgroundColor: '#f1f5f9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <IonIcon icon={documentTextOutline} style={{ fontSize: '20px', color: '#2563eb', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {archivo.name}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      <IonIcon icon={trashOutline} style={{ fontSize: '18px' }} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              {}
              <IonButton 
                expand="block" 
                type="submit" 
                style={{ 
                  '--background': '#2563eb',
                  '--border-radius': '8px',
                  height: '48px', 
                  fontWeight: 600 
                } as React.CSSProperties}
              >
                Iniciar Solicitud
              </IonButton>
            </form>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default SolicitudAperturaPage;