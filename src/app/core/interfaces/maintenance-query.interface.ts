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
  time_range?: number; // not on api
  category_id?: number;
  status_id?: number;
  datetime__gte?: string;
  datetime__lte?: string;
}
