import { Component, Input } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceEvent, MaintenanceStatus, MaintenanceCategory } from '@interfaces/maintenance.interface';
import { Station } from '@interfaces/inventory.interface';
import { Table } from '@core/classes/table.class';

@Component({
  selector: 'app-maintenance-table-2',
  templateUrl: './maintenance-table-2.component.html',
  styleUrls: ['./maintenance-table-2.component.scss']
})
export class MaintenanceTable2Component extends Table<MaintenanceEvent> {

  @Input() stations: Station[] = [];
  @Input() maintenanceStatuses: MaintenanceStatus[] = [];
  @Input() maintenanceCategories: MaintenanceCategory[] = [];

  displayedColumns: string[] = ['date', 'status', 'category', 'station', 'attachments', 'description', 'actions'];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    private _router: Router
  ) {
    super(_matDialog);
  }

  generateCopyUrl(id: number) {
    const url = window.location.origin + this._router.createUrlTree(['maintenance', id]);
    return url;
  }

  onModelEdited($event: MaintenanceEvent, oldEvent: MaintenanceEvent) {
    Object.assign(oldEvent, $event);
  }

  editButtonClick(maintenanceEventId: number) {
    this._router.navigate(['maintenance', maintenanceEventId], { preserveQueryParams: true });
  }
}
