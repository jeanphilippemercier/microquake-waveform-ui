import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';

import { PageMode } from '@interfaces/core.interface';
import { Sensor, ISensorType, CableType, Station } from '@interfaces/inventory.interface';
import { MaintenanceEventCreateInput, MaintenanceEventUpdateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog, MatDialogRef, MatAutocompleteSelectedEvent, MatSelectChange } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { Form } from '@core/classes/form.class';
import { MaintenanceEvent, MaintenanceCategory, MaintenanceStatus } from '@interfaces/maintenance.interface';
import { FileSystemDirectoryEntry, FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';

@Component({
  selector: 'app-maintenance-form',
  templateUrl: './maintenance-form.component.html',
  styleUrls: ['./maintenance-form.component.scss']
})

export class MaintenanceFormComponent extends Form<MaintenanceEvent> implements OnInit {

  @Input()

  public set stationFixed(v: Station) {
    this._stationFixed = v;
    if (this._stationFixed) {
      this.myForm.controls['station'].disable({ onlySelf: true });
    }
  }

  public get stationFixed(): Station {
    return this._stationFixed;
  }
  private _stationFixed: Station;

  @Input() stations: Station[] = [];
  @Input() maintenanceStatuses: MaintenanceStatus[] = [];
  @Input() maintenanceCategories: MaintenanceCategory[] = [];

  @Output() maintenanceCategoryChanged: EventEmitter<string> = new EventEmitter();
  @Output() maintenanceStationChanged: EventEmitter<Station> = new EventEmitter();
  @Output() descriptionChanged: EventEmitter<string> = new EventEmitter();

  editDisabled = false;
  deleteDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  filteredStations: Observable<Station[]>;

  myForm = this._fb.group({
    date: [new Date(), [Validators.required]],
    status: [, [Validators.required]],
    station: [, Validators.required],
    category: [, Validators.required],
    description: [],
  });

  submited = false;
  public files: NgxFileDropEntry[] = [];

  public async dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    const unuploaed = files.map(val => ({
      id: null,
      description: null,
      file: val.relativePath,
      fileObj: val,
      uploading: true,
      error: false
    }));
    this.model.attachments = [...unuploaed, ...this.model.attachments];
    const tmpFiles = [...this.files];

    for (let i = 0; i < unuploaed.length; i++) {
      const droppedFile = unuploaed[i].fileObj;
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file(async (file: File) => {

          try {

            const formData = new FormData();
            formData.append('file', file);
            const response = await this._inventoryApiService.addAttachmentToMaintenanceEvent(this.model.id, formData).toPromise();
            Object.assign(unuploaed[i], response);
            unuploaed[i].uploading = false;
          } catch (err) {
            unuploaed[i].uploading = false;
            unuploaed[i].error = true;
            console.error(err);
            this._toastrNotificationService.error(err);
          }

        });
      } else {
        this._toastrNotificationService.error('Folder uploads are not supported');
      }
    }
  }

  public fileOver(event) {
    console.log(`fileOver`);
    console.log(event);
  }

  public fileLeave(event) {
    console.log(`fileLeave`);
    console.log(event);
  }

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router,
    private _ngxSpinnerService: NgxSpinnerService,
    protected _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super();
  }

  async ngOnInit() {
    this._initEditableForm();
  }

  private async _initEditableForm() {

    try {
      this.filteredStations = this.myForm.get('station').valueChanges
        .pipe(
          startWith(''),
          map(value => !value || typeof value === 'string' ? value : value.name),
          map(input => input ? this._filter<Station>(input, this.stations, 'name') : (this.stations ? this.stations.slice() : []))
        );

    } catch (err) {
      console.error(err);
    }
  }

  stationDisplayFn(sensor?: Sensor): string | undefined {
    return sensor ? sensor.name : undefined;
  }

  private _buildUpdateDtoObject(formValues: any): MaintenanceEventUpdateInput {

    const dto: MaintenanceEventUpdateInput = formValues;

    if (!dto) {
      throw new Error('No form is defined');
    }

    if (formValues.date) {
      formValues.date = moment(formValues.date).format('YYYY-MM-DD');
    } else {
      throw new Error('No date is defined');
    }

    if (!formValues.status) {
      throw new Error('No status is defined');
    }

    if (!formValues.category) {
      throw new Error('No category is defined');
    }

    if (!formValues.station) {
      throw new Error('No station is defined');
    }

    if (!formValues.description) {
      throw new Error('No description is defined');
    }


    // if (formValues.category && formValues.category.name) {
    //   dto.category = formValues.category.name;
    // } else {
    //   throw new Error('No category is defined');
    // }

    return dto;
  }


  private _buildCreateDtoObject(formValues: any): MaintenanceEventCreateInput {
    const dto = <MaintenanceEventCreateInput>this._buildUpdateDtoObject(formValues);

    // if (this.sensorId) {
    //   dto.sensor_id = this.sensorId;
    // } else {
    //   throw new Error('No sensor is defined');
    // }

    return dto;
  }

  async onSubmit() {

    this.submited = true;
    // if (this.myForm.invalid) {
    //   this._toastrNotificationService.error('Form is not valid');
    //   return;
    // }

    try {

      let response: any;
      await this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
      this.loading = true;

      if (this.mode === PageMode.CREATE) {
        const dto = this._buildCreateDtoObject(this.myForm.getRawValue());

        response = await this._inventoryApiService.createMaintenanceEvent(dto).toPromise();
        this._toastrNotificationService.success('Maintenance event created');
        this.modelCreated.emit(response);

      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.getRawValue());
        response = await this._inventoryApiService.updateMaintenanceEvent(this.model.id, dto).toPromise();
        this._toastrNotificationService.success('Maintenance event updated');
        this.modelEdited.emit(response);
      }
      console.log(response);
      // this._router.navigate(['/inventory/sensors', response.id]);

    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      this._ngxSpinnerService.hide('loading');
    }
  }

  categorySelected($event: MatSelectChange) {
    this.maintenanceCategoryChanged.emit($event.value);
  }

  stationSelected($event: MatAutocompleteSelectedEvent) {
    this.maintenanceStationChanged.emit($event.option.value);
  }

  descriptionChange($event) {
    const val = $event.target.value;
    this.descriptionChanged.emit(val);
  }

}
