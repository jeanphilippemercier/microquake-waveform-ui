import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Borehole } from '@interfaces/inventory.interface';
import { SensorCreateInput, BoreholeCreateInput, BoreholeUpdateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { MatDialog } from '@angular/material';
import { Form } from '@core/classes/form.class';

@Component({
  selector: 'app-borehole-form',
  templateUrl: './borehole-form.component.html',
  styleUrls: ['./borehole-form.component.scss']
})

export class BoreholeFormComponent extends Form<Borehole> implements OnInit {


  myForm = this._fb.group({
    name: [, [Validators.required]],
    length: [],
    azimuth: [],
    dip: [],
    collar_x: [],
    collar_y: [],
    collar_z: [],
    toe_x: [],
    toe_y: [],
    toe_z: []
  });

  @ViewChild('inventoryForm', { static: false }) inventoryForm!: NgForm;
  submited = false;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router,
    protected _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService,
    private _matDialog: MatDialog
  ) {
    super(_ngxSpinnerService);
  }

  ngOnInit() {
    this._initEditableForm();
  }

  private async _initEditableForm() {
    try {

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
        queryParamsHandling: 'merge', // remove to replace all query params by provided
      });
  }

  async onSubmit() {

    this.submited = true;
    if (this.myForm.invalid) {
      this._toastrNotificationService.error('Form is not valid');
      return;
    }

    try {
      this.loading = true;
      await this.loadingStart();
      if (this.mode === PageMode.CREATE) {
        const dto = this._buildCreateDtoObject(this.myForm.value);
        const response = await this._inventoryApiService.createBorehole(dto).toPromise();
        this._toastrNotificationService.success('Borehole created');
        this.modelCreated.emit(response);
      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.value);
        const response = await this._inventoryApiService.updateBorehole(this.model.id, dto).toPromise();
        this._toastrNotificationService.success('Borehole updated');
        this.modelEdited.emit(response);
        this.modelChange.emit(response);
      }
    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      await this.loadingStop();
    }
  }

  private _buildUpdateDtoObject(formValues: any): BoreholeUpdateInput {
    const dto: BoreholeUpdateInput = formValues;

    if (!formValues) {
      throw new Error('No form is defined');
    }

    return dto;
  }

  private _buildCreateDtoObject(formValues: any): BoreholeCreateInput {
    const dto: BoreholeCreateInput = <BoreholeCreateInput>this._buildUpdateDtoObject(formValues);
    return dto;
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }
}
