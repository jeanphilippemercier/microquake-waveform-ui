import { IEvent, Pick, ArrivalBase, BatchStatus, ArrivalPartial } from './event.interface';
import { PaginationResponse } from './dto.interface';

export interface EventUpdateInput extends Partial<IEvent> {
  event_resource_id?: string;
}

export interface PickUpdateInput extends Partial<Pick> {
}

export interface ArrivalUpdateInput {
  data: ArrivalPartial[];
}

export interface WaveformQueryResponse {
  num_of_pages: number;
  pages: string[];
  context: string;
  all_sensor_codes: string[];
}

export interface EventPaginationResponse<T> extends PaginationResponse<T> {
  time_utc_max: string;
  time_utc_min: string;
}
