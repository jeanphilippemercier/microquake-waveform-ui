import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable, forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Station, Borehole, Network, Site } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog, MatTabChangeEvent, Sort } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';
import { first } from 'rxjs/operators';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { MaintenanceStatus, MaintenanceCategory, MaintenanceEvent } from '@interfaces/maintenance.interface';
import { MaintenanceEventQuery } from '@interfaces/maintenance-query.interface';
import { RequestOptions } from '@interfaces/query.interface';
import { SensorsQuery, SensorsQueryOrdering } from '@interfaces/inventory-query.interface';

@Component({
  selector: 'app-inventory-station-detail-page',
  templateUrl: './inventory-station-detail-page.component.html',
  styleUrls: ['./inventory-station-detail-page.component.scss']
})

export class InventoryStationDetailPageComponent implements OnInit, OnDestroy {

  params$: Subscription;
  stationId: number;
  station: Partial<Station>;
  sites: Site[];

  pageMode: PageMode = PageMode.EDIT;
  PageMode = PageMode;
  loading = false;
  maintenanceStatuses: MaintenanceStatus[] = [];
  maintenanceCategories: MaintenanceCategory[] = [];
  maintenanceEvents: MaintenanceEvent[] = [];
  maintenanceEventsCount = 0;
  maintenanceEventsCursorPrevious: string;
  maintenanceEventsCursorNext: string;
  maintenanceEventsInitialized = false;

  sensorsDataSource: Sensor[];
  sensorsCount = 0;
  sensorsCursorPrevious: string;
  sensorsCursorNext: string;
  sensorsOrdring: SensorsQueryOrdering = SensorsQueryOrdering.station_location_codeASC;
  sensorsInitialized = false;

  detailInitialized = false;


  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router,
    private _ngxSpinnerService: NgxSpinnerService,
    private _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService
  ) { }

  async ngOnInit() {

    this.params$ = this._activatedRoute.params.subscribe(async params => {
      if (params['stationId'] === PageMode.CREATE || params['pageMode'] === PageMode.CREATE) {
        this.pageMode = PageMode.CREATE;
      } else {
        this.pageMode = PageMode.EDIT;
        this.stationId = params['stationId'];
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

  delete(stationId: number) {
    if (!stationId) {
      console.error(`No stationId`);
      this._toastrNotificationService.error('No station is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          header: `Are you sure?`,
          text: `Do you want to proceed and delete this station?`
        }
      });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {

          await this.loadingStart();
          const response = await this._inventoryApiService.deleteStation(stationId).toPromise();
          await this._toastrNotificationService.success('Station deleted');
          this._router.navigate(['/inventory/stations']);
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          await this.loadingStop();
        }
      }
    });
  }

  tabChanged($event: MatTabChangeEvent) {
    const idx = $event.index;
    if (idx === 1) {
      if (!this.maintenanceEventsInitialized) {
        this._initMaintenanceLogs();
      }
    } else if (idx === 2) {
      if (!this.sensorsInitialized) {
        this._initSensors();
      }
    }
  }

  private async _initDetail() {
    this.loadingStart();
    forkJoin([
      this._inventoryApiService.getSites(),
      this._inventoryApiService.getStation(this.stationId),
    ]).subscribe(
      result => {
        this.sites = result[0];
        this.station = result[1];
        this.detailInitialized = true;
        this.loadingStop();
      }, err => {
        console.error(err);
        this.loadingStop();
      });
  }

  private async _initMaintenanceLogs() {
    this.loadingStart();
    forkJoin([
      this._inventoryApiService.getMaintenanceStatuses(),
      this._inventoryApiService.getMaintenanceCategories(),
      this.getMaintenanceEvents(),
    ]).subscribe(
      result => {
        this.maintenanceStatuses = result[0];
        this.maintenanceCategories = result[1];
        this.maintenanceEvents = result[2].results;
        this.maintenanceEventsCount = result[2].count;
        this.maintenanceEventsCursorPrevious = result[2].cursor_previous;
        this.maintenanceEventsCursorNext = result[2].cursor_next;
        this.maintenanceEventsInitialized = true;
        this.loadingStop();
      }, err => {
        console.error(err);
        this.loadingStop();
      });
  }

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
        station: this.station.id
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

  getMaintenanceEvents(cursor: string | null = null) {
    const query: MaintenanceEventQuery = {
      station_id: this.stationId,
      page_size: 15
    };

    if (cursor) {
      query.cursor = cursor;
    }

    return this._inventoryApiService.getMaintenanceEvents(query);
  }

  async changeMaintenanceEventsPage(cursor?: string) {
    try {
      await this.loadingStart();
      const response = await this.getMaintenanceEvents(cursor).toPromise();
      this.maintenanceEvents = response.results;
      this.maintenanceEventsCount = response.count;
      this.maintenanceEventsCursorPrevious = response.cursor_previous;
      this.maintenanceEventsCursorNext = response.cursor_next;
    } catch (err) {
      console.error(err);
    } finally {
      await this.loadingStop();
    }
  }

  async onDeleteMaintenanceEvents(id: number) {
    if (!id) {
      console.error(`No maintenance event id`);
      this._toastrNotificationService.error('No maintenance event id is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          header: `Are you sure?`,
          text: `Do you want to proceed and delete maintenance event (ID: ${id})?`
        }
      });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          this.loadingStart();
          const response = await this._inventoryApiService.deleteMaintenanceEvent(id).toPromise();
          this.changeMaintenanceEventsPage();
          await this._toastrNotificationService.success('Maintenance event deleted');
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          this.loadingStop();
        }
      }
    });
  }

  async loadingStart() {
    await this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingStop() {
    await this._ngxSpinnerService.hide('loading');
  }

  async onCreatedMaintenanceEvent($event: MaintenanceEvent) {

    try {
      await this.loadingStart();
      const response = await this.getMaintenanceEvents(null).toPromise();
      this.maintenanceEvents = response.results;
      this.maintenanceEventsCount = response.count;
      this.maintenanceEventsCursorPrevious = response.cursor_previous;
      this.maintenanceEventsCursorNext = response.cursor_next;
    } catch (err) {
      console.error(err);
    } finally {
      await this.loadingStop();
    }
  }

  openDetail($event: Station) {
    this._router.navigate(['/inventory/stations', $event.id]);
  }
}

