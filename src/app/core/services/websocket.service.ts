import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';


@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  constructor() { }

  private _subject: Subject<any>;
  private _connected$ = new Subject<boolean>();

  public connect<T>(url: string): Subject<T> {
    if (!this._subject) {
      this._subject = webSocket<T>(url);
      // console.log(`Successfully connected: ${url}`);
      this._connected$.next(true);
    }
    return this._subject;
  }

  public connected(): Observable<boolean> {
    return this._connected$.asObservable();
  }

}
