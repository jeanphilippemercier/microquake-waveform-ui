import { Component, OnInit, Input } from '@angular/core';

import { MatDialogRef, MatDialog, Sort } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@core/classes/table.class';
import { Station } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-station-table',
  templateUrl: './station-table.component.html',
  styleUrls: ['./station-table.component.scss'],
})
export class StationTableComponent extends Table<Station> {

  displayedColumns: string[] = ['code', 'name', 'sensors', 'communication', 'power', 'actions'];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute
  ) {
    super(_matDialog);
  }

}
