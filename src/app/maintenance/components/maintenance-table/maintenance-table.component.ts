import { Component, OnInit, Input } from '@angular/core';

import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatDialogRef, MatDialog, Sort } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@core/classes/table.class';
import { MaintenanceEvent, MaintenanceStatus, MaintenanceCategory } from '@interfaces/maintenance.interface';
import { Station } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-maintenance-table',
  templateUrl: './maintenance-table.component.html',
  styleUrls: ['./maintenance-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MaintenanceTableComponent extends Table<MaintenanceEvent> {

  @Input() stations: Station[];
  @Input() maintenanceStatuses: MaintenanceStatus[] = [];
  @Input() maintenanceCategories: MaintenanceCategory[] = [];

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['detail', 'date', 'status', 'category', 'station', 'attachments', 'description', 'actions'];
  deleteDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute
  ) {
    super(_matDialog);
  }
}
