import { IEvent, EvaluationStatus, EventType, EvaluationMode } from './event.interface';
import { EventQuery } from './event-query.interface';
import { Site } from './site.interface';

export interface EventUpdateDialog {
  event: IEvent;
  evaluationStatuses: EvaluationStatus[];
  eventTypes: EventType[];
  eventEvaluationModes: EvaluationMode[];
}
export interface EventFilterDialogData {
  timezone: string;
  eventQuery: EventQuery;
  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatus[];
  eventEvaluationModes: EvaluationMode[];
  sites: Site[];
}
