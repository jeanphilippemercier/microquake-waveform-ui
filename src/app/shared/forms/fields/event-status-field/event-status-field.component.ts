import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material';

import { EventStatus } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-status-field',
  templateUrl: './event-status-field.component.html',
  styleUrls: ['./event-status-field.component.scss']
})
export class EventStatusFieldComponent {

  @Input() eventStatuses: EventStatus[];
  @Input() selectedEventStatuses: EventStatus[];
  @Output() selectedEventStatusesChange: EventEmitter<EventStatus[]> = new EventEmitter();

  onChangeEventStatuses(event: MatSelectChange) {
    this.selectedEventStatusesChange.emit(event.value);
  }

}
