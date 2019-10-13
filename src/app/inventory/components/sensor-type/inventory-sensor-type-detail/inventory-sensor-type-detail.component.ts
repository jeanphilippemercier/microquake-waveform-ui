import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { ISensorType } from '@interfaces/inventory.interface';
import { ISensorTypeUpdateInput, ISensorTypeCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { MatDialog } from '@angular/material';
import { Form } from '@core/classes/form.class';

@Component({
  selector: 'app-inventory-sensor-type-detail',
  templateUrl: './inventory-sensor-type-detail.component.html',
  styleUrls: ['./inventory-sensor-type-detail.component.scss']
})

export class InventorySensorTypeDetailComponent extends Form<ISensorType> implements OnInit {

  myForm = this._fb.group({
    model: [, [Validators.required]],
    manufacturer: [, [Validators.required]],
    sensor_type: [, [Validators.required]],
    resonance_frequency: [],
    coil_resistance: [],
    shunt_resistance: [],
    gain: [],
    description: [],
    motion_type: [],
  });

  @ViewChild('inventoryForm', { static: false }) inventoryForm: NgForm;
  submited = false;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router,
    protected _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService,
    protected _matDialog: MatDialog
  ) {
    super(_ngxSpinnerService);
  }

  ngOnInit() {
  }

  private _buildUpdateDtoObject(formValues: any): ISensorTypeUpdateInput {
    const dto: ISensorTypeUpdateInput = formValues;

    if (!dto) {
      throw new Error('No form is defined');
    }
    return dto;
  }


  private _buildCreateDtoObject(formValues: any): ISensorTypeCreateInput {
    const dto: ISensorTypeCreateInput = <ISensorTypeCreateInput>this._buildUpdateDtoObject(formValues);
    return dto;
  }

  async onSubmit() {

    this.submited = true;
    if (this.myForm.invalid) {
      this._toastrNotificationService.error('Form is not valid');
      return;
    }

    try {

      let response: any;
      await this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
      this.loading = true;

      if (this.mode === PageMode.CREATE) {
        const dto = this._buildCreateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.createSensorType(dto).toPromise();
        this._toastrNotificationService.success('Sensor type created');
        this.modelCreated.emit(response);

      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.updateSensorType(this.model.id, dto).toPromise();

        this._toastrNotificationService.success('Sensor type updated');
        this.modelEdited.emit(response);
      }
      console.log(response);
      // this._router.navigate(['/inventory/sensors', response.id]);

    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      this._ngxSpinnerService.hide('loading');
    }
  }

}
