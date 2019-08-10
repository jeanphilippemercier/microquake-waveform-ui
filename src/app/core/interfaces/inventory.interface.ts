
// TODO: add actual sensor params from API
export interface Sensor {
  id?: string;
  code?: string;
  station?: string;
  chart?: canvasjs.Chart;
  picks?: any;
  container?: any;
  channels: any;
  sensor_code?: any;
}
