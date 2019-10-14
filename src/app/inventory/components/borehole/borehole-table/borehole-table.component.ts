import { Component } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@core/classes/table.class';
import { Sensor } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-borehole-table',
  templateUrl: './borehole-table.component.html',
  styleUrls: ['./borehole-table.component.scss'],
})
export class BoreholeTableComponent extends Table<Sensor> {

  displayedColumns: string[] = ['name', 'length', 'azimuth', 'dip', 'toe', 'trace', 'actions'];
  deleteDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute
  ) {
    super(_matDialog);
  }
}
