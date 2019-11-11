import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { PageMode } from '@interfaces/core.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { Sensor, Station, Borehole } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Params, Router, ActivatedRoute } from '@angular/router';
import { ListPage } from '@core/classes/list-page.class';
import { MatDialog, Sort } from '@angular/material';
import { SensorsQuery, SensorsQueryOrdering } from '@interfaces/inventory-query.interface';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, first } from 'rxjs/operators';
import { SensorFormDialogComponent } from '@app/inventory/dialogs/sensor-form-dialog/sensor-form-dialog.component';
import { SensorFormDialogData, ConfirmationDialogData } from '@interfaces/dialogs.interface';
import { LoadingService } from '@services/loading.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-inventory-sensor-list-page',
  templateUrl: './inventory-sensor-list-page.component.html',
  styleUrls: ['./inventory-sensor-list-page.component.scss']
})
export class InventorySensorListPageComponent extends ListPage<Sensor> implements OnInit {

  ordring: SensorsQueryOrdering = SensorsQueryOrdering.station_location_codeASC;

  constructor(
    private _inventoryApiService: InventoryApiService,
    private _loadingService: LoadingService,
    private _toastrNotificationService: ToastrNotificationService,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    protected _ngxSpinnerService: NgxSpinnerService
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
    this._subscribeToSearch();
  }

  async loadData(cursor?: string | null) {
    try {
      this.loading = true;
      this._loadingService.start();

      const query: SensorsQuery = {
        ordering: this.ordring,
        page_size: this.pageSize
      };

      if (cursor) {
        query.cursor = cursor;
      }

      if (this.search) {
        query.search = this.search;
      }

      const response = await this._inventoryApiService.getSensors(query).toPromise();

      this.dataSource = response.results;
      this.count = response.count;
      this.cursorPrevious = response.cursor_previous;
      this.cursorNext = response.cursor_next;
      this.currentPage = response.current_page - 1;
    } catch (err) {
      this._toastrNotificationService.error(err);
      console.error(err);
    } finally {
      this.loading = false;
      this._loadingService.stop();
    }
  }

  onSort($event: Sort) {
    if ($event.active === 'sensor') {
      if ($event.direction === 'asc') {
        this.ordring = SensorsQueryOrdering.station_location_codeASC;
      } else {
        this.ordring = SensorsQueryOrdering.station_location_codeDESC;
      }
    }
    this.loadData();
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
        this.loadData();
      }
    });
  }


  onDelete(sensorId: number) {
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
          this.loadingStart();
          const response = await this._inventoryApiService.deleteSensor(sensorId).toPromise();
          await this._toastrNotificationService.success('Sensor deleted');
          this.loadData();
        } catch (err) {
          this._toastrNotificationService.error(err);
          console.error(err);
        } finally {
          this.loadingStop();
        }
      }
    });
  }

}
