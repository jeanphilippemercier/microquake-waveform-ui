import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  _drawer: MatDrawer;

  init(drawer: MatDrawer) {
    this._drawer = drawer;

  }

  async open() {
    if (!this._drawer) {
      console.error(`no menu drawer`);
      return;
    }
    this._drawer.open();
  }

  async close() {
    if (!this._drawer) {
      console.error(`no menu drawer`);
      return;
    }
    this._drawer.close();
  }

  async toggle() {
    if (!this._drawer) {
      console.error(`no menu drawer`);
      return;
    }
    this._drawer.toggle();
  }
}
