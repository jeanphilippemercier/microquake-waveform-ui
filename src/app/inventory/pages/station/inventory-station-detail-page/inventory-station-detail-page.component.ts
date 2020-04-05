import { Component, OnInit } from '@angular/core';
import { Subscription, forkJoin, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Station, Site } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, SensorFormDialogData, MaintenanceFormDialogData } from '@interfaces/dialogs.interface';
import { first, filter, take, takeUntil } from 'rxjs/operators';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { MaintenanceStatus, MaintenanceCategory, MaintenanceEvent } from '@interfaces/maintenance.interface';
import { MaintenanceEventQuery, MaintenanceEventQueryOrdering } from '@interfaces/maintenance-query.interface';
import { SensorsQuery, SensorsQueryOrdering } from '@interfaces/inventory-query.interface';
import { SensorFormDialogComponent } from '@app/inventory/dialogs/sensor-form-dialog/sensor-form-dialog.component';
import { DetailPage } from '@core/classes/detail-page.class';
import { MaintenanceFormDialogComponent } from '@app/maintenance/dialogs/maintenance-form-dialog/maintenance-form-dialog.component';

@Component({
  selector: 'app-inventory-station-detail-page',
  templateUrl: './inventory-station-detail-page.component.html',
  styleUrls: ['./inventory-station-detail-page.component.scss']
})

export class InventoryStationDetailPageComponent extends DetailPage<Station> {

  PageMode = PageMode;
  basePageUrlArr = ['/inventory/stations'];

  sites!: Site[];

  maintenanceStatuses: MaintenanceStatus[] = [];
  maintenanceCategories: MaintenanceCategory[] = [];
  maintenanceEvents!: MaintenanceEvent[];
  maintenanceEventsCount = 0;
  maintenanceEventsCursorPrevious!: string | null;
  maintenanceEventsCursorNext!: string | null;
  maintenanceEventsInitialized = false;

  sensorsDataSource!: Sensor[];
  sensorsCount = 0;
  sensorsCursorPrevious!: string | null;
  sensorsCursorNext!: string | null;
  sensorsOrdring: SensorsQueryOrdering = SensorsQueryOrdering.station_location_codeASC;
  sensorsInitialized = false;

  mapTabs = [
    '',
    'maintenance',
    'sensors',
  ];

  constructor(
    protected _activatedRoute: ActivatedRoute,
    protected _router: Router,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _matDialog: MatDialog,
    private _inventoryApiService: InventoryApiService,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_activatedRoute, _router, _matDialog, _ngxSpinnerService);
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

  handleTabInit(idx: number) {
    if (!this.detailInitialized.getValue()) {
      this._initDetail();
    }

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
      (this.id ? this._inventoryApiService.getStation(this.id) : of(null)),
      this._inventoryApiService.getSites()
    ]).subscribe(
      result => {
        this.model = result[0];
        this.sites = result[1];
        this.detailInitialized.next(true);
      }, err => {
        console.error(err);
      }).add(() => this.loadingStop());
  }

  private async _initMaintenanceLogs() {
    this.loadingStart();
    forkJoin([
      this._inventoryApiService.getMaintenanceStatuses(),
      this._inventoryApiService.getMaintenanceCategories(),
      this.loadMaintenanceEvents(),
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
        station: this.id
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

  loadMaintenanceEvents(cursor: string | null = null) {
    const query: MaintenanceEventQuery = {
      station_id: this.id,
      page_size: 15,
      ordering: MaintenanceEventQueryOrdering.DATE_DESC
    };

    if (cursor) {
      query.cursor = cursor;
    }

    return this._inventoryApiService.getMaintenanceEvents(query);
  }

  async changeMaintenanceEventsPage(cursor?: string) {
    try {
      await this.loadingStart();
      const response = await this.loadMaintenanceEvents(cursor).toPromise();
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

  async onCreatedMaintenanceEvent($event: MaintenanceEvent) {

    try {
      await this.loadingStart();
      const response = await this.loadMaintenanceEvents(null).toPromise();
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

  onCreated($event: Station) {
    this._router.navigate(['/inventory/stations', $event.id]);
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


  async openMaintenanceFormDialog($event: MaintenanceEvent) {
    const formDialogRef = this._matDialog.open<MaintenanceFormDialogComponent, MaintenanceFormDialogData>(
      MaintenanceFormDialogComponent, {
      hasBackdrop: true,
      data: {
        model: $event,
        stationFixed: this.id,
        maintenanceCategories: this.maintenanceCategories,
        maintenanceStatuses: this.maintenanceStatuses
      }
    });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadMaintenanceEvents();
      }
    });
  }

}

