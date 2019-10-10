import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { EventHelpDialogComponent } from '@app/shared/dialogs/event-help-dialog/event-help-dialog.component';
import { globals } from '@src/globals';
import { WaveformService } from '@services/waveform.service';
import { Subject, combineLatest, timer } from 'rxjs';
import { takeUntil, skip, distinctUntilChanged, debounce } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatOptionSelectionChange, MatSelectChange, MatSelect } from '@angular/material';


@Component({
  selector: 'app-waveform-toolbar',
  templateUrl: './waveform-toolbar.component.html',
  styleUrls: ['./waveform-toolbar.component.scss']
})

export class WaveformToolbarComponent implements OnInit, OnDestroy {

  @ViewChild('options', { static: true }) optionsSelect: MatSelect;

  // FILTER
  lowFreqCorner: number;
  highFreqCorner: number;
  numPoles: number;

  pickingMode: any = 'none'; // TODO: interface

  maxFreq = globals.highFreqCorner;

  helpDialogRef: MatDialogRef<EventHelpDialogComponent>;
  helpDialogOpened = false;
  private _unsubscribe = new Subject<void>();
  interactiveProcessingDisabled = false;

  test = new FormControl();

  constructor(
    public waveformService: WaveformService
  ) { }

  testChange($event: MatOptionSelectionChange) {

    if (!$event.isUserInput) {
      return;
    }
    console.log(`event`);
    console.log($event);

    const value = $event.source.value;
    const selected = $event.source.selected;

    switch (value) {
      case 'commonTimeScale':
        this.waveformService.commonTimeScale.next(selected);
        break;
      case 'commonAmplitudeScale':
        this.waveformService.commonAmplitudeScale.next(selected);
        break;
      case 'zoomAll':
        this.waveformService.zoomAll.next(selected);
        break;
      case 'displayComposite':
        this.waveformService.displayComposite.next(selected);
        break;
      case 'displayRotated':
        this.waveformService.displayRotated.next(selected);
        break;
      case 'predictedPicks':
        this.waveformService.predictedPicks.next(selected);
        break;
      case 'predictedPicksBias':
        this.waveformService.predictedPicksBias.next(selected);
        break;
      default:
        break;
    }
  }

  initTest() {
    this.optionsSelect.optionSelectionChanges.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe((val: MatOptionSelectionChange) => {
      this.testChange(val);
    });


    combineLatest([
      this.waveformService.commonTimeScale,
      this.waveformService.commonAmplitudeScale,
      this.waveformService.zoomAll,
      this.waveformService.displayComposite,
      this.waveformService.displayRotated,
      this.waveformService.predictedPicks,
      this.waveformService.predictedPicksBias,
    ]).pipe(
      distinctUntilChanged(),
      takeUntil(this._unsubscribe)
    ).subscribe(([
      commonTimeScale,
      commonAmplitudeScale,
      zoomAll,
      displayComposite,
      displayRotated,
      predictedPicks,
      predictedPicksBias
    ]) => {

      let values = [];
      values.push(commonTimeScale ? 'commonTimeScale' : '');
      values.push(commonAmplitudeScale ? 'commonAmplitudeScale' : '');
      values.push(zoomAll ? 'zoomAll' : '');
      values.push(displayComposite ? 'displayComposite' : '');
      values.push(displayRotated ? 'displayRotated' : '');
      values.push(predictedPicks ? 'predictedPicks' : '');
      values.push(predictedPicksBias ? 'predictedPicksBias' : '');
      values = values.filter(val => val !== '');
      this.test.setValue(values);
    });
  }

  async ngOnInit() {
    this.initTest();


    this.lowFreqCorner = this.waveformService.lowFreqCorner.getValue();
    this.highFreqCorner = this.waveformService.highFreqCorner.getValue();
    this.numPoles = this.waveformService.numPoles.getValue();

    combineLatest([this.waveformService.interactiveProcessActiveList, this.waveformService.currentEvent]).pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(([val, currentEvent]) => {
      this.interactiveProcessingDisabled = val.some(v => {
        if (v && v.event && v.event.event_resource_id) {
          if (currentEvent && v.event.event_resource_id === currentEvent.event_resource_id) {
            return true;
          }
          return false;
        }
      });
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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

  onDisplayRotatedClick() {
    this.waveformService.displayRotated.next(!this.waveformService.displayRotated.getValue());
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

  onPageChanged(calcOp: number) {
    if (
      this.waveformService.currentPage.getValue() + calcOp <= 0 ||
      this.waveformService.currentPage.getValue() + calcOp > this.waveformService.maxPages.getValue()
    ) {
      return;
    }
    this.waveformService.pageChanged.next(this.waveformService.currentPage.getValue() + calcOp);
  }

  onPageChangedFirst() {
    this.waveformService.pageChanged.next(1);
  }

  onPageChangedLast() {
    this.waveformService.pageChanged.next(this.waveformService.maxPages.getValue());
  }



}
