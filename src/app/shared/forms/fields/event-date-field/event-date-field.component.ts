import { Component, Input, EventEmitter, Output } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-event-date-field',
  templateUrl: './event-date-field.component.html',
  styleUrls: ['./event-date-field.component.scss']
})
export class EventDateFieldComponent {

  @Input()
  public set date(v: Date | null) {
    if (v) {
      const offset = moment.parseZone(v).utcOffset();
      const userTimezone = moment.parseZone(new Date()).utcOffset();
      this._date = moment(v).utc().add(offset - userTimezone, 'minute').toDate();
    } else {
      this._date = v;
    }
  }

  public get date() {
    return this._date;
  }
  private _date: Date | null = null;

  @Output() dateChange: EventEmitter<Date> = new EventEmitter();

  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() label = '';

  onChangeDate(event: Date) {
    this.dateChange.emit(event);
  }

}
