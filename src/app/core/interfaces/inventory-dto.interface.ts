import { SiteBase, SensorBase, IComponent, IComponentBase } from './inventory.interface';

export interface SiteCreateInput extends Partial<SiteBase> { }
export interface SiteUpdateInput extends Partial<SiteBase> { }

export interface SensorCreateInput extends Partial<SensorBase> {
  station_id?: number;
  borehole_id?: number;
}
// tslint:disable-next-line:no-empty-interface
export interface SensorUpdateInput extends SensorCreateInput { }

export interface ComponentCreateInput extends Partial<IComponentBase> {
  sensor_id: number;
  sensor_type_id: number;
  cable_id: number;
}

export interface ComponentUpdateInput extends Partial<IComponentBase> {
  sensor_type_id: number;
  cable_id: number;
}
