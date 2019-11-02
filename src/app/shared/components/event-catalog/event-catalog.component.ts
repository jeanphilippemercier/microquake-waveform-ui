import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import * as moment from 'moment';

import { IEvent, EventsDailySummary } from '@interfaces/event.interface';

interface EventDay {
  dayDate: moment.Moment;
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

  private _eventsDailySummary!: EventsDailySummary[];
  @Input()
  set eventsDailySummary(eventsDailySummary: EventsDailySummary[]) {

    this.reopenDay = false;
    this.scrolledToEvent = false;

    if (!eventsDailySummary) {
      return;
    }

    this._eventsDailySummary = eventsDailySummary;
    this.reopenDay = true;
    if (this.currentEvent) {
      this.currentEvent.outsideOfCurrentFilter = false;
      this.addCurrentEventToList();
    }
  }
  get eventsDailySummary(): EventsDailySummary[] {
    return this._eventsDailySummary;
  }


  // to force changeDetection
  private _forceCD = 0;
  @Input()
  set forceCD(forceCD: number) {
    this._forceCD = forceCD;
    if (this.currentEvent) {
      this.currentEvent.outsideOfCurrentFilter = false;
      this.addCurrentEventToList();
    }

    if (!this.scrolledToEvent && this.currentEvent) {
      // scroll to event
      // setTimeout(() => {
      //   const el = document.getElementById(`event-${this.currentEvent.event_resource_id}`);
      //   if (el) {
      //     el.scrollIntoView(false);
      //     this.scrolledToEvent = true;
      //   }
      //   console.log(el);
      // }, 300);
    } else {
      this.scrolledToEvent = true;
    }
  }
  get forceCD() {
    return this._forceCD;
  }

  @Input() currentEventInfo!: IEvent;

  private _currentEvent!: IEvent;
  @Input()
  set currentEvent(event: IEvent) {
    this._currentEvent = event;
    this.currentEventDay = event && event.time_utc ? moment.utc(event.time_utc).utcOffset(this.timezone).startOf('day') : null;
    this.currentEventDate = event && event.time_utc ? moment.utc(event.time_utc).utcOffset(this.timezone) : null;
    this.addCurrentEventToList();
  }
  get currentEvent(): IEvent {
    return this._currentEvent;
  }



  @Input() timezone!: string;

  @Output() eventClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();
  @Output() chartClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();


  @Input() filterTimeAfter: moment.Moment | null = null;
  @Input() filterTimeBefore: moment.Moment | null = null;

  @Input()
  public set interactiveProcessingEvents(v: { id: number; event: IEvent }[]) {
    this.interactiveProcessingEventsIds = [];
    if (v) {
      this.interactiveProcessingEventsIds = v.map(val => {
        return val.event.event_resource_id;
      });
    }
    this._interactiveProcessingEvents = v;
  }

  @Output() dayChanged: EventEmitter<moment.Moment> = new EventEmitter();

  public get interactiveProcessingEvents(): { id: number; event: IEvent }[] {
    return this._interactiveProcessingEvents;
  }

  private _interactiveProcessingEvents: { id: number; event: IEvent }[] = [];
  interactiveProcessingEventsIds: string[] = [];
  daysMap: any = {};
  openedDay: moment.Moment | null = null;
  currentEventDayInList = false;
  showCurrentDayBeforeCatalog = false;
  showCurrentDayAfterCatalog = false;
  currentEventDayOutsideCatalog = false;
  currentEventDaySummaryOutsideCatalog: Partial<EventsDailySummary> | null = null;
  currentEventDay: moment.Moment | null = null;
  currentEventDate: moment.Moment | null = null;
  reopenDay = false;
  scrolledToEvent = false;

