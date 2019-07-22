import { Component, OnInit } from '@angular/core';

import { AuthService } from '@services/auth.service';
import { User } from '@interfaces/user.interface';

@Component({
  selector: 'app-event-shell-old',
  templateUrl: './event-shell-old.component.html',
  styleUrls: ['./event-shell-old.component.scss']
})
export class EventShellOldComponent implements OnInit {
  user: User;

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
