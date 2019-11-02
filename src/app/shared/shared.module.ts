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
  MAT_LABEL_GLOBAL_OPTIONS,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material';
import { MomentModule } from 'ngx-moment';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ClipboardModule } from 'ngx-clipboard';

import { LayoutTopbarComponent } from './layouts/layout-topbar/layout-topbar.component';
import { FooterLayoutComponent } from './layouts/footer-layout/footer-layout.component';
import { EventTypeFieldComponent } from './forms/fields/event-type-field/event-type-field.component';
import { EventStatusFieldComponent } from './forms/fields/event-status-field/event-status-field.component';
import { EventModeFieldComponent } from './forms/fields/event-mode-field/event-mode-field.component';
import { EventDateFieldComponent } from './forms/fields/event-date-field/event-date-field.component';
import { SiteSelectFieldComponent } from './forms/fields/site-select-field/site-select-field.component';
import { SiteNetworkFieldComponent } from './forms/fields/site-network-field/site-network-field.component';
import { EventInfoComponent } from './components/event-info/event-info.component';
import { EventCatalogComponent } from './components/event-catalog/event-catalog.component';
import { EventHelpDialogComponent } from './dialogs/event-help-dialog/event-help-dialog.component';
import { EventTypeIconPipe } from './pipes/event-type-icon.pipe';
import { EventMagnitudePipe } from './pipes/event-magnitude.pipe';
import { DiffNumber } from './pipes/diff-number.pipe';
import { OrdinalPipe } from './pipes/ordinal.pipe';
import { EventQuakemlToMicroquakeTypePipe } from './pipes/event-quakeml-to-microquake-type.pipe';
import { ConfirmationDialogComponent } from './dialogs/confirmation-dialog/confirmation-dialog.component';
import { EventUpdateDialogComponent } from './dialogs/event-update-dialog/event-update-dialog.component';
import { EventFilterDialogComponent } from './dialogs/event-filter-dialog/event-filter-dialog.component';
import { EventInteractiveProcessingDialogComponent } from './dialogs/event-interactive-processing-dialog/event-interactive-processing-dialog.component';
import { EventWaveformFilterDialogComponent } from './dialogs/event-waveform-filter-dialog/event-waveform-filter-dialog.component';
import { LayoutHeaderComponent } from './layouts/layout-header/layout-header.component';
import { LayoutFilterComponent } from './layouts/layout-filter/layout-filter.component';
import { LayoutContentComponent } from './layouts/layout-content/layout-content.component';

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
  LayoutContentComponent,
  LayoutHeaderComponent,
  LayoutFilterComponent,
  LayoutTopbarComponent,
  FooterLayoutComponent,
  EventTypeFieldComponent,
  EventModeFieldComponent,
  EventStatusFieldComponent,
  EventDateFieldComponent,
  EventInfoComponent,
  EventCatalogComponent,
  SiteSelectFieldComponent,
  SiteNetworkFieldComponent,
];

const DIALOGS = [
  EventHelpDialogComponent,
  EventUpdateDialogComponent,
  EventFilterDialogComponent,
  EventInteractiveProcessingDialogComponent,
  ConfirmationDialogComponent,
  EventWaveformFilterDialogComponent
];

const SHEETS: any[] = [];

const PIPES = [
  DiffNumber,
  OrdinalPipe,
  EventQuakemlToMicroquakeTypePipe,
  EventTypeIconPipe,
  EventMagnitudePipe
];


const matFormFieldDefaultOptions: MatFormFieldDefaultOptions = {
  appearance: 'outline'
};

@NgModule({
  declarations: [
    ...COMPONTENTS,
    ...DIALOGS,
    ...SHEETS,
    ...PIPES,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MomentModule,
    NgxSpinnerModule,
    NgxFileDropModule,
    ClipboardModule,
    ToastrModule.forRoot(),
    ...MATERIAL_MODULES,
    ...CDK_MODULES,
  ],
  exports: [
    ...COMPONTENTS,
    ...DIALOGS,
    ...SHEETS,
    ...PIPES,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MomentModule,
    NgxSpinnerModule,
    NgxFileDropModule,
    ClipboardModule,
    ToastrModule,
    ...MATERIAL_MODULES,
    ...CDK_MODULES
  ],
  entryComponents: [
    ...DIALOGS,
    ...SHEETS
  ],
  providers: [
    EventQuakemlToMicroquakeTypePipe,
    {
      provide: MAT_LABEL_GLOBAL_OPTIONS,
      useValue: { float: 'always' }
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: matFormFieldDefaultOptions
    }
  ]
})
export class SharedModule { }
