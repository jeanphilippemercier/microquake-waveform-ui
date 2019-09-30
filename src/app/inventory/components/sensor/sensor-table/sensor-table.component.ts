import { Component, Output, EventEmitter } from '@angular/core';

import { MatDialogRef, MatDialog, Sort } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@core/classes/table.class';
import { Sensor } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-sensor-table',
  templateUrl: './sensor-table.component.html',
  styleUrls: ['./sensor-table.component.scss'],
})
export class SensorTableComponent extends Table<Sensor> {

  displayedColumns: string[] = ['enabled', 'sensor', 'station', 'borehole', 'components', 'actions'];
  deleteDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute
  ) {
    super(_matDialog);
  }

  delete(id: number) {
    console.log('Delete not implemented yet');
  }
}
