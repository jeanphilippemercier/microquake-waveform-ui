import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';

import { ListPage } from '@core/classes/list-page.class';
import { CableType } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { MatDialog } from '@angular/material/dialog';
import { LoadingService } from '@services/loading.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogData, CableTypeFormDialogData } from '@interfaces/dialogs.interface';
import { first, takeUntil } from 'rxjs/operators';
import { CableTypeFormDialogComponent } from '@app/inventory/dialogs/cable-type-form-dialog/cable-type-form-dialog.component';
import { PageMode } from '@interfaces/core.interface';

@Component({
  selector: 'app-inventory-cable-type-list-page',
  templateUrl: './inventory-cable-type-list-page.component.html',
  styleUrls: ['./inventory-cable-type-list-page.component.scss']
})
export class InventoryCableTypeListPageComponent extends ListPage<CableType> {

  constructor(
    private _inventoryApiService: InventoryApiService,
    private _loadingService: LoadingService,
    private _toastrNotificationService: ToastrNotificationService,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    protected _router: Router,
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
  }

  async afterNgOnInit() {
    this._activatedRoute.params
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async params => {

        const cableTypeId = +params['cableTypeId'];
        if (!cableTypeId) {
          return;
        }

        try {
          await this.loadingStart();

          let data: CableType | undefined;
          if (this.dataSource) {
            data = this.dataSource.find(ev => ev.id === cableTypeId);
          }
          if (!data) {
            data = await this._inventoryApiService.getCableType(cableTypeId).toPromise();
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
      this._loadingService.start();
      this.dataSource = await this._inventoryApiService.getCableTypes().toPromise();
    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err);
    } finally {
      this.loading = false;
      this._loadingService.stop();
    }
  }


  delete(id: number) {
    if (!id) {
      console.error(`No cable type type id is defined`);
      this._toastrNotificationService.error('No cable type type id is defined');
    }

    const deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          header: `Are you sure?`,
          text: `Do you want to proceed and delete cable type (ID: ${id})?`
        }
      });

    deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          this._loadingService.start();
          const response = await this._inventoryApiService.deleteCableType(id).toPromise();
          this.loadData();
          await this._toastrNotificationService.success('Cable type deleted');
        } catch (err) {
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          this._loadingService.stop();
        }
      }
    });
  }

  async openEditFormDialog($event: CableType) {
    const formDialogRef = this._matDialog.open<CableTypeFormDialogComponent, CableTypeFormDialogData>(
      CableTypeFormDialogComponent, {
        hasBackdrop: true,
        autoFocus: false,
        data: {
          model: $event,
          mode: PageMode.EDIT,
        }
      });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['inventory/cable-types'], { preserveQueryParams: true });
    });
  }

  async openCreateFormDialog() {
    const model: Partial<CableType> = {};
    const formDialogRef = this._matDialog.open<CableTypeFormDialogComponent, CableTypeFormDialogData>(
      CableTypeFormDialogComponent, {
        hasBackdrop: true,
        autoFocus: false,
        data: {
          model: model,
          mode: PageMode.CREATE
        }
      });

    formDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.loadData();
      }
      this._router.navigate(['inventory/cable-types'], { preserveQueryParams: true });
    });
  }

  onRowClicked(ev: CableType) {
    this._router.navigate(['/inventory/cable-types', ev.id]);
  }



}
