import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  private _assetsDynamicConfigUrl = 'assets/dynamic-config/config.json';

  constructor() { }

  // to inject config.json from assets folder
  public initAssetsConfig() {
    return new Promise(async (resolve) => {
      try {
        const config = await fetch(this._assetsDynamicConfigUrl).then(function (response) {
          return response.json();
        });

        environment.injectConfig(config);
        resolve(config);
      } catch (err) {
        // no dynamic config found
        console.error(err);
        environment.injectConfig({});
        resolve();
      }
    });
  }
}
