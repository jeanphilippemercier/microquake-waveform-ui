import { Component, OnInit } from '@angular/core';

import { ISensorType } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, SensorTypeFormDialogData } from '@interfaces/dialogs.interface';
import { first, takeUntil } from 'rxjs/operators';
import { ListPage } from '@core/classes/list-page.class';
import { LoadingService } from '@services/loading.service';
import { SensorTypeFormDialogComponent } from '@app/inventory/dialogs/sensor-type-form-dialog/sensor-type-form-dialog.component';
import { PageMode } from '@interfaces/core.interface';

@Component({
  selector: 'app-inventory-sensor-type-list-page',
  templateUrl: './inventory-sensor-type-list-page.component.html',
  styleUrls: ['./inventory-sensor-type-list-page.component.scss']
})
export class InventorySensorTypeListPageComponent extends ListPage<ISensorType> {


  constructor(
    private _inventoryApiService: InventoryApiService,
    private _loadingService: LoadingService,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    protected _router: Router,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
  }

  async afterNgOnInit() {
    this._activatedRoute.params
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async params => {

        const sensorTypeId = +params['sensorTypeId'];
        if (!sensorTypeId) {
          return;
        }

        try {
          await this.loadingStart();

          let data: ISensorType | undefined;
          if (this.dataSource) {
            data = this.dataSource.find(ev => ev.id === sensorTypeId);
          }
          if (!data) {
            data = await this._inventoryApiService.getSensorType(sensorTypeId).toPromise();
          }
          await this.openEditFormDialog(data);
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          await this.loadingStop();
        }
      });
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      this._loadingService.start();

      const response = await this._inventoryApiService.getSensorTypes().toPromise();
      this.dataSource = response;
    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      this._loadingService.stop();
    }
  }

  delete(id: number) {
    if (!id) {
      console.error(`No sensor type id`);
      this._toastrNotificationService.error('No sensor type id is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          header: `Are you sure?`,
          text: `Do you want to proceed and delete sensor type (ID: ${id})?`
        }
      });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          this._loadingService.start();
          const response = await this._inventoryApiService.deleteSensorType(id).toPromise();
          await this._toastrNotificationService.success('Sensor type deleted');
          await this.loadData();
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          this._loadingService.stop();
        }
      }
    });
  }

  async openEditFormDialog($event: ISensorType) {
    const formDialogRef = this._matDialog.open<SensorTypeFormDialogComponent, SensorTypeFormDialogData>(
      SensorTypeFormDialogComponent, {
        hasBackdrop: true,
        autoFocus: false,
        data: {
          model: $event,
          mode: PageMode.EDIT,
        }
      });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['inventory/sensor-types'], { preserveQueryParams: true });
    });
  }

  async openCreateFormDialog() {
    const model: Partial<ISensorType> = {};
    const formDialogRef = this._matDialog.open<SensorTypeFormDialogComponent, SensorTypeFormDialogData>(
      SensorTypeFormDialogComponent, {
        hasBackdrop: true,
        autoFocus: false,
        data: {
          model: model,
          mode: PageMode.CREATE
        }
      });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['inventory/sensor-types'], { preserveQueryParams: true });
    });
  }

  onRowClicked(ev: ISensorType) {
    this._router.navigate(['/inventory/sensor-types', ev.id]);
  }

}
