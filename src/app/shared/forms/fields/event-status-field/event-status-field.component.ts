import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { EvaluationStatusGroup } from '@interfaces/event.interface';

/**
 * Form field component used for selecting event's evaluation statuses.
 *
 * - has 2 visual types (`select` / `chip`) that can be set with `[type]` field
 * - depending on the value if the `[multiple]` field, can set single or multiple values
 * - depending on the value of the `[multiple]` field, emits different events
 */
@Component({
  selector: 'app-event-status-field',
  templateUrl: './event-status-field.component.html',
  styleUrls: ['./event-status-field.component.scss']
})
export class EventStatusFieldComponent {

  /** Label at the top of the form field. Default value is `Event Status` */
  @Input()
  label = `Event Status`;

  /**
   * (if `[type]="'select'"`) Defines if the form field should accept single or multiple values. If multiple is true, values
   * are set and returned in an array.
   *
   * Default value is `true`
   */
  @Input()
  multiple = true;

  /**
   * Sets visual version of the component - `select` | `chip`. Select looks like a
   * selectbox form field and chip looks like list of labels.
   *
   * Default value is `select`
   */
  @Input()
  type: 'select' | 'chip' = 'select';

  /**  Defines all possible evaluation status options */
  @Input()
  evaluationStatuses: EvaluationStatusGroup[] = [];


  // FOR SINGLE VALUE:


  /**  (if [multiple]="false") Value of component. Field has a two-way data binding */
  @Input()
  selectedEvaluationStatus: EvaluationStatusGroup | null = null;

  /**  (if [multiple]="false") Emits event when value changes */
  @Output()
  selectedEvaluationStatusChange: EventEmitter<EvaluationStatusGroup> = new EventEmitter();


  // FOR MULTIPLE VALUES:


  /**  (if [multiple]="true") Value of component. Field has a two-way data binding */
  @Input()
  selectedEvaluationStatuses: EvaluationStatusGroup[] = [];

  /**  (if [multiple]=true") Emits event when value changes  */
  @Output()
  selectedEvaluationStatusesChange: EventEmitter<EvaluationStatusGroup[]> = new EventEmitter();



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
