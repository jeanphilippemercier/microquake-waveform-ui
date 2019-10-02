import { Injectable } from '@angular/core';
import { ToastrService, ActiveToast, IndividualConfig } from 'ngx-toastr';


@Injectable({
  providedIn: 'root'
})
export class ToastrNotificationService {

  constructor(
    private _toastrService: ToastrService,
  ) { }


  success(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    return this._toastrService.success(message, title, override);
  }

  error(messageOrErr?: string | any, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    if (!override) {
      override = {
        timeOut: 4000
      };
    }

    if (messageOrErr && messageOrErr.message) {
      return this._toastrService.error(messageOrErr.message);
    }
    return this._toastrService.error(messageOrErr, title, override);
  }


  info(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    return this._toastrService.info(message, title, override);
  }


  warning(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    return this._toastrService.warning(message, title, override);
  }


  clear(toastId?: number): void {
    return this._toastrService.clear(toastId);
  }


  successDataDelete() {
    this.success('Data successfully deleted!', 'Success');
  }

  successDataUpdate() {
    this.success('Data successfully updated!', 'Success');
  }

  successDataSave() {
    this.success('Data successfully saved!', 'Success');
  }

  successDataCreation(entity = 'Data') {
    this.success(`${entity} successfully created!`, 'Success');
  }
}
