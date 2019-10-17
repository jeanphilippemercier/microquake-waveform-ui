import { Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormGroup } from '@angular/forms';

import { PageMode } from '@interfaces/core.interface';
import { NgxSpinnerService } from 'ngx-spinner';

export class DetailPage<T> {

  @Input() mode: PageMode = PageMode.CREATE;
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  model: T;

  editDisabled = false;
  PageMode = PageMode;
  loading = false;

  constructor(
    protected _matDialog: MatDialog,
    protected _ngxSpinnerService: NgxSpinnerService,
  ) { }

  onCancel() {
    this.cancel.emit();
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }

  closeDialog() {
    this._matDialog.closeAll();
  }

  async loadingTableStart() {
    await this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingTableStop() {
    await this._ngxSpinnerService.hide('loadingTable');
  }

  async loadingStart() {
    await this._ngxSpinnerService.show('loading', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingStop() {
    await this._ngxSpinnerService.hide('loading');
  }
}
