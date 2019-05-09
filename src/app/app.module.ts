import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ComponentsModule } from './components/components.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material';
import { DemoMaterialModule} from './material-modules';
import { AppComponent } from './app.component';
import {CatalogTreeModule} from './catalog-tree/catalog-tree.module';
import { CatalogApiService } from './catalog-api.service';
import { JwtModule } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { HelpDialogComponent, HelpDialogSheetComponent} from './help-dialog/help-dialog.component';
import { NgxLoadingModule } from 'ngx-loading';
import { NgxPaginationModule } from 'ngx-pagination';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { WaveformComponent } from './waveform/waveform.component';
import { NotifierComponent } from './notifier/notifier.component';
import { SiteNetworkComponent } from './site-network/site-network.component';
// import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

@NgModule({
  declarations: [
    AppComponent,
    // EventsTreeComponent,
    HelpDialogComponent,
    HelpDialogSheetComponent,
    LoginComponent,
    WaveformComponent,
    // AdminLayoutComponent,
    NotifierComponent,
    SiteNetworkComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ComponentsModule,
    CatalogTreeModule,
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
    FlexLayoutModule,
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
