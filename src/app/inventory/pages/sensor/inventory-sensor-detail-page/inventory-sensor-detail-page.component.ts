import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable, forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Station, Borehole } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';
import { first } from 'rxjs/operators';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { DetailPage } from '@core/classes/detail-page.class';

@Component({
  selector: 'app-inventory-sensor-detail-page',
  templateUrl: './inventory-sensor-detail-page.component.html',
  styleUrls: ['./inventory-sensor-detail-page.component.scss']
})

export class InventorySensorDetailPageComponent extends DetailPage<Sensor> implements OnInit, OnDestroy {

  params$: Subscription;
  sensorId: number;

  pageMode: PageMode = PageMode.EDIT;
  PageMode = PageMode;

  stations: Station[];
  boreholes: Borehole[];

  detailInitialized = false;

  @ViewChild('inventoryForm', { static: false }) inventoryForm: NgForm;
  submited = false;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router,
    protected _matDialog: MatDialog,
    protected _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_matDialog, _ngxSpinnerService);
  }

  async ngOnInit() {

    this.params$ = this._activatedRoute.params.subscribe(async params => {
      if (params['sensorId'] === PageMode.CREATE || params['pageMode'] === PageMode.CREATE) {
        this.pageMode = PageMode.CREATE;
      } else {
        this.pageMode = PageMode.EDIT;
        this.sensorId = params['sensorId'];
        if (!this.detailInitialized) {
          this._initDetail();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.params$) {
      this.params$.unsubscribe();
    }
  }


  private async _initDetail() {
    this.loadingTableStart();
    forkJoin([
      this._inventoryApiService.getSensor(this.sensorId),
      this._inventoryApiService.getStations({ page_size: 10000 }),
      this._inventoryApiService.getBoreholes({ page_size: 10000 }),
    ]).subscribe(
      result => {
        this.model = result[0];
        this.stations = result[1].results;
        this.boreholes = result[2].results;
        this.loadingTableStop();
      }, err => {
        console.error(err);
        this.loadingTableStop();
      });
  }

  delete(sensorId: number) {
    if (!sensorId) {
      console.error(`No sensorId`);
      this._toastrNotificationService.error('No sensor is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          header: `Are you sure?`,
          text: `Do you want to proceed and delete this sensor?`
        }
      });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          const response = await this._inventoryApiService.deleteSensor(sensorId).toPromise();
          await this._toastrNotificationService.success('Sensor deleted');
        } catch (err) {
          this._toastrNotificationService.error(err);
          console.error(err);
        }
      }
    });
  }
}
