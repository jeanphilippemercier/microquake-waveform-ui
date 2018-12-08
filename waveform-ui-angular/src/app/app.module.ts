import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MatNativeDateModule} from '@angular/material';
import { platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DemoMaterialModule} from './material-modules';

import { AppComponent } from './app.component';
import {TreeFlatOverviewExample} from './tree-flat-overview-example';

@NgModule({
  declarations: [
    AppComponent,
    TreeFlatOverviewExample
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    DemoMaterialModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent, TreeFlatOverviewExample]
})
export class AppModule { }

platformBrowserDynamic().bootstrapModule(AppModule);
