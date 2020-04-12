import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Form } from '@core/classes/form.class';
import { Observable } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

import { PageMode } from '@interfaces/core.interface';
import { MicroquakeEventTypeCreateInput, MicroquakeEventTypeUpdateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { EventType, QuakemlType, QuakemlTypeWithMappedMicroquakeType } from '@interfaces/event.interface';
import { Site, TakenEventType } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-microquake-event-type-form',
  templateUrl: './microquake-event-type-form.component.html',
  styleUrls: ['./microquake-event-type-form.component.scss']
})

export class MicroquakeEventTypeFormComponent extends Form<EventType> implements OnInit {

  @Input()
  sites: Site[] = [];
  @Input()
  takenEventTypes!: TakenEventType[];
  @Input()
  quakemlTypes!: QuakemlTypeWithMappedMicroquakeType[];

  filteredSites!: Observable<Site[]>;

  myForm = this._fb.group({
    microquake_type: [, [Validators.required]],
    quakeml_type: [, [Validators.required]],
    site: [, [Validators.required]],
    identifier: [],
    countable: [],
  });

  @ViewChild('inventoryForm', { static: false }) inventoryForm!: NgForm;
  submited = false;
  QuakemlType = QuakemlType;
  allQuakemlTypes = Object.values(QuakemlType);

  constructor(
    private _inventoryApiService: InventoryApiService,
    private _fb: FormBuilder,
    protected _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService,
    protected _matDialog: MatDialog
  ) {
    super(_ngxSpinnerService);
  }

  ngOnInit() {
    this._initEditableForm();
  }

  private _initEditableForm() {
    const foundSite = this.sites.find(val => val.id === this.model.site);
    if (foundSite) {
      this.myForm.patchValue({ site: foundSite });
    }

    const foundQuakemlType = this.quakemlTypes.find(val => val.quakeml_type === this.model.quakeml_type);
    if (foundQuakemlType) {
      this.myForm.patchValue({ quakeml_type: foundQuakemlType });
    }

    const siteFormEl = this.myForm.get('site');
    if (!siteFormEl) {
      return;
    }
    this.filteredSites = siteFormEl.valueChanges
      .pipe(
        startWith(''),
        map(value => !value || typeof value === 'string' ? value : value.name),
        map(input => input ? this._filter<Site>(input, this.sites, 'name') : this.sites.slice())
      );
  }

  private _buildUpdateDtoObject(formValues: any): MicroquakeEventTypeUpdateInput {
    const dto: MicroquakeEventTypeUpdateInput = formValues;

    if (!dto) {
      throw new Error('No form is defined');
    }

    if (formValues.site && formValues.site.id) {
      dto.site = formValues.site.id;
    }

    if (formValues.quakeml_type && formValues.quakeml_type.id) {
      dto.quakeml_type = formValues.quakeml_type.id;
    }

    return dto;
  }


  private _buildCreateDtoObject(formValues: any): MicroquakeEventTypeCreateInput {
    const dto: MicroquakeEventTypeCreateInput = <MicroquakeEventTypeCreateInput>this._buildUpdateDtoObject(formValues);
    return dto;
  }

  async onSubmit() {

    this.submited = true;
    if (this.myForm.invalid) {
      this._toastrNotificationService.error('Form is not valid');
      return;
    }

    try {

      let response: any;
      this.loadingStart();
      this.loading = true;

      if (this.mode === PageMode.CREATE) {
        const dto = this._buildCreateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.createMicroquakeEventType(dto).toPromise();
        this._toastrNotificationService.success('Microquake event type created');
        this.modelCreated.emit(response);

      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.updateMicroquakeEventType(this.model.id, dto).toPromise();
        this._toastrNotificationService.success('Microquake event type updated');
        this.modelEdited.emit(response);
      }

    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      this.loadingStop();
    }
  }

  siteDisplayFn(site?: Site): string | undefined {
    return site ? site.name : undefined;
  }

  isQuakemlTypeTaken(quakemlType: QuakemlType): number {
    const idx = this.takenEventTypes.findIndex((val: TakenEventType) => val.quakeml_type === quakemlType);
    return idx;
  }

  takenQuakemlType(idx: number): string {
    if (idx > -1) {
      return '(' + this.takenEventTypes[idx].microquake_type.microquake_type + ')';
    }
    return '';
  }

}
