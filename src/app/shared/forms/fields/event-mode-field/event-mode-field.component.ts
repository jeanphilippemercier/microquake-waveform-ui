import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material';

import { EventEvaluationMode } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-mode-field',
  templateUrl: './event-mode-field.component.html',
  styleUrls: ['./event-mode-field.component.scss']
})
export class EventModeFieldComponent {

  @Input() label = `Event Mode`;
  @Input() multiple = true;
  @Input() eventEvaluationModes: EventEvaluationMode[];

  // for multiple === false
  @Input() selectedEventEvaluationMode: EventEvaluationMode;
  @Output() selectedEventEvaluationModeChange: EventEmitter<EventEvaluationMode> = new EventEmitter();

  // for multiple === true
  @Input() selectedEventEvaluationModes: EventEvaluationMode[];
  @Output() selectedEventEvaluationModesChange: EventEmitter<EventEvaluationMode[]> = new EventEmitter();

  onChangeEventEvaluationMode(event: MatSelectChange) {
    this.selectedEventEvaluationModeChange.emit(event.value);
  }

  onChangeEventEvaluationModes(event: MatSelectChange) {
    this.selectedEventEvaluationModesChange.emit(event.value);
  }

}
