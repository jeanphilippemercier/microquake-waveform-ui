import { SiteBase, SensorBase, IComponentBase, StationBase, ISensorTypeBase, CableTypeBase } from './inventory.interface';
import { MaintenanceEventBase } from './maintenance.interface';

export interface SiteCreateInput extends Partial<SiteBase> { }
export interface SiteUpdateInput extends Partial<SiteBase> { }

export interface SensorCreateInput extends Partial<SensorBase> {
  station_id?: number;
  borehole_id?: number;
}
export interface SensorUpdateInput extends Partial<SensorBase> { }

export interface ComponentCreateInput extends Partial<IComponentBase> {
  sensor_id: number;
  sensor_type_id: number;
  cable_id: number;
}
export interface ComponentUpdateInput extends Partial<IComponentBase> {
  sensor_type_id: number;
  cable_id: number;
}

export interface StationCreateInput extends Partial<StationBase> {
  network_id: number;
}
export interface StationUpdateInput extends Partial<StationCreateInput> { }

export interface ISensorTypeCreateInput extends Partial<ISensorTypeBase> { }
export interface ISensorTypeUpdateInput extends Partial<ISensorTypeBase> { }

export interface CableTypeCreateInput extends Partial<CableTypeBase> { }
export interface CableTypeUpdateInput extends Partial<CableTypeBase> { }

export interface MaintenanceEventCreateInput extends Partial<MaintenanceEventBase> { }
export interface MaintenanceEventUpdateInput extends Partial<MaintenanceEventBase> { }
