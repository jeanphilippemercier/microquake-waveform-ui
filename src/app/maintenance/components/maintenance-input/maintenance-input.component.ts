import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ENTER, TAB } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { map } from 'rxjs/operators';
import { MatDialog, MatDialogRef, MatAutocomplete } from '@angular/material';

import { Station } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { MaintenanceCategory, MaintenanceStatus, MaintenanceEvent } from '@interfaces/maintenance.interface';
import { MaintenanceFormComponent } from '../maintenance-form/maintenance-form.component';

enum MaintenanceType {
  STATUS = 'status',
  STATION = 'station',
  CATEGORY = 'category'
}
interface MaintenanceInput {
  name: string;
  type: MaintenanceType;
  obj: any;
}
@Component({
  selector: 'app-maintenance-input',
  templateUrl: './maintenance-input.component.html',
  styleUrls: ['./maintenance-input.component.scss']
})

export class MaintenanceInputComponent implements OnInit {


  @Input()
  public set maintenanceStatuses(v: MaintenanceStatus[]) {
    this._maintenanceStatuses = v;
    if (this._maintenanceStatuses && this._maintenanceStatuses[0]) {
      this.model.status = this.maintenanceStatuses[0].name;
      this.model = { ...this.model };
    }
  }

  public get maintenanceStatuses(): MaintenanceStatus[] {
    return this._maintenanceStatuses;
  }
  private _maintenanceStatuses: MaintenanceStatus[] = [];


  @Input() maintenanceCategories: MaintenanceCategory[] = [];
  @Input() stations: Station[] = [];
  @Input()
  public set stationFixed(v: Station) {
    this._stationFixed = v;
    if (this._stationFixed) {
      console.log(`this._stationFixed`);
      console.log(this._stationFixed);

      this.stationChanged(this._stationFixed);
    }
  }
  public get stationFixed(): Station {
    return this._stationFixed;
  }
  private _stationFixed: Station;

  @Output() created: EventEmitter<MaintenanceEvent> = new EventEmitter();

  @ViewChild('maintenanceForm', { static: false }) maintenanceForm: MaintenanceFormComponent;

  editDisabled = false;
  deleteDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  filteredStations: Observable<Station[]>;

