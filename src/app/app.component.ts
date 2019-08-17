import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { User } from '@interfaces/user.interface';
import { AuthService } from '@services/auth.service';
import { MenuService } from '@services/menu.service';
import { AuthDialogComponent } from '@app/auth/dialogs/auth-dialog/auth-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  user: User;

  constructor(
    private _dialog: MatDialog,
    private _authService: AuthService,
    public menuService: MenuService,
    private _router: Router
  ) { }

  async ngOnInit() {
    await this._authService.init();

    this._authService.loggedUser.subscribe(user => {
      this.user = user;
      if (user === null) {
        this.menuService.close();
        this._router.navigate(['..']);
        this.openAuthDialog();
      }
    });
  }

  openAuthDialog() {
    const dialogRef = this._dialog.open(AuthDialogComponent, {
      disableClose: true
    });
  }

  logoutClick() {
    this._authService.logout();
  }

  onMenuOpenedChange($event) {
    if ($event) {
      this.menuService.open();
    } else {
      this.menuService.close();
    }
  }

  closeMenu() {
    this.menuService.close();
  }

}
