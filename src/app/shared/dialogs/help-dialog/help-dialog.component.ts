import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { HelpDialogSheetComponent } from '../../sheets/help-dialog-sheet.component';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss']
})
export class HelpDialogComponent {

  constructor(
    public dialog: MatDialog
  ) { }

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
