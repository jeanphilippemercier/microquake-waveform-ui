import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material';

import { EvaluationStatus } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-status-field',
  templateUrl: './event-status-field.component.html',
  styleUrls: ['./event-status-field.component.scss']
})
export class EventStatusFieldComponent {

  @Input() label = `Event Status`;
  @Input() multiple = true;
  @Input() evaluationStatuses: EvaluationStatus[];

  // for multiple === false
  @Input() selectedEvaluationStatus: EvaluationStatus;
  @Output() selectedEvaluationStatusChange: EventEmitter<EvaluationStatus> = new EventEmitter();

  // for multiple === true
  @Input() selectedEvaluationStatuses: EvaluationStatus[];
  @Output() selectedEvaluationStatusesChange: EventEmitter<EvaluationStatus[]> = new EventEmitter();


  onChangeEvaluationStatus(event: MatSelectChange) {
    this.selectedEvaluationStatusChange.emit(event.value);
  }

  onChangeEvaluationStatuses(event: MatSelectChange) {
    this.selectedEvaluationStatusesChange.emit(event.value);
  }

}
