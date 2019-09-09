import { IEvent, Pick, ArrivalBase } from './event.interface';
import { PaginationResponse } from './dto.interface';

export interface EventUpdateInput extends Partial<IEvent> {
  event_resource_id?: string;
}

export interface PickUpdateInput extends Partial<Pick> {
}

export interface ArrivalUpdateInput extends Partial<ArrivalBase<PickUpdateInput>> {
}

export interface WaveformQueryResponse {
  num_of_pages: number;
  pages: string[];
  context: string;
  complete_stations: string[];
}

export interface EventPaginationResponse<T> extends PaginationResponse<T> {
  time_utc_max: string;
  time_utc_min: string;
}
