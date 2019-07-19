import { Component, OnInit, ViewChild } from '@angular/core';

import { AuthService } from '@services/auth.service';
import { User } from '@interfaces/user.interface';
import { MatDrawer } from '@angular/material';

@Component({
  selector: 'app-event-shell',
  templateUrl: './event-shell.component.html',
  styleUrls: ['./event-shell.component.scss']
})
export class EventShellComponent implements OnInit {
  user: User;
  @ViewChild('drawer') drawer: MatDrawer;

  constructor(
    private _authService: AuthService
  ) { }

  async ngOnInit() {
    this._authService.loggedUser.subscribe(user => {
      this.user = user;
    });

  }

  logoutClick() {
    this._authService.logout();
  }
}
