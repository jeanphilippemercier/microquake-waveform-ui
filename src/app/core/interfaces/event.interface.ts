export interface EventType {
  id: number;
  identifier: string;
  microquake_type: string;
  quakeml_type: string;
  site: number;
  site_code: string;
}

export enum EventStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}
