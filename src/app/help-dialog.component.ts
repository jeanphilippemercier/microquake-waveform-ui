import { Component, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.css']
})
export class HelpDialogComponent {


    constructor(public dialog: MatDialog) {}

    openDialog(): void {
        if (this.dialog.openDialogs.length > 0) {
          this.dialog.closeAll();
        } else {
          const dialogRef = this.dialog.open(HelpDialogSheetComponent, {
            width: '600px',
            hasBackdrop: false,
            position: {
              'bottom': '0',
              'left': '0'
            }
          });

        }
    }

}

@Component({
  selector: 'app-help-dialog-dialog',
  templateUrl: './help-dialog-sheet.component.html',
})
export class HelpDialogSheetComponent {

  constructor(
    public dialogRef: MatDialogRef<HelpDialogSheetComponent>
  ) {}

  closeModal() {
    this.dialogRef.close();
  }

}

