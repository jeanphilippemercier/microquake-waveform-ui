import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { CableType } from '@interfaces/inventory.interface';
import { CableTypeUpdateInput, CableTypeCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { MatDialog } from '@angular/material';
import { Form } from '@core/classes/form.class';

@Component({
  selector: 'app-cable-type-form',
  templateUrl: './cable-type-form.component.html',
  styleUrls: ['./cable-type-form.component.scss']
})

export class CableTypeFormComponent extends Form<CableType> implements OnInit {

  myForm = this._fb.group({
    code: [, [Validators.required]],
    manufacturer: [],
    part_number: [],
    r: [],
    l: [],
    g: [],
    c: [],
    description: []
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
    protected _matDialog: MatDialog
  ) {
    super(_ngxSpinnerService);
  }

  ngOnInit() { }

  private _buildUpdateDtoObject(formValues: any): CableTypeUpdateInput {
    const dto: CableTypeUpdateInput = formValues;

    if (!dto) {
      throw new Error('No form is defined');
    }
    return dto;
  }


  private _buildCreateDtoObject(formValues: any): CableTypeCreateInput {
    const dto: CableTypeCreateInput = <CableTypeCreateInput>this._buildUpdateDtoObject(formValues);
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
        response = await this._inventoryApiService.createCableType(dto).toPromise();
        this._toastrNotificationService.success('Cable type created');
        this.modelCreated.emit(response);

      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.updateCableType(this.model.id, dto).toPromise();

        this._toastrNotificationService.success('Cable type updated');
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
