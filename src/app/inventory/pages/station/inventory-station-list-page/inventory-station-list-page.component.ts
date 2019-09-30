import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { PageMode } from '@interfaces/core.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { Sensor, Station } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Params, Router, ActivatedRoute } from '@angular/router';
import { ListPage } from '@core/classes/list-page.class';
import { MatDialog, Sort } from '@angular/material';
import { StationsQuery, StationsQueryOrdering, SensorsQueryOrdering } from '@interfaces/inventory-query.interface';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
    private _ngxSpinnerService: NgxSpinnerService,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute
  ) {
    super(_activatedRoute, _matDialog, _router);
    this._subscribeToSearch();
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

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
      this._ngxSpinnerService.hide('loadingTable');
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
