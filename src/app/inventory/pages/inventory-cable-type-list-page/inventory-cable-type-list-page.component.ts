import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { CableType } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Params, Router, ActivatedRoute } from '@angular/router';
import { ListPage } from '@app/inventory/classes/list-page.class';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-inventory-cable-type-list-page',
  templateUrl: './inventory-cable-type-list-page.component.html',
  styleUrls: ['./inventory-cable-type-list-page.component.scss']
})
export class InventoryCableTypeListPageComponent extends ListPage<CableType> {

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['code', 'manufacturer', 'part_number', 'r', 'l', 'g', 'c', 'id', 'actions'];
  paginationEnabled = false;

  constructor(
    private _inventoryApiSevice: InventoryApiService,
    private _ngxSpinnerService: NgxSpinnerService,
    private _router: Router,
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog
  ) {
    super(_activatedRoute, _matDialog);
  }

  protected async _loadData(cursor?: string) {
    try {
      this.loading = true;
      this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
      this.dataSource = await this._inventoryApiSevice.getCableTypes().toPromise();
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this._ngxSpinnerService.hide('loadingTable');
    }
  }

  onModelCreated($event: CableType) {
    this.dataSource.unshift($event);
  }

}
