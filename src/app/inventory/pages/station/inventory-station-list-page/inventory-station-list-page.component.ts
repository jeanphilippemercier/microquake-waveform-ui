import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, Sort } from '@angular/material';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ListPage } from '@core/classes/list-page.class';
import { Station } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { StationsQuery, StationsQueryOrdering } from '@interfaces/inventory-query.interface';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-inventory-station-list-page',
  templateUrl: './inventory-station-list-page.component.html',
  styleUrls: ['./inventory-station-list-page.component.scss']
})
export class InventoryStationListPageComponent extends ListPage<Station> {

  ordering: StationsQueryOrdering = StationsQueryOrdering.codeASC;
  search = '';
  searchChange = new Subject<string>();

  constructor(
    private _inventoryApiSevice: InventoryApiService,
    private _loadingService: LoadingService,
    protected _ngxSpinnerService: NgxSpinnerService,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
    this._subscribeToSearch();
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      this._loadingService.start();

      const query: StationsQuery = {
        cursor,
        page_size: this.pageSize
      };

      if (this.ordering) {
        query.ordering = this.ordering;
      }

      if (this.search) {
        query.search = this.search;
      }

      const response = await this._inventoryApiSevice.getStations(query).toPromise();

      this.dataSource = response.results;
      this.count = response.count;
      this.cursorPrevious = response.cursor_previous;
      this.cursorNext = response.cursor_next;
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this._loadingService.stop();
    }
  }

  onSort($event: Sort) {
    if ($event.active === 'code') {
      if ($event.direction === 'asc') {
        this.ordering = StationsQueryOrdering.codeASC;
      } else {
        this.ordering = StationsQueryOrdering.codeDESC;
      }
    } else if ($event.active === 'name') {
      if ($event.direction === 'asc') {
        this.ordering = StationsQueryOrdering.nameASC;
      } else {
        this.ordering = StationsQueryOrdering.nameDESC;
      }
    }
    this.loadData();
  }

  private _subscribeToSearch() {
    this.searchChange.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
        this.search = value;
        this.loadData();
      });
  }
}
