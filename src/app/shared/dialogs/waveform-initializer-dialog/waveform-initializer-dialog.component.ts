import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
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
  overalLoadStatus: DataLoadStatus = DataLoadStatus.UNKNOWN;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _dialogData: { waveformService: WaveformService },
  ) {
    this.waveformService = this._dialogData.waveformService;
    this.watchAllDataLoad();
  }

  watchAllDataLoad() {
    combineLatest([
      this.waveformService.sitesLoadStatus,
      this.waveformService.networksLoadStatus,
      this.waveformService.eventTypesLoadStatus,
      this.waveformService.allSensorsOrigLoadStatus,
      this.waveformService.allStationsLoadStatus
    ]).subscribe(val => {

      if (val.indexOf(DataLoadStatus.ERROR) > -1) {
        this.overalLoadStatus = DataLoadStatus.ERROR;
      } else if (val.every(v => v === val[0])) {
        this.overalLoadStatus = DataLoadStatus.LOADED;
      } else {
        this.overalLoadStatus = DataLoadStatus.LOADING;
      }
    });
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
