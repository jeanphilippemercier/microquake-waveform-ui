import { QuakemlType, EvaluationStatus, EvaluationStatusGroup } from './event.interface';
import { PaginationRequest } from './query.interface';

// QUERIES
export interface EventQuery extends PaginationRequest {
  site?: number;
  network?: number;
  time_utc_after?: string;
  time_utc_before?: string;
  time_range?: number; // TODO: add to API ?
  event_type?: QuakemlType[];
  status?: EvaluationStatusGroup[];
  magnitude_min?: number;
  magnitude_max?: number;
  energy_joule_min?: number;
  energy_joule_max?: number;
  x_min?: number;
  x_max?: number;
  y_min?: number;
  y_max?: number;
  z_min?: number;
  z_max?: number;
  ordering?: string;
  format?: string;
}

export interface EventDailySummaryQuery extends EventQuery {
  tz_offset?: string;
}

export interface BoundariesQuery {
  site_code?: string;
  network_code?: string;
}

export interface MicroquakeEventTypesQuery {
  site_code?: string;
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
  sampling_rate?: number;
}

export interface EventRayQuery {
  site_code: string;
  network_code: string;
  event_id: string;
  origin_id?: string;
}
