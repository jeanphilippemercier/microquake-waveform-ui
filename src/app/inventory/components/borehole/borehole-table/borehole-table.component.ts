import { Component, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@core/classes/table.class';
import { Sensor, Borehole } from '@interfaces/inventory.interface';
import { BoreholeSurveyFileDialogComponent } from '@app/inventory/dialogs/borehole-survey-file-dialog/borehole-survey-file-dialog.component';
import { BoreholeSurveyFileDialogData, BoreholeInterpolationDialogData } from '@interfaces/dialogs.interface';
import { BoreholeInterpolationDialogComponent } from '@app/inventory/dialogs/borehole-interpolation-dialog/borehole-interpolation-dialog.component';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-borehole-table',
  templateUrl: './borehole-table.component.html',
  styleUrls: ['./borehole-table.component.scss'],
})
export class BoreholeTableComponent extends Table<Sensor> {

  @Output() interpolate: EventEmitter<Borehole> = new EventEmitter();
  @Output() surveyFile: EventEmitter<Borehole> = new EventEmitter();

  displayedColumns: string[] = ['name', 'length', 'azimuth', 'dip', 'toe', 'collar', 'survey', 'actions'];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;



  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute
  ) {
    super(_matDialog);
  }

  onInterpolate($event: Borehole) {
    this.interpolate.emit($event);
  }
  onSurveyFile($event: Borehole) {
    this.surveyFile.emit($event);
  }
}
