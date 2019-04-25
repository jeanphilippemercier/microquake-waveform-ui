import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material';
import { DemoMaterialModule} from './material-modules';
import { AppComponent } from './app.component';
import { EventsTreeComponent } from './events-tree.component';
import { CatalogApiService } from './catalog-api.service';
import { JwtModule } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { HelpDialogComponent, HelpDialogSheetComponent} from './help-dialog.component';
import { NgxLoadingModule } from 'ngx-loading';
import { NgxPaginationModule } from 'ngx-pagination';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { WaveformComponent } from './waveform/waveform.component';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

@NgModule({
  declarations: [
    AppComponent,
    EventsTreeComponent,
    HelpDialogComponent,
    HelpDialogSheetComponent,
    LoginComponent,
    WaveformComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: ['api.microquake.org', 'localhost']
      }
    }),
    DemoMaterialModule,
    MatDialogModule,
    ReactiveFormsModule,
    NgxLoadingModule.forRoot({}),
    NgxPaginationModule,
    AppRoutingModule
  ],
  entryComponents: [HelpDialogComponent, HelpDialogSheetComponent],
  providers: [
    CatalogApiService,
    // UserService,
    AuthService,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

// platformBrowserDynamic().bootstrapModule(AppModule);
