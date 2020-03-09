import { Component, Inject, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WaveformService } from '@services/waveform.service';
import { DataLoadStatus } from '@interfaces/core.interface';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-waveform-initializer-dialog',
  templateUrl: './waveform-initializer-dialog.component.html',
  styleUrls: ['./waveform-initializer-dialog.component.scss']
})
export class WaveformInitializerDialogComponent {
  public waveformService: WaveformService;

  displayedColumns: string[] = ['data', 'status'];
  DataLoadStatus = DataLoadStatus;

  @HostListener('window:keyup.esc') onKeyUp() { this._matDialogRef.close(); }

  constructor(
    @Inject(MAT_DIALOG_DATA) private _dialogData: { waveformService: WaveformService },
    private _matDialogRef: MatDialogRef<WaveformInitializerDialogComponent>
  ) {
    this.waveformService = this._dialogData.waveformService;
  }


  reloadData(index: number) {
    switch (index) {
      case 0:
      case 1:
        this.waveformService.reloadAllSitesAndNetworks();
        break;
      case 2:
        this.waveformService.reloadEventTypes();
        break;
      case 3:
        this.waveformService.reloadAllSensors();
        break;
      case 4:
        this.waveformService.reloadAllStations();
        break;
    }
  }
  reloadAllMissingData() {
    if (
      this.waveformService.sitesLoadStatus.getValue() === DataLoadStatus.ERROR ||
      this.waveformService.networksLoadStatus.getValue() === DataLoadStatus.ERROR
    ) {
      this.reloadData(0);
    }

    if (this.waveformService.eventTypesLoadStatus.getValue() === DataLoadStatus.ERROR) {
      this.reloadData(2);
    }

    if (this.waveformService.allSensorsOrigLoadStatus.getValue() === DataLoadStatus.ERROR) {
      this.reloadData(3);
    }

    if (this.waveformService.allStationsLoadStatus.getValue() === DataLoadStatus.ERROR) {
      this.reloadData(4);
    }
  }
}
