import { Component, HostBinding, HostListener } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-context-menu',
  template: '<ng-content></ng-content>',
  styles: ['']
})
export class ContextMenuComponent extends MatMenuTrigger {

  @HostBinding('style.position') private _position = 'fixed';
  @HostBinding('style.pointer-events') private _events = 'none';
  @HostBinding('style.left') private _x = '';
  @HostBinding('style.top') private _y = '';

  // Intercepts the global context menu event
  @HostListener('document:contextmenu', ['$event'])
  public rightClick(data?: MouseEvent) {
    const classList = (<Element>data?.target)?.classList;

    for (let idx = 0; idx < classList?.length; idx++) {
      const el = classList[idx];
      if (el === 'cdk-overlay-backdrop') {
        if (this.menuData) {
          this.closeMenu();
          this.menuData = null;
        }
        return false;
      }
    }
  }

  public async open(data: MouseEvent) {
    this._openMenuAtPosition(data);
    return false;
  }

  private _openMenuAtPosition(data: MouseEvent) {
    // Pass along the context data to support lazily-rendered content
    if (!!data) { this.menuData = data; }

    // Adjust the menu anchor position
    this._x = data?.x + 'px';
    this._y = data?.y + 'px';

    // Opens the menu
    this.openMenu();
  }
}
