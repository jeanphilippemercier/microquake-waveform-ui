import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MenuService } from '@app/core/services/menu.service';
import { MatDrawer } from '@angular/material';

@Component({
  selector: 'app-header-layout',
  templateUrl: './header-layout.component.html',
  styleUrls: ['./header-layout.component.scss']
})
export class HeaderLayoutComponent {

  @ViewChild('drawer') drawer: MatDrawer;
  today = new Date();

  constructor(
    private _menuService: MenuService
  ) { }

  async drawerClick() {
    await this._menuService.toggle();
  }
}
