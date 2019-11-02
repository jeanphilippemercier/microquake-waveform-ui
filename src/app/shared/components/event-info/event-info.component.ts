import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { IEvent, EventType, EvaluationStatus, EvaluationMode } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-info',
  templateUrl: './event-info.component.html',
  styleUrls: ['./event-info.component.scss']
})
export class EventInfoComponent implements OnInit {

  private _event!: IEvent;
  @Input()
  set event(v: IEvent) {
    this._event = v;
    this.setEventProps(this._event);
  }
  get event() {
    return this._event;
  }

  @Output() eventChange: EventEmitter<IEvent> = new EventEmitter();
  @Input() editEnabled = false;
  @Input() mode: 'updateDialog' | 'eventDetail' = 'eventDetail';
  @Input() eventTypes: EventType[] = [];
  @Input() evaluationStatuses: EvaluationStatus[] = [];
  @Input() eventEvaluationModes: EvaluationMode[] = [];
  @Input() loading = false;
  @Input() timezone!: string;
  @Output() acceptClicked: EventEmitter<EventType> = new EventEmitter();
  @Output() rejectClicked: EventEmitter<EventType> = new EventEmitter();

  selectedEventType: EventType | null = null;
  selectedEvenStatus: EvaluationStatus | null = null;
  selectedEvaluationMode: EvaluationMode | null = null;
  EvaluationStatus = EvaluationStatus;

  @HostListener('window:keydown', ['$event'])
  doSomething($event: KeyboardEvent) {
    if (!$event) {
      return;
    }

    switch ($event.key) {
      case 'q':
      case 'Q':
        if (!this.selectedEventType) {
          return;
        }
        this.onRejectClicked(this.selectedEventType);
        break;
      case 'w':
      case 'W':
        if (!this.selectedEventType) {
          return;
        }
        this.onAcceptClicked(this.selectedEventType);
        break;
      default:
        break;
    }
  }

  ngOnInit() {
    if (this.mode === 'updateDialog') {
      this.setEventProps(this.event);
    }
  }

  setEventProps(event: IEvent) {
    if (!event) {
      return;
    }

    if (this.eventTypes && this.eventTypes.length > 0) {
      const val = this.eventTypes.find(eventType => eventType.quakeml_type === event.event_type);
      this.selectedEventType = val ? val : null;
    }

    if (this.evaluationStatuses && this.evaluationStatuses.length > 0) {
      const val = this.evaluationStatuses.find(evaluationStatus => evaluationStatus === event.status);
      this.selectedEvenStatus = val ? val : null;
    }

    if (this.eventEvaluationModes && this.eventEvaluationModes.length > 0) {
      const val = this.eventEvaluationModes.find(eventEvaluationMode => eventEvaluationMode === event.evaluation_mode);
      this.selectedEvaluationMode = val ? val : null;
    }
  }

  onEventTypeChange(eventType: EventType) {
    if (eventType && eventType.quakeml_type !== this.event.event_type) {
      this.event.event_type = eventType.quakeml_type;
    }

    this.selectedEventType = eventType;
    this.eventChange.emit(this.event);
  }

  onEvaluationStatusChange(evaluationStatus: EvaluationStatus) {
    if (evaluationStatus && evaluationStatus !== this.event.status) {
      this.event.status = evaluationStatus;
    }

    this.selectedEvenStatus = evaluationStatus;
    this.eventChange.emit(this.event);
  }

  onEvaluationModeChange(eventEvaluationMode: EvaluationMode) {
    if (eventEvaluationMode && eventEvaluationMode !== this.event.evaluation_mode) {
      this.event.evaluation_mode = eventEvaluationMode;
    }

    this.selectedEvaluationMode = eventEvaluationMode;
    this.eventChange.emit(this.event);
  }

  onAcceptClicked($event: EventType | null) {
    if (!$event) {
      console.error('No event type');
      return;
    }

    if (this.loading) {
      return;
    }

    this.acceptClicked.emit($event);
  }

  onRejectClicked($event: EventType | null) {
    if (!$event) {
      console.error('No event type');
      return;
    }

    if (this.loading) {
      return;
    }

    this.rejectClicked.emit($event);
  }
}
