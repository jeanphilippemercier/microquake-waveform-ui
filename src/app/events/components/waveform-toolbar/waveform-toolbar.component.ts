import { Component, OnInit } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { MatDialogRef, PageEvent } from '@angular/material';

import { EventHelpDialogComponent } from '@app/shared/dialogs/event-help-dialog/event-help-dialog.component';
import { globals } from '@src/globals';
import { WaveformService } from '@services/waveform.service';


@Component({
  selector: 'app-waveform-toolbar',
  templateUrl: './waveform-toolbar.component.html',
  styleUrls: ['./waveform-toolbar.component.scss']
})

export class WaveformToolbarComponent implements OnInit {

  // FILTER
  lowFreqCorner: number;
  highFreqCorner: number;
  numPoles: number;

  pickingMode: any = 'none'; // TODO: interface

  maxFreq = globals.highFreqCorner;
  rateControl = new FormControl('rateControl', [Validators.max(this.maxFreq)]);
  minRateControl = new FormControl('minRateControl', [Validators.min(0)]);

  helpDialogRef: MatDialogRef<EventHelpDialogComponent>;
  helpDialogOpened = false;

  pageSize = 6;

  constructor(
    public waveformService: WaveformService
  ) { }

  async ngOnInit() {
    this.lowFreqCorner = this.waveformService.lowFreqCorner.getValue();
    this.highFreqCorner = this.waveformService.highFreqCorner.getValue();
    this.numPoles = this.waveformService.numPoles.getValue();
  }

  onCommonTimeScaleClick() {
    this.waveformService.commonTimeScale.next(!this.waveformService.commonTimeScale.getValue());
  }

  onCommonAmplitudeScaleClick() {
    this.waveformService.commonAmplitudeScale.next(!this.waveformService.commonAmplitudeScale.getValue());
  }

  onZoomAllClick() {
    this.waveformService.zoomAll.next(!this.waveformService.zoomAll.getValue());
  }

  onBackClick() {
    this.waveformService.undoLastZoomOrPanClicked.next();
  }

  onResetAllChartsViewClick() {
    this.waveformService.resetAllChartsViewClicked.next();
  }

  onDisplayCompositeClick() {
    this.waveformService.displayComposite.next(!this.waveformService.displayComposite.getValue());
  }

  onSortTracesClick() {
    this.waveformService.sortTraces.next(!this.waveformService.sortTraces.getValue());
  }

  onPredictedPicksClick() {
    this.waveformService.predictedPicks.next(!this.waveformService.predictedPicks.getValue());
  }

  onPredictedPicksBiasClick() {
    this.waveformService.predictedPicksBias.next(!this.waveformService.predictedPicksBias.getValue());
  }

  onApplyFilter() {
    this.waveformService.numPoles.next(this.numPoles);
    this.waveformService.lowFreqCorner.next(this.lowFreqCorner);
    this.waveformService.highFreqCorner.next(this.highFreqCorner);
    this.waveformService.applyFilterClicked.next();
  }

  onUndoLastPickingClick() {
    this.waveformService.undoLastPickingClicked.next();
  }

  onInteractiveProcessClick() {
    this.waveformService.interactiveProcessClicked.next();
  }

  // TODO: add interface
  onPickingModeChange($event: any) {
    this.waveformService.pickingMode.next($event);
  }

  onEventSidebarCollapseClick() {
    this.waveformService.sidebarOpened.next(!this.waveformService.sidebarOpened.getValue());
  }

  onHelpDialogClick() {
    this.waveformService.openHelpDialog();
  }

  onPageChanged($event: PageEvent) {
    this.waveformService.pageChanged.next($event.pageIndex + 1);
  }


}
