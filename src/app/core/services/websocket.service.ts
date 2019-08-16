import { Injectable } from '@angular/core';
import { Subject, Observable, Observer } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  constructor() { }

  private _subject: Subject<MessageEvent>;
  private _connected$ = new Subject<boolean>();

  public connect(url: string): Subject<MessageEvent> {
    if (!this._subject) {
      this._subject = this.create(url);
      // console.log(`Successfully connected: ${url}`);
      this._connected$.next(true);
    }
    return this._subject;
  }

  public connected(): Observable<boolean> {
    return this._connected$.asObservable();
  }

  private create(url: string): Subject<MessageEvent> {
    const ws = new WebSocket(url);

    const observable = Observable.create((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });

    const observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    };
    return Subject.create(observer, observable);
  }

}
