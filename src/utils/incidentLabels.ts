import type { IncidentStatus, IncidentType } from '../types';

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  HOMICIDE: 'Homicidio',
  FEMICIDE: 'Feminicidio',
  ARMED_ROBBERY: 'Robo agravado / armado',
  ROBBERY: 'Robo',
  VEHICLE_THEFT: 'Robo de vehículo',
  THEFT: 'Hurto',
  EXTORTION: 'Extorsión',
  KIDNAPPING: 'Secuestro',
  ASSAULT: 'Agresión',
  SEXUAL_ASSAULT: 'Agresión sexual',
  SHOOTING: 'Balacera / Disparos',
  FRAUD: 'Estafa / Fraude',
  CYBERCRIME: 'Delito informático',
  DRUG_TRAFFICKING: 'Tráfico de drogas',
  VANDALISM: 'Vandalismo',
  HIT_AND_RUN: 'Atropello y fuga',
  OTHER: 'Otro incidente',
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  PENDING_REVIEW: 'En revisión',
  PUBLISHED: 'Publicado',
  REJECTED: 'Rechazado',
  VALIDATED: 'Validado',
  VERIFIED: 'Verificado',
};