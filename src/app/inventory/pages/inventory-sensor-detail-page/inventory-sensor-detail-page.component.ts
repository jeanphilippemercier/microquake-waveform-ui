import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Site, Station, Borehole } from '@interfaces/inventory.interface';
import { SensorUpdateInput, SensorCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';

@Component({
  selector: 'app-inventory-sensor-detail-page',
  templateUrl: './inventory-sensor-detail-page.component.html',
  styleUrls: ['./inventory-sensor-detail-page.component.scss']
})

export class InventorySensorDetailPageComponent implements OnInit, OnDestroy {

  params$: Subscription;
  sensorId: number;
  sensor: Sensor | SensorUpdateInput | SensorCreateInput = {};

  editDisabled = false;
  pageMode: PageMode = PageMode.VIEW;
  PageMode = PageMode;
  loading = false;

  // sites: Site[];
  // filteredSites: Observable<Site[]>;

  stations: Station[];
  filteredStations: Observable<Station[]>;

  boreholes: Borehole[];
  filteredBoreholes: Observable<Borehole[]>;

  myForm = this._fb.group({
    enabled: [false],
    name: [, [Validators.required]],
    code: [, [Validators.required]],
    // site: [, Validators.required],
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

  @ViewChild('inventoryForm') inventoryForm: NgForm;
  submited = false;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router
  ) { }

  async ngOnInit() {



    this.params$ = this._activatedRoute.params.subscribe(async params => {

      if (params['sensorId'] === PageMode.CREATE || params['pageMode'] === PageMode.CREATE) {
        this.pageMode = PageMode.CREATE;
        this.initEditableForm();
      } else {
        if (params['pageMode'] === PageMode.EDIT) {
          this.pageMode = PageMode.EDIT;
          this.initEditableForm();
        } else {
          this.pageMode = PageMode.VIEW;
          this.myForm.disable();
        }
        this.sensorId = params['sensorId'];
        this.sensor = await this._inventoryApiService.getSensor(this.sensorId).toPromise();
        this.myForm.patchValue(Object.assign(this.myForm.value, this.sensor));
      }
    });
  }

  ngOnDestroy() {
    if (this.params$) {
      this.params$.unsubscribe();
    }
  }

  async initEditableForm() {
    try {
      // this.sites = await this._inventoryApiService.getSites().toPromise();
      this.stations = (await this._inventoryApiService.getStations({ page_size: 10000 }).toPromise()).results;
      this.boreholes = (await this._inventoryApiService.getBoreholes({ page_size: 10000 }).toPromise()).results;

      // this.filteredSites = this.myForm.get('site').valueChanges
      //   .pipe(
      //     startWith(''),
      //     map(value => !value || typeof value === 'string' ? value : value.name),
      //     map(name => name ? this._filterSite(name) : this.sites.slice())
      //   );

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

  // private _filterSite(name: string): Site[] {
  //   const filterValue = name.toLowerCase();
  //   return this.sites.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
  // }

  private _filterStation(name: string): Station[] {
    const filterValue = name.toLowerCase();
    return this.stations.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
  }

  private _filterBorehole(name: string): Borehole[] {
    const filterValue = name.toLowerCase();
    return this.boreholes.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
  }

  // async onSiteInputClick() {
  //   if (!this.sites) {
  //     this.sites = await this._inventoryApiService.getSites().toPromise();
  //   }
  // }

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
        const response = await this._inventoryApiService.createSensor(dto).toPromise();
        this._router.navigate(['/inventory/sensors', response.id]);
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
      }
    } else if (this.pageMode === PageMode.EDIT) {
      try {
        this.loading = true;
        const response = await this._inventoryApiService.updateSensor(this.sensorId, dto).toPromise();
        this._router.navigate(['/inventory/sensors', response.id]);
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
      }
    }
  }

  createDtoObject(formValues: any) {
    if (!formValues) {
      return;
    }

    const dto: SensorCreateInput = formValues;

    // if (formValues.site && formValues.site.id) {
    //   dto.site_id = formValues.site.id;
    //   delete formValues.site;
    // }

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
