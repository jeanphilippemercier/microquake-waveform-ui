import { Component, OnInit, ViewChild, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Site, Station, Borehole } from '@interfaces/inventory.interface';
import { SensorCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { MatDialog } from '@angular/material';
import { Form } from '@core/classes/form.class';

@Component({
  selector: 'app-sensor-form',
  templateUrl: './sensor-form.component.html',
  styleUrls: ['./sensor-form.component.scss']
})

export class SensorFormComponent extends Form<Sensor> implements OnInit {

  @Input() stations: Station[];
  @Input() boreholes: Borehole[];

  filteredStations: Observable<Station[]>;
  filteredBoreholes: Observable<Borehole[]>;

  myForm = this._fb.group({
    enabled: [false],
    name: [, [Validators.required]],
    code: [, [Validators.required]],
    alternate_code: [],
    location_code: [],
    station: [, Validators.required],
    borehole: [],
    commissioning_date: [],
    decommissioning_date: [],
    location_x: [],
    location_y: [],
    location_z: [],
    orientation_valid: [],
    along_hole_z: [],
    part_number: [],
    manufacturer: [],
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
      if (!this.stations) {
        this.stations = (await this._inventoryApiService.getStations({ page_size: 10000 }).toPromise()).results;
      }
      if (!this.boreholes) {
        this.boreholes = (await this._inventoryApiService.getBoreholes({ page_size: 10000 }).toPromise()).results;
      }

      this.filteredStations = this.myForm.get('station').valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.name),
          map(name => name ? this._filterStation(name) : this.stations.slice())
        );

      this.filteredBoreholes = this.myForm.get('borehole').valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.name),
          map(name => name ? this._filterBorehole(name) : this.boreholes.slice())
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
        queryParamsHandling: 'merge', // remove to replace all query params by provided
      });
  }

  private _filterStation(name: string): Station[] {
    const filterValue = name.toLowerCase();
    return this.stations.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
  }

  private _filterBorehole(name: string): Borehole[] {
    const filterValue = name.toLowerCase();
    return this.boreholes.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
  }

  siteDisplayFn(site?: Site): string | undefined {
    return site ? site.name : undefined;
  }

  stationDisplayFn(sensor?: Sensor): string | undefined {
    return sensor ? sensor.name : undefined;
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
        this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        const response = await this._inventoryApiService.createSensor(dto).toPromise();
        await this._toastrNotificationService.success('Sensor created');
        this._router.navigate(['/inventory/sensors', response.id]);
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
        this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        const response = await this._inventoryApiService.updateSensor(this.model.id, dto).toPromise();
        await this._toastrNotificationService.success('Sensor updated');
        this._router.navigate(['/inventory/sensors', response.id]);
      } catch (err) {
        console.error(err);
        await this._toastrNotificationService.error(err);
      } finally {
        this.loading = false;
        this._ngxSpinnerService.hide('loadingCurrentEvent');
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
