import { Component, Inject, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import * as moment from 'moment';

import EventUtil from '@core/utils/event-util';
import { EventType, EvaluationMode, EvaluationStatusGroup } from '@interfaces/event.interface';
import { EventQuery } from '@interfaces/event-query.interface';
import { Site } from '@interfaces/inventory.interface';
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
  origQuery: EventQuery;
  eventQuery: EventQuery;
  editedQuery: EventQuery;
  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatusGroup[];
  eventEvaluationModes: EvaluationMode[];
  selectedSite: Site;
  timezone: string;
  todayEnd: Date;
  numberOfChanges = 0;

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

    if (this.editedQuery.time_range === 0) {
      this.editedQuery.start_time = moment(this.editedQuery.start_time).startOf('day').toISOString();
      this.editedQuery.end_time = moment(this.editedQuery.end_time).endOf('day').toISOString();
    }
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
    this.editedQuery.start_time = moment()
      .utcOffset(this.timezone)
      .startOf('day')
      .subtract(this.editedQuery.time_range - 1, 'days')
      .toISOString();
    this.editedQuery.end_time = this.todayEnd.toISOString();
    this.somethingEdited = this.checkIfSomethingEdited(this.eventQuery, this.editedQuery);
    this.numberOfChanges = EventUtil.getNumberOfChanges(this.editedQuery);
  }

  onTimeRangeChange($event: MatRadioChange) {
    if ($event.value !== 0) {
      this.editedQuery.start_time = moment().utcOffset(this.timezone).startOf('day').subtract($event.value - 1, 'days').toISOString();
      this.editedQuery.end_time = this.todayEnd.toISOString();
    } else {
      this.editedQuery.start_time = moment().utcOffset(this.timezone).startOf('day').toISOString();
      this.editedQuery.end_time = this.todayEnd.toISOString();
    }
    this.somethingEdited = this.checkIfSomethingEdited(this.eventQuery, this.editedQuery);
    this.numberOfChanges = EventUtil.getNumberOfChanges(this.editedQuery);
  }

  checkIfSomethingEdited(origQuery: EventQuery, editedQuery: EventQuery): boolean {
    return JSON.stringify(origQuery) !== JSON.stringify(editedQuery) ? true : false;
  }


  onCustomDateStartChange($event: Date) {
    this.editedQuery.start_time = moment($event).utcOffset(this.timezone).startOf('day').toISOString();
  }

  onCustomDateEndChange($event: Date) {
    this.editedQuery.end_time = moment($event).utcOffset(this.timezone).endOf('day').toISOString();
  }
}
