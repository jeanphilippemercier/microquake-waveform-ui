import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'eventMagnitude',
  pure: true
})
export class EventMagnitudePipe implements PipeTransform {

  transform(value: any): string {

    return value !== -999 ? parseFloat(value).toFixed(2) : '';
  }

}
