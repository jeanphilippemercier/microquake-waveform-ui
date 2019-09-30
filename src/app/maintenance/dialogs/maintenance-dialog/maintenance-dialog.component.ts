import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-maintenance-dialog',
  templateUrl: './maintenance-dialog.component.html',
  styleUrls: ['./maintenance-dialog.component.scss']
})
export class MaintenanceDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private _matDialogRef: MatDialogRef<MaintenanceDialogComponent>
  ) { }

  close() {
    this._matDialogRef.close();
  }

}
