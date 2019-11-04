import { Component } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';

import { Table } from '@core/classes/table.class';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ISensorType } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-sensor-type-table',
  templateUrl: './sensor-type-table.component.html',
  styleUrls: ['./sensor-type-table.component.scss'],
})
export class SensorTypeTableComponent extends Table<ISensorType> {

  displayedColumns: string[] = ['model', 'manufacturer', 'sensorType', 'motionType', 'resonanceFrequency', 'shuntResistance', 'actions'];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    private _router: Router
  ) {
    super(_matDialog);
  }

  generateCopyUrl(id: number) {
    const url = window.location.origin + this._router.createUrlTree(['inventory/sensor-types', id]);
    return url;
  }

  onModelEdited($event: ISensorType, oldEvent: ISensorType) {
    Object.assign(oldEvent, $event);
  }

  editButtonClick(sensorTypeId: number) {
    this._router.navigate(['inventory/sensor-types', sensorTypeId], { preserveQueryParams: true });
  }

  rowClicked($event: ISensorType) {
    this.rowClick.emit($event);
  }
}
