import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { startWith, map, first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Cable, IComponent, ComponentCode, ISensorType } from '@interfaces/inventory.interface';
import { ComponentCreateInput, ComponentUpdateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-inventory-component-detail',
  templateUrl: './inventory-component-detail.component.html',
  styleUrls: ['./inventory-component-detail.component.scss']
})

export class InventoryComponentDetailComponent implements OnInit {


  @Input()
  public set id(v: number) {
    this._id = v;
    this._loadData();
  }

  public get id() {
    return this._id;
  }
  private _id: number;


  @Input()
  public set model(v: Partial<IComponent>) {
    this._model = v;
    this.myForm.patchValue(Object.assign(this.myForm.value, this.model));
  }

  public get model() {
    return this._model;
  }
  private _model: Partial<IComponent> = {};


  @Input()
  public set mode(v: PageMode) {
    this._mode = v;
    this._initPageMode();
  }

  public get mode(): PageMode {
    return this._mode;
  }
  private _mode: PageMode;

  @Input() sensorId: number;
  @Input() sensorTypes: ISensorType[] = [];
  @Input() cables: Cable[] = [];

  @Input() availableComponentCodes: ComponentCode[] = [];

  @Output() modelChange: EventEmitter<Partial<IComponent>> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();

  editDisabled = false;
  PageMode = PageMode;
  loading = false;
  ComponentCode = ComponentCode;
  allComponentCodes: ComponentCode[] = Object.values(ComponentCode);
  deleteDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  filteredCables: Observable<Cable[]>;
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
    private _ngxSpinnerService: NgxSpinnerService,
    private _matDialog: MatDialog
  ) { }

  async ngOnInit() {

  }

  private async _initPageMode() {
    this._initEditableForm();
  }

  private async _loadData() {
    this.model = await this._inventoryApiService.getComponent(this.id).toPromise();
    this.modelChange.emit(this.model);
    this.myForm.patchValue(Object.assign(this.myForm.value, this.model));
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
          map(input => input ? this._filter<Cable>(input, this.cables, 'code') : this.cables.slice())
        );

    } catch (err) {
      console.error(err);
    }
  }

  openEditMode() {
    this._router.navigate(
      [PageMode.EDIT],
      {
        relativeTo: this._activatedRoute,
        queryParams: { pageMode: PageMode.EDIT },
        queryParamsHandling: 'merge',
      });
  }

  private _filter<T>(input: string, array: T[], name: string): T[] {
    const filterValue = input.toLowerCase();
    return array.filter(option => option[name] && option[name].toLowerCase().indexOf(filterValue) === 0);
  }

  sensorDisplayFn(sensor?: Sensor): string | undefined {
    return sensor ? sensor.name : undefined;
  }

  cableDisplayFn(cable?: Cable): string | undefined {
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
      return;
    }

    try {

      let response: any;
      await this._ngxSpinnerService.show('loadingForm', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
      this.loading = true;

      if (this.mode === PageMode.CREATE) {
        const dto = this._buildCreateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.createComponent(dto).toPromise();
      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.updateComponent(this.model.id, dto).toPromise();
      }
      console.log(response);
      // this._router.navigate(['/inventory/sensors', response.id]);

    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this._ngxSpinnerService.hide('loadingForm');
    }
  }

  onCancel() {
    this.cancel.emit();
  }


}
