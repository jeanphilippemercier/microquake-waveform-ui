import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Borehole } from '@interfaces/inventory.interface';
import { SensorCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
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
    collar: [],
    toe: [],
    trace: [],
    survey_file: [],
    vtp_file: [],
    dxf_file: []
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
    const dto = this.createDtoObject(this.myForm.value);

    this.submited = true;
    if (this.myForm.invalid) {
      console.log(`invalid`);

      return;
    }

    if (this.mode === PageMode.CREATE) {
      try {
        this.loading = true;
        this.loadingFormStart();
        const response = await this._inventoryApiService.createBorehole(dto).toPromise();
        await this._toastrNotificationService.success('Borehole created');
        this._router.navigate(['/inventory/boreholes', response.id]);
      } catch (err) {
        console.error(err);
        await this._toastrNotificationService.error(err);
      } finally {
        this.loading = false;
        this._ngxSpinnerService.hide('loadingCurrentEvent');
      }
    } else if (this.mode === PageMode.EDIT) {
      try {
        this.loading = true;
        this.loadingFormStart();
        const response = await this._inventoryApiService.updateBorehole(this.model.id, dto).toPromise();
        await this._toastrNotificationService.success('Borehole updated');
        this._router.navigate(['/inventory/boreholes', response.id]);
      } catch (err) {
        console.error(err);
        await this._toastrNotificationService.error(err);
      } finally {
        this.loading = false;
        this.loadingFormStop();
      }
    }
  }

  createDtoObject(formValues: any) {
    if (!formValues) {
      return;
    }

    const dto: SensorCreateInput = formValues;

    if (formValues.borehole && formValues.borehole.id) {
      dto.borehole_id = formValues.borehole.id;
      delete formValues.borehole;
    }

    if (formValues.station && formValues.station.id) {
      dto.station_id = formValues.station.id;
      delete formValues.station;
    }

    return dto;
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }
}
