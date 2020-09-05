import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { EventType } from '@interfaces/event.interface';

/**
 * Form field component for manipulation with event types.
 *
 * - has 2 visual types (`select` / `chip`) that can be set with `[type]` field
 * - depending on the value if the `[multiple]` field, can set single or multiple values
 * - depending on the value of the `[multiple]` field, emits different events
 */
@Component({
  selector: 'app-event-type-field',
  templateUrl: './event-type-field.component.html',
  styleUrls: ['./event-type-field.component.scss']
})
export class EventTypeFieldComponent {

  /** Label at the top of the form field. Default value is `Event Type` */
  @Input()
  label = `Event Type`;

  /**
    * Defines if the form field should accept single or multiple values. If multiple is true, values
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

  /**  Defines all possible evevent type options */
  @Input()
  eventTypes: EventType[] = [];


  // FOR SINGLE VALUE:


  /**  (if [multiple]="false") Value of component. Field has a two-way data binding */
  @Input() selectedEventType: EventType | null = null;

  /**  (if [multiple]="false") Emits event when value changes  */
  @Output() selectedEventTypeChange: EventEmitter<EventType> = new EventEmitter();


  // FOR MULTIPLE VALUES:


  /**  (if [multiple]="true") Value of component. Field has a two-way data binding */
  @Input() selectedEventTypes: EventType[] = [];

  /**  (if [multiple]=true") Emits event when value changes  */
  @Output() selectedEventTypesChange: EventEmitter<EventType[]> = new EventEmitter();

  /**
   * (if [multiple]=true") Emits event when value changes.
   *
   * Same as (selectedEventTypesChange) event, only it doesn't return the whole
   * `EventType` object, but maps to `EventType.quakeml_type`
   */
  @Output() selectedMicroquakeTypesChange: EventEmitter<string[]> = new EventEmitter();

  previousSelectedEventTypes: EventType[] = [];

  onChangeEventTypes(event: MatSelectChange) {
    this.selectedEventTypesChange.emit(event.value);
  }

  onChangeEventType(event: MatSelectChange) {
    this.selectedEventTypeChange.emit(event.value);
  }

  onChipClick(eventStatus: EventType) {
    if (!this.selectedEventTypes) {
      this.selectedEventTypes = [];
    }
    const position = this.selectedEventTypes.indexOf(eventStatus);

    if (position > -1) {
      this.selectedEventTypes.splice(position, 1);
    } else {
      this.selectedEventTypes.push(eventStatus);
    }

    this.selectedEventTypesChange.emit(this.selectedEventTypes);
    this.selectedMicroquakeTypesChange.emit(this.selectedEventTypes.map(eventType => eventType.quakeml_type));

  }

  onNoFilterChipClick() {
    if (!this.selectedEventTypes || this.selectedEventTypes.length === 0) {
      if (this.selectedEventTypes && this.previousSelectedEventTypes.length > 0) {
        this.selectedEventTypes = [...this.previousSelectedEventTypes];
      }
    } else {
      this.previousSelectedEventTypes = [...this.selectedEventTypes];
      this.selectedEventTypes = [];
    }
    this.selectedEventTypesChange.emit(this.selectedEventTypes);
  }
}
