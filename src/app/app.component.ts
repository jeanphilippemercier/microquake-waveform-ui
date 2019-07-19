import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';

import { AuthDialogComponent } from '@app/auth/dialogs/auth-dialog/auth-dialog.component';
import { AuthService } from '@services/auth.service';
import { User } from '@interfaces/user.interface';

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
    private _router: Router
  ) { }

  async ngOnInit() {
    await this._authService.init();

    this._authService.loggedUser.subscribe(user => {
      this.user = user;
      if (user === null) {
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

}
