import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DemoMaterialModule} from './material-modules';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { AppComponent } from './app.component';
import {EventsTreeComponent} from './events-tree.component';
import { CatalogApiService } from './catalog-api.service';
import { HelpDialogComponent, HelpDialogSheetComponent} from './help-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    EventsTreeComponent,
    HelpDialogComponent,
    HelpDialogSheetComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    DemoMaterialModule,
    ReactiveFormsModule,
    AngularFontAwesomeModule
  ],
  entryComponents: [HelpDialogComponent, HelpDialogSheetComponent],
  providers: [CatalogApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }

platformBrowserDynamic().bootstrapModule(AppModule);
