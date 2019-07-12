import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { AuthDialogComponent } from './dialogs/auth-dialog/auth-dialog.component';

@NgModule({
  declarations: [
    AuthDialogComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    AuthDialogComponent
  ],
  entryComponents: [
    AuthDialogComponent
  ]
})
export class AuthModule { }
