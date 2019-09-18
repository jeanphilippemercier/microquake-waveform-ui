import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { PageMode } from '@interfaces/core.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { Sensor, Station } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Params, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-inventory-station-list-page',
  templateUrl: './inventory-station-list-page.component.html',
  styleUrls: ['./inventory-station-list-page.component.scss']
})
export class InventoryStationListPageComponent implements OnInit {

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['name', 'network', 'code', 'communication', 'power', 'id', 'actions'];
  dataSource: Station[];
  loading = false;

  pageSize = 15;
  count = 0;
  previous: string | null = null;
  next: string | null = null;
  PageMode = PageMode;

  constructor(
    private _inventoryApiSevice: InventoryApiService,
    private _ngxSpinnerService: NgxSpinnerService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    this._activatedRoute.queryParams.subscribe(async (params) => {
      let cursor: string;
      if (params) {
        if (params.cursor) {
          cursor = params.cursor;
        }
        if (params.page_size) {
          this.pageSize = params.page_size;
        }
      }

      await this.loadData(cursor);
    });
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;
      this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      const query: PaginationRequest = {
        cursor,
        page_size: this.pageSize
      };

      // if (cursor) {
      //   query.cursor = cursor;
      // }
      // if (page_size) {
      //   query.page_size = page_size;
      // }

      const response = await this._inventoryApiSevice.getStations(query).toPromise();

      this.dataSource = response.results;
      this.count = response.count;
      this.previous = response.cursor_previous;
      this.next = response.cursor_next;
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this._ngxSpinnerService.hide('loadingTable');
    }
  }

  async pageChange($event: PageEvent) {
    let cursor = this.next;

    if ($event.previousPageIndex > $event.pageIndex) {
      cursor = this.previous;
    }
    await this.changePage(cursor);
  }

  async changePage(cursor: string) {
    const queryParams: Params = { page_size: this.pageSize, cursor };

    this._router.navigate(
      [],
      {
        relativeTo: this._activatedRoute,
        queryParams: queryParams,
        queryParamsHandling: 'merge',
      });
  }

}
