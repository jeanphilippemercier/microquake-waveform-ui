import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { EvaluationMode } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-mode-field',
  templateUrl: './event-mode-field.component.html',
  styleUrls: ['./event-mode-field.component.scss']
})
export class EventModeFieldComponent {

  @Input() label = `Event Mode`;
  @Input() multiple = true;
  @Input() eventEvaluationModes: EvaluationMode[];

  // for multiple === false
  @Input() selectedEvaluationMode: EvaluationMode;
  @Output() selectedEvaluationModeChange: EventEmitter<EvaluationMode> = new EventEmitter();

  // for multiple === true
  @Input() selectedEvaluationModes: EvaluationMode[];
  @Output() selectedEvaluationModesChange: EventEmitter<EvaluationMode[]> = new EventEmitter();

  onChangeEvaluationMode(event: MatSelectChange) {
    this.selectedEvaluationModeChange.emit(event.value);
  }

  onChangeEvaluationModes(event: MatSelectChange) {
    this.selectedEvaluationModesChange.emit(event.value);
  }

}
