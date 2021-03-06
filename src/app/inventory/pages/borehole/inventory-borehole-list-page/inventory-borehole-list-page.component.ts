import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs/operators';

import { PageMode } from '@interfaces/core.interface';
import { ListPage } from '@core/classes/list-page.class';
import { Borehole } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { BoreholeSurveyFileDialogComponent } from '@app/inventory/dialogs/borehole-survey-file-dialog/borehole-survey-file-dialog.component';
import { BoreholeSurveyFileDialogData, BoreholeInterpolationDialogData, ConfirmationDialogData, BoreholeFormDialogData } from '@interfaces/dialogs.interface';
import { BoreholeInterpolationDialogComponent } from '@app/inventory/dialogs/borehole-interpolation-dialog/borehole-interpolation-dialog.component';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { BoreholesQuery } from '@interfaces/inventory-query.interface';
import { BoreholeFormDialogComponent } from '@app/inventory/dialogs/borehole-form-dialog/borehole-form-dialog.component';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-inventory-borehole-list-page',
  templateUrl: './inventory-borehole-list-page.component.html',
  styleUrls: ['./inventory-borehole-list-page.component.scss']
})
export class InventoryBoreholeListPageComponent extends ListPage<Borehole> implements OnInit {

  constructor(
    private _inventoryApiService: InventoryApiService,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    protected _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
    this._subscribeToSearch();
  }

  async loadData(cursor?: string | null) {
    try {
      this.loading = true;
      this.loadingStart();

      const query: BoreholesQuery = {
        page_size: this.pageSize
      };

      if (cursor) {
        query.cursor = cursor;
      }

      if (this.search) {
        query.search = this.search;
      }

      const response = await this._inventoryApiService.getBoreholes(query).toPromise();

      this.dataSource = response.results;
      this.count = response.count;
      this.cursorPrevious = response.cursor_previous;
      this.cursorNext = response.cursor_next;
      this.currentPage = response.current_page;
    } catch (err) {
      this._toastrNotificationService.error(err);
      console.error(err);
    } finally {
      this.loading = false;
      this.loadingStop();
    }
  }

  onUploadSurveyFile($event: Borehole) {
    const surveyFileDialogRef = this._matDialog.open<BoreholeSurveyFileDialogComponent, BoreholeSurveyFileDialogData>(
      BoreholeSurveyFileDialogComponent, {
      hasBackdrop: true,
      disableClose: true,
      data: {
        id: $event.id,
        colar_x: $event.collar_x,
        colar_y: $event.collar_y,
        colar_z: $event.collar_z,
      }
    });

    surveyFileDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        this.loadData();
      }
    });
  }

  onInterpolateBorehole($event: Borehole) {
    const boreholeInterpolationDialogRef = this._matDialog.open<BoreholeInterpolationDialogComponent, BoreholeInterpolationDialogData>(
      BoreholeInterpolationDialogComponent, {
      hasBackdrop: true,
      disableClose: true,
      data: {
        id: $event.id
      }
    });
  }

  onDelete(boreholeId: number) {
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
        text: `Do you want to proceed and delete this borehole? Borehole id: ${boreholeId}`
      }
    });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          const response = await this._inventoryApiService.deleteBorehole(boreholeId).toPromise();
          await this._toastrNotificationService.success('Borehole deleted');
          this.loadData();
        } catch (err) {
          this._toastrNotificationService.error(err);
          console.error(err);
        }
      }
    });
  }

  async openFormDialog($event: Borehole) {
    const formDialogRef = this._matDialog.open<BoreholeFormDialogComponent, BoreholeFormDialogData>(
      BoreholeFormDialogComponent, {
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

}
