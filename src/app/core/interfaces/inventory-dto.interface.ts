import { SiteBase, SensorBase, IComponent } from './inventory.interface';

export interface SiteCreateInput extends Partial<SiteBase> { }
export interface SiteUpdateInput extends Partial<SiteBase> { }

export interface SensorCreateInput extends Partial<SensorBase> {
  station_id?: number;
  borehole_id?: number;
}
// tslint:disable-next-line:no-empty-interface
export interface SensorUpdateInput extends SensorCreateInput { }


export interface ComponentCreateInput extends Partial<IComponent> {

}
