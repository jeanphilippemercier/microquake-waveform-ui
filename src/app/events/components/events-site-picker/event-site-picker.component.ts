import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { EventSitePickerDialogComponent } from '@app/events/dialogs/event-site-picker-dialog/event-site-picker-dialog.component';
import { EventSitePickerDialogData } from '@interfaces/dialogs.interface';
import { WaveformService } from '@services/waveform.service';
import { HeartbeatStatus } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-event-site-picker',
  templateUrl: './event-site-picker.component.html',
  styleUrls: ['./event-site-picker.component.scss']
})

export class EventSitePickerComponent implements OnDestroy {

  HeartbeatStatus = HeartbeatStatus;
  hearbeatSub: Subscription;
  hearbeatStatus: HeartbeatStatus = HeartbeatStatus.INACTIVE;
  pulseAnimation = false;

  constructor(
    public waveformService: WaveformService,
    private _matDialog: MatDialog
  ) {

    this.hearbeatSub = this.waveformService.heartbeatStatus.subscribe(val => {
      this.hearbeatStatus = val;

      if (this.hearbeatStatus === HeartbeatStatus.ACTIVE) {
        this.pulseAnimation = true;
        setTimeout(() => {
          this.pulseAnimation = false;
        }, 4000);
      }
    });
  }

  ngOnDestroy() {
    if (this.hearbeatSub) {
      this.hearbeatSub.unsubscribe();
      delete this.hearbeatSub;
    }
  }

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
