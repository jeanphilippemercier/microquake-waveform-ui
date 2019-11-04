import { Component, OnDestroy, } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { first, takeUntil, take, skipWhile } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

import { Station, } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ListPage } from '@core/classes/list-page.class';
import { MatDialog } from '@angular/material';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, MaintenanceFormDialogData } from '@interfaces/dialogs.interface';
import { MaintenanceEvent, MaintenanceStatus, MaintenanceCategory } from '@interfaces/maintenance.interface';

import { MaintenanceEventQuery, MaintenanceEventQueryOrdering } from '@interfaces/maintenance-query.interface';
import { MaintenanceFormDialogComponent } from '@app/maintenance/dialogs/maintenance-form-dialog/maintenance-form-dialog.component';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-maintenance-list-page',
  templateUrl: './maintenance-list-page.component.html',
  styleUrls: ['./maintenance-list-page.component.scss']
})
export class MaintenanceListPageComponent extends ListPage<MaintenanceEvent> implements OnDestroy {

  maintenanceStatuses: MaintenanceStatus[] = [];
  maintenanceCategories: MaintenanceCategory[] = [];
  stations: Station[] = [];
  count = 0;

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
    this._initFormData();

    this._activatedRoute.params
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async params => {

        const maintenanceEventId = params['maintenanceEventId'];
        if (!maintenanceEventId) {
          return;
        }

        try {
          await this._loadingService.start();
          await this.wiatForInitialization();
          const response = await this._inventoryApiService.getMaintenanceEvent(maintenanceEventId).toPromise();
          await this.openFormDialog(response);
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          await this._loadingService.stop();
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

      const query: MaintenanceEventQuery = {
        cursor,
        page_size: this.pageSize,
        ordering: MaintenanceEventQueryOrdering.DATE_DESC
      };

      const response = await this._inventoryApiService.getMaintenanceEvents(query).toPromise();
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


}
