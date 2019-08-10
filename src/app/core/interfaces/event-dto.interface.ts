import { IEvent } from './event.interface';

export interface EventUpdateInput extends Partial<IEvent> {
  event_resource_id: string;
}

export interface WaveformQueryResponse {
  num_of_pages: number;
  pages: string[];
  context: string;
  complete_stations: string[];
}
