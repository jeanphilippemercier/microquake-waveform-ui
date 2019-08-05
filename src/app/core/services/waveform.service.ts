import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MatDialogRef, MatDialog } from '@angular/material';
import { first } from 'rxjs/operators';

import { EventHelpDialogComponent } from '@app/shared/dialogs/event-help-dialog/event-help-dialog.component';
import { globals } from '@src/globals';

@Injectable({
  providedIn: 'root'
})
export class WaveformService implements OnInit {

  commonTimeScale: BehaviorSubject<boolean> = new BehaviorSubject(true);
  commonAmplitudeScale: BehaviorSubject<boolean> = new BehaviorSubject(false);
  zoomAll: BehaviorSubject<boolean> = new BehaviorSubject(false);
  displayComposite: BehaviorSubject<boolean> = new BehaviorSubject(true);
  sortTracesHidden: BehaviorSubject<boolean> = new BehaviorSubject(false);
  sortTraces: BehaviorSubject<boolean> = new BehaviorSubject(false);
  predictedPicks: BehaviorSubject<boolean> = new BehaviorSubject(true);
  predictedPicksBias: BehaviorSubject<boolean> = new BehaviorSubject(true);
  pickingMode: BehaviorSubject<any> = new BehaviorSubject('none'); // TODO: add interface
  loadedAll: BehaviorSubject<boolean> = new BehaviorSubject(false);

  undoLastZoomOrPanClicked: Subject<void> = new Subject;
  undoLastZoomOrPanClickedObs: Observable<void> = this.undoLastZoomOrPanClicked.asObservable();
  resetAllChartsViewClicked: Subject<void> = new Subject;
  resetAllChartsViewClickedObs: Observable<void> = this.resetAllChartsViewClicked.asObservable();
  undoLastPickingClicked: Subject<void> = new Subject;
  undoLastPickingClickedObs: Observable<void> = this.undoLastPickingClicked.asObservable();
  interactiveProcessClicked: Subject<void> = new Subject;
  interactiveProcessClickedObs: Observable<void> = this.interactiveProcessClicked.asObservable();

  // FILTER
  lowFreqCorner: BehaviorSubject<number> = new BehaviorSubject(globals.lowFreqCorner);
  highFreqCorner: BehaviorSubject<number> = new BehaviorSubject(globals.highFreqCorner);
  numPoles: BehaviorSubject<number> = new BehaviorSubject(globals.numPoles);
  applyFilterClicked: Subject<void> = new Subject;
  applyFilterClickedObs: Observable<void> = this.applyFilterClicked.asObservable();

  // PAGINATION
  pageChanged: Subject<number> = new Subject;
  pageChangedObs: Observable<number> = this.pageChanged.asObservable();

  helpDialogRef: MatDialogRef<EventHelpDialogComponent>;
  helpDialogOpened = false;

  site: BehaviorSubject<string> = new BehaviorSubject('');
  network: BehaviorSubject<string> = new BehaviorSubject('');

  allSensors: BehaviorSubject<any[]> = new BehaviorSubject([]);

  options: any = {};
  sidebarOpened: BehaviorSubject<boolean> = new BehaviorSubject(true);

  constructor(
    private _matDialog: MatDialog
  ) { }

  ngOnInit() {
    this._loadPersistantData();
  }

  private _loadPersistantData() {
    this.options = JSON.parse(window.localStorage.getItem('viewer-options')) || {};
    this.numPoles.next(this.options.numPoles ? this.options.numPoles : globals.numPoles);
    this.lowFreqCorner.next(this.options.lowFreqCorner ? this.options.lowFreqCorner : globals.lowFreqCorner);
    this.highFreqCorner.next(this.options.highFreqCorner ? this.options.highFreqCorner : globals.highFreqCorner);
    this.site.next(this.options.site ? this.options.site : '');
    this.network.next(this.options.network ? this.options.network : '');
  }

  saveOption(option: string, value: any) {
    this.options[option] = value;
    window.localStorage.setItem('viewer-options', JSON.stringify(this.options));
  }

  async openHelpDialog() {
    if (this.helpDialogOpened || this.helpDialogRef) {
      return;
    }

    this.helpDialogOpened = true;
    this.helpDialogRef = this._matDialog.open(EventHelpDialogComponent);
    this.helpDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.helpDialogRef;
      this.helpDialogOpened = false;
    });
  }

}
