import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { } from '@interfaces/core.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { Borehole } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { ListPage } from '@core/classes/list-page.class';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-inventory-borehole-list-page',
  templateUrl: './inventory-borehole-list-page.component.html',
  styleUrls: ['./inventory-borehole-list-page.component.scss']
})
export class InventoryBoreholeListPageComponent extends ListPage<Borehole> implements OnInit {

  constructor(
    private _inventoryApiSevice: InventoryApiService,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    protected _ngxSpinnerService: NgxSpinnerService
  ) {
    super(_activatedRoute, _matDialog, _router);
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      const query: PaginationRequest = {
        cursor,
        page_size: this.pageSize
      };

      const response = await this._inventoryApiSevice.getBoreholes(query).toPromise();

      this.dataSource = response.results;
      this.count = response.count;
      this.cursorPrevious = response.cursor_previous;
      this.cursorNext = response.cursor_next;
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this._ngxSpinnerService.hide('loadingTable');
    }
  }

}
