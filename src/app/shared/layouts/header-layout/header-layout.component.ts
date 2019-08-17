import { Component, AfterViewInit, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { MenuService } from '@app/core/services/menu.service';
import { MatDrawer } from '@angular/material';

@Component({
  selector: 'app-header-layout',
  templateUrl: './header-layout.component.html',
  styleUrls: ['./header-layout.component.scss']
})
export class HeaderLayoutComponent {

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
