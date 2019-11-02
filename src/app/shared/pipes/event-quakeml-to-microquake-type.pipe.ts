import { Pipe, PipeTransform } from '@angular/core';
import { EventType } from '@interfaces/event.interface';

@Pipe({
  name: 'eventQuakemlToMicroquakeType',
  pure: true
})
export class EventQuakemlToMicroquakeTypePipe implements PipeTransform {

  transform(value: any, eventTypes: EventType[]): any {
    if (!eventTypes) {
      return value;
    }

    const eventType = eventTypes.find(event => event.quakeml_type === value);
    return eventType && eventType.microquake_type ? eventType.microquake_type : value;
  }

}
