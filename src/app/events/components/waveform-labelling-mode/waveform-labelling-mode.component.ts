import { Component, OnInit, OnDestroy, Input, ChangeDetectionStrategy, ChangeDetectorRef, HostBinding } from '@angular/core';
import { FormControl } from '@angular/forms';
import WaveformUtil from '@core/utils/waveform-util';
import { EventTraceLabelUpdateContext, EventTraceLabelUpdateInput } from '@interfaces/event-dto.interface';
import { EventType, IEvent, EventTraceLabelMap, WaveformSensor } from '@interfaces/event.interface';
import { Sensor, TraceLabel } from '@interfaces/inventory.interface';
import { WaveformService } from '@services/waveform.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-waveform-labelling-mode',
  templateUrl: './waveform-labelling-mode.component.html',
  styleUrls: ['./waveform-labelling-mode.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class WaveformLabellingModeComponent implements OnInit, OnDestroy {
  @HostBinding('class.isActive') public isLabellingModeActive = false;

  private _unsubscribe = new Subject<void>();
  waveformSensors: WaveformSensor[] = [];
  selectedWaveformSensors: WaveformSensor[] = [];
  traceLabels: TraceLabel[] = [];
  eventTraceLabelsMap: EventTraceLabelMap = {};

  paginationForm = new FormControl();
  paginationPages: number[] = [];
  pageSize = 0;
  currentPage = 0;
  contextId = 0;
  contextSensor: Sensor | null = null;
  selectedContextSensor = false;
  event: IEvent | null = null;

  keyboardShortcutsFn = (e: any) => {
    const target = e.target || e.srcElement;
    if (!/INPUT|TEXTAREA|SELECT/.test(target.nodeName)) {

      if (e.keyCode === 88) {  // x
        this.selectAllVisibleTraces();
      }

      if (e.keyCode === 90) {
        this.onSaveClick();
      }

      if (e.keyCode === 49) {
        this.toggleLabel(this.traceLabels[0]);
      } else if (e.keyCode === 50) {
        this.toggleLabel(this.traceLabels[1]);
      } else if (e.keyCode === 51) {
        this.toggleLabel(this.traceLabels[2]);
      } else if (e.keyCode === 52) {
        this.toggleLabel(this.traceLabels[3]);
      } else if (e.keyCode === 53) {
        this.toggleLabel(this.traceLabels[4]);
      } else if (e.keyCode === 54) {
        this.toggleLabel(this.traceLabels[5]);
      } else if (e.keyCode === 55) {
        this.toggleLabel(this.traceLabels[6]);
      } else if (e.keyCode === 56) {
        this.toggleLabel(this.traceLabels[7]);
      } else if (e.keyCode === 57) {
        this.toggleLabel(this.traceLabels[8]);
      }
    }
  }

  constructor(
    public waveformService: WaveformService,
    private _cdr: ChangeDetectorRef,
  ) { }

  async ngOnInit() {

    this.waveformService.labellingModeIsActive.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(val => {
      this.isLabellingModeActive = val;
      if (this.isLabellingModeActive) {
        this.selectedWaveformSensors = [];
        this.selectedContextSensor = false;
        this.traceLabels = this.waveformService.traceLabels;
        document.addEventListener('keydown', this.keyboardShortcutsFn);
      } else {
        document.removeEventListener('keydown', this.keyboardShortcutsFn);
      }

      this._cdr.detectChanges();
    });

    this.waveformService.currentEvent.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(val => {
      if (this.event !== null && this.event.event_resource_id === val?.event_resource_id) {
        return;
      }
      this.event = val;
      this.eventTraceLabelsMap = WaveformUtil.createEventTraceLabelsMap(this.event?.trace_labels ?? []);
      this._cdr.detectChanges();
    });

    this.waveformService.allWaveformSensors.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(val => {
      this.waveformSensors = val;
      this._cdr.detectChanges();
    });

    this.waveformService.contextSensors.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(val => {
      this.contextSensor = val?.length > 0 && val[0] ? val[0] : null;
      this._cdr.detectChanges();
    });

    this.waveformService.pageSize.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(val => {
      this.pageSize = val;
      this._cdr.detectChanges();
    });

    this.waveformService.currentPage.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(val => {
      this.currentPage = val;
      this._cdr.detectChanges();
    });

    this.waveformService.maxPages.pipe(
      takeUntil(this._unsubscribe)
    ).subscribe(val => {
      this.paginationPages = [];
      for (let i = 0; i < val; i++) {
        this.paginationPages.push(i + 1);
      }
      this._cdr.detectChanges();
    });


  }


  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    // document.removeEventListener('keydown', this.keyboardShortcutsFn);
  }

  onCancelClick() {
    this.waveformService.labellingModeIsActive.next(false);
  }

  onSaveClick() {
    const original = WaveformUtil.createEventTraceLabelsMap(this.event?.trace_labels ?? []);

    if (JSON.stringify(original) === JSON.stringify(this.eventTraceLabelsMap)) {
      this.waveformService.labellingModeIsActive.next(false);
    } else {
      const updateInput = this.buildEventTraceLabelUpdateInput(this.eventTraceLabelsMap);
      this.waveformService.labelTracesRequest.next(updateInput);
    }
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

  onChangeToCustomPage(pageNumber: number) {
    this.waveformService.pageChanged.next(pageNumber);
  }

  isWaveformTraceSelected(index: number): boolean {
    index = (index + (this.currentPage - 1) * this.pageSize) - (this.currentPage - 1);
    const sensor = this.waveformSensors[index];
    if (!sensor) {
      return false;
    }

    const selectedSensorIndex = this.selectedWaveformSensors.findIndex((val => val.id === sensor.id));
    return selectedSensorIndex > -1;
  }

  isLabelSelected(label: TraceLabel): number {
    if (this.event?.trace_labels === null) {
      return -1;
    }
    let someSelected = false;
    let someNotSelected = false;
    let rtnVal = -1;

    this.selectedWaveformSensors.forEach(el => {
      const traceLabels = this.eventTraceLabelsMap[el.code];
      if ((traceLabels?.findIndex(val => val.id === label.id) ?? -1) > -1) {
        someSelected = true;
      } else {
        someNotSelected = true;
      }
    });

    if (this.selectedContextSensor) {
      if ((this.selectedContextSensor && this.eventTraceLabelsMap['context']?.findIndex(val => val.id === label.id) > -1)) {
        someSelected = true;
      } else {
        someNotSelected = true;
      }

    }

    if (someSelected && !someNotSelected) {
      rtnVal = 1;
    } else if (someSelected && someNotSelected) {
      rtnVal = 0;
    }

    return rtnVal;
  }

  toggleWaveformTrace(index: number): void {
    index = (index + (this.currentPage - 1) * this.pageSize) - (this.currentPage - 1);
    const sensor = this.waveformSensors[index];
    if (!sensor) {
      return;
    }

    const selectedSensorIndex = this.selectedWaveformSensors.findIndex((val => val.id === sensor.id));

    if (selectedSensorIndex > -1) {
      this.selectedWaveformSensors.splice(selectedSensorIndex, 1);
    } else {
      this.selectedWaveformSensors.push(sensor);
    }
    this._cdr.detectChanges();
  }

  toggleContextTrace(): void {
    this.selectedContextSensor = !this.selectedContextSensor;
  }

  toggleSelectAllTraces() {
    if (this.selectedWaveformSensors?.length === 0) {
      this.selectedWaveformSensors = this.waveformSensors.slice();
      this.selectedContextSensor = true;
    } else {
      this.selectedWaveformSensors = [];
      this.selectedContextSensor = false;
    }

    this._cdr.detectChanges();
  }

  selectAllVisibleTraces() {
    for (let index = 0; index < this.pageSize - 1; index++) {
      const sensorIndex = (index + (this.currentPage - 1) * this.pageSize) - (this.currentPage - 1);
      const element = this.waveformSensors[sensorIndex];
      if (this.selectedWaveformSensors.findIndex(val => val.id === element.id) === -1) {
        this.selectedWaveformSensors.push(element);
      }
    }
    this._cdr.detectChanges();
  }

  deselectAllTraces() {
    this.selectedWaveformSensors = [];
    this._cdr.detectChanges();
  }

  removeAllLabels() {
    this.eventTraceLabelsMap = {};
    this._cdr.detectChanges();
  }

  toggleLabel(label: TraceLabel): void {
    if (this.event == null) {
      return;
    }
    let someSelected = false;
    let someNotSelected = false;

    const labels = this.eventTraceLabelsMap;
    this.selectedWaveformSensors.forEach(el => {
      if (labels[el.code]?.findIndex(val => val.id === label.id) > -1) {
        someSelected = true;
      } else {
        someNotSelected = true;
      }
    });

    if (this.selectedContextSensor) {
      if ((labels['context'] as TraceLabel[])?.findIndex(val => val.id === label.id) > -1) {
        someSelected = true;
      } else {
        someNotSelected = true;
      }
    }

    this.selectedWaveformSensors.forEach(el => {
      if (!labels[el.code]) {
        labels[el.code] = [];
      }

      if (someSelected && !someNotSelected) {
        labels[el.code] = labels[el.code].filter(val => val.id !== label.id);

      } else if (!someSelected && someNotSelected) {
        labels[el.code].push(label);

      } else {
        if (labels[el.code]?.findIndex(val => val.id === label.id) === -1) {
          labels[el.code].push(label);
        }
      }

    });


    if (this.selectedContextSensor) {
      if (!labels['context']) {
        labels['context'] = [];
      }
      if (someSelected && !someNotSelected) {
        labels['context'] = labels['context'].filter(val => val.id !== label.id);
      } else if (!someSelected && someNotSelected) {
        labels['context'].push(label);

      } else {
        if (labels['context']?.findIndex(val => val.id === label.id) === -1) {
          labels['context'].push(label);
        }
      }
    }

    this._cdr.detectChanges();
  }

  buildEventTraceLabelUpdateInput(eventTraceLabelsMap: EventTraceLabelMap): EventTraceLabelUpdateInput {
    const data: EventTraceLabelUpdateContext[] = [];
    const keys = Object.keys(eventTraceLabelsMap);

    keys.forEach(key => {
      const labels = eventTraceLabelsMap[key];

      labels?.forEach(el => {
        const traceLabel: EventTraceLabelUpdateContext = {
          sensor: key !== 'context' ? {
            code: key,
          } : null,
          label: {
            id: el.id
          }
        };
        data.push(traceLabel);
      });
    });

    const eventTraceLabelUpdateInput: EventTraceLabelUpdateInput = {
      trace_labels: data,
    };
    return eventTraceLabelUpdateInput;
  }

  areLabelsEmpty(): boolean {
    return Object.keys(this.eventTraceLabelsMap).length === 0;
  }
}
