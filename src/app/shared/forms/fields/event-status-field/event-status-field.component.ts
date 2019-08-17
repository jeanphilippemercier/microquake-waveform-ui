import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { EvaluationStatus } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-status-field',
  templateUrl: './event-status-field.component.html',
  styleUrls: ['./event-status-field.component.scss']
})
export class EventStatusFieldComponent {

  @Input() label = `Event Status`;
  @Input() multiple = true;
  @Input() type: 'select' | 'chip' = 'select';
  @Input() evaluationStatuses: EvaluationStatus[];

  // for multiple === false
  @Input() selectedEvaluationStatus: EvaluationStatus;
  @Output() selectedEvaluationStatusChange: EventEmitter<EvaluationStatus> = new EventEmitter();

  // for multiple === true
  @Input() selectedEvaluationStatuses: EvaluationStatus[] = [];
  @Output() selectedEvaluationStatusesChange: EventEmitter<EvaluationStatus[]> = new EventEmitter();

  previousSelectedEvaluationStatuses: EvaluationStatus[] = [];

  onChangeEvaluationStatus(event: MatSelectChange) {
    this.selectedEvaluationStatusChange.emit(event.value);
  }

  onChangeEvaluationStatuses(event: MatSelectChange) {
    this.selectedEvaluationStatusesChange.emit(event.value);
  }

  onChipClick(evaluationStatus: EvaluationStatus) {
    if (!this.selectedEvaluationStatuses) {
      this.selectedEvaluationStatuses = [];
    }
    const position = this.selectedEvaluationStatuses.indexOf(evaluationStatus);

    if (position > -1) {
      this.selectedEvaluationStatuses.splice(position, 1);
    } else {
      this.selectedEvaluationStatuses.push(evaluationStatus);
    }

    this.selectedEvaluationStatusesChange.emit(this.selectedEvaluationStatuses);
  }

  onNoFilterChipClick() {
    if (!this.selectedEvaluationStatuses || this.selectedEvaluationStatuses.length === 0) {
      if (this.previousSelectedEvaluationStatuses && this.previousSelectedEvaluationStatuses.length > 0) {
        this.selectedEvaluationStatuses = [...this.previousSelectedEvaluationStatuses];
      }
    } else {
      this.previousSelectedEvaluationStatuses = [...this.selectedEvaluationStatuses];
      this.selectedEvaluationStatuses = [];
    }

    this.selectedEvaluationStatusesChange.emit(this.selectedEvaluationStatuses);
  }
}
