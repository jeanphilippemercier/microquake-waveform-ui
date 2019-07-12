import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthLoginInput } from '@app/core/interfaces/auth.interface';
import { NgForm } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

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

  submitAuthForm() {

  }
}
