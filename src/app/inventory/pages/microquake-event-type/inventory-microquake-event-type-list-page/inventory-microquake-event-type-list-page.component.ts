import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { NgxSpinnerService } from 'ngx-spinner';
import { first, takeUntil } from 'rxjs/operators';

import { ListPage } from '@core/classes/list-page.class';
import { InventoryApiService } from '@services/inventory-api.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, MicroquakeEventTypeFormDialogData } from '@interfaces/dialogs.interface';
import { EventType, QuakemlTypeWithMappedMicroquakeType } from '@interfaces/event.interface';
import { MicroquakeEventTypeTableComponent } from '@app/inventory/components/microquake-event-type/microquake-event-type-table/microquake-event-type-table.component';
import { MicroquakeEventTypeFormDialogComponent } from '@app/inventory/dialogs/microquake-event-type-form-dialog/microquake-event-type-form-dialog.component';
import { TakenEventType, Site } from '@interfaces/inventory.interface';
import { forkJoin } from 'rxjs';
import { PageMode } from '@interfaces/core.interface';

@Component({
  selector: 'app-inventory-microquake-event-type-list-page',
  templateUrl: './inventory-microquake-event-type-list-page.component.html',
  styleUrls: ['./inventory-microquake-event-type-list-page.component.scss']
})
export class InventoryMicroquakeEventTypeListPageComponent extends ListPage<EventType> {

  takenEventType: TakenEventType[] = [];
  sites: Site[] = [];
  quakemlTypes: QuakemlTypeWithMappedMicroquakeType[] = [];

  constructor(
    private _inventoryApiService: InventoryApiService,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    protected _router: Router,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
  }

  async afterNgOnInit() {
    this._initFormData();
    this._activatedRoute.params
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async params => {
        const microquakeEventTypeId = +params['microquakeEventTypeId'];
        if (!microquakeEventTypeId) {
          return;
        }

        try {
          await this.loadingStart();
          await this.wiatForInitialization();

          let data: EventType | undefined;
          if (this.dataSource) {
            data = this.dataSource.find(ev => ev.id === microquakeEventTypeId);
          }
          if (!data) {
            data = await this._inventoryApiService.getMicroquakeEventType(microquakeEventTypeId).toPromise();
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
      const response = await this._inventoryApiService.getMicroquakeEventTypes().toPromise();
      this.dataSource = response;

      this.takenEventType = this.dataSource.map(val => {
        const obj: TakenEventType = {
          quakeml_type: val.quakeml_type,
          microquake_type: val
        };
        return obj;
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
      this._inventoryApiService.getSites(),
      this._inventoryApiService.getQuakemlEventTypes()
    ]).subscribe(
      result => {
        this.sites = result[0];
        this.quakemlTypes = result[1];
        this.initialized.next(true);
      }, err => {
        console.error(err);
      });
  }

  delete(id: number) {
    if (!id) {
      console.error(`No microquake event type id`);
      this._toastrNotificationService.error('No microquake event type id is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          header: `Are you sure?`,
          text: `Do you want to proceed and delete microquake event type (ID: ${id})?`
        }
      });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          const response = await this._inventoryApiService.deleteMicroquakeEventType(id).toPromise();
          this.loadData();
          await this._toastrNotificationService.success('Microquake event type deleted');
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        }
      }
    });
  }

  async openEditFormDialog($event: EventType) {
    const formDialogRef = this._matDialog.open<MicroquakeEventTypeFormDialogComponent, MicroquakeEventTypeFormDialogData>(
      MicroquakeEventTypeFormDialogComponent, {
        hasBackdrop: true,
        autoFocus: false,
        data: {
          model: $event,
          mode: PageMode.EDIT,
          sites: this.sites,
          takenEventType: this.takenEventType,
          quakemlTypes: this.quakemlTypes
        }
      });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['inventory/microquake-event-types'], { preserveQueryParams: true });
    });
  }

  async openCreateFormDialog() {
    const model: Partial<EventType> = {};
    const formDialogRef = this._matDialog.open<MicroquakeEventTypeFormDialogComponent, MicroquakeEventTypeFormDialogData>(
      MicroquakeEventTypeFormDialogComponent, {
        hasBackdrop: true,
        autoFocus: false,
        data: {
          model: model,
          mode: PageMode.CREATE,
          sites: this.sites,
          takenEventType: this.takenEventType,
          quakemlTypes: this.quakemlTypes
        }
      });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['inventory/microquake-event-types'], { preserveQueryParams: true });
    });
  }

  onRowClicked(ev: EventType) {
    this._router.navigate(['/inventory/microquake-event-types', ev.id]);
  }
}
