import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Site, Station, Cable, SensorType, IComponent } from '@interfaces/inventory.interface';
import { SensorCreateInput, ComponentCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-inventory-component-detail',
  templateUrl: './inventory-component-detail.component.html',
  styleUrls: ['./inventory-component-detail.component.scss']
})

export class InventoryComponentDetailComponent implements OnInit {

  private _id: number;

  @Input()
  public set id(v: number) {
    this._id = v;
    this._loadData();
  }

  public get id() {
    return this._id;
  }


  private _model: IComponent;

  @Input()
  public set model(v: IComponent) {
    this._model = v;
    this.myForm.patchValue(Object.assign(this.myForm.value, this.model));
  }

  public get model() {
    return this._model;
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

  @Output() modelChange: EventEmitter<IComponent> = new EventEmitter();

  editDisabled = false;
  PageMode = PageMode;
  loading = false;

  cables: Cable[];
  filteredCables: Observable<Cable[]>;

  sensors: Sensor[];
  filteredSensors: Observable<Sensor[]>;

  sensorTypes: SensorType[];
  filteredSensorTypes: Observable<SensorType[]>;

  myForm = this._fb.group({
    enabled: [false],
    cable: [, [Validators.required]],
    cable_length: [, [Validators.required]],
    code: [, [Validators.required]],
    sensor: [, Validators.required],
    sensor_type: [, Validators.required],
    damping: [],
    orientation_x: [],
    orientation_y: [],
    orientation_z: []
  });

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

  private async _loadData() {
    this.model = await this._inventoryApiService.getComponent(this.id).toPromise();
    this.modelChange.emit(this.model);
    this.myForm.patchValue(Object.assign(this.myForm.value, this.model));
  }

  private async _initEditableForm() {
    try {
      this.sensors = (await this._inventoryApiService.getSensors({ page_size: 10000 }).toPromise()).results;
      this.cables = (await this._inventoryApiService.getCables({ page_size: 10000 }).toPromise()).results;

      this.filteredSensors = this.myForm.get('sensor').valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.name),
          map(name => name ? this._filter<Sensor>(name, this.sensors) : this.sensors.slice())
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

  private _filter<T>(name: string, array: T[]): T[] {
    const filterValue = name.toLowerCase();
    return array.filter(option => option[name] && option[name].toLowerCase().indexOf(filterValue) === 0);
  }

  sensorDisplayFn(sensor?: Sensor): string | undefined {
    return sensor ? sensor.name : undefined;
  }

  cableDisplayFn(cable?: Cable): string | undefined {
    return cable ? cable.code : undefined;
  }

  async onSubmit() {
    // const dto = this.createDtoObject(this.myForm.value);

    // this.submited = true;
    // if (this.myForm.invalid) {
    //   return;
    // }

    // try {

    //   this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
    //   this.loading = true;
    //   let response;

    //   if (this.mode === PageMode.CREATE) {
    //     response = await this._inventoryApiService.createSensor(dto).toPromise();
    //   } else if (this.mode === PageMode.EDIT) {
    //     response = await this._inventoryApiService.updateSensor(this.id, dto).toPromise();
    //   }

    //   this._router.navigate(['/inventory/sensors', response.id]);

    // } catch (err) {
    //   console.error(err);
    // } finally {
    //   this.loading = false;
    //   this._ngxSpinnerService.hide('loadingCurrentEvent');
    // }
  }

  // createDtoObject(formValues: any) {
  //   if (!formValues) {
  //     return;
  //   }

  //   const dto: ComponentCreateInput = formValues;

  //   if (formValues.borehole && formValues.borehole.id) {
  //     dto.sensor = formValues.sensor.id;
  //     delete formValues.borehole;
  //   }

  //   if (formValues.station && formValues.station.id) {
  //     dto.station_id = formValues.station.id;
  //     delete formValues.station;
  //   }

  //   return dto;
  // }

}
