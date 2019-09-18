import { Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormGroup } from '@angular/forms';

import { PageMode } from '@interfaces/core.interface';

export class DetailPage<T> {


  @Input()
  public set id(v: number) {
    this._id = v;
    if (this._id) {
      this._loadData(this._id);
    }
  }

  public get id() {
    return this._id;
  }
  private _id: number;

  @Input()
  public set model(v: T) {
    this._model = v;
    this.modelChange.emit(this.model);
    this.myForm.patchValue(Object.assign(this.myForm.value, this.model));
  }

  public get model() {
    return this._model;
  }
  private _model: T;

  @Input() mode: PageMode = PageMode.CREATE;
  @Output() modelChange: EventEmitter<Partial<T>> = new EventEmitter();
  @Output() modelCreated: EventEmitter<Partial<T>> = new EventEmitter();
  @Output() modelEdited: EventEmitter<Partial<T>> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();

  editDisabled = false;
  PageMode = PageMode;
  loading = false;
  myForm: FormGroup;

  constructor(
    protected _matDialog: MatDialog
  ) { }

  protected async _loadData(id: number) { }

  protected _filter<U>(input: string, array: U[], name: string): U[] {
    const filterValue = input.toLowerCase();
    return array.filter(option => option[name] && option[name].toLowerCase().indexOf(filterValue) === 0);
  }

  onCancel() {
    this.cancel.emit();
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }

  closeDialog() {
    this._matDialog.closeAll();
  }
}
