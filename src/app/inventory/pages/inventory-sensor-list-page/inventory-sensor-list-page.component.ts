import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material';

import { PageMode } from '@interfaces/core.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { Sensor } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';

@Component({
  selector: 'app-inventory-sensor-list-page',
  templateUrl: './inventory-sensor-list-page.component.html',
  styleUrls: ['./inventory-sensor-list-page.component.scss']
})
export class InventorySensorListPageComponent implements OnInit {

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['id', 'name', 'station', 'borehole', 'code', 'components', 'enabled', 'actions'];
  dataSource: Sensor[];
  loading = false;

  pageSize = 15;
  count = 0;
  previous: string | null = null;
  next: string | null = null;
  PageMode = PageMode;

  constructor(
    private _inventoryApiSevice: InventoryApiService
  ) { }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData(cursor?: string) {
    try {
      this.loading = true;

      const query: PaginationRequest = {
        page_size: this.pageSize,
      };

      if (cursor) {
        query.cursor = cursor;
      }

      const response = await this._inventoryApiSevice.getSensors(query).toPromise();

      this.dataSource = response.results;
      this.count = response.count;
      this.previous = response.cursor_previous;
      this.next = response.cursor_next;
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async pageChange($event: PageEvent) {
    let cursor = this.next;

    if ($event.previousPageIndex > $event.pageIndex) {
      cursor = this.previous;
    }
    await this.loadData(cursor);
  }

}
