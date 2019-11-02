import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PageMode } from '@interfaces/core.interface';
import { BoreholeInterpolationDialogData } from '@interfaces/dialogs.interface';
import { FormBuilder, Validators } from '@angular/forms';
import { InventoryApiService } from '@services/inventory-api.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { InterpolateBoreholeQuery } from '@interfaces/inventory-query.interface';
import { InterpolateBoreholeResponse } from '@interfaces/inventory.interface';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-borehole-interpolation-dialog',
  templateUrl: './borehole-interpolation-dialog.component.html',
  styleUrls: ['./borehole-interpolation-dialog.component.scss']
})
export class BoreholeInterpolationDialogComponent {
  PageMode = PageMode;

  response!: InterpolateBoreholeResponse;
  currentDepth!: number;

  myForm = this._fb.group({
    alonghole_depth: [, Validators.required],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: BoreholeInterpolationDialogData,
    private _matDialogRef: MatDialogRef<BoreholeInterpolationDialogComponent, boolean>,
    private _fb: FormBuilder,
    private _inventoryApiService: InventoryApiService,
    private _toastrNotificationService: ToastrNotificationService,
    private _ngxSpinnerService: NgxSpinnerService
  ) { }

  close() {
    this._matDialogRef.close();
  }

  onCancelClicked() {
    this._matDialogRef.close();
  }

  async onSaveClicked() {
    try {
      if (this.myForm.value.alonghole_depth === null) {
        this._toastrNotificationService.error('Please define depth along the borehole');
        return;
      }

      const query: InterpolateBoreholeQuery = {
        alonghole_depth: this.myForm.value.alonghole_depth
      };

      this.response = await this._inventoryApiService.interpolateBorehole(this.dialogData.id, query).toPromise();
      this.currentDepth = query.alonghole_depth;

    } catch (err) {
      console.error(err);
      const errMsg = err.error && err.error.alonghole_depth && err.error.alonghole_depth[0] ? err.error.alonghole_depth[0] : err;
      this._toastrNotificationService.error(errMsg);
      return;
    }
  }

  async loadingDialogStart() {
    await this._ngxSpinnerService.show('loadingDialog', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingDialogStop() {
    await this._ngxSpinnerService.hide('loadingDialog');
  }
}
