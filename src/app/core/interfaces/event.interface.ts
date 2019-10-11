export enum QuakemlType {
  NOT_EXISTING = 'not existing',
  NOT_REPORTED = 'not reported',
  EARTHQUAKE = 'earthquake',
  ANTHROPOGENIC_EVENT = 'anthropogenic event',
  COLLAPSE = 'collapse',
  CAVITY_COLLAPSE = 'cavity collapse',
  MINE_COLLAPSE = 'mine collapse',
  BUILDING_COLLAPSE = 'building collapse',
  EXPLOSION = 'explosion',
  ACCIDENTAL_EXPLOSION = 'accidental explosion',
  CHEMICAL_EXPLOSION = 'chemical explosion',
  CONTROLLED_EXPLOSION = 'controlled explosion',
  EXPERIMENTAL_EXPLOSION = 'experimental explosion',
  INDUSTRIAL_EXPLOSION = 'industrial explosion',
  MINING_EXPLOSION = 'mining explosion',
  QUARRY_BLACT = 'quarry blast',
  ROAD_CUT = 'road cut',
  BLASTING_LEVEE = 'blasting levee',
  NUCLEAR_EXPLOSION = 'nuclear explosion',
  INDUCED_OR_TRIGGERED_EVENT = 'induced or triggered event',
  ROCK_BURST = 'rock burst',
  RESERVOIR_LOADING = 'reservoir loading',
  FLUID_INJECTION = 'fluid injection',
  FLUID_EXTRACTION = 'fluid extraction',
  CRASH = 'crash',
  PLANE_CRASH = 'plane crash',
  TRAIN_CRASH = 'train crash',
  BOAT_CRASH = 'boat crash',
  OTHER_EVENT = 'other event',
  ATMOSPHERIC_EVENT = 'atmospheric event',
  SONIC_BOOM = 'sonic boom',
  SONIC_BLAST = 'sonic blast',
  ACOUSTIC_NOIST = 'acoustic noise',
  THUNDER = 'thunder',
  AVALANCHE = 'avalanche',
  SNOW_AVALANCHE = 'snow avalanche',
  DEBRIS_AVALANCHE = 'debris avalanche',
  HYDROACOUSTIC_EVENT = 'hydroacoustic event',
  ICE_QUAKE = 'ice quake',
  SLIDE = 'slide',
  LANDSLIDE = 'landslide',
  ROCKSLIDE = 'rockslide',
  METEORITE = 'meteorite',
  VOLCANIC_ERUPTION = 'volcanic eruption',
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

export enum EvaluationMode {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic'
}

export interface EventType {
  id: number;
  identifier: string;
  microquake_type: string;
  quakeml_type: QuakemlType;
  site: number;
  site_code: string;
}

export interface IEvent {
  azimuth: any;
  evaluation_mode: string;
  corner_frequency?: number;
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

export enum WebsocketResponseOperation {
  CREATED = 'created',
  UPDATE = 'update',
  INTERACTIVE_BATCH_READY = 'interactive_batch_ready',
  INTERACTIVE_BATCH_FAILED = 'interactive_batch_failed',
}

export enum WebsocketResponseType {
  EVENT = 'event',
}

export interface WebsocketEventResponse {
  type: WebsocketResponseType;
  operation: WebsocketResponseOperation;
  event: IEvent;
  extra: EventExtra;
}

export interface EventExtra {
  batch?: {
    id: number;
    status: BatchStatus;
  };
  error: string | null;
}

export enum BatchStatus {
  NEW = 'new',
  PENDING = 'pending',
  PROCESSING = 'processing',
  ERROR = 'error',
  READY = 'ready',
}

export interface EventBatchMap {
  batchId: number;
  event: IEvent;
}

export interface InteractiveProcessing {
  data: Arrival[];
  id: number;
  new_catalog: any;
  status: BatchStatus;
}

export interface Boundaries {
  timezone: string;
  min_time: string;
  max_time: string;
}

export interface Origin {
  origin_resource_id: string;
  preferred_origin: boolean;
  evaluation_mode: EvaluationMode;
  evaluation_status: EvaluationStatus;
  event: string;
  insertion_timestamp: string;
  modification_timestamp: string;
  network: number;
  site: number;
  time_utc: string;
  uncertainty: string;
  x: number;
  y: number;
  z: number;
}

export interface WaveformSensor {
  code: string;
  enabled: boolean;
  id: number;
  location_code: string;
  name: string;
  orientation_valid: boolean;
  preferred_ray: {
    P: PreferredRay | null;
    S: PreferredRay | null;
  };
  station: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export interface PreferredRay {
  ray_resource_id: string;
  phase: string;
  ray_length: number;
  travel_time: number;
  back_azimuth: number;
  incidence_angle: number;
}

export interface Ray {
  ray_resource_id: string;
  site: string;
  network: string;
  event: string;
  origin: string;
  arrival: string;
  sensor: string;
  nodes: string;
  phase: string;
  azimuth: number;
  takeoff_angle: number;
  back_azimuth: number;
  incidence_angle: number;
  ray_length: number;
  travel_time: number;
}

export interface Channel {
  code_id?: string;
  sensor_code?: string;
  channel_id?: string;
  sample_rate?: number;
  start?: any;
  microsec?: number;
  duration?: number;
  raw?: any;
  rotated?: any;
  data?: any[];
  valid?: boolean;
}

export interface ArrivalBase<T> {
  pick: T;
  arrival_resource_id: string;
  azimuth: number;
  distance: number;
  earth_model: string;
  event: string;
  network: number;
  origin: string;
  phase: PickKey;
  site: number;
  takeoff_angle: number;
  time_correction: any;
  time_residual: number;
}

export interface Arrival extends ArrivalBase<Pick> {
  pick: Pick;
}

export interface ArrivalPartial extends Partial<ArrivalBase<Partial<Pick>>> {
}

export interface Pick {
  evaluation_mode: EvaluationMode;
  evaluation_status: EvaluationStatus;
  event: string;
  filter_id: any;
  method_id: any;
  network: number;
  onset: any;
  phase_hint: string;
  pick_resource_id: string;
  polarity: any;
  sensor: number;
  site: number;
  time_errors: any;
  time_utc: string;
}

export enum PredictedPickKey {
  p = 'p',
  s = 's'
}

export enum PickKey {
  P = 'P',
  S = 'S'
}

export type PickingMode = PickKey | null;

export enum PickType {
  ARRIVAL = 'arrival',
  TRAVELTIME = 'traveltime'
}
