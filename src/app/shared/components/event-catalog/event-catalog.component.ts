import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import * as moment from 'moment';

import { IEvent } from '@interfaces/event.interface';

interface EventDay {
  dayDate: Date;
  dayDateStr: string;
  dayEvents: IEvent[];
}

@Component({
  selector: 'app-event-catalog',
  templateUrl: './event-catalog.component.html',
  styleUrls: ['./event-catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCatalogComponent {

  private _events: IEvent[];

  @Input()
  set events(events: IEvent[]) {
    this._events = events || [];
    this._events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
    [this.days, this.daysMap] = this.mapEventsToDays(this.events);
    return;
  }

  get events(): IEvent[] {
    return this._events;
  }

  @Input() currentEvent: IEvent;
  @Input() timezone: string;

  @Output() eventClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();
  @Output() chartClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();

  days: EventDay[] = [];
  daysMap: any = {};

  mapEventsToDays(events: IEvent[]): [EventDay[], {}] {
    const eventDays: EventDay[] = [];
    const daysMap = {};

    events.forEach((event, idx) => {
      const day = moment(event.time_utc).utcOffset(event.timezone).startOf('day').toString();
      if (typeof daysMap[day] === 'undefined') {
        eventDays.push({
          dayDate: new Date(event.time_utc),
          dayDateStr: day,
          dayEvents: []
        });
        daysMap[day] = eventDays.length - 1;
      }
      eventDays[daysMap[day]].dayEvents.push(event);
    });

    return [eventDays, daysMap];
  }

  trackDay(index: number, item: EventDay) {
    return item.dayDateStr;
  }

  trackEvent(index: number, item: IEvent) {
    return item.modification_timestamp;
  }

  async onEventClick($event: IEvent) {
    this.eventClick.emit($event);
  }

  async onChartClick($event: IEvent) {
    this.chartClick.emit($event);
  }
}
