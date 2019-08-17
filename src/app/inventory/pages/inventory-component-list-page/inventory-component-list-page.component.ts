import { Component, OnInit } from '@angular/core';

import { PageMode } from '@interfaces/core.interface';
import { IComponent } from '@interfaces/inventory.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';

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
    private _ngxSpinnerService: NgxSpinnerService
  ) { }

  async ngOnInit() {
    await this.loadData();
    console.log(this.components);

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
    await this.loadData(this.next);
  }

  async onPreviousPage() {
    await this.loadData(this.previous);
  }
}
