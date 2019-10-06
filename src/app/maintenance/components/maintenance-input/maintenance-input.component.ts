import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { ENTER, TAB } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map } from 'rxjs/operators';
import { MatDialog, MatDialogRef, MatAutocomplete } from '@angular/material';

import { Station } from '@interfaces/inventory.interface';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
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

  @ViewChild('auto', { static: false }) autoCompleteEl: MatAutocomplete;

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
  addOnBlur = false;
  addingChip = false;
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
    protected _matDialog: MatDialog,
  ) { }

  ngOnInit() {

    this.filteredFruits = this.fruitCtrl.valueChanges.pipe(
      // startWith(null),
      map((fruit: string | null) => this._filter(fruit)));

  }

  onKeypressEnter($event: KeyboardEvent) {
    if (this.addingChip) {
      return;
    }

    this.onSubmit();
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

  selected($event: MatAutocompleteSelectedEvent): any {
    this.addingChip = true;
    const val = $event.option.value;
    this._addChip(val);

    setTimeout(_ => {
      this.addingChip = false;
    }, 250);
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
          .filter(val => val.name.toLowerCase().indexOf(filterValue) > -1)
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
          .filter(val => val.code.toLowerCase().indexOf(filterValue) > -1)
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
