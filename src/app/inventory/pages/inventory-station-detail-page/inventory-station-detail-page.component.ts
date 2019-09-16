import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Station, Borehole, Network } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';
import { first } from 'rxjs/operators';
import { ToastrNotificationService } from '@services/toastr-notification.service';

@Component({
  selector: 'app-inventory-station-detail-page',
  templateUrl: './inventory-station-detail-page.component.html',
  styleUrls: ['./inventory-station-detail-page.component.scss']
})

export class InventoryStationDetailPageComponent implements OnInit, OnDestroy {

  params$: Subscription;
  stationId: number;
  station: Partial<Station>;

  pageMode: PageMode = PageMode.EDIT;
  PageMode = PageMode;
  loading = false;

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
      }
    });
  }

  ngOnDestroy() {
    if (this.params$) {
      this.params$.unsubscribe();
    }
  }

  openEditMode() {
    this._router.navigate(
      [PageMode.EDIT],
      {
        relativeTo: this._activatedRoute,
        queryParams: { pageMode: PageMode.EDIT },
        queryParamsHandling: 'merge'
      });
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
          await this._toastrNotificationService.error('Station deletion is not active');
          // const response = await this._inventoryApiService.deleteStation(stationId).toPromise();
          // await this._toastrNotificationService.success('Station deleted');
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        }
      }
    });
  }
}
