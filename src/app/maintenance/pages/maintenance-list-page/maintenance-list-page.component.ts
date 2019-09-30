import { Component, } from '@angular/core';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

import { Station, } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ListPage } from '@core/classes/list-page.class';
import { MatDialog } from '@angular/material';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';
import { MaintenanceEvent, MaintenanceStatus, MaintenanceCategory } from '@interfaces/maintenance.interface';

import { MaintenanceEventQuery } from '@interfaces/maintenance-query.interface';

@Component({
  selector: 'app-maintenance-list-page',
  templateUrl: './maintenance-list-page.component.html',
  styleUrls: ['./maintenance-list-page.component.scss']
})
export class MaintenanceListPageComponent extends ListPage<MaintenanceEvent> {

  maintenanceStatuses: MaintenanceStatus[] = [];
  maintenanceCategories: MaintenanceCategory[] = [];
  stations: Station[] = [];
  count = 0;

  constructor(
    private _inventoryApiService: InventoryApiService,
    private _ngxSpinnerService: NgxSpinnerService,
    protected _router: Router,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_activatedRoute, _matDialog, _router);
    this._initFormData();
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
        this.initialized = true;
      }, err => {
        console.error(err);
      });
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      await this.loadingTableStart();

      const query: MaintenanceEventQuery = {
        cursor,
        page_size: this.pageSize
      };

      const response = await this._inventoryApiService.getMaintenanceEvents(query).toPromise();
      this.dataSource = response.results;
      this.count = response.count;
      this.cursorPrevious = response.cursor_previous;
      this.cursorNext = response.cursor_next;

    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      await this.loadingTableStop();
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


  async loadingTableStart() {
    await this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingTableStop() {
    await this._ngxSpinnerService.hide('loadingTable');
  }

  async onCreatedMaintenanceEvent($event: MaintenanceEvent) {
    this.loadData();
  }

}
