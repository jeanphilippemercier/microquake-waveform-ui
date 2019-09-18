import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Site, Station, Borehole, Network } from '@interfaces/inventory.interface';
import { SensorCreateInput, StationUpdateInput, StationCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { DetailPage } from '@app/inventory/classes/detail-page.class';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-inventory-station-detail',
  templateUrl: './inventory-station-detail.component.html',
  styleUrls: ['./inventory-station-detail.component.scss']
})

export class InventoryStationDetailComponent extends DetailPage<Station> implements OnInit {

  networks: Network[];
  filteredNetworks: Observable<Network[]>;

  myForm = this._fb.group({
    name: [, [Validators.required]],
    code: [, [Validators.required]],
    network: [, [Validators.required]],
    description: [],
    location_x: [],
    location_y: [],
    location_z: [],
    communication: [],
    power: [],
  });

  @ViewChild('inventoryForm', { static: false }) inventoryForm: NgForm;
  submited = false;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router,
    private _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService,
    protected _matDialog: MatDialog
  ) {
    super(_matDialog);
  }

  ngOnInit() {
    this._initEditableForm();
  }

  protected async _loadData(id: number) {
    this.model = await this._inventoryApiService.getStation(id).toPromise();
    this.modelChange.emit(this.model);
    this.myForm.patchValue(Object.assign(this.myForm.value, this.model));
  }

  private async _initEditableForm() {
    try {
      const sites = (await this._inventoryApiService.getSites().toPromise());
      this.networks = [];
      const networks = sites.map(val => {
        this.networks = [...this.networks, ...val.networks];
      });

      this.filteredNetworks = this.myForm.get('network').valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.name),
          map(input => input ? this._filter<Network>(input, this.networks, 'code') : this.networks.slice())
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

  networkDisplayFn(network?: Network): string | undefined {
    return network ? network.name : undefined;
  }

  private _buildUpdateDtoObject(formValues: any): StationUpdateInput {

    const dto: StationUpdateInput = formValues;

    if (!dto) {
      throw new Error('No form is defined');
    }

    if (formValues.network && formValues.network.id) {
      dto.network_id = formValues.network.id;
      delete formValues.network;
    } else {
      throw new Error('No network is defined');
    }

    return dto;
  }


  private _buildCreateDtoObject(formValues: any): StationCreateInput {
    const dto: StationCreateInput = <StationCreateInput>this._buildUpdateDtoObject(formValues);

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
        response = await this._inventoryApiService.createStation(dto).toPromise();
        this._toastrNotificationService.success('Station created');
        this.modelCreated.emit(response);

      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.updateStation(this.model.id, dto).toPromise();

        this._toastrNotificationService.success('Station updated');
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


}
