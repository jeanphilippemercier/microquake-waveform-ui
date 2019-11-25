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
}

export enum WebsocketResponseType {
  EVENT = 'event',
  HEARTBEAT = 'heartbeat'
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

export enum HeartbeatStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive'
}
