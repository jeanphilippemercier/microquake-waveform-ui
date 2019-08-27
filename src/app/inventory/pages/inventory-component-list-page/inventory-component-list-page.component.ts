import { Component, OnInit } from '@angular/core';

import { PageMode } from '@interfaces/core.interface';
import { IComponent } from '@interfaces/inventory.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Params, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-inventory-component-list-page',
  templateUrl: './inventory-component-list-page.component.html',
  styleUrls: ['./inventory-component-list-page.component.scss']
})
export class InventoryComponentListPageComponent implements OnInit {

  loading = false;

  pageSize = 15;
  count = 0;
  previous: string | null = null;
  next: string | null = null;
  PageMode = PageMode;
  components: IComponent[];

  constructor(
    private _inventoryApiSevice: InventoryApiService,
    private _ngxSpinnerService: NgxSpinnerService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router
  ) { }

  async ngOnInit() {

    this._activatedRoute.queryParams.subscribe(async (params) => {
      let cursor: string;
      if (params) {
        if (params.cursor) {
          cursor = params.cursor;
        }
      }

      await this.loadData(cursor);
    });

  }

  async loadData(cursor?: string) {
    try {
      this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
      this.loading = true;

      const query: PaginationRequest = {
        page_size: this.pageSize,
      };

      if (cursor) {
        query.cursor = cursor;
      }

      const response = await this._inventoryApiSevice.getComponents(query).toPromise();

      this.components = response.results;
      this.count = response.count;
      this.previous = response.cursor_previous;
      this.next = response.cursor_next;
    } catch (err) {
      console.error(err);
    } finally {
      this._ngxSpinnerService.hide('loadingTable');
      this.loading = false;
    }
  }

  async onNextPage() {
    await this.changePage(this.next);
  }

  async onPreviousPage() {
    await this.changePage(this.previous);
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
