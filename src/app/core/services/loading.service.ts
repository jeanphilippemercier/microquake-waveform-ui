import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

const defaultFullscreenLoadingSettings = {
  fullScreen: true,
  bdColor: 'rgba(51,51,51,0.25)'
};

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  constructor(
    private _ngxSpinnerService: NgxSpinnerService) {
  }

  async start(loadingEl = 'loading', loadingSettings = defaultFullscreenLoadingSettings) {
    await this._ngxSpinnerService.show(loadingEl, loadingSettings);
  }
  async stop(loadingEl = 'loading') {
    await this._ngxSpinnerService.hide(loadingEl);
  }
}
