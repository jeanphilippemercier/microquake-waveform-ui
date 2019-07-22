import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';

import { AuthService } from '@services/auth.service';
import { User } from '@interfaces/user.interface';
import { MatDrawer } from '@angular/material';
import { MenuService } from '@services/menu.service';

@Component({
  selector: 'app-event-shell',
  templateUrl: './event-shell.component.html',
  styleUrls: ['./event-shell.component.scss']
})
export class EventShellComponent implements OnInit, AfterViewInit {
  user: User;
  @ViewChild('drawer') drawer: MatDrawer;

  constructor(
    private _authService: AuthService,
    private _menuService: MenuService
  ) { }

  async ngOnInit() {
    this._authService.loggedUser.subscribe(user => {
      this.user = user;
    });
  }

  ngAfterViewInit() {
    this._menuService.init(this.drawer);
  }

  logoutClick() {
    this._authService.logout();
  }
}
