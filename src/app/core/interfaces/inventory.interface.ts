
export interface SiteBase {
  name: string;
  code: string;
  coordinate_system: CoordinateSystem;
  country?: string;
  description?: string;
  operator?: string;
  timezone: Timezone;
}

export interface Site extends SiteBase {
  id: number;
  networks: Network[];
}

export enum CoordinateSystem {
  CARTESIAN_LOCAL = 'Cartesian/Local',
  UTM = 'UTM',
  SPHERICAL = 'Spherical'
}

export enum Timezone {
  UTC = '00:00',
  UTC_MINUS_01 = '-01:00',
  UTC_MINUS_02 = '-02:00',
  UTC_MINUS_03 = '-03:00',
  UTC_MINUS_03_30 = '-03:30',
  UTC_MINUS_04 = '-04:00',
  UTC_MINUS_05 = '-05:00',
  UTC_MINUS_06 = '-06:00',
  UTC_MINUS_07 = '-07:00',
  UTC_MINUS_08 = '-08:00',
  UTC_MINUS_09 = '-09:00',
  UTC_MINUS_09_30 = '-09:30',
  UTC_MINUS_10 = '-10:00',
  UTC_MINUS_11 = '-11:00',
  UTC_MINUS_12 = '-12:00',
  UTC_PLUS_01 = '+01:00',
  UTC_PLUS_02 = '+02:00',
  UTC_PLUS_03 = '+03:00',
  UTC_PLUS_04 = '+04:00',
  UTC_PLUS_05 = '+05:00',
  UTC_PLUS_05_30 = '+05:30',
  UTC_PLUS_05_45 = '+05:45',
  UTC_PLUS_06 = '+06:00',
  UTC_PLUS_06_30 = '+06:30',
  UTC_PLUS_07 = '+07:00',
  UTC_PLUS_08 = '+08:00',
  UTC_PLUS_08_45 = '+08:45',
  UTC_PLUS_09 = '+09:00',
  UTC_PLUS_09_30 = '+09:30',
  UTC_PLUS_10 = '+10:00',
  UTC_PLUS_10_30 = '+10:30',
  UTC_PLUS_11 = '+11:00',
  UTC_PLUS_12 = '+12:00',
  UTC_PLUS_12_45 = '+12:45',
  UTC_PLUS_13 = '+13:00',
  UTC_PLUS_14 = '+14:00',
}

export interface Network {
  code: string;
  contact_email: string;
  contact_name: string;
  contact_phone: string;
  description: string;
  id: number;
  name: string;
  site: number;
}
export interface SensorBase {
  code: string;
  name: string;
  commissioning_date: string;
  decommissioning_date: string;
  location_code: string;
  location_x: number;
  location_y: number;
  location_z: number;
  part_number?: any;
  manufacturer: string;
  enabled: boolean;
  signal_quality: SignalQuality;
  components: IComponent[];
}

export interface Sensor extends SensorBase {
  sensor_code?: any;
  chart?: canvasjs.Chart;
  picks?: any;
  S_pick_time_utc?: string;
  P_pick_time_utc?: string;
  container?: any;
  channels?: any;
  distance?: number;

  id: number;
  station: {
    id: number;
    name: string;
    code: string;
  } | null;
  borehole?: {
    id: number;
    name: string;
  } | null;
}

export interface SignalQuality {
  id: number;
  update_timestamp: string;
  energy: number;
  integrity: number;
  sampling_rate: number;
  num_samples: number;
  amplitude: number;
  sensor: number;
}


export interface IComponentBase {
  code: ComponentCode;
  orientation_x: number;
  orientation_y: number;
  orientation_z: number;
  damping: number;
  enabled: boolean;
  cable_length: number;
}
export interface IComponent extends IComponentBase {
  id: number;
  sensor_type: ISensorType;
  sensor: Sensor;
  cable: number;
}

export interface ISensorTypeBase {
  model: string;
  manufacturer: string;
  sensor_type: SensorType;
  resonance_frequency: number;
  coil_resistance: number;
  shunt_resistance: number;
  gain: number;
  description: string;
  motion_type: MotionType;
}
export interface ISensorType extends ISensorTypeBase {
  id: number;
  response_file: string;
}

export enum ComponentCode {
  X = 'X',
  Y = 'Y',
  Z = 'Z',
}

export enum SensorType {
  GEOPHONE = 'geophone',
  ACCELEROMETER = 'accelerometer'
}

export enum MotionType {
  MM_PER_S_VELOCITY = 'mm/s (velocity)'
}


export interface Borehole {
  id: number;
  name: string;
  length: number;
  azimuth: any;
  dip: any;
  collar_location_x: number;
  collar_location_y: number;
  collar_location_z: number;
  toe_x: number;
  toe_y: number;
  toe_z: number;
  trace_x: number;
  trace_y: number;
  trace_z: number;
  vtp_file_url: string;
  dfx_file_url: string;
}
export interface StationBase {
  code: string;
  name: string;
  description?: string;
  location_x: number;
  location_y: number;
  location_z: number;
  communication: string;
  power: string;
}

export interface Station extends StationBase {
  id: number;
  network: Network;
}

export interface CableTypeBase {
  code: string;
  manufacturer: string;
  part_number: number;
  r: number;
  l: number;
  g: number;
  c: number;
  description: string;
}

export interface CableType extends CableTypeBase {
  id: number;
  upload_time: string;
}
