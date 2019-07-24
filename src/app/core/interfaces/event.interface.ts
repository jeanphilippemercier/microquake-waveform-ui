export interface EventType {
  id: number;
  identifier: string;
  microquake_type: string;
  quakeml_type: string;
  site: number;
  site_code: string;
}

export enum EvaluationStatus {
  PRELIMINARY = 'preliminary',
  CONFIRMED = 'confirmed',
  REVIEWED = 'reviewed',
  FINAL = 'final',
  REJECTED = 'rejected',
  REPORTED = 'reported'
}

export enum EvaluationStatusGroup {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum EventEvaluationMode {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic'
}

export interface EventQuery {
  start_time: string;
  end_time: string;
  site_code: string;
  network_code: string;
  type?: string[]; // TODO: string / EventType inconsitancy
  status?: EvaluationStatus[];
}

export interface BoundariesQuery {
  site_code: string;
  network_code: string;
}

export interface MicroquakeEventTypesQuery {
  site_code: string;
}

export interface EventWaveformQuery {
  page_number: number;
  traces_per_page: number;
}

export interface IEvent {
  azimuth: any;
  evaluation_mode: string;
  event_file: string;
  event_resource_id: string;
  event_type: string;
  in_interactive_mode: any;
  insertion_timestamp: string;
  is_active: boolean;
  is_processing: boolean;
  magnitude: number;
  magnitude_type: string;
  modification_timestamp: string;
  network: number;
  npick: number;
  plunge: any;
  preferred_magnitude_id: string;
  preferred_origin_id: string;
  replaced_event: boolean;
  site: number;
  status: string;
  time_epoch: number;
  time_residual: number;
  time_utc: string;
  timezone: string;
  uncertainty: number;
  uncertainty_vector_x: number;
  uncertainty_vector_y: number;
  uncertainty_vector_z: number;
  variable_size_waveform_file: string;
  waveform_context_file: string;
  waveform_file: string;
  x: number;
  y: number;
  z: number;
}

export interface EventUpdateInput extends Partial<IEvent> {
  event_resource_id: string;
}
