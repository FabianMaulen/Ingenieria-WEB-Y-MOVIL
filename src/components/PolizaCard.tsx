import React from 'react';
import { IonItem, IonLabel, IonBadge } from '@ionic/react';
import { Poliza } from '../data/mockData';

interface PolizaCardProps {
  data: Poliza;
}

export const PolizaCard: React.FC<PolizaCardProps> = ({ data }) => {
  return (
    <IonItem className="item-custom" lines="none">
      <IonLabel>
        <h2 className="text-bold-title">{data.aseguradora}</h2>
        <p className="text-subtle">{data.tipo} — N° {data.nro}</p>
      </IonLabel>
      <IonBadge color="success">{data.monto}</IonBadge>
    </IonItem>
  );
};