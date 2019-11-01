import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';

import { ListPage } from '@core/classes/list-page.class';
import { CableType } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { MatDialog } from '@angular/material';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-inventory-cable-type-list-page',
  templateUrl: './inventory-cable-type-list-page.component.html',
  styleUrls: ['./inventory-cable-type-list-page.component.scss']
})
export class InventoryCableTypeListPageComponent extends ListPage<CableType> {

  displayedColumns: string[] = ['code', 'manufacturer', 'part_number', 'r', 'l', 'g', 'c', 'id', 'actions'];
  paginationEnabled = false;

  constructor(
    private _inventoryApiSevice: InventoryApiService,
    private _loadingService: LoadingService,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    protected _router: Router
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      this._loadingService.start();
      this.dataSource = await this._inventoryApiSevice.getCableTypes().toPromise();
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this._loadingService.stop();
    }
  }

  onModelCreated($event: CableType) {
    this.dataSource.unshift($event);
  }

}
