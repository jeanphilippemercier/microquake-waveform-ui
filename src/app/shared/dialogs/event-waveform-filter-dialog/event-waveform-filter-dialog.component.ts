import { Component, Inject, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as moment from 'moment';
import { EventWaveformFilterDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-event-waveform-filter-dialog',
  templateUrl: './event-waveform-filter-dialog.component.html',
  styleUrls: ['./event-waveform-filter-dialog.component.scss']
})
export class EventWaveformFilterDialogComponent {

  loading = true;
  data: EventWaveformFilterDialogData = {
    lowFreqCorner: 0,
    highFreqCorner: 0,
    numPoles: 0,
    maxFreq: 0
  };
  applyFilter: EventEmitter<EventWaveformFilterDialogData> = new EventEmitter();

  constructor(
    @Inject(MAT_DIALOG_DATA) private _dialogData: EventWaveformFilterDialogData,
    private _matDialogRef: MatDialogRef<EventWaveformFilterDialogComponent, EventWaveformFilterDialogData>
  ) {
    this.data = this._dialogData;
  }

  onApplyFilter() {
    this.applyFilter.emit(this.data);
  }

}
