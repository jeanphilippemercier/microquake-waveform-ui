import { IEvent, EvaluationStatus, EventType, EvaluationMode, EvaluationStatusGroup, QuakemlType } from './event.interface';
import { EventQuery } from './event-query.interface';
import { Site, Network, Station, TakenEventType } from './inventory.interface';
import { MaintenanceEvent, MaintenanceStatus, MaintenanceCategory } from './maintenance.interface';
import { PageMode } from './core.interface';

export interface EventUpdateDialog {
  event: IEvent;
  evaluationStatuses: EvaluationStatus[];
  eventTypes: EventType[];
  eventEvaluationModes: EvaluationMode[];
  mode: 'updateDialog' | 'eventDetail';
}
export interface EventFilterDialogData {
  timezone: string;
  eventQuery: EventQuery;
  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatusGroup[];
  eventEvaluationModes: EvaluationMode[];
}
export interface EventInteractiveProcessingDialog {
  oldEvent: IEvent;
  newEvent?: IEvent;
}

export interface ConfirmationDialogData {
  header: string;
  text: string;
}

export interface EventSitePickerDialogData {
  sites: Site[];
  networks: Network[];
  currentSite: Site;
  currentNetwork: Network;
}

export interface EventWaveformFilterDialogData {
  lowFreqCorner: number;
  highFreqCorner: number;
  numPoles: number;
  maxFreq: number;
}

export interface MaintenanceFormDialogData {
  model: MaintenanceEvent;
  stations: Station[];
  maintenanceStatuses: MaintenanceStatus[];
  maintenanceCategories: MaintenanceCategory[];
}


export interface MicroquakeEventTypeFormDialogData {
  model: EventType | Partial<EventType>;
  mode: PageMode;
  sites: Site[];
  takenEventType: TakenEventType[];
}
