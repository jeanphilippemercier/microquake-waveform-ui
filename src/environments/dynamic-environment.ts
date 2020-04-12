export class DynamicEnvironment {
  public _defaultConfig: any;
  public production = false;
  public url = '';
  public apiUrl = '';
  public url3dUi = '';
  public wss = '';

  constructor() { }

  setDefaultConfig(config: any) {
    this._defaultConfig = config;
    this._injectConfig(this._defaultConfig);
  }

  injectConfig(config: any) {
    this._injectConfig(config);

    if (this._defaultConfig) {
      this._injectConfig(this._defaultConfig);
    }
  }

  private _injectConfig(config: any) {
    if (config) {
      const keys = Object.keys(config);

      keys.forEach(key => {
        if (config[key] !== undefined) {
          // @ts-ignore: init config workaround
          this[key] = config[key];
        }
      });
    }
  }
}
