import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';

import { EventSitePickerDialogComponent } from '@app/events/dialogs/event-site-picker-dialog/event-site-picker-dialog.component';
import { EventSitePickerDialogData } from '@interfaces/dialogs.interface';
import { WaveformService } from '@services/waveform.service';

@Component({
  selector: 'app-event-site-picker',
  templateUrl: './event-site-picker.component.html',
  styleUrls: ['./event-site-picker.component.scss']
})

export class EventSitePickerComponent {

  constructor(
    public waveformService: WaveformService,
    private _matDialog: MatDialog
  ) { }

  openDialog() {

    const dialogRef = this._matDialog.open<EventSitePickerDialogComponent, EventSitePickerDialogData>(EventSitePickerDialogComponent, {
      hasBackdrop: true,
      width: '450px',
      data: {
        sites: this.waveformService.sites,
        networks: this.waveformService.networks,
        currentSite: this.waveformService.currentSite,
        currentNetwork: this.waveformService.currentNetwork,
      }
    });
  }
}
