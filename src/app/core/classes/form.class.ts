import { Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { PageMode } from '@interfaces/core.interface';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';

export class Form<T> implements OnDestroy {

  @Input()
  public set model(v: T) {
    this._model = v;
    this.modelChange.emit(this._model);
    this.myForm.patchValue(Object.assign(this.myForm.value, this._model));
  }

  public get model() {
    return this._model;
  }
  private _model!: T;
  protected _unsubscribe = new Subject<void>();

  @Input() mode: PageMode = PageMode.CREATE;
  @Output() modelChange: EventEmitter<Partial<T> | null> = new EventEmitter();
  @Output() modelCreated: EventEmitter<Partial<T>> = new EventEmitter();
  @Output() modelEdited: EventEmitter<Partial<T>> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();

  editDisabled = false;
  PageMode = PageMode;
  loading = false;
  myForm!: FormGroup;

  constructor(
    protected _ngxSpinnerService: NgxSpinnerService
  ) { }


  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  protected _filter<U>(input: string, array: U[], name: string): U[] {
    const filterValue = input.toLowerCase();
    return array.filter((option: any) => option[name] && option[name].toLowerCase().indexOf(filterValue) === 0);
  }

  onCancel() {
    this.cancel.emit();
  }

  async loadingFormStart(loadingElName = 'loadingForm') {
    await this._ngxSpinnerService.show(loadingElName, { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingFormStop(loadingElName = 'loadingForm') {
    await this._ngxSpinnerService.hide(loadingElName);
  }

  async loadingStart(loadingElName = 'loading') {
    await this._ngxSpinnerService.show(loadingElName, { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingStop(loadingElName = 'loading') {
    await this._ngxSpinnerService.hide(loadingElName);
  }

}
