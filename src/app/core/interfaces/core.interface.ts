import { IEvent, BatchStatus } from './event.interface';
import { Heartbeat } from './inventory.interface';

export enum PageMode {
  EDIT = 'edit',
  CREATE = 'create'
}

export enum WebsocketResponseOperation {
  CREATED = 'created',
  UPDATED = 'updated',
  INTERACTIVE_BATCH_READY = 'interactive_batch_ready',
  INTERACTIVE_BATCH_FAILED = 'interactive_batch_failed',
  AUTOMATIC_PIPELINE_COMPLETE = 'automatic_pipeline_complete',
  AUTOMATIC_PIPELINE_FAILED = 'automatic_pipeline_failed'
}

export enum WebsocketResponseType {
  EVENT = 'event',
  HEARTBEAT = 'heartbeat',
  SIGNAL_QUALITY = 'signal_quality'
}

export interface WebsocketEventResponse {
  type: WebsocketResponseType;
  operation: WebsocketResponseOperation;
  event: IEvent;
  heartbeat?: Heartbeat;
  extra: EventExtra;
}

export interface EventExtra {
  batch?: {
    id: number;
    status: BatchStatus;
  };
  error: string | null;
}

export enum DataLoadStatus {
  UNKNOWN = 'unknown',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
}
