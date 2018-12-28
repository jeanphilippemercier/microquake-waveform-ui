import { Component, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.css']
})
export class HelpDialogComponent {

    animal: string;
    name: string;

    constructor(public dialog: MatDialog) {}

    openDialog(): void {
        const dialogRef = this.dialog.open(HelpDialogComponentDialog, {
          width: '600px',
          data: {name: this.name, animal: this.animal}
        });
        dialogRef.afterClosed().subscribe(result => {
          console.log(`Dialog closed: ${result}`);
          this.animal = result;
        });
    }

}

@Component({
  selector: 'app-help-dialog-dialog',
  templateUrl: './help-dialog.component-dialog.html',
})
export class HelpDialogComponentDialog {

  constructor(
    public dialogRef: MatDialogRef<HelpDialogComponentDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}

