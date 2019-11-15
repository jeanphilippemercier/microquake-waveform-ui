import { Component, OnInit, ViewChild, Input, Output, EventEmitter, TemplateRef, OnDestroy } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
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

export class SensorFormComponent extends Form<Sensor> implements OnInit, OnDestroy {


  @Input()
  set stations(v: Station[]) {
    if (v && v.length > 0) {
      this.myForm.controls['station'].enable({ onlySelf: true });
      this._stations = v;
    } else {
      this.myForm.controls['station'].disable({ onlySelf: true });
    }

    this.checkFixedStation();
  }
  get stations(): Station[] {
    return this._stations;
  }
  private _stations: Station[] = [];


  @Input()
  set boreholes(v: Borehole[]) {
    if (v && v.length > 0) {
      this.myForm.controls['borehole'].enable({ onlySelf: true });
      this._boreholes = v;
    } else {
      this.myForm.controls['borehole'].disable({ onlySelf: true });
    }
  }
  get boreholes(): Borehole[] {
    return this._boreholes;
  }
  private _boreholes: Borehole[] = [];


  @Input()
  public set stationId(v: number) {
    this._stationId = v;
    this.checkFixedStation();
  }

  public get stationId(): number {
    return this._stationId;
  }
  private _stationId!: number;

  public get code() {
    return this.myForm.get('code');
  }

  @Output() alongHoleZ: EventEmitter<number> = new EventEmitter<number>();

  filteredStations!: Observable<Station[]>;
  filteredBoreholes!: Observable<Borehole[]>;

  myForm = this._fb.group({
    enabled: [false],
    name: [, [Validators.required]],
    code: [, [Validators.required, Validators.maxLength(3)]],
    alternate_code: [],
    location_code: [],
    station: [, Validators.required],
    borehole: [, [Validators.required]],
    commissioning_date: [],
    decommissioning_date: [],
    location_x: [],
    location_y: [],
    location_z: [],
    orientation_valid: [false, [Validators.required]],
    along_hole_z: [],
    part_number: [],
    manufacturer: [],
  });

  @ViewChild('inventoryForm', { static: false }) inventoryForm!: NgForm;
  submited = false;
  alongHoleZFormElSub!: Subscription;

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

  ngOnDestroy() {
    if (this.alongHoleZFormElSub) {
      this.alongHoleZFormElSub.unsubscribe();
      delete this.alongHoleZFormElSub;
    }
  }

  private async _initEditableForm() {
    try {
      this.myForm.controls['station'].disable({ onlySelf: true });
      this.myForm.controls['borehole'].disable({ onlySelf: true });
      const stationFormEl = this.myForm.get('station');
      if (!stationFormEl) {
        return;
      }
      this.filteredStations = stationFormEl.valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.name),
          map(name => name ? this._filterStation(name) : this.stations.slice())
        );

      const boreholeFormEl = this.myForm.get('borehole');
      if (!boreholeFormEl) {
        return;
      }

      this.filteredBoreholes = boreholeFormEl.valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.name),
          map(name => name ? this._filterBorehole(name) : this.boreholes.slice())
        );


      const alongHoleZFormEl = this.myForm.get('along_hole_z');
      if (!alongHoleZFormEl) {
        return;
      }

      this.alongHoleZFormElSub = alongHoleZFormEl.valueChanges.subscribe(val => {
        this.alongHoleZ.emit(val);
      });

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
    const dto = this.createDtoObject(this.myForm.getRawValue());

    this.submited = true;
    if (this.myForm.invalid) {
      console.log(`invalid`);

      return;
    }

    if (this.mode === PageMode.CREATE) {
      try {
        this.loading = true;
        this.loadingStart();
        const response = await this._inventoryApiService.createSensor(dto).toPromise();
        await this._toastrNotificationService.success('Sensor created');
        this.modelCreated.emit(response);
      } catch (err) {
        console.error(err);
        await this._toastrNotificationService.error(err);
      } finally {
        this.loading = false;
        this.loadingStop();
      }
    } else if (this.mode === PageMode.EDIT) {
      try {
        this.loading = true;
        this.loadingStart();
        const response = await this._inventoryApiService.updateSensor(this.model.id, dto).toPromise();
        this.modelEdited.emit(response);
        await this._toastrNotificationService.success('Sensor updated');
      } catch (err) {
        console.error(err);
        await this._toastrNotificationService.error(err);
      } finally {
        this.loading = false;
        this.loadingStop();
      }
    }
  }

  createDtoObject(formValues: any) {

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

  checkFixedStation() {

    const fixedStation = this.stationId && this.stations ? this.stations.find(station => station.id === +this.stationId) : null;

    if (fixedStation) {
      this.myForm.controls['station'].patchValue(fixedStation, { onlySelf: true });
      this.myForm.controls['station'].disable({ onlySelf: true });
    }
  }
}
