import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { PageMode } from '@interfaces/core.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { Sensor } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Params, Router, ActivatedRoute } from '@angular/router';
import { ListPage } from '@core/classes/list-page.class';
import { MatDialog, Sort } from '@angular/material';
import { SensorsQuery, SensorsQueryOrdering } from '@interfaces/inventory-query.interface';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-sensor-list-page',
  templateUrl: './inventory-sensor-list-page.component.html',
  styleUrls: ['./inventory-sensor-list-page.component.scss']
})
export class InventorySensorListPageComponent extends ListPage<Sensor> implements OnInit {

  ordring: SensorsQueryOrdering = SensorsQueryOrdering.station_location_codeASC;
  search = '';
  searchChange = new Subject<string>();

  constructor(
    private _inventoryApiSevice: InventoryApiService,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute,
    protected _ngxSpinnerService: NgxSpinnerService
  ) {
    super(_activatedRoute, _matDialog, _router, _ngxSpinnerService);
    this._subscribeOnSearch();
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      const query: SensorsQuery = {
        cursor,
        ordering: this.ordring,
        page_size: this.pageSize
      };

      if (this.search) {
        query.search = this.search;
      }

      const response = await this._inventoryApiSevice.getSensors(query).toPromise();

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
    if ($event.active === 'sensor') {
      if ($event.direction === 'asc') {
        this.ordring = SensorsQueryOrdering.station_location_codeASC;
      } else {
        this.ordring = SensorsQueryOrdering.station_location_codeDESC;
      }
    }
    this.loadData();
  }

  private _subscribeOnSearch() {
    this.searchChange.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
        this.search = value;
        this.loadData();
      });
  }

}
