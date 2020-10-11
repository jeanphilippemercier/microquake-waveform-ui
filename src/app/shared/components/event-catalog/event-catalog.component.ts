import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import * as moment from 'moment';

import { IEvent, EventsDailySummary, EventsDailySummaryForCatalog, EventBatchMap } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-catalog',
  templateUrl: './event-catalog.component.html',
  styleUrls: ['./event-catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCatalogComponent {

  private _eventsDailySummary!: (EventsDailySummary | Partial<EventsDailySummary>)[];
  @Input()
  set eventsDailySummary(eventsDailySummary: (EventsDailySummary | Partial<EventsDailySummary>)[]) {

    this.reopenDay = false;
    this.scrolledToEvent = false;

    if (!eventsDailySummary) {
      return;
    }

    this._eventsDailySummary = eventsDailySummary;
    this.reopenDay = true;
  }
  get eventsDailySummary(): (EventsDailySummary | Partial<EventsDailySummary>)[] {
    return this._eventsDailySummary;
  }


  // to force changeDetection
  private _forceCD = 0;
  @Input()
  set forceCD(forceCD: number) {
    this._forceCD = forceCD;

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


  private _currentEvent!: IEvent;
  @Input()
  set currentEvent(event: IEvent) {
    this._currentEvent = event;
    this.currentEventDay = event && event.time_utc ? moment.utc(event.time_utc).utcOffset(this.timezone).startOf('day') : null;
    this.currentEventDate = event && event.time_utc ? moment.utc(event.time_utc).utcOffset(this.timezone) : null;
  }
  get currentEvent(): IEvent {
    return this._currentEvent;
  }


  private _interactiveProcessingEvents: EventBatchMap[] = [];
  @Input()
  public set interactiveProcessingEvents(v: EventBatchMap[]) {
    this.interactiveProcessingEventsIds = [];
    if (v) {
      this.interactiveProcessingEventsIds = v.map(val => {
        return val.event.event_resource_id;
      });
    }
    this._interactiveProcessingEvents = v;
  }
  public get interactiveProcessingEvents(): EventBatchMap[] {
    return this._interactiveProcessingEvents;
  }


  private _automaticProcessingEvents: IEvent[] = [];
  @Input()
  public set automaticProcessingEvents(v: IEvent[]) {

    this.automaticProcessingEventsIds = [];
    if (v) {
      this.automaticProcessingEventsIds = v.map(val => {
        return val.event_resource_id;
      });
    }
    this._automaticProcessingEvents = v;
  }
  public get automaticProcessingEvents(): IEvent[] {
    return this._automaticProcessingEvents;
  }


  @Input() currentEventInfo!: IEvent;
  @Input() timezone!: string;
  @Input() magnitudeMax!: number;
  @Input() magnitudeMin!: number;

  @Output() dayChanged: EventEmitter<EventsDailySummaryForCatalog> = new EventEmitter<EventsDailySummaryForCatalog>();
  @Output() eventClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();
  @Output() chartClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();
  // context menu
  @Output() contextMenuEventDuplicationClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();
  @Output() contextMenuAutomaticProcessingClick: EventEmitter<IEvent> = new EventEmitter<IEvent>();


  interactiveProcessingEventsIds: string[] = [];
  automaticProcessingEventsIds: string[] = [];

  daysMap: any = {};
  openedDay: moment.Moment | null = null;
  currentEventDayInList = false;
  currentEventDay: moment.Moment | null = null;
  currentEventDate: moment.Moment | null = null;
  reopenDay = false;
  scrolledToEvent = false;

  trackDay(index: number, item: EventsDailySummary) {
    return item && item.date ? item.date : null;
  }

  trackEvent(index: number, item: IEvent) {
    return item && item.event_resource_id ? item.event_resource_id : null;
  }

  async onEventClick($event: IEvent) {
    this.eventClick.emit($event);
  }

  async onChartClick($event: IEvent) {
    this.chartClick.emit($event);
  }

  async onContextMenuEventDuplicationClick($event: IEvent) {
    this.contextMenuEventDuplicationClick.emit($event);
  }

  async onContextMenuAutomaticProcessingClick($event: IEvent) {
    this.contextMenuAutomaticProcessingClick.emit($event);
  }



  onDayChanged(ev: EventsDailySummaryForCatalog) {
    if (ev) {
      this.dayChanged.emit(ev);
    }
  }
}
