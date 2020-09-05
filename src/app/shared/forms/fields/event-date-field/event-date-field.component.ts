import { Component, Input, EventEmitter, Output } from '@angular/core';
import * as moment from 'moment';

/** Form field component used for manipulation with dates */
@Component({
  selector: 'app-event-date-field',
  templateUrl: './event-date-field.component.html',
  styleUrls: ['./event-date-field.component.scss']
})
export class EventDateFieldComponent {

  /** Value of the component. Field has a two-way data binding */
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

  /** Label at the top of the form field. Default value is empty string (no label) */
  @Input()
  label = '';

  /** Minimum allowed date */
  @Input()
  minDate: Date | null = null;

  /** Maximum allowed date */
  @Input()
  maxDate: Date | null = null;

  /** Event emitted when [date] value changes */
  @Output()
  dateChange: EventEmitter<Date> = new EventEmitter();

  onChangeDate(event: Date) {
    this.dateChange.emit(event);
  }

}
