import { Component, OnDestroy, OnInit, } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { first, takeUntil, take, skipWhile } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import * as moment from 'moment';

import { Station, } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ListPage } from '@core/classes/list-page.class';
import { MatDialog } from '@angular/material/dialog';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, MaintenanceFormDialogData } from '@interfaces/dialogs.interface';
import { MaintenanceEvent, MaintenanceStatus, MaintenanceCategory } from '@interfaces/maintenance.interface';

import { MaintenanceEventQuery, MaintenanceEventQueryOrdering } from '@interfaces/maintenance-query.interface';
import { MaintenanceFormDialogComponent } from '@app/maintenance/dialogs/maintenance-form-dialog/maintenance-form-dialog.component';
import { LoadingService } from '@services/loading.service';
import MaintenanceUtil from '@core/utils/maintenance-util';

@Component({
  selector: 'app-maintenance-list-page',
  templateUrl: './maintenance-list-page.component.html',
  styleUrls: ['./maintenance-list-page.component.scss']
})
export class MaintenanceListPageComponent extends ListPage<MaintenanceEvent> implements OnInit, OnDestroy {

  query: MaintenanceEventQuery = {
    cursor: undefined,
    page_size: this.pageSize,
    // time_range: 3,
  };
  maintenanceStatuses: MaintenanceStatus[] = [];
  maintenanceCategories: MaintenanceCategory[] = [];
  stations: Station[] = [];
  count = 0;
  timezone = '+08:00';
  todayEnd = moment().utc().utcOffset(this.timezone).endOf('day');
  timeRange = 3;

  constructor(
    private _inventoryApiService: InventoryApiService,
    private _loadingService: LoadingService,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _router: Router,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
  }

  async ngOnInit() {
    const initQueryParams = this._activatedRoute.snapshot.queryParams;
    this.query = MaintenanceUtil.buildMaintenanceListQuery(initQueryParams, this.timezone);

    super.ngOnInit();
  }

  async afterNgOnInit() {
    this._initFormData();
    this._activatedRoute.params
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async params => {

        const maintenanceEventId = +params['maintenanceEventId'];
        if (!maintenanceEventId) {
          return;
        }

        try {
          await this.loadingStart();

          let data: MaintenanceEvent | undefined;
          if (this.dataSource) {
            data = this.dataSource.find(ev => ev.id === maintenanceEventId);
          }
          if (!data) {
            data = await this._inventoryApiService.getMaintenanceEvent(maintenanceEventId).toPromise();
          }
          await this.openFormDialog(data);
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          await this.loadingStop();
        }
      });
  }

  private async _initFormData() {
    forkJoin([
      this._inventoryApiService.getMaintenanceStatuses(),
      this._inventoryApiService.getMaintenanceCategories(),
      this._inventoryApiService.getStations({ page_size: 10000 }),
    ]).subscribe(
      result => {
        this.maintenanceStatuses = result[0];
        this.maintenanceCategories = result[1];
        this.stations = result[2].results;
        this.initialized.next(true);
      }, err => {
        console.error(err);
      });
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      await this._loadingService.start();

      this.query.cursor = cursor;

      const response = await this._inventoryApiService.getMaintenanceEvents(this.query).toPromise();
      this.dataSource = response.results;
      this.count = response.count;
      this.cursorPrevious = response.cursor_previous;
      this.cursorNext = response.cursor_next;

    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      await this._loadingService.stop();
    }
  }

  delete(id: number) {
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
          const response = await this._inventoryApiService.deleteMaintenanceEvent(id).toPromise();
          this.loadData();
          await this._toastrNotificationService.success('Maintenance event deleted');
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        }
      }
    });
  }

  async onCreatedMaintenanceEvent($event: MaintenanceEvent) {
    this.loadData();
  }

  async openFormDialog($event: MaintenanceEvent) {
    const formDialogRef = this._matDialog.open<MaintenanceFormDialogComponent, MaintenanceFormDialogData>(
      MaintenanceFormDialogComponent, {
      hasBackdrop: true,
      data: {
        model: $event,
        stations: this.stations,
        maintenanceCategories: this.maintenanceCategories,
        maintenanceStatuses: this.maintenanceStatuses
      }
    });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['maintenance'], { preserveQueryParams: true });
    });
  }

  onRowClicked(ev: MaintenanceEvent) {
    this._router.navigate(['maintenance', ev.id],
      {
        preserveQueryParams: true,
      });
  }

  onFilterChange() {

    this._router.navigate(
      [],
      {
        relativeTo: this._activatedRoute,
        queryParams: MaintenanceUtil.buildMaintenanceListParams(this.query),
      });
  }

}
