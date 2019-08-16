export class DynamicEnvironment {
  public _defaultConfig: any;
  public production: boolean;
  public url: string;
  public apiUrl: string;
  public url3dUi: string;
  public wss: string;

  constructor() { }

  setDefaultConfig(config: any) {
    this._defaultConfig = config;
  }

  injectConfig(config) {
    this._injectConfig(config);

    if (this._defaultConfig) {
      this._injectConfig(this._defaultConfig);
    }
  }

  private _injectConfig(config) {
    if (config) {
      const keys = Object.keys(config);

      keys.forEach(key => {
        if (config[key] !== undefined) {
          this[key] = config[key];
        }
      });
    }
  }
}
