import { IEvent, EvaluationStatus, EventType, EventEvaluationMode } from './event.interface';
import { EventQuery } from './event-query.interface';
import { Site } from './site.interface';

export interface EventUpdateDialog {
  event: IEvent;
  evaluationStatuses: EvaluationStatus[];
  eventTypes: EventType[];
  eventEvaluationModes: EventEvaluationMode[];
}
export interface EventFilterDialogData {
  timezone: string;
  eventQuery: EventQuery;
  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatus[];
  eventEvaluationModes: EventEvaluationMode[];
  sites: Site[];
}
