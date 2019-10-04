import { Component, Input, EventEmitter, Output } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-event-date-field',
  templateUrl: './event-date-field.component.html',
  styleUrls: ['./event-date-field.component.scss']
})
export class EventDateFieldComponent {

  @Input()
  public set date(v: Date) {
    const offset = moment.parseZone(v).utcOffset();
    const userTimezone = moment.parseZone(new Date()).utcOffset();
    this._date = moment(v).utc().add(offset - userTimezone, 'minute').toDate();
  }

  public get date(): Date {
    return this._date;
  }
  private _date: Date;

  @Output() dateChange: EventEmitter<Date> = new EventEmitter();

  @Input() minDate: Date;
  @Input() maxDate: Date;
  @Input() label = '';

  onChangeDate(event: Date) {
    this.dateChange.emit(event);
  }

}
