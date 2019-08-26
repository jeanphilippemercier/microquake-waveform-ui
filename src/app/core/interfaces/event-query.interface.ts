import { QuakemlType, EvaluationStatus, EvaluationStatusGroup } from './event.interface';

// QUERIES
export interface EventQuery {
  start_time: string;
  end_time: string;
  site_code: string;
  network_code: string;
  time_range?: number; // TODO: add to API ?
  type?: QuakemlType[];
  status?: EvaluationStatusGroup[];
}

export interface BoundariesQuery {
  site_code?: string;
  network_code?: string;
}

export interface MicroquakeEventTypesQuery {
  site_code: string;
}

export interface EventOriginsQuery {
  site_code: string;
  network_code: string;
  event_id: string;
}

export interface EventArrivalsQuery {
  site_code: string;
  network_code: string;
  event_id: string;
  origin_id?: string;
}

export interface EventWaveformQuery {
  traces_per_page?: number;
}
