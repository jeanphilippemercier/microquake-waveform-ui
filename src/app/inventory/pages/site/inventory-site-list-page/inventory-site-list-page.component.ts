import { Component, OnInit } from '@angular/core';
import { InventoryApiService } from '@services/inventory-api.service';
import { Site } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-inventory-site-list-page',
  templateUrl: './inventory-site-list-page.component.html',
  styleUrls: ['./inventory-site-list-page.component.scss']
})
export class InventorySiteListPageComponent implements OnInit {

  displayedColumns: string[] = ['name', 'id', 'networks', 'actions'];
  dataSource!: Site[];

  constructor(
    private _inventoryApiService: InventoryApiService
  ) { }

  async ngOnInit() {
    this.dataSource = await this._inventoryApiService.getSites().toPromise();
  }

}
