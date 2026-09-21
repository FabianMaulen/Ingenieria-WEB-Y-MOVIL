import React from 'react';
import { IonItem, IonAvatar, IonLabel, IonChip } from '@ionic/react';
import { Albacea } from '../data/mockData';

interface AlbaceaCardProps {
  data: Albacea;
}

export const AlbaceaCard: React.FC<AlbaceaCardProps> = ({ data }) => {
  return (
    <IonItem className="item-custom" lines="none">
      <IonAvatar slot="start">
        <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Avatar Albacea" />
      </IonAvatar>
      <IonLabel>
        <h2 className="text-bold-title">{data.nombre}</h2>
        <p className="text-subtle">RUT: {data.rut} | {data.email}</p>
      </IonLabel>
      <IonChip color="tertiary">{data.parentesco}</IonChip>
    </IonItem>
  );
};