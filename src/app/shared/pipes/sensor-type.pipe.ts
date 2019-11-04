import { Pipe, PipeTransform } from '@angular/core';
import { SensorType } from '@interfaces/inventory.interface';

@Pipe({
  name: 'sensorType',
  pure: true
})
export class SensorTypePipe implements PipeTransform {

  transform(value: SensorType): any {
    switch (value) {
      case SensorType.ACCELEROMETER:
        return 'accelerometer';
        break;
      case SensorType.GEOPHONE:
        return 'geophone';
        break;
      case SensorType.STRONG_GROUND_MOTION:
        return 'strong ground motion';
        break;
      case SensorType.SHORT_PERIOD:
        return 'short period';
        break;
      case SensorType.LONG_PERIOD:
        return 'long period';
        break;
      case SensorType.BROADBAND:
        return 'broadband';
        break;
      default:
        return value;
        break;
    }
  }
}
