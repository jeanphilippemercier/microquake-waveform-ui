import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  menuOpened: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  async open() {
    this.menuOpened.next(true);
  }

  async close() {
    this.menuOpened.next(false);
  }

  async toggle() {
    this.menuOpened.next(!this.menuOpened.getValue());
  }
}
