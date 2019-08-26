import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { EvaluationStatus, EvaluationStatusGroup } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-status-field',
  templateUrl: './event-status-field.component.html',
  styleUrls: ['./event-status-field.component.scss']
})
export class EventStatusFieldComponent {

  @Input() label = `Event Status`;
  @Input() multiple = true;
  @Input() type: 'select' | 'chip' = 'select';
  @Input() evaluationStatuses: EvaluationStatusGroup[];

  // for multiple === false
  @Input() selectedEvaluationStatus: EvaluationStatusGroup;
  @Output() selectedEvaluationStatusChange: EventEmitter<EvaluationStatusGroup> = new EventEmitter();

  // for multiple === true
  @Input() selectedEvaluationStatuses: EvaluationStatusGroup[] = [];
  @Output() selectedEvaluationStatusesChange: EventEmitter<EvaluationStatusGroup[]> = new EventEmitter();

  previousSelectedEvaluationStatuses: EvaluationStatusGroup[] = [];

  onChangeEvaluationStatus(event: MatSelectChange) {
    this.selectedEvaluationStatusChange.emit(event.value);
  }

  onChangeEvaluationStatuses(event: MatSelectChange) {
    this.selectedEvaluationStatusesChange.emit(event.value);
  }

  onChipClick(evaluationStatus: EvaluationStatusGroup) {
    if (!this.selectedEvaluationStatuses) {
      this.selectedEvaluationStatuses = [];
    }
    const position = this.selectedEvaluationStatuses.indexOf(evaluationStatus);

    if (this.selectedEvaluationStatuses.length === 1 && position > -1) {
      return;
    }

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
