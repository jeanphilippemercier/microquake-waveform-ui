import { Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-event-date-field',
  templateUrl: './event-date-field.component.html',
  styleUrls: ['./event-date-field.component.scss']
})
export class EventDateFieldComponent {

  @Input() date: Date;
  @Output() dateChange: EventEmitter<Date> = new EventEmitter();

  @Input() minDate: Date;
  @Input() maxDate: Date;
  @Input() label = '';

  onChangeDate(event: Date) {
    this.dateChange.emit(event);
  }

}
