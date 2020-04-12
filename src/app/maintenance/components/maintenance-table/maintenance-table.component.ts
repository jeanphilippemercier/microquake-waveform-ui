import { Component, Input, Output, EventEmitter } from '@angular/core';

import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceEvent, MaintenanceStatus, MaintenanceCategory } from '@interfaces/maintenance.interface';
import { Station } from '@interfaces/inventory.interface';
import { TableWithExpandableRows } from '@core/classes/table-with-expandable-rows.class';

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
export class MaintenanceTableComponent extends TableWithExpandableRows<MaintenanceEvent> {

  @Input() stations: Station[] = [];
  @Input() maintenanceStatuses: MaintenanceStatus[] = [];
  @Input() maintenanceCategories: MaintenanceCategory[] = [];

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['detail', 'date', 'status', 'category', 'station', 'attachments', 'description', 'actions'];
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

  editButtonClick(maintenanceEventId: string) {
    this._router.navigate(['maintenance', maintenanceEventId], { preserveQueryParams: true });
  }
}
