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
import { FooterLayoutComponent } from './layouts/footer-layout/footer-layout.component';
import { EventTypeFieldComponent } from './forms/fields/event-type-field/event-type-field.component';
import { EventStatusFieldComponent } from './forms/fields/event-status-field/event-status-field.component';
import { SiteSelectFieldComponent } from './forms/fields/site-select-field/site-select-field.component';
import { SiteNetworkFieldComponent } from './forms/fields/site-network-field/site-network-field.component';

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
  FooterLayoutComponent,
  EventTypeFieldComponent,
  EventStatusFieldComponent,
  SiteSelectFieldComponent,
  SiteNetworkFieldComponent,
];

const DIALOGS = [
  HelpDialogComponent,
  HelpDialogSheetComponent
];

@NgModule({
  declarations: [
    ...COMPONTENTS,
    ...DIALOGS
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
