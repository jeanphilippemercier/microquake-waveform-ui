import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { MatTabChangeEvent } from '@angular/material/tabs';

import { DetailPage } from '@core/classes/detail-page.class';
import { PageMode } from '@interfaces/core.interface';
import { Borehole, Sensor } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, BoreholeSurveyFileDialogData, BoreholeInterpolationDialogData, SensorFormDialogData } from '@interfaces/dialogs.interface';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { BoreholeSurveyFileDialogComponent } from '@app/inventory/dialogs/borehole-survey-file-dialog/borehole-survey-file-dialog.component';
import { BoreholeInterpolationDialogComponent } from '@app/inventory/dialogs/borehole-interpolation-dialog/borehole-interpolation-dialog.component';
import { SensorsQueryOrdering, SensorsQuery } from '@interfaces/inventory-query.interface';
import { SensorFormDialogComponent } from '@app/inventory/dialogs/sensor-form-dialog/sensor-form-dialog.component';

@Component({
  selector: 'app-inventory-borehole-detail-page',
  templateUrl: './inventory-borehole-detail-page.component.html',
  styleUrls: ['./inventory-borehole-detail-page.component.scss']
})

export class InventoryBoreholeDetailPageComponent extends DetailPage<Borehole> {

  PageMode = PageMode;
  basePageUrlArr = ['/inventory/boreholes'];

  files!: NgxFileDropEntry[];
  traceDisplayedColumns: string[] = ['d', 'x', 'y', 'z'];

  /*
   * SENSORS
   */
  sensorsDataSource!: Sensor[];
  sensorsCount = 0;
  sensorsCursorPrevious!: string | null;
  sensorsCursorNext!: string | null;
  sensorsOrdring: SensorsQueryOrdering = SensorsQueryOrdering.station_location_codeASC;
  sensorsInitialized = false;

  submited = false;
  selectedTabIndex = 0;

  mapTabs = [
    '',
    'sensors',
    'files',
    'trace'
  ];

  constructor(
    protected _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_activatedRoute, _router, _matDialog, _ngxSpinnerService);
  }

  handleTabInit(idx: number) {
    if ([0, 2, 3].indexOf(idx) > -1) {
      if (!this.detailInitialized.getValue()) {
        this._initDetail();
      }
    } else if (idx === 1) {
      if (!this.sensorsInitialized) {
        this._initSensors();
      }
    }
  }

  private async _initDetail() {
    this.loadingStart();
    forkJoin([
      this._inventoryApiService.getBorehole(this.id)
    ]).subscribe(
      result => {
        this.model = result[0];
        this.detailInitialized.next(true);
      }, err => {
        console.error(err);
      }).add(() => this.loadingStop());
  }

  openDetail($event: Borehole) {
    this._router.navigate(['/inventory/boreholes', $event.id]);
  }

  delete(boreholeId: number) {
    if (!boreholeId) {
      console.error(`No boreholeId`);
      this._toastrNotificationService.error('No borehole is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
      hasBackdrop: true,
      width: '350px',
      data: {
        header: `Are you sure?`,
        text: `Do you want to proceed and delete this borehole?`
      }
    });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          await this._inventoryApiService.deleteBorehole(boreholeId).toPromise();
          this._toastrNotificationService.success('Borehole deleted');
        } catch (err) {
          this._toastrNotificationService.error(err);
          console.error(err);
        }
      }
    });
  }

  uploadSurveyFile() {
    if (!this.model) {
      this._toastrNotificationService.error('Borehole model is not loaded');
      return;
    }

    const surveyFileDialogRef = this._matDialog.open<BoreholeSurveyFileDialogComponent, BoreholeSurveyFileDialogData>(
      BoreholeSurveyFileDialogComponent, {
      hasBackdrop: true,
      disableClose: true,
      data: {
        id: this.model.id,
        colar_x: this.model.collar_x,
        colar_y: this.model.collar_y,
        colar_z: this.model.collar_z,
      }
    });

    surveyFileDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          this.loadingStart();
          this.model = await this._inventoryApiService.getBorehole(this.id).toPromise();
          this.selectedTabIndex = 1;
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          this.loadingStop();
        }
      }
    });
  }


  interpolateBorehole() {
    if (!this.model) {
      this._toastrNotificationService.error('Borehole model is not loaded');
      return;
    }

    const boreholeInterpolationDialogRef = this._matDialog.open<BoreholeInterpolationDialogComponent, BoreholeInterpolationDialogData>(
      BoreholeInterpolationDialogComponent, {
      hasBackdrop: true,
      disableClose: true,
      // width: '350px',
      data: {
        id: this.model.id
      }
    });

    boreholeInterpolationDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {

      }
    });
  }


  /*
   * SENSORS
   */
  private async _initSensors() {
    await this.getSensors();
    this.sensorsInitialized = true;
  }

  async getSensors(cursor?: string) {
    try {
      this.loading = true;
      this.loadingStart();

      const query: SensorsQuery = {
        cursor,
        page_size: 15,
        borehole: this.id
      };

      if (this.sensorsOrdring) {
        query.ordering = this.sensorsOrdring;
      }

      const response = await this._inventoryApiService.getSensors(query).toPromise();

      this.sensorsDataSource = response.results;
      this.sensorsCount = response.count;
      this.sensorsCursorPrevious = response.cursor_previous;
      this.sensorsCursorNext = response.cursor_next;
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this.loadingStop();
    }
  }

  onSensorsSort($event: Sort) {
    if ($event.active === 'sensor') {
      if ($event.direction === 'asc') {
        this.sensorsOrdring = SensorsQueryOrdering.station_location_codeASC;
      } else {
        this.sensorsOrdring = SensorsQueryOrdering.station_location_codeDESC;
      }
    }
    this.getSensors();
  }

  async openFormDialog($event: Sensor) {
    const formDialogRef = this._matDialog.open<SensorFormDialogComponent, SensorFormDialogData>(
      SensorFormDialogComponent, {
      hasBackdrop: true,
      autoFocus: false,
      data: {
        mode: PageMode.EDIT,
        model: $event
      }
    });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.getSensors();
      }
    });
  }
}
