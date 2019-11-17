import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  constructor() { }


  public get subject(): Subject<any> {
    return this._subject;
  }

  private _subject!: Subject<any>;
  private _connected$ = new Subject<boolean>();
  public isClosing: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public lastConnectionInitTimestamp: BehaviorSubject<number> = new BehaviorSubject<number>(new Date().getTime());

  private _reconect: Subject<void> = new Subject;
  reconectObs: Observable<void> = this._reconect.asObservable();

  public connect<T>(url: string): Subject<T> {
    if (!this._subject) {
      this._subject = webSocket<T>({
        url: url,
        openObserver: {
          next: () => {
            this.lastConnectionInitTimestamp.next(new Date().getTime());
          }
        },
        closeObserver: {
          next: () => {
            this.isClosing.next(false);
          }
        },
        closingObserver: {
          next: () => {
            this.isClosing.next(true);
            this._reconect.next();
          }
        },

      });
      this._connected$.next(true);
    }
    return this._subject;
  }

  public connected(): Observable<boolean> {
    return this._connected$.asObservable();
  }

}
