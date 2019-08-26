import { EventQuery } from '@interfaces/event-query.interface';


export default class EventUtil {
  static getNumberOfChanges(editedQuery: EventQuery): number {
    let count = 0;
    count += editedQuery.status ? editedQuery.status.length : 0;
    count += editedQuery.type ? editedQuery.type.length : 0;
    count += editedQuery.time_range !== 3 ? 1 : 0;

    return count;
  }
}
