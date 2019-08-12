import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IEvent, EventType, EvaluationStatus, EvaluationMode } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-info',
  templateUrl: './event-info.component.html',
  styleUrls: ['./event-info.component.scss']
})
export class EventInfoComponent implements OnInit {

  @Input() event: IEvent;
  @Output() eventChange: EventEmitter<IEvent> = new EventEmitter();
  @Input() editEnabled = false;
  @Input() eventTypes: EventType[];
  @Input() evaluationStatuses: EvaluationStatus[];
  @Input() eventEvaluationModes: EvaluationMode[];
  @Input() showEventResourceId = false;
  @Input() showTimeResidual = false;
  @Input() showUncertainty = false;
  @Input() showPreferredOriginId = false;

  selectedEventType: EventType;
  selectedEvenStatus: EvaluationStatus;
  selectedEvaluationMode: EvaluationMode;

  ngOnInit() {
    if (this.event && this.eventTypes && this.eventTypes.length > 0) {
      this.selectedEventType = this.eventTypes.find(eventType => eventType.quakeml_type === this.event.event_type);
    }

    if (this.event && this.evaluationStatuses && this.evaluationStatuses.length > 0) {
      this.selectedEvenStatus = this.evaluationStatuses.find(evaluationStatus => evaluationStatus === this.event.status);
    }

    if (this.event && this.eventEvaluationModes && this.eventEvaluationModes.length > 0) {
      this.selectedEvaluationMode = this.eventEvaluationModes.find(
        eventEvaluationMode => eventEvaluationMode === this.event.evaluation_mode
      );
    }
  }

  onEventTypeChange(eventType: EventType) {
    if (eventType && eventType.quakeml_type !== this.event.event_type) {
      this.event.event_type = eventType.quakeml_type;
    }

    this.eventChange.emit(this.event);
  }

  onEvaluationStatusChange(evaluationStatus: EvaluationStatus) {
    if (evaluationStatus && evaluationStatus !== this.event.status) {
      this.event.status = evaluationStatus;
    }

    this.eventChange.emit(this.event);
  }

  onEvaluationModeChange(eventEvaluationMode: EvaluationMode) {
    if (eventEvaluationMode && eventEvaluationMode !== this.event.evaluation_mode) {
      this.event.evaluation_mode = eventEvaluationMode;
    }

    this.eventChange.emit(this.event);
  }
}
