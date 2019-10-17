import { PaginationRequest } from './query.interface';

export interface SensorsQuery extends PaginationRequest {
  station?: number;
  ordering?: SensorsQueryOrdering;
  search?: string;
}

export enum SensorsQueryOrdering {
  station_location_codeASC = 'station_location_code',
  station_location_codeDESC = '-station_location_code',
  location_codeASC = 'location_code',
  location_codeDESC = '-location_code',
  pkASC = 'pk',
  pkDESC = '-pk'
}

export interface StationsQuery extends PaginationRequest {
  ordering?: StationsQueryOrdering;
  search?: string;
}

export enum StationsQueryOrdering {
  codeASC = 'code',
  codeDESC = '-code',
  nameASC = 'name',
  nameDESC = '-name',
  pkASC = 'pk',
  pkDESC = '-pkÎ',
}

export interface InterpolateBoreholeQuery {
  alonghole_depth: number;
}
