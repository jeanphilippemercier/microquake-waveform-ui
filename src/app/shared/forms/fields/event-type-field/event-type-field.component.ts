import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { EventType } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-type-field',
  templateUrl: './event-type-field.component.html',
  styleUrls: ['./event-type-field.component.scss']
})
export class EventTypeFieldComponent {

  @Input() label = `Event Type`;
  @Input() multiple = true;
  @Input() type: 'select' | 'chip' = 'select';
  @Input() eventTypes: EventType[] = [];

  // for multiple === false
  @Input() selectedEventType: EventType | null = null;
  @Output() selectedEventTypeChange: EventEmitter<EventType> = new EventEmitter();

  // for multiple === true
  @Input() selectedEventTypes: EventType[] = [];
  @Output() selectedEventTypesChange: EventEmitter<EventType[]> = new EventEmitter();
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
