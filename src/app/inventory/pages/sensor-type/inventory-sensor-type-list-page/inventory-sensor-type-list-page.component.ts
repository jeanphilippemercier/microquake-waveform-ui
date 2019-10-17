import { Component, OnInit } from '@angular/core';

import { ISensorType } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';
import { first } from 'rxjs/operators';
import { ListPage } from '@core/classes/list-page.class';

@Component({
  selector: 'app-inventory-sensor-type-list-page',
  templateUrl: './inventory-sensor-type-list-page.component.html',
  styleUrls: ['./inventory-sensor-type-list-page.component.scss']
})
export class InventorySensorTypeListPageComponent extends ListPage<ISensorType> {

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['model', 'manufacturer', 'sensorType', 'motionType', 'resonanceFrequency', 'shuntResistance', 'id', 'actions'];
  paginationEnabled = false;

  constructor(
    private _inventoryApiSevice: InventoryApiService,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    protected _router: Router,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      const response = await this._inventoryApiSevice.getSensorTypes().toPromise();
      this.dataSource = response;
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this._ngxSpinnerService.hide('loadingTable');
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
          // await this._toastrNotificationService.error('Sensor type deletion is not active');
          const response = await this._inventoryApiSevice.deleteSensorType(id).toPromise();
          console.log(response);
          await this._toastrNotificationService.success('Sensor type deleted');
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        }
      }
    });
  }

}
