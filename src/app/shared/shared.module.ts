import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import {
  MatAutocompleteModule, MatBadgeModule, MatBottomSheetModule, MatButtonModule, MatButtonToggleModule,
  MatCardModule, MatCheckboxModule, MatChipsModule, MatDatepickerModule, MatDialogModule, MatDividerModule,
  MatExpansionModule, MatGridListModule, MatIconModule, MatInputModule, MatFormFieldModule, MatListModule,
  MatMenuModule, MatNativeDateModule, MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule, MatRadioModule,
  MatRippleModule, MatSelectModule, MatSidenavModule, MatSliderModule, MatSlideToggleModule, MatSnackBarModule,
  MatSortModule, MatStepperModule, MatTableModule, MatTabsModule, MatToolbarModule, MatTooltipModule, MatTreeModule,
} from '@angular/material';

import { HelpDialogComponent } from './dialogs/help-dialog/help-dialog.component';
import { HelpDialogSheetComponent } from './sheets/help-dialog-sheet.component';
import { HeaderLayoutComponent } from './layouts/header-layout/header-layout.component';
import { FooterLayoutComponent } from './layouts/footer-layout/footer-layout.component';
import { EventTypeFieldComponent } from './forms/fields/event-type-field/event-type-field.component';
import { EventStatusFieldComponent } from './forms/fields/event-status-field/event-status-field.component';
import { EventModeFieldComponent } from './forms/fields/event-mode-field/event-mode-field.component';
import { EventDateFieldComponent } from './forms/fields/event-date-field/event-date-field.component';
import { SiteSelectFieldComponent } from './forms/fields/site-select-field/site-select-field.component';
import { SiteNetworkFieldComponent } from './forms/fields/site-network-field/site-network-field.component';
import { EventTypeIconPipe } from './pipes/event-type-icon.pipe';
import { EventInfoComponent } from './components/event-info/event-info.component';
import { EventMagnitudePipe } from './pipes/event-magnitude.pipe';
import { EventQuakemlToMicroquakeTypePipe } from './pipes/event-quakeml-to-microquake-type.pipe';

const MATERIAL_MODULES = [
  MatAutocompleteModule,
  MatBadgeModule,
  MatBottomSheetModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatDialogModule,
  MatDividerModule,
  MatExpansionModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatFormFieldModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatRippleModule,
  MatSelectModule,
  MatSidenavModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatStepperModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatTreeModule,
];

const CDK_MODULES = [
  DragDropModule,
  ScrollingModule,
  CdkTableModule,
  CdkTreeModule
];

const COMPONTENTS = [
  HeaderLayoutComponent,
  FooterLayoutComponent,
  EventTypeFieldComponent,
  EventModeFieldComponent,
  EventStatusFieldComponent,
  EventDateFieldComponent,
  EventInfoComponent,
  SiteSelectFieldComponent,
  SiteNetworkFieldComponent,
];

const DIALOGS = [
  HelpDialogComponent,
  HelpDialogSheetComponent
];

const PIPES = [
  EventQuakemlToMicroquakeTypePipe,
  EventTypeIconPipe,
  EventMagnitudePipe
];

@NgModule({
  declarations: [
    ...COMPONTENTS,
    ...DIALOGS,
    ...PIPES,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES,
    ...CDK_MODULES,
  ],
  exports: [
    ...COMPONTENTS,
    ...DIALOGS,
    ...PIPES,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES,
    ...CDK_MODULES
  ],
  entryComponents: [
    ...DIALOGS
  ]
})
export class SharedModule { }
