import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PageMode } from '@interfaces/core.interface';
import { MaintenanceFormDialogData } from '@interfaces/dialogs.interface';
import { MaintenanceEvent } from '@interfaces/maintenance.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maintenance-form-dialog',
  templateUrl: './maintenance-form-dialog.component.html',
  styleUrls: ['./maintenance-form-dialog.component.scss']
})
export class MaintenanceFormDialogComponent {
  PageMode = PageMode;
  model: MaintenanceEvent;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: MaintenanceFormDialogData,
    private _matDialogRef: MatDialogRef<MaintenanceFormDialogComponent, boolean>,
    private _router: Router
  ) {
  }

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
