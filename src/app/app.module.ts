import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
// import { MatIconRegistry, MatIconModule } from '@angular/material';
// import { DomSanitizer } from '@angular/platform-browser';
import { ComponentsModule } from './components/components.module';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import { MatDialogModule } from '@angular/material';
import { DemoMaterialModule} from './material-modules';
import { AppComponent } from './app.component';
import {CatalogTreeModule} from './catalog-tree/catalog-tree.module';
import { CatalogApiService } from './catalog-api.service';
import { JWT_OPTIONS, JwtInterceptor, JwtModule } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RefreshTokenInterceptor } from './refresh-token-interceptor';
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

export function jwtOptionsFactory (authService: AuthService) {
  return {
    tokenGetter: () => {
      return authService.getAccessToken();
    },
    whitelistedDomains: ['api.microquake.org', 'localhost'],
    blacklistedRoutes: [`${environment.apiUrl}/api/token`]
  };
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
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [AuthService]
      }
    }),
    DemoMaterialModule,
    MatDialogModule,
    // MatIconModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    NgxLoadingModule.forRoot({}),
    NgxPaginationModule,
    AppRoutingModule
  ],
  entryComponents: [HelpDialogComponent, HelpDialogSheetComponent],
  providers: [
    AuthService,
    JwtInterceptor, // Providing JwtInterceptor allow to inject JwtInterceptor manually into RefreshTokenInterceptor
    CatalogApiService,
    // UserService,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useExisting: JwtInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RefreshTokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  // constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
  //  matIconRegistry.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('../assets/mdi.svg'));
  // }
}
