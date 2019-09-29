import { PaginationRequest } from './query.interface';

export interface MaintenanceEventQuery extends PaginationRequest {
  station_id?: number;
}
