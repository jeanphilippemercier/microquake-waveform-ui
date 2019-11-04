import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PageMode } from '@interfaces/core.interface';
import { MaintenanceEvent } from '@interfaces/maintenance.interface';
import { CableTypeFormDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-cable-type-form-dialog',
  templateUrl: './cable-type-form-dialog.component.html',
  styleUrls: ['./cable-type-form-dialog.component.scss']
})
export class CableTypeFormDialogComponent {
  PageMode = PageMode;
  model!: MaintenanceEvent;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: CableTypeFormDialogData,
    private _matDialogRef: MatDialogRef<CableTypeFormDialogComponent, boolean>,
  ) { }

  close() {
    this._matDialogRef.close();
  }

  onCancelClicked() {
    this._matDialogRef.close();
  }

  onSaveClicked() {
    this._matDialogRef.close(true);
  }
}
