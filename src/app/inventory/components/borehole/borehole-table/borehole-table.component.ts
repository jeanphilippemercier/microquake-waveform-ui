import { Component, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@core/classes/table.class';
import { Sensor, Borehole } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-borehole-table',
  templateUrl: './borehole-table.component.html',
  styleUrls: ['./borehole-table.component.scss'],
})
export class BoreholeTableComponent extends Table<Borehole> {

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
