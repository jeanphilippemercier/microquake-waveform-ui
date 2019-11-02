import { Component } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';

import { Table } from '@core/classes/table.class';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { EventType } from '@interfaces/event.interface';

@Component({
  selector: 'app-microquake-event-type-table',
  templateUrl: './microquake-event-type-table.component.html',
  styleUrls: ['./microquake-event-type-table.component.scss'],
})
export class MicroquakeEventTypeTableComponent extends Table<EventType> {

  displayedColumns: string[] = ['microquake_type', 'quakeml_type', 'site', 'countable', 'actions'];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    private _router: Router
  ) {
    super(_matDialog);
  }

  generateCopyUrl(id: number) {
    const url = window.location.origin + this._router.createUrlTree(['inventory/microquake-event-types', id]);
    return url;
  }

  onModelEdited($event: EventType, oldEvent: EventType) {
    Object.assign(oldEvent, $event);
  }

  editButtonClick(microquakeEventTypeId: number) {
    this._router.navigate(['inventory/microquake-event-types', microquakeEventTypeId], { preserveQueryParams: true });
  }
}
