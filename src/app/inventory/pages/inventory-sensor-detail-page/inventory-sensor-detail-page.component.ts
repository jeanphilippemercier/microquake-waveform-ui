import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Station, Borehole } from '@interfaces/inventory.interface';
import { SensorUpdateInput, SensorCreateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';

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

    this.params$ = this._activatedRoute.params.subscribe(async params => {
      if (params['sensorId'] === PageMode.CREATE || params['pageMode'] === PageMode.CREATE) {
        this.pageMode = PageMode.CREATE;
      } else {
        if (params['pageMode'] === PageMode.EDIT) {
          this.pageMode = PageMode.EDIT;
        } else {
          this.pageMode = PageMode.VIEW;
        }
        this.sensorId = params['sensorId'];
      }
    });
  }

  ngOnDestroy() {
    if (this.params$) {
      this.params$.unsubscribe();
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

}
