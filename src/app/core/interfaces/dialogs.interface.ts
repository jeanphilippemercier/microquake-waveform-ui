import { IEvent, EvaluationStatus, EventType, EventEvaluationMode } from './event.interface';

export interface EventUpdateDialog {
  event: IEvent;
  evaluationStatuses: EvaluationStatus[];
  eventTypes: EventType[];
  eventEvaluationModes: EventEvaluationMode[];
}
