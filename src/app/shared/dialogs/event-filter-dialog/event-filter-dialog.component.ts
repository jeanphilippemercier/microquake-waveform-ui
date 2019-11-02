import { Component, Inject, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import * as moment from 'moment';

import EventUtil from '@core/utils/event-util';
import { EventType, EvaluationMode, EvaluationStatusGroup } from '@interfaces/event.interface';
import { EventQuery } from '@interfaces/event-query.interface';
import { EventFilterDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-event-filter-dialog',
  templateUrl: './event-filter-dialog.component.html',
  styleUrls: ['./event-filter-dialog.component.scss']
})
export class EventFilterDialogComponent {
  loading = false;
  somethingEdited = false;
  onFilter: EventEmitter<EventQuery> = new EventEmitter();
  origQuery!: EventQuery;
  eventQuery: EventQuery;
  editedQuery: EventQuery;
  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatusGroup[];
  eventEvaluationModes: EvaluationMode[];
  timezone: string;
  todayEnd: Date;
  numberOfChanges = 0;
  selectedEventTypes: EventType[] | null;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _dialogData: EventFilterDialogData
  ) {
    this.timezone = this._dialogData.timezone;
    this.eventQuery = { ...this._dialogData.eventQuery };
    this.editedQuery = { ...this._dialogData.eventQuery };
    this.eventTypes = this._dialogData.eventTypes;
    this.evaluationStatuses = this._dialogData.evaluationStatuses;
    this.eventEvaluationModes = this._dialogData.eventEvaluationModes;
    this.todayEnd = moment().utc().utcOffset(this.timezone).endOf('day').toDate();
    this.numberOfChanges = EventUtil.getNumberOfChanges(this.editedQuery);
    this.selectedEventTypes = this.eventQuery.event_type ?
      this.eventQuery.event_type.map(event_type => {
        const val = this.eventTypes.find(et => et.quakeml_type === event_type);
        return val ? val : this.eventTypes[0]; // TODO: do better check!
      }) : null;
  }

  async onFilterChange() {
    this.somethingEdited = this.checkIfSomethingEdited(this.eventQuery, this.editedQuery);
    this.numberOfChanges = EventUtil.getNumberOfChanges(this.editedQuery);
  }

  onFilterClick(event: EventQuery) {
    this.onFilter.emit(event);
  }

  resetFilter() {
    this.editedQuery = { ...this.eventQuery };
    this.editedQuery.time_range = 3;
    this.editedQuery.time_utc_after = moment()
      .utcOffset(this.timezone)
      .startOf('day')
      .subtract(this.editedQuery.time_range - 1, 'days')
      .toISOString();
    this.editedQuery.time_utc_before = this.todayEnd.toISOString();
    this.editedQuery.status = [EvaluationStatusGroup.ACCEPTED];
    this.editedQuery.event_type = undefined;
    this.selectedEventTypes = null;
    this.somethingEdited = this.checkIfSomethingEdited(this.eventQuery, this.editedQuery);
    this.numberOfChanges = EventUtil.getNumberOfChanges(this.editedQuery);
  }

  onTimeRangeChange($event: MatRadioChange) {
    this.somethingEdited = this.checkIfSomethingEdited(this.eventQuery, this.editedQuery);
    this.numberOfChanges = EventUtil.getNumberOfChanges(this.editedQuery);
  }

  checkIfSomethingEdited(origQuery: EventQuery, editedQuery: EventQuery): boolean {
    return JSON.stringify(origQuery) !== JSON.stringify(editedQuery) ? true : false;
  }


  onCustomDateStartChange($event: Date) {
    this.editedQuery.time_utc_after = moment($event).utc().utcOffset(this.timezone).startOf('day').toISOString(true);
  }

  onCustomDateEndChange($event: Date) {
    this.editedQuery.time_utc_before = moment($event).utc().utcOffset(this.timezone).endOf('day').toISOString(true);
  }

  onEventTypesChange($event: EventType[]) {
    this.selectedEventTypes = $event;
    this.editedQuery.event_type = this.selectedEventTypes && this.selectedEventTypes.length > 0 ? this.selectedEventTypes.map((eventType: EventType) => eventType.quakeml_type) : undefined;

  }
}