  addCurrentEventToList() {
    if (this.currentEvent) {
      const inList = this.isEventDayInList(this.currentEvent);

      switch (inList) {
        case -1:
        case null:
          this.showCurrentDayBeforeCatalog = true;
          this.showCurrentDayAfterCatalog = false;
          this.currentEventDaySummaryOutsideCatalog = this.generateEventDailySummaryForEventOuside(this.currentEvent);
          break;
        case 0:
          this.showCurrentDayBeforeCatalog = false;
          this.showCurrentDayAfterCatalog = true;
          this.currentEventDaySummaryOutsideCatalog = this.generateEventDailySummaryForEventOuside(this.currentEvent);

          break;
        default:

          this.showCurrentDayBeforeCatalog = false;
          this.showCurrentDayAfterCatalog = false;

          if (this.currentEvent.outsideOfCurrentFilter) {
            return;
          }

          const found = this.eventsDailySummary.some(day => {
            if (!day.dayDate || !this.currentEventDay) {
              return;
            }

            if (!day.dayDate.isSame(this.currentEventDay)) {
              return false;
            }

            return day.events && day.events.some((ev, idx) => {
              if (this.currentEvent && this.currentEvent.event_resource_id === ev.event_resource_id) {
                return true;
              }
              const nextEvent = ev;
              if (nextEvent) {
                const nextDate = nextEvent.time_utc ? moment.utc(nextEvent.time_utc).utcOffset(this.timezone) : null;

                if (!day.events) {
                  return;
                }

                if (this.currentEventDate && nextDate && this.currentEventDate.isAfter(nextDate)) {
                  day.events.splice(idx, 0, this.currentEvent);
                  this.currentEvent.outsideOfCurrentFilter = true;
                  return true;
                } else if (idx === day.events.length - 1) {
                  day.events.splice(idx, 0, this.currentEvent);
                  this.currentEvent.outsideOfCurrentFilter = true;
                  return true;
                }
              }
            });
          });

          break;
      }
    }
  }

  mapEventsToDays(events: IEvent[]): [EventDay[], {}] {
    const eventDays: EventDay[] = [];
    const daysMap: { [key: string]: number } = {};

    events.forEach((event, idx) => {

      const dayMoment = moment(event.time_utc).utcOffset(this.timezone).startOf('day');
      const day = dayMoment.toString();
      let dayOutsideFiterRange = false;

      if (this.filterTimeBefore && dayMoment.isAfter(this.filterTimeBefore)) {
        dayOutsideFiterRange = true;
      }

      if (this.filterTimeAfter && dayMoment.isBefore(this.filterTimeAfter)) {
        dayOutsideFiterRange = true;
      }

      if (typeof daysMap[day] === 'undefined') {
        eventDays.push({
          dayDate: moment(event.time_utc).utcOffset(this.timezone).startOf('day'),
          dayDateStr: day,
          dayEvents: []
        });
        daysMap[day] = eventDays.length - 1;
      }
      eventDays[daysMap[day]].dayEvents.push(event);
    });

    return [eventDays, daysMap];
  }

  isEventInList(ev: IEvent) {
    if (this.eventsDailySummary && ev) {
      const found = this.eventsDailySummary.some(val => val.events && val.events.some(event => event.event_resource_id === ev.event_resource_id));
      return found ? true : false;
    }

    return false;
  }

  isEventDayInList(ev: IEvent) {
    if (!ev) {
      return null;
    }
    const eventDay = moment(moment.utc(ev.time_utc).utcOffset(this.timezone));

    if (!this.eventsDailySummary || this.eventsDailySummary.length === 0) {
      return -1;
    }

    if (eventDay.isSameOrBefore(this.eventsDailySummary[0].dayDate, 'day')) {
      if (eventDay.isSameOrAfter(this.eventsDailySummary[this.eventsDailySummary.length - 1].dayDate, 'day')) {
        return 1;
      }
    } else if (eventDay.isSameOrAfter(this.eventsDailySummary[this.eventsDailySummary.length - 1].dayDate, 'day')) {
      return -1;
    }
    return 0;

  }

  generateEventDailySummaryForEventOuside(ev: IEvent) {
    ev.outsideOfCurrentFilter = true;
    const ds: Partial<EventsDailySummary> = {
      dayDate: moment.utc(ev.time_utc).utcOffset(this.timezone).startOf('day'),
      date: moment.utc(ev.time_utc).utcOffset(this.timezone).format('YYYY-MM-DD'),
      partial: true,
      events: [ev]
    };
    return ds;
  }

  trackDay(index: number, item: EventsDailySummary) {
    return item.date;
  }

  trackEvent(index: number, item: IEvent) {
    return item.event_resource_id;
  }

  async onEventClick($event: IEvent) {
    this.eventClick.emit($event);
  }

  async onChartClick($event: IEvent) {
    this.chartClick.emit($event);
  }

  onDayChanged($event: moment.Moment) {
    if ($event) {
      this.dayChanged.emit($event);
    }
  }
}
