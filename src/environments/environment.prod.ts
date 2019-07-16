import { DynamicEnvironment } from './dynamic-environment';

// overwrite injected values
const CONFIG = {
  production: true,
};
class Environment extends DynamicEnvironment {

  constructor() {
    super();
    this.setDefaultConfig(CONFIG);
  }
}

export const environment = new Environment();
