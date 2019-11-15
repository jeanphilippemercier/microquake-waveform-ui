import { Component } from '@angular/core';
import { forkJoin, of, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, Station, Borehole, IComponent, ComponentCode, SensorType, CableType, ISensorType } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, ComponentFormDialogData } from '@interfaces/dialogs.interface';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { DetailPage } from '@core/classes/detail-page.class';
import { InterpolateBoreholeQuery } from '@interfaces/inventory-query.interface';
import { LoadingService } from '@services/loading.service';
import { ComponentFormDialogComponent } from '@app/inventory/dialogs/component-form-dialog/component-form-dialog.component';

@Component({
  selector: 'app-inventory-sensor-detail-page',
  templateUrl: './inventory-sensor-detail-page.component.html',
  styleUrls: ['./inventory-sensor-detail-page.component.scss']
})
export class InventorySensorDetailPageComponent extends DetailPage<Sensor> {



  public get model(): Sensor | null {
    return this._model;
  }

  public set model(v: Sensor | null) {
    this._model = v;

    this.availableComponentCodes = Object.values(ComponentCode);
    if (this.model && this.model.components) {
      this.model.components.map(val => {
        const idx = this.availableComponentCodes.findIndex(componentCode => componentCode === val.code);

        if (idx > -1) {
          this.availableComponentCodes.splice(idx, 1);
        }
      });
    }
  }


  private _model: Sensor | null = null;

  basePageUrlArr = ['/inventory/sensors'];
  PageMode = PageMode;
  stations!: Station[];
  boreholes!: Borehole[];
  queryParams: Params = {};
  submited = false;
  availableComponentCodes: ComponentCode[] = Object.values(ComponentCode);

  sensorTypes: ISensorType[] = [];
  cableTypes: CableType[] = [];

  componentslInitialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  mapTabs = [
    '',
    'components',
    'signalQuality',
  ];



  constructor(
    protected _activatedRoute: ActivatedRoute,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _ngxSpinnerService: NgxSpinnerService,
    private _inventoryApiService: InventoryApiService,
    private _toastrNotificationService: ToastrNotificationService,
    private _loadingService: LoadingService
  ) {
    super(_activatedRoute, _router, _matDialog, _ngxSpinnerService);
    this.queryParams = this._activatedRoute.snapshot.queryParams;
  }

  handleTabInit(idx: number) {
    if ([0, 1, 2].indexOf(idx) > -1) {
      if (!this.detailInitialized.getValue()) {
        this._initDetail();
      }
    }

    if (idx === 1) {
      if (!this.componentslInitialized.getValue()) {
        this._initComponents();
      }
    }
  }

  private async _initDetail() {
    this.loadingStart();

    forkJoin([
      (this.id ? this._inventoryApiService.getSensor(this.id) : of(null)),
      this._inventoryApiService.getStations({ page_size: 10000 }),
      this._inventoryApiService.getBoreholes({ page_size: 10000 }),
    ]).subscribe(
      result => {
        this.model = result[0];
        this.stations = result[1].results;
        this.boreholes = result[2].results;
        this.detailInitialized.next(true);
      }, err => {
        this._toastrNotificationService.error(err);
        console.error(err);
      }).add(() => {
        this.loadingStop();
      });
  }

  private async _initComponents() {
    this.loadingStart();
    forkJoin([
      this._inventoryApiService.getSensorTypes(),
      this._inventoryApiService.getCableTypes(),
    ]).subscribe(
      result => {
        this.sensorTypes = result[0];
        this.cableTypes = result[1];
        this.componentslInitialized.next(true);
      }, err => {
        this._toastrNotificationService.error(err);
        console.error(err);
      }).add(() => {
        this.loadingStop();
      });
  }

  delete(sensorId: number) {
    if (!sensorId) {
      console.error(`No sensorId`);
      this._toastrNotificationService.error('No sensor is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
      hasBackdrop: true,
      width: '350px',
      data: {
        header: `Are you sure?`,
        text: `Do you want to proceed and delete this sensor?`
      }
    });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          this.loadingStart();
          const response = await this._inventoryApiService.deleteSensor(sensorId).toPromise();
          await this._toastrNotificationService.success('Sensor deleted');
        } catch (err) {
          this._toastrNotificationService.error(err);
          console.error(err);
        } finally {
          this.loadingStop();
        }
      }
    });
  }

  deleteComponent(componentId: number) {
    if (!componentId) {
      console.error(`No componentId`);
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
      hasBackdrop: true,
      width: '350px',
      data: {
        header: `Are you sure?`,
        text: `Do you want to proceed and delete this component?`
      }
    });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          this.loadingStart();
          await this._inventoryApiService.deleteComponent(componentId).toPromise();
          const response = await this._inventoryApiService.getSensor(this.id).toPromise();
          this.model = response;
          this._toastrNotificationService.success('Component deleted');
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          this.loadingStop();
        }
      }
    });
  }

  openDetail($event: Sensor) {
    this._router.navigate(['/inventory/sensors', $event.id]);
  }

  async calculateLocation() {
    try {
      if (!this.model) {
        this._toastrNotificationService.error('No model is defined');
        return;
      }

      if (this.model.along_hole_z === null) {
        this._toastrNotificationService.error('Please define depth along the borehole (Along hole z)');
        return;
      }

      if (!this.model.borehole) {
        this._toastrNotificationService.error('No borehole is defined');
        return;
      }

      const query: InterpolateBoreholeQuery = {
        alonghole_depth: this.model.along_hole_z
      };
      this._loadingService.start();
      const response = await this._inventoryApiService.interpolateBorehole(this.model.borehole.id, query).toPromise();

      this.model = {
        ...this.model,
        location_x: response.location.x,
        location_y: response.location.y,
        location_z: response.location.z
      };
      this._toastrNotificationService.success(`Location calculated. Click on Save button to save calculated values`);
      console.log(response);

    } catch (err) {
      console.error(err);
      const errMsg = err.error && err.error.alonghole_depth && err.error.alonghole_depth[0] ? err.error.alonghole_depth[0] : err;
      this._toastrNotificationService.error(errMsg);
      return;
    } finally {
      this._loadingService.stop();
    }
  }

  alongHoleZChanged($event: any) {
    if (this.model) {
      this.model.along_hole_z = $event;
    }
  }

  async openComponentFormDialog($event?: IComponent) {


    const formDialogRef = this._matDialog.open<ComponentFormDialogComponent, ComponentFormDialogData>(
      ComponentFormDialogComponent, {
      hasBackdrop: true,
      autoFocus: false,
      data: {
        mode: $event ? PageMode.EDIT : PageMode.CREATE,
        model: $event ? $event : {},
        sensorId: this.id,
        sensorTypes: this.sensorTypes,
        cables: this.cableTypes,
        availableComponentCodes: this.availableComponentCodes
      }
    });

    formDialogRef.afterClosed().pipe(first()).subscribe(async (val) => {
      if (val) {
        try {
          this.loadingStart();
          const response = await this._inventoryApiService.getSensor(this.id).toPromise();
          this.model = response;
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          this.loadingStop();
        }
      }
    });
  }
}
