import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable, forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Borehole } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';
import { first } from 'rxjs/operators';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { DetailPage } from '@core/classes/detail-page.class';

@Component({
  selector: 'app-inventory-borehole-detail-page',
  templateUrl: './inventory-borehole-detail-page.component.html',
  styleUrls: ['./inventory-borehole-detail-page.component.scss']
})

export class InventoryBoreholeDetailPageComponent extends DetailPage<Borehole> implements OnInit, OnDestroy {

  params$: Subscription;
  boreholeId: number;

  pageMode: PageMode = PageMode.EDIT;
  PageMode = PageMode;

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
      if (params['boreholeId'] === PageMode.CREATE || params['pageMode'] === PageMode.CREATE) {
        this.pageMode = PageMode.CREATE;
      } else {
        this.pageMode = PageMode.EDIT;
        this.boreholeId = params['boreholeId'];
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
      this._inventoryApiService.getBorehole(this.boreholeId)
    ]).subscribe(
      result => {
        this.model = result[0];
        this.loadingTableStop();
      }, err => {
        console.error(err);
        this.loadingTableStop();
      });
  }

  delete(boreholeId: number) {
    if (!boreholeId) {
      console.error(`No boreholeId`);
      this._toastrNotificationService.error('No borehole is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          header: `Are you sure?`,
          text: `Do you want to proceed and delete this borehole?`
        }
      });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          const response = await this._inventoryApiService.deleteBorehole(boreholeId).toPromise();
          await this._toastrNotificationService.success('Borehole deleted');
        } catch (err) {
          this._toastrNotificationService.error(err);
          console.error(err);
        }
      }
    });
  }

}
