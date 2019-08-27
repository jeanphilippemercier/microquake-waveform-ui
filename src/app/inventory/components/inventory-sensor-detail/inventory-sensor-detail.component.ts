import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Site, Station, Borehole } from '@interfaces/inventory.interface';
import { SensorCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-inventory-sensor-detail',
  templateUrl: './inventory-sensor-detail.component.html',
  styleUrls: ['./inventory-sensor-detail.component.scss']
})

export class InventorySensorDetailComponent implements OnInit {

  private _sensorId: number;

  @Input()
  public set sensorId(v: number) {
    this._sensorId = v;
    this._loadSensor();
  }

  public get sensorId() {
    return this._sensorId;
  }

  private _mode: PageMode;

  @Input()
  public set mode(v: PageMode) {
    this._mode = v;
    this._initPageMode();
  }

  public get mode(): PageMode {
    return this._mode;
  }

  @Output() sensorChange: EventEmitter<Sensor> = new EventEmitter();

  sensor: Sensor;

  editDisabled = false;
  pageMode: PageMode = PageMode.VIEW;
  PageMode = PageMode;
  loading = false;

  stations: Station[];
  filteredStations: Observable<Station[]>;

  boreholes: Borehole[];
  filteredBoreholes: Observable<Borehole[]>;

  myForm = this._fb.group({
    enabled: [false],
    name: [, [Validators.required]],
    code: [, [Validators.required]],
    station: [, Validators.required],
    borehole: [],
    commissioning_date: [],
    decommissioning_date: [],
    location_x: [],
    location_y: [],
    location_z: [],
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
    private _ngxSpinnerService: NgxSpinnerService
  ) { }

  async ngOnInit() {

  }

  private async _initPageMode() {

    if (this.mode === PageMode.VIEW) {
      this.myForm.disable();
    } else {
      this._initEditableForm();
    }
  }

  private async _loadSensor() {
    this.sensor = await this._inventoryApiService.getSensor(this.sensorId).toPromise();
    this.sensorChange.emit(this.sensor);
    this.myForm.patchValue(Object.assign(this.myForm.value, this.sensor));
  }

  private async _initEditableForm() {
    try {
      this.stations = (await this._inventoryApiService.getStations({ page_size: 10000 }).toPromise()).results;
      this.boreholes = (await this._inventoryApiService.getBoreholes({ page_size: 10000 }).toPromise()).results;

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
      return;
    }

    if (this.pageMode === PageMode.CREATE) {
      try {
        this.loading = true;
        this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        const response = await this._inventoryApiService.createSensor(dto).toPromise();
        this._router.navigate(['/inventory/sensors', response.id]);
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
        this._ngxSpinnerService.hide('loadingCurrentEvent');
      }
    } else if (this.pageMode === PageMode.EDIT) {
      try {
        this.loading = true;
        this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        const response = await this._inventoryApiService.updateSensor(this.sensorId, dto).toPromise();
        this._router.navigate(['/inventory/sensors', response.id]);
      } catch (err) {
        console.error(err);
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

}
