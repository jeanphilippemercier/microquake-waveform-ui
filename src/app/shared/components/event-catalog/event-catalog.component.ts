import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import * as moment from 'moment';

import { IEvent } from '@interfaces/event.interface';

interface EventDay {
  dayDate: moment.Moment;
  dayDateStr: string;
  dayOutsideFiterRange: boolean;
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
    this.addCurrentEventToList();
    this.sortAndMapEvents();
    this.currentEventDayInList = this.isCurrentEventDayInList();
    return;
  }

  get events(): IEvent[] {
    return this._events;
  }

  // to force changeDetection
  private _forceCD = 0;
  @Input()
  set forceCD(forceCD: number) {
    this.sortAndMapEvents();
    this.currentEventDayInList = this.isCurrentEventDayInList();
    this._forceCD = forceCD;
  }
  get forceCD() {
    return this._forceCD;
  }

  @Input() currentEventInfo: IEvent;

  _currentEvent: IEvent;
  @Input()
  set currentEvent(event: IEvent) {
    this._currentEvent = event;
    if (event && event.time_utc) {
      this.openedDay = moment(event.time_utc).utcOffset(this.timezone).startOf('day');
      this.currentEventDayInList = this.isCurrentEventDayInList();
    }
    return;
  }

  get currentEvent(): IEvent {
    return this._currentEvent;
  }

  @Input() timezone: string;

  @Output() eventClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();
  @Output() chartClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();


  @Input() filterTimeAfter: moment.Moment;
  @Input() filterTimeBefore: moment.Moment;

  days: EventDay[] = [];
  daysMap: any = {};
  openedDay: moment.Moment;
  currentEventDayInList = false;

  sortAndMapEvents() {
    this.events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
    [this.days, this.daysMap] = this.mapEventsToDays(this.events);
  }

  addCurrentEventToList() {
    if (
      this.currentEvent &&
      this.events &&
      this.events.findIndex(event => event.event_resource_id === this.currentEvent.event_resource_id) === -1
    ) {
      this.events.push(this.currentEvent);
    }
  }

  mapEventsToDays(events: IEvent[]): [EventDay[], {}] {
    const eventDays: EventDay[] = [];
    const daysMap = {};

    events.forEach((event, idx) => {

      // TODO: use timezone from event.timezone not this.timezone (when timezone's fixed on API)
      const dayMoment = moment(event.time_utc).utcOffset(this.timezone).startOf('day');
      const day = dayMoment.toString();
      let dayOutsideFiterRange = false;

      if (this.filterTimeBefore && dayMoment.isAfter(this.filterTimeBefore)) {
        dayOutsideFiterRange = true;
      }

      if (this.filterTimeBefore && dayMoment.isBefore(this.filterTimeAfter)) {
        dayOutsideFiterRange = true;
      }

      if (typeof daysMap[day] === 'undefined') {
        eventDays.push({
          dayDate: moment(event.time_utc).utcOffset(this.timezone).startOf('day'),
          dayOutsideFiterRange,
          dayDateStr: day,
          dayEvents: []
        });
        daysMap[day] = eventDays.length - 1;
      }
      eventDays[daysMap[day]].dayEvents.push(event);
    });

    return [eventDays, daysMap];
  }

  isCurrentEventDayInList() {
    if (this.events && this.currentEvent) {
      if (this.events.findIndex(event => event.event_resource_id === this.currentEvent.event_resource_id) > -1) {
        return true;
      }
    }

    return false;
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
