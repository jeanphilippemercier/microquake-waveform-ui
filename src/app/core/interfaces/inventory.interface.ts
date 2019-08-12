export interface Sensor {
  id: number;
  code: string;
  chart?: canvasjs.Chart;
  picks?: any;
  S_pick_time_utc?: string;
  P_pick_time_utc?: string;

  container?: any;
  channels?: any;
  station: string;
  sensor_code?: any;
  site: number;
  borehole?: number;
  name: string;
  commissioning_date: string;
  decommissioning_date: string;
  location_x: number;
  location_y: number;
  location_z: number;
  part_number?: any;
  manufacturer: string;
  enabled: boolean;
  signal_quality: SignalQuality;
  components: Component[];
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

export interface Component {
  id: number;
  sensor_type: SensorType;
  code: ComponentCode;
  cable_length: number;
  orientation_x: number;
  orientation_y: number;
  orientation_z: number;
  damping: number;
  enabled: boolean;
  sensor: number;
  cable: number;
}

export interface ISensorType {
  id: number;
  sensor_type: SensorType;
  motion_type: MotionType;
}

export enum ComponentCode {
  Z = 'z',
  Y = 'y',
  X = 'x',
}

export enum SensorType {
  GEOPHONE = 'geophone',
  ACCELEROMETER = 'accelerometer'
}

export enum MotionType {
  MM_PER_S_VELOCITY = 'mm/s (velocity)'
}
