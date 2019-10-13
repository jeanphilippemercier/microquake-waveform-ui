import { Component, OnInit, Input, TemplateRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, IComponent, ComponentCode, ISensorType, CableType } from '@interfaces/inventory.interface';
import { ComponentCreateInput, ComponentUpdateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { Form } from '@core/classes/form.class';

@Component({
  selector: 'app-inventory-component-detail',
  templateUrl: './inventory-component-detail.component.html',
  styleUrls: ['./inventory-component-detail.component.scss']
})

export class InventoryComponentDetailComponent extends Form<IComponent> implements OnInit {

  @Input() sensorId: number;
  @Input() sensorTypes: ISensorType[] = [];
  @Input() cables: CableType[] = [];
  @Input() availableComponentCodes: ComponentCode[] = [];

  editDisabled = false;
  ComponentCode = ComponentCode;

  allComponentCodes: ComponentCode[] = Object.values(ComponentCode);
  deleteDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  filteredCables: Observable<CableType[]>;
  filteredSensorTypes: Observable<ISensorType[]>;

  myForm = this._fb.group({
    enabled: [false],
    cable: [, [Validators.required]],
    cable_length: [, [Validators.required]],
    code: [, [Validators.required]],
    sensor_type: [, Validators.required],
    orientation_x: [],
    orientation_y: [],
    orientation_z: [],
    damping: [, [Validators.required]],
    sample_rate: [, [Validators.required]],
  });

  submited = false;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_ngxSpinnerService);
  }

  async ngOnInit() {
    this._initEditableForm();
  }

  private async _initEditableForm() {

    try {
      this.filteredSensorTypes = this.myForm.get('sensor_type').valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.model),
          map(input => input ? this._filter<ISensorType>(input, this.sensorTypes, 'model') : this.sensorTypes.slice())
        );

    } catch (err) {
      console.error(err);
    }

    try {
      this.filteredCables = this.myForm.get('cable').valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.code),
          map(input => input ? this._filter<CableType>(input, this.cables, 'code') : this.cables.slice())
        );

    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    }
  }

  sensorDisplayFn(sensor?: Sensor): string | undefined {
    return sensor ? sensor.name : undefined;
  }

  cableDisplayFn(cable?: CableType): string | undefined {
    return cable ? cable.code : undefined;
  }

  sensorTypeDisplayFn(sensorType: ISensorType): string | undefined {

    return sensorType ? sensorType.model : undefined;
  }

  private _buildUpdateDtoObject(formValues: any): ComponentUpdateInput {

    const dto: ComponentUpdateInput = formValues;

    if (!dto) {
      throw new Error('No form is defined');
    }

    if (formValues.sensor_type && formValues.sensor_type.id) {
      dto.sensor_type_id = formValues.sensor_type.id;
      delete formValues.sensor_type;
    } else {
      throw new Error('No sensor_type is defined');
    }

    if (formValues.cable && formValues.cable.id) {
      dto.cable_id = formValues.cable.id;
      delete formValues.cable;
    } else {
      throw new Error('No cable is defined');
    }

    return dto;
  }


  private _buildCreateDtoObject(formValues: any): ComponentCreateInput {
    const dto: ComponentCreateInput = <ComponentCreateInput>this._buildUpdateDtoObject(formValues);

    if (this.sensorId) {
      dto.sensor_id = this.sensorId;
    } else {
      throw new Error('No sensor is defined');
    }

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
      await this._ngxSpinnerService.show('loadingForm', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
      this.loading = true;

      if (this.mode === PageMode.CREATE) {
        const dto = this._buildCreateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.createComponent(dto).toPromise();
        this._toastrNotificationService.success('Component created');
        this.modelCreated.emit(response);

      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.updateComponent(this.model.id, dto).toPromise();
        this._toastrNotificationService.success('Component updated');
        this.modelEdited.emit(response);
      }
      console.log(response);
      // this._router.navigate(['/inventory/sensors', response.id]);

    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      this._ngxSpinnerService.hide('loadingForm');
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }
}
