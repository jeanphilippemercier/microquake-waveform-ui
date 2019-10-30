import { PaginationRequest } from './query.interface';

export enum MaintenanceEventQueryOrdering {
  ID_ASC = 'id',
  ID_DESC = '-id',
  DATE_ASC = 'date',
  DATE_DESC = '-date'
}
export interface MaintenanceEventQuery extends PaginationRequest {
  station_id?: number;
  ordering?: MaintenanceEventQueryOrdering;
}
