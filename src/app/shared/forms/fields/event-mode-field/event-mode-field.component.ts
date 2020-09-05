import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { EvaluationMode } from '@interfaces/event.interface';

/**
 * Form field component for manipulation with event evaluation modes.
 *
 * - depending on the value if the `[multiple]` field, can set single or multiple values
 * - depending on the value of the `[multiple]` field, emits different events
 */
@Component({
  selector: 'app-event-mode-field',
  templateUrl: './event-mode-field.component.html',
  styleUrls: ['./event-mode-field.component.scss']
})
export class EventModeFieldComponent {

  /** Label at the top of the form field. Default value is `Event Mode` */
  @Input()
  label = `Event Mode`;

  /** Allows select multiple values. Default value is true */
  @Input()
  multiple = true;

  /** Defines all possible evaluation mode options. */
  @Input()
  eventEvaluationModes: EvaluationMode[] = [];


  // FOR SINGLE VALUE:


  /**  (use if [multiple]="false") Value of component. Field has a two-way data binding */
  @Input()
  selectedEvaluationMode: EvaluationMode | null = null;

  /**  (use if [multiple]="false") Emits event when [value] changes  */
  @Output()
  selectedEvaluationModeChange: EventEmitter<EvaluationMode> = new EventEmitter();


  // FOR MULTIPLE VALUES:


  /**  (use if [multiple]="true") Value of component. Field has a two-way data binding */
  @Input()
  selectedEvaluationModes: EvaluationMode[] = [];

  /**  (use if [multiple]="true") Emits event when [value] changes  */
  @Output()
  selectedEvaluationModesChange: EventEmitter<EvaluationMode[]> = new EventEmitter();



  onChangeEvaluationMode(event: MatSelectChange) {
    this.selectedEvaluationModeChange.emit(event.value);
  }

  onChangeEvaluationModes(event: MatSelectChange) {
    this.selectedEvaluationModesChange.emit(event.value);
  }

}
