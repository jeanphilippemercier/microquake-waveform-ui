import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'eventTypeIcon',
  pure: true
})
export class EventTypeIconPipe implements PipeTransform {

  transform(value: any): any {
    switch (value) {
      case 'E':
      case 'earthquake':
        return 'multiline_chart';
        break;
      case 'B':
      case 'explosion':
        return 'flare';
        break;
      case 'OB':
      case 'controlled explosion':
        return 'filter_tilt_shift';
        break;
      case 'SE':
      case 'anthropogenic event':
        return 'person';
        break;
      case 'PN':
      case 'collapse':
      case 'DN':
      case 'reservoir loading':
      case 'MN':
      case 'road cut':
      case 'CN':
      case 'acoustic noise':
      case 'L':
      case 'thunder':
      case 'N':
      case 'other event':
        return 'hearing';
        break;
      case 'OP':
      case 'quarry blast':
        return 'all_out';
        break;
      default:
        return 'more';
        break;
    }
  }

}
