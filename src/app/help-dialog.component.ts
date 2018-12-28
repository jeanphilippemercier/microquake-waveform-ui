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
        this.dialog.closeAll();
        const dialogRef = this.dialog.open(HelpDialogSheetComponent, {
          width: '600px',
          hasBackdrop: false,
          position: {
            'bottom': '0',
            'right': '0'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          console.log(`Dialog closed: ${result}`);
        });
    }

}

@Component({
  selector: 'app-help-dialog-dialog',
  templateUrl: './help-dialog.component-dialog.html',
})
export class HelpDialogSheetComponent {

  constructor(
    public dialogRef: MatDialogRef<HelpDialogSheetComponent>
    ) {}

}

