import { Component, Input } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { Table } from '@core/classes/table.class';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { EventType } from '@interfaces/event.interface';
import { TraceLabel } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-trace-label-table',
  templateUrl: './trace-label-table.component.html',
  styleUrls: ['./trace-label-table.component.scss'],
})
export class TraceLabelTableComponent extends Table<TraceLabel> {

  @Input()
  eventTypes!: EventType[];
  displayedColumns: string[] = ['name', 'event_type', 'priority', 'keyboard_shortcut', 'actions'];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    private _router: Router
  ) {
    super(_matDialog);
  }

  generateCopyUrl(id: number) {
    const url = window.location.origin + this._router.createUrlTree(['inventory/trace-labels', id]);
    return url;
  }

  onModelEdited($event: EventType, oldEvent: EventType) {
    Object.assign(oldEvent, $event);
  }

  editButtonClick(traceLabelId: number) {
    this._router.navigate(['inventory/trace-labels', traceLabelId], { preserveQueryParams: true });
  }

  rowClicked($event: TraceLabel) {
    this.rowClick.emit($event);
  }

  parseEventType(eventTypeId: number, eventTypes: EventType[]) {
    return eventTypes?.find(el => el.id === eventTypeId)?.microquake_type ?? '';
  }
}
