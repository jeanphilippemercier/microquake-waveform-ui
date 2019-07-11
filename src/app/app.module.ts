import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
// import { MatIconRegistry, MatIconModule } from '@angular/material';
// import { DomSanitizer } from '@angular/platform-browser';

import { ComponentsModule } from './components/components.module';
import { AppComponent } from './app.component';
import { CatalogTreeModule } from './catalog-tree/catalog-tree.module';
import { HelpDialogComponent, HelpDialogSheetComponent } from './help-dialog/help-dialog.component';
import { NgxLoadingModule } from 'ngx-loading';
import { NgxPaginationModule } from 'ngx-pagination';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { WaveformComponent } from './waveform/waveform.component';
import { SiteNetworkComponent } from './site-network/site-network.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
// import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';


@NgModule({
  declarations: [
    AppComponent,
    HelpDialogComponent,
    HelpDialogSheetComponent,
    LoginComponent,
    WaveformComponent,
    // AdminLayoutComponent,
    SiteNetworkComponent
  ],
  imports: [
    CoreModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    ComponentsModule,
    CatalogTreeModule,
    HttpClientModule,
    FlexLayoutModule,
    NgxLoadingModule.forRoot({}),
    NgxPaginationModule,
    AppRoutingModule
  ],
  entryComponents: [HelpDialogComponent, HelpDialogSheetComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
  // constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
  //  matIconRegistry.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('../assets/mdi.svg'));
  // }
}
