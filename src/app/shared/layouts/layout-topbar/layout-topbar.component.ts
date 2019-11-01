import { Component, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { MenuService } from '@app/core/services/menu.service';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'app-layout-topbar',
  templateUrl: './layout-topbar.component.html',
  styleUrls: ['./layout-topbar.component.scss']
})
export class LayoutTopbarComponent {

  @ViewChild('drawer', { static: false }) drawer: MatDrawer;
  today = new Date();

  @Input() width = '100%';

  @Input() showEventSidebarButton = false;

  @Input() eventSidebarOpened = false;
  @Output() eventSidebarOpenedChange: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private _menuService: MenuService
  ) { }

  async drawerClick() {
    await this._menuService.toggle();
  }

  onSidebarButtonClick($event) {
    this.eventSidebarOpenedChange.emit($event);
  }
}
