import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { NgForm } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

import { AuthService } from '@services/auth.service';
import { AuthLoginInput } from '@app/core/interfaces/auth.interface';

enum DialogMode {
  LOGIN = 'login',
  REGISTRATION = 'registration'
}

@Component({
  selector: 'app-auth-dialog',
  templateUrl: './auth-dialog.component.html',
  styleUrls: ['./auth-dialog.component.scss']
})
export class AuthDialogComponent {
  @ViewChild('authForm') authForm: NgForm;

  error: string;
  DialogMode = DialogMode;
  mode: DialogMode = DialogMode.LOGIN;
  loading = false;
  submited = false;
  authLoginInput: AuthLoginInput = {
    username: '',
    password: ''
  };

  constructor(
    private _auth: AuthService,
    private _router: Router,
    private _matDialogRef: MatDialogRef<AuthDialogComponent>
  ) { }

  // TODO: handle cs/ss errors
  submitAuthForm() {
    this.submited = true;
    if (this.authForm.invalid) {
      return;
    }

    this.loading = true;

    this._auth.login(this.authLoginInput)
      .pipe(first())
      .subscribe(
        result => {
          this._matDialogRef.close();
          this._router.navigate(['v1/events']);
        },
        err => {
          console.error(err);
          this.error = 'Could not authenticate';
        }
      ).add(() => this.loading = false);

  }
}
