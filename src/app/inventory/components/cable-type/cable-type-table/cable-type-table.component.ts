import { Component } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';

import { Table } from '@core/classes/table.class';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { EventType } from '@interfaces/event.interface';
import { CableType } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-cable-type-table',
  templateUrl: './cable-type-table.component.html',
  styleUrls: ['./cable-type-table.component.scss'],
})
export class CableTypeTableComponent  extends Table<CableType> {

  displayedColumns: string[] = ['code', 'manufacturer', 'part_number', 'r', 'l', 'g', 'c', 'actions'];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    private _router: Router
  ) {
    super(_matDialog);
  }

  generateCopyUrl(id: number) {
    const url = window.location.origin + this._router.createUrlTree(['inventory/cable-types', id]);
    return url;
  }

  onModelEdited($event: EventType, oldEvent: EventType) {
    Object.assign(oldEvent, $event);
  }

  editButtonClick(cableTypeId: number) {
    this._router.navigate(['inventory/cable-types', cableTypeId], { preserveQueryParams: true });
  }

  rowClicked($event: CableType) {
    this.rowClick.emit($event);
  }
}
