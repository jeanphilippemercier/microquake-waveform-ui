import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Form } from '@core/classes/form.class';
import { Observable } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

import { PageMode } from '@interfaces/core.interface';
import { MicroquakeEventTypeCreateInput, MicroquakeEventTypeUpdateInput, TraceLabelCreateInput, TraceLabelUpdateInput } from '@interfaces/inventory-dto.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { EventType, QuakemlType } from '@interfaces/event.interface';
import { Site, TraceLabel } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-trace-label-form',
  templateUrl: './trace-label-form.component.html',
  styleUrls: ['./trace-label-form.component.scss']
})

export class TraceLabelFormComponent extends Form<TraceLabel> implements OnInit {

  @Input()
  takenEventTypes!: number[];
  @Input()
  eventTypes!: EventType[];

  filteredSites!: Observable<Site[]>;

  myForm = this._fb.group({
    name: [, [Validators.required]],
    event_type: [],
    priority: [],
  });

  @ViewChild('inventoryForm', { static: false }) inventoryForm!: NgForm;
  submited = false;

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

    const foundEventType = this.eventTypes.find(val => val.id === this.model.event_type);
    console.log(this.eventTypes);
    console.log(this.model);
    if (foundEventType) {
      console.log('found!');
      this.myForm.patchValue({ event_type: foundEventType });
    }

  }

  private _buildUpdateDtoObject(formValues: any): TraceLabelUpdateInput {
    const dto: TraceLabelUpdateInput = formValues;

    if (!dto) {
      throw new Error('No form is defined');
    }

    if (formValues.event_type && formValues.event_type.id) {
      dto.event_type = formValues.event_type.id;
    }

    return dto;
  }


  private _buildCreateDtoObject(formValues: any): TraceLabelCreateInput {
    const dto: TraceLabelCreateInput = <TraceLabelCreateInput>this._buildUpdateDtoObject(formValues);
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
        response = await this._inventoryApiService.createTraceLabel(dto).toPromise();
        this._toastrNotificationService.success('Trace label created');
        this.modelCreated.emit(response);

      } else if (this.mode === PageMode.EDIT) {
        const dto = this._buildUpdateDtoObject(this.myForm.value);
        response = await this._inventoryApiService.updateTraceLabel(this.model.id, dto).toPromise();
        this._toastrNotificationService.success('Trace label updated');
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

  isEventTypeTaken(eventType: EventType): boolean {
    return (this.takenEventTypes?.findIndex((val) => val === eventType.id) ?? -1) > -1;
  }

}
