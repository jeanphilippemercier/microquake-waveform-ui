import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialog, MatDrawer } from '@angular/material';
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
export class AppComponent implements OnInit, AfterViewInit {
  user: User;
  @ViewChild('drawer') drawer: MatDrawer;

  constructor(
    private _dialog: MatDialog,
    private _authService: AuthService,
    private _menuService: MenuService,
    private _router: Router
  ) { }

  async ngOnInit() {
    await this._authService.init();

    this._authService.loggedUser.subscribe(user => {
      this.user = user;
      if (user === null) {
        this._menuService.close();
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

  ngAfterViewInit() {
    this._menuService.init(this.drawer);
  }

  logoutClick() {
    this._authService.logout();
  }

}
