import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import dynamicConfig from '@env/dynamic-config/config.json';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  private readonly _assetsDynamicConfigUrl = 'assets/dynamic-config/config.json';

  constructor() { }

  // to inject from environment folder
  public init() {
    return new Promise((resolve) => {
      if (dynamicConfig) {
        environment.injectConfig(dynamicConfig);
      }
      resolve();
    });
  }

  // to inject from assets folder
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
        environment.injectConfig({});
        resolve();
      }
    });
  }
}