  submited = false;

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, TAB];
  fruitCtrl = new FormControl();
  filteredFruits: Observable<MaintenanceInput[]>;
  fruits: MaintenanceInput[] = [];
  model: Partial<MaintenanceEvent> = {};

  MaintenanceType = MaintenanceType;

  openForm = false;

  @ViewChild('fruitInput', { static: false }) fruitInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto', { static: false }) matAutocomplete: MatAutocomplete;


  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    private _router: Router,
    private _ngxSpinnerService: NgxSpinnerService,
    protected _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService
  ) {

  }

  ngOnInit() {
    // this.fruits = [...this.maintenanceStatuses.map(val => ({
    //   name: val.name,
    //   type: MaintenanceType.STATUS,
    //   obj: val
    // }))];

    // this.fruits = [...this.fruits, ...this.maintenanceCategories.map(val => ({
    //   name: val.name,
    //   type: MaintenanceType.CATEGORY,
    //   obj: val
    // }))];

    // this.fruits = [...this.fruits, ...this.stations.map(val => ({
    //   name: val.name,
    //   type: MaintenanceType.STATION,
    //   obj: val
    // }))];

    this.filteredFruits = this.fruitCtrl.valueChanges.pipe(
      // startWith(null),
      map((fruit: string | null) => this._filter(fruit)));

  }


  add(event: MatChipInputEvent): void {

    // Add fruit only when MatAutocomplete is not open
    // To make sure this does not conflict with OptionSelected Event
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      // // Add our fruit
      // if ((value || '').trim()) {
      //   this.fruits.push(value);
      // }

      // // Reset the input value
      // if (input) {
      //   input.value = '';
      // }

      this.fruitCtrl.setValue(null);
    }
  }

  remove(fruit: MaintenanceInput): void {
    if (this.stationFixed && fruit.type === MaintenanceType.STATION) {
      return;
    }

    const index = this.fruits.indexOf(fruit);

    if (index >= 0) {
      const val = this.fruits.splice(index, 1)[0];

      switch (val.type) {
        case MaintenanceType.CATEGORY:
          this.model.category = null;
          break;
        case MaintenanceType.STATION:
          this.model.station = null;
          break;

      }
    }
    this.model = { ...this.model };
  }

  selected(event: MatAutocompleteSelectedEvent): any {
    const val = event.option.value;
    this._addChip(val);
  }

  private _addChip(val: MaintenanceInput) {
    switch (val.type) {
      case MaintenanceType.CATEGORY:
        this.model.category = val.obj.name;
        break;
      case MaintenanceType.STATION:
        this.model.station = val.obj;
        break;
    }

    this.model = { ...this.model };

    this.fruits.push(val);
    if (this.fruitInput) {
      this.fruitInput.nativeElement.value = '';
    }
    this.fruitCtrl.setValue(null);
  }

  private _filter(value: string): any[] {
    if (typeof value !== 'string') {
      return [];
    }
    const filterAction = value && value[0] ? value[0] : '';
    const filterValue = value && typeof value === 'string' ? value.toLowerCase().substr(1) : '';
    switch (filterAction) {
      case '#':
        if (this.model.category) {
          return;
        }

        return this.maintenanceCategories
          .filter(val => val.name.indexOf(filterValue) > -1)
          .map(val => ({
            name: val.name,
            type: MaintenanceType.CATEGORY,
            obj: val
          }));
        break;
      case '@':
        if (this.model.station) {
          return;
        }

        return this.stations
          .filter(val => val.code.indexOf(filterValue) > -1)
          .map(val => ({
            name: val.code,
            type: MaintenanceType.STATION,
            obj: val
          }));
        break;

      default:
        this.model.description = value;
        this.model = { ...this.model };
        break;
    }

    return [];
    // return this.allFruits.filter(fruit => fruit.toLowerCase().indexOf(filterValue) === 0);
  }

  categoryChanged($event: string) {
    this.model.category = $event;
    const idx = this.fruits.findIndex(val => val.type === MaintenanceType.CATEGORY);
    let chip: MaintenanceInput;

    if (idx > -1) {
      chip = this.fruits[idx];
    }

    if (!$event && idx > -1) {
      this.fruits.splice(idx, 1);
      return;
    }

    const category = this.maintenanceCategories.find(val => val.name === $event);

    if (!chip) {
      this._addChip({
        name: $event,
        type: MaintenanceType.CATEGORY,
        obj: category
      });
    } else {
      Object.assign(chip, {
        name: $event,
        type: MaintenanceType.CATEGORY,
        obj: category
      });
    }
  }

  stationChanged($event: Station) {
    this.model.station = $event;
    const idx = this.fruits.findIndex(val => val.type === MaintenanceType.STATION);
    let chip: MaintenanceInput;

    if (idx > -1) {
      chip = this.fruits[idx];
    }

    if (!$event && idx > -1) {
      this.fruits.splice(idx, 1);
      return;
    }

    if (!chip) {
      this._addChip({
        name: $event.code,
        type: MaintenanceType.STATION,
        obj: $event
      });
    } else {
      Object.assign(chip, {
        name: $event.code,
        type: MaintenanceType.STATION,
        obj: $event
      });
    }
  }

  descriptionChanged($event: string) {
    this.model.description = $event;
    if (this.fruitInput) {
      this.fruitInput.nativeElement.value = $event;
    }
    this.fruitCtrl.setValue($event);
  }

  onSubmit() {
    this.maintenanceForm.onSubmit();
  }

  onCreated($event: MaintenanceEvent) {
    this.created.emit($event);
    this.categoryChanged(null);
    this.descriptionChanged('');
    if (!this.stationFixed) {
      this.stationChanged(null);
    }
    this.openForm = false;
  }
}
