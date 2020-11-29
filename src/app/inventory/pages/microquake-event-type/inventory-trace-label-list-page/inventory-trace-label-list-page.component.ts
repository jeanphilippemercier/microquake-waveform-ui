import { Component, Injector, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { first, takeUntil } from 'rxjs/operators';

import { ListPage } from '@core/classes/list-page.class';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, TraceLabelFormDialogData } from '@interfaces/dialogs.interface';
import { EventType } from '@interfaces/event.interface';
import { MicroquakeEventTypeFormDialogComponent } from '@app/inventory/dialogs/microquake-event-type-form-dialog/microquake-event-type-form-dialog.component';
import { TraceLabel } from '@interfaces/inventory.interface';
import { forkJoin } from 'rxjs';
import { PageMode } from '@interfaces/core.interface';
import { TraceLabelFormDialogComponent } from '@app/inventory/dialogs/trace-label-form-dialog/trace-label-form-dialog.component'
import { WaveformService } from '@services/waveform.service';;

@Component({
  selector: 'app-inventory-trace-label-list-page',
  templateUrl: './inventory-trace-label-list-page.component.html',
  styleUrls: ['./inventory-trace-label-list-page.component.scss']
})
export class InventoryTraceLabelListPageComponent extends ListPage<TraceLabel> {

  takenEventType: number[] = [];
  eventTypes: EventType[] = [];
  waveformService: WaveformService | undefined;

  constructor(
    private _inventoryApiService: InventoryApiService,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    protected _router: Router,
    private _toastrNotificationService: ToastrNotificationService,
    private _injector: Injector,
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
  }

  async afterNgOnInit() {
    this._initFormData();
    this._activatedRoute.params
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async params => {
        const traceLabelId = +params['traceLabelId'];
        if (!traceLabelId) {
          return;
        }

        try {
          await this.loadingStart();
          await this.waitForInitialization();

          let data: TraceLabel | undefined;
          if (this.dataSource) {
            data = this.dataSource.find(ev => ev.id === traceLabelId);
          }
          if (!data) {
            data = await this._inventoryApiService.getTraceLabel(traceLabelId).toPromise();
          }
          await this.openEditFormDialog(data);
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          await this.loadingStop();
        }
      });
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      await this.loadingStart();
      const response = await this._inventoryApiService.getTraceLabels().toPromise();
      this.dataSource = response;
      this.takenEventType = [];
      this.dataSource?.forEach(val => {
        if (val.event_type !== null) {
          this.takenEventType.push(val.event_type);
        }
      });

    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      await this.loadingStop();
    }
  }

  private async _initFormData() {
    forkJoin([
      this._inventoryApiService.getMicroquakeEventTypes(),
    ]).subscribe(
      result => {
        this.eventTypes = result[0];
        this.initialized.next(true);
      }, err => {
        console.error(err);
      });
  }

  delete(id: number) {
    if (!id) {
      console.error(`No trace label id`);
      this._toastrNotificationService.error('No trace label id is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
      hasBackdrop: true,
      width: '350px',
      data: {
        header: `Are you sure?`,
        text: `Do you want to proceed and delete trace label (ID: ${id})?`
      }
    });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          const response = await this._inventoryApiService.deleteTraceLabel(id).toPromise();
          this.loadData();
          await this._toastrNotificationService.success('Trace label deleted');
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        }
      }
    });
  }

  async openEditFormDialog($event: TraceLabel) {
    const formDialogRef = this._matDialog.open<TraceLabelFormDialogComponent, TraceLabelFormDialogData>(
      TraceLabelFormDialogComponent, {
      hasBackdrop: true,
      autoFocus: false,
      width: '1200px',
      data: {
        model: $event,
        mode: PageMode.EDIT,
        takenEventType: this.takenEventType,
        eventTypes: this.eventTypes
      }
    });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['inventory/trace-labels'], { preserveQueryParams: true });
    });
  }

  async openCreateFormDialog() {
    const model: Partial<EventType> = {};
    const formDialogRef = this._matDialog.open<TraceLabelFormDialogComponent, TraceLabelFormDialogData>(
      TraceLabelFormDialogComponent, {
      hasBackdrop: true,
      autoFocus: false,
      width: '1200px',
      data: {
        model: model,
        mode: PageMode.CREATE,
        takenEventType: this.takenEventType,
        eventTypes: this.eventTypes
      }
    });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['inventory/trace-labels'], { preserveQueryParams: true });
    });
  }

  onRowClicked(ev: EventType) {
    // if (!this.waveformService) {
    //   this.waveformService = this._injector.get<WaveformService>(WaveformService);
    // }
    // if (this.waveformService) {
    //   this.waveformService.openApplicationDataDialog();
    // }
    this._router.navigate(['/inventory/trace-labels', ev.id]);
  }


}
