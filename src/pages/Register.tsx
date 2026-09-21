import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonCard, IonCardContent, IonSelect, IonSelectOption } from '@ionic/react';
import { useNavigate } from 'react-router-dom';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'Titular'
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const { rut, nombre, email, password, confirmPassword } = formData;

    if (!rut || !nombre || !email || !password || !confirmPassword) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La clave debe contener al menos 6 caracteres.');
      return;
    }

    setErrorMsg('');
    navigate('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="vault-header">
          <IonTitle>Baúl Eterno Registro</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard className="card-custom">
          <IonCardContent>
            <h2 className="text-bold-title">Crear Cuenta de Usuario</h2>
            <form onSubmit={handleRegister}>
              <IonItem>
                <IonLabel position="floating">RUT</IonLabel>
                <IonInput value={formData.rut} onIonChange={(e) => handleChange('rut', e.detail.value!)} required />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Nombre Completo</IonLabel>
                <IonInput value={formData.nombre} onIonChange={(e) => handleChange('nombre', e.detail.value!)} required />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Correo Electrónico</IonLabel>
                <IonInput type="email" value={formData.email} onIonChange={(e) => handleChange('email', e.detail.value!)} required />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Perfil de Cuenta</IonLabel>
                <IonSelect value={formData.rol} onIonChange={(e) => handleChange('rol', e.detail.value)}>
                  <IonSelectOption value="Titular">Titular de Bóveda</IonSelectOption>
                  <IonSelectOption value="Albacea">Albacea / Beneficiario</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Contraseña</IonLabel>
                <IonInput type="password" value={formData.password} onIonChange={(e) => handleChange('password', e.detail.value!)} required />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Confirmar Contraseña</IonLabel>
                <IonInput type="password" value={formData.confirmPassword} onIonChange={(e) => handleChange('confirmPassword', e.detail.value!)} required />
              </IonItem>

              {errorMsg && <IonText color="danger"><p className="ion-margin-top">{errorMsg}</p></IonText>}

              <IonButton expand="block" type="submit" className="ion-margin-top" color="primary">
                Completar Registro
              </IonButton>
              <IonButton expand="block" fill="clear" routerLink="/login">
                Volver al inicio de sesión
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};