import { Component, Input, EventEmitter, Output } from '@angular/core';

import { EventType } from '@interfaces/event.interface';
import { MatSelectChange } from '@angular/material';

@Component({
  selector: 'app-event-type-field',
  templateUrl: './event-type-field.component.html',
  styleUrls: ['./event-type-field.component.scss']
})
export class EventTypeFieldComponent {

  @Input() eventTypes: EventType[];
  @Input() selectedEventTypes: EventType[];
  @Output() selectedEventTypesChange: EventEmitter<EventType[]> = new EventEmitter();

  onChangeEventTypes(event: MatSelectChange) {
    this.selectedEventTypesChange.emit(event.value);
  }
}
