import { SiteBase, SensorBase } from './inventory.interface';

export interface SiteCreateInput extends Partial<SiteBase> { }
export interface SiteUpdateInput extends Partial<SiteBase> { }

export interface SensorCreateInput extends Partial<SensorBase> {
  station_id?: number;
  borehole_id?: number;
}
// tslint:disable-next-line:no-empty-interface
export interface SensorUpdateInput extends SensorCreateInput { }
