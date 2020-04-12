import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { first, tap } from 'rxjs/operators';
import { NgForm, Validators, FormBuilder, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { AuthService } from '@services/auth.service';
import { AuthLoginInput } from '@app/core/interfaces/auth.interface';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { UserCreateInput } from '@interfaces/user-dto.interface';
import { NgxSpinnerService } from 'ngx-spinner';

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
  @ViewChild('authForm', { static: false }) authForm!: NgForm;

  DialogMode = DialogMode;
  mode: DialogMode = DialogMode.LOGIN;
  loading = false;
  submited = false;
  authLoginInput: AuthLoginInput = {
    username: '',
    password: ''
  };

  myForm = this._fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    password_repeat: ['', [
      Validators.compose(
        [
          Validators.required,
          this.validateAreEqual.bind(this)
        ]
      )]
    ],
    first_name: [''],
    last_name: ['']
  });


  public get username() {
    return this.myForm.get('username');
  }
  public get password() {
    return this.myForm.get('password');
  }
  public get password_repeat() {
    return this.myForm.get('password_repeat');
  }


  constructor(
    private _auth: AuthService,
    private _router: Router,
    private _matDialogRef: MatDialogRef<AuthDialogComponent>,
    private _toastrNotificationService: ToastrNotificationService,
    private _fb: FormBuilder,
    private _ngxSpinnerService: NgxSpinnerService
  ) { }

  private validateAreEqual(fieldControl: FormControl) {
    const passwordEl = this.myForm && this.myForm.get('password');
    return this.myForm && passwordEl && fieldControl.value === passwordEl.value ? null : {
      notEqual: true
    };
  }

  // TODO: handle cs/ss errors
  submitAuthForm() {
    this.submited = true;

    if (this.username && this.username.errors) {
      return;
    }

    if (this.password && this.password.errors) {
      return;
    }

    if (this.mode === DialogMode.LOGIN) {


      const loginDto: AuthLoginInput = {
        username: this.myForm.value.username,
        password: this.myForm.value.password
      };

      this.loading = true;
      this.loadingStart();

      this._auth.login(loginDto)
        .pipe(
          first()
        )
        .subscribe(
          result => {
            this._matDialogRef.close();
            this._router.navigate(['events']);
          },
          err => {
            console.error(err);
            this._toastrNotificationService.error('Could not authenticate');
          }
        ).add(() => {
          this.loading = false;
          this.loadingStop();
        });

    } else {
      if (this.password_repeat && this.password_repeat.errors) {
        return;
      }

      const registrationDto: UserCreateInput = {
        username: this.myForm.value.username,
        password: this.myForm.value.password,
        first_name: this.myForm.value.first_name,
        last_name: this.myForm.value.last_name,
      };

      this.loading = true;
      this.loadingStart();

      this._auth.register(registrationDto)
        .pipe(
          first()
        )
        .subscribe(
          result => {
            this._matDialogRef.close();
            this._router.navigate(['events']);
            this._toastrNotificationService.success('Successfully registered');
          },
          err => {
            console.error(err);
            this._toastrNotificationService.error('Could not register');

            if (err && err.error) {
              const error = err.error;
              if (error.username && error.username[0]) {
                this._toastrNotificationService.error(error.username[0]);
              } else if (error.password && error.password[0]) {
                this._toastrNotificationService.error(error.password[0]);
              }
            }
          }
        ).add(() => {
          this.loading = false;
          this.loadingStop();
        });
    }
  }

  async loadingStart() {
    await this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
  }

  async loadingStop() {
    await this._ngxSpinnerService.hide('loading');
  }
}
