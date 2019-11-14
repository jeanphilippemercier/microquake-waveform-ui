import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { EventHelpDialogComponent } from '@app/shared/dialogs/event-help-dialog/event-help-dialog.component';
import { WaveformService } from '@services/waveform.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatOptionSelectionChange, MatSelect } from '@angular/material';
import { PickingMode, PickKey } from '@interfaces/event.interface';

@Component({
  selector: 'app-waveform-toolbar',
  templateUrl: './waveform-toolbar.component.html',
  styleUrls: ['./waveform-toolbar.component.scss']
})

export class WaveformToolbarComponent implements OnInit, OnDestroy {

  @ViewChild('options', { static: true }) optionsSelect!: MatSelect;

  PickKey = PickKey;
  helpDialogRef!: MatDialogRef<EventHelpDialogComponent>;
  helpDialogOpened = false;
  interactiveProcessingDisabled = false;
  paginationPages: number[] = [];
  optionsForm = new FormControl();
  paginationForm = new FormControl();
  private _unsubscribe = new Subject<void>();

  constructor(
    public waveformService: WaveformService
  ) { }

  async ngOnInit() {
    this._initOptions();

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

    this.waveformService.maxPages.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(val => {
      this.paginationPages = [];
      for (let i = 0; i < val; i++) {
        this.paginationPages.push(i + 1);
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _initOptions() {
    this.optionsSelect.optionSelectionChanges.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe((val: MatOptionSelectionChange) => {
      this._optionsChange(val);
    });

    combineLatest([
      this.waveformService.commonTimeScale,
      this.waveformService.commonAmplitudeScale,
      this.waveformService.zoomAll,
      this.waveformService.displayComposite,
      this.waveformService.displayRotated,
      this.waveformService.displayDistanceTime,
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
      displayDistanceTime,
      predictedPicks,
      predictedPicksBias
    ]) => {

      let values = [];
      values.push(commonTimeScale ? 'commonTimeScale' : '');
      values.push(commonAmplitudeScale ? 'commonAmplitudeScale' : '');
      values.push(zoomAll ? 'zoomAll' : '');
      values.push(displayComposite ? 'displayComposite' : '');
      values.push(displayRotated ? 'displayRotated' : '');
      values.push(displayDistanceTime ? 'displayDistanceTime' : '');
      values.push(predictedPicks ? 'predictedPicks' : '');
      values.push(predictedPicksBias ? 'predictedPicksBias' : '');
      values = values.filter(val => val !== '');
      this.optionsForm.setValue(values);
    });
  }

  private _optionsChange($event: MatOptionSelectionChange) {

    if (!$event.isUserInput) {
      return;
    }

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
      case 'displayDistanceTime':
        this.waveformService.displayDistanceTime.next(selected);
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

  onDisplayDistanceTimeClick() {
    this.waveformService.displayDistanceTime.next(!this.waveformService.displayDistanceTime.getValue());
  }

  onPredictedPicksClick() {
    this.waveformService.predictedPicks.next(!this.waveformService.predictedPicks.getValue());
  }

  onPredictedPicksBiasClick() {
    this.waveformService.predictedPicksBias.next(!this.waveformService.predictedPicksBias.getValue());
  }

  onBatchPicksClick() {
    this.waveformService.batchPicks.next(!this.waveformService.batchPicks.getValue());
  }

  onApplyFilter() {
    this.waveformService.applyFilterClicked.next();
  }

  onUndoLastPickingClick() {
    this.waveformService.undoLastPickingClicked.next();
  }

  onInteractiveProcessClick() {
    this.waveformService.interactiveProcessClicked.next();
  }

  onPickingModeChange($event: PickingMode) {

    const currentVal = this.waveformService.pickingMode.getValue();
    let nextVal = $event;

    if (currentVal === nextVal) {
      nextVal = null;
    }

    this.waveformService.pickingMode.next(nextVal);
  }

  onEventSidebarCollapseClick() {
    this.waveformService.sidebarOpened.next(!this.waveformService.sidebarOpened.getValue());
  }

  onHelpDialogClick() {
    this.waveformService.openHelpDialog();
  }

  onWaveformFilterDialogClick() {
    this.waveformService.openWaveformFilterDialog();
  }

  onAddPage(calcOp: number) {
    if (
      this.waveformService.currentPage.getValue() + calcOp <= 0 ||
      this.waveformService.currentPage.getValue() + calcOp > this.waveformService.maxPages.getValue()
    ) {
      return;
    }
    this.waveformService.pageChanged.next(this.waveformService.currentPage.getValue() + calcOp);
  }

  onChangeToFirstPage() {
    this.waveformService.pageChanged.next(1);
  }

  onChangToLastPage() {
    this.waveformService.pageChanged.next(this.waveformService.maxPages.getValue());
  }

  onChangeToCustomPage(pageNumber: number) {
    this.waveformService.pageChanged.next(pageNumber);
  }
}
