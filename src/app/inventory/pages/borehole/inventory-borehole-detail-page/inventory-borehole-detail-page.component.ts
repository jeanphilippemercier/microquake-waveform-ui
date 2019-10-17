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
import { ConfirmationDialogData, BoreholeSurveyFileDialogData, BoreholeInterpolationDialogData } from '@interfaces/dialogs.interface';
import { first } from 'rxjs/operators';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { DetailPage } from '@core/classes/detail-page.class';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { BoreholeSurveyFileDialogComponent } from '@app/inventory/dialogs/borehole-survey-file-dialog/borehole-survey-file-dialog.component';
import { BoreholeInterpolationDialogComponent } from '@app/inventory/dialogs/borehole-interpolation-dialog/borehole-interpolation-dialog.component';

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
  files: NgxFileDropEntry[];

  collar_x = 0;
  collar_y = 0;
  collar_z = 0;

  traceDisplayedColumns: string[] = ['d', 'x', 'y', 'z'];



  myForm = this._fb.group({
    collar_x: [, Validators.required],
    collar_y: [, Validators.required],
    collar_z: [, Validators.required],
  });

  @ViewChild('inventoryForm', { static: false }) inventoryForm: NgForm;
  submited = false;
  selectedTabIndex = 0;

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

  uploadSurveyFile() {
    const surveyFileDialogRef = this._matDialog.open<BoreholeSurveyFileDialogComponent, BoreholeSurveyFileDialogData>(
      BoreholeSurveyFileDialogComponent, {
        hasBackdrop: true,
        disableClose: true,
        // width: '350px',
        data: {
          id: this.model.id,
          colar_x: this.model.collar_x,
          colar_y: this.model.collar_y,
          colar_z: this.model.collar_z,
        }
      });

    surveyFileDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          this.loadingStart();
          this.model = await this._inventoryApiService.getBorehole(this.boreholeId).toPromise();
          this.selectedTabIndex = 1;
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          this.loadingStop();
        }
      }
    });
  }


  interpolateBorehole() {
    const boreholeInterpolationDialogRef = this._matDialog.open<BoreholeInterpolationDialogComponent, BoreholeInterpolationDialogData>(
      BoreholeInterpolationDialogComponent, {
        hasBackdrop: true,
        disableClose: true,
        // width: '350px',
        data: {
          id: this.model.id
        }
      });

    boreholeInterpolationDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {

      }
    });
  }
}
