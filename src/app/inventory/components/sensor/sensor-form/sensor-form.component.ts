import { Component, OnInit, ViewChild, Input, Output, EventEmitter, TemplateRef, OnDestroy } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { startWith, map, debounceTime, switchMap, tap, filter, catchError, take } from 'rxjs/operators';
import { Observable, Subscription, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Site, Station, Borehole } from '@interfaces/inventory.interface';
import { SensorCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { MatDialog, MatAutocompleteTrigger, MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material';
import { Form } from '@core/classes/form.class';

@Component({
  selector: 'app-sensor-form',
  templateUrl: './sensor-form.component.html',
  styleUrls: ['./sensor-form.component.scss']
})

export class SensorFormComponent extends Form<Sensor> implements OnInit, OnDestroy {

  @Input()
  set stations(v: Station[]) {

    // this.checkFixedStation();
  }
  get stations(): Station[] {
    return this._stations;
  }
  private _stations: Station[] = [];
  autoStationLoading = false;
  autoStationValue!: Sensor;
  autoStationInitialized = false;

  @Input()
  set boreholes(v: Borehole[]) {

  }
  get boreholes(): Borehole[] {
    return this._boreholes;
  }
  private _boreholes: Borehole[] = [];
  autoBoreholeLoading = false;
  autoBoreholeValue!: Borehole;
  autoBoreholeInitialized = false;

  @Input()
  public set stationId(v: number) {
    this._stationId = v;
    if (this._stationId) {
      this.getStation(this._stationId);
    }
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
    station: ['', Validators.required],
    borehole: ['', [Validators.required]],
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

  autoStationSelected($event: MatAutocompleteSelectedEvent) {
    this.autoStationValue = $event.option.value;
  }

  autoBoreholeSelected($event: MatAutocompleteSelectedEvent) {
    this.autoBoreholeValue = $event.option.value;
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

  async autoStationFocused() {
    if (!this.autoStationInitialized) {
      this.autoStationInitialized = true;
      await this._initAutoStation();
    }
  }

  private async _initAutoStation() {
    return new Promise((resolve, reject) => {
      try {
        const stationFormEl = this.myForm.get('station');
        if (!stationFormEl) {
          return;
        }
        this.filteredStations = stationFormEl.valueChanges
          .pipe(
            startWith(this.myForm.value['station'] ? this.myForm.value['station'] : ''),
            map(value => !value || typeof value === 'string' ? value : value.code),
            debounceTime(400),
            tap(val => this.autoStationLoading = true),
            switchMap(value => (!this.autoStationValue || this.autoStationValue.code !== value) ? this._inventoryApiService.getStations({ search: value, page_size: 5 }) : of({ results: [] })),
            tap(val => this.autoStationLoading = false),
            map(value => value.results),
            tap(val => resolve()),
          );
      } catch (err) {
        console.error(err);
        reject();
      }
    });
  }


  async autoBoreholeFocused() {
    if (!this.autoBoreholeInitialized) {
      await this._initAutoBorehole();
      this.autoBoreholeInitialized = true;
    }
  }
  private async _initAutoBorehole() {
    try {
      const boreholeFormEl = this.myForm.get('borehole');
      if (!boreholeFormEl) {
        return;
      }

      this.filteredBoreholes = boreholeFormEl.valueChanges
        .pipe(
          startWith(this.myForm.value['borehole'] ? this.myForm.value['borehole'] : ''),
          map(value => !value || typeof value === 'string' ? value : value.name),
          debounceTime(400),
          tap(val => this.autoBoreholeLoading = true),
          switchMap(value => (!this.autoBoreholeValue || this.autoBoreholeValue.name !== value) ? this._inventoryApiService.getBoreholes({ search: value, page_size: 5 }) : of({ results: [] })),
          tap(val => this.autoBoreholeLoading = false),
          map(value => value.results)
        );

    } catch (err) {
      console.error(err);
    }
  }

  private async _initEditableForm() {
    try {

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

  stationDisplayFn(station?: Station): string | undefined {
    return station ? station.code : undefined;
  }

  boreholeDisplayFn(borehole?: Borehole): string | undefined {
    return borehole ? borehole.name : undefined;
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
    return dto;
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }

  async getStation(id: number) {
    try {
      if (!id) {
        return;
      }
      const response = await this._inventoryApiService.getStation(id).toPromise();
      this.myForm.patchValue({ station: response }, { emitEvent: false, onlySelf: false });
    } catch (err) {
      console.log(err);
    }
  }
}
