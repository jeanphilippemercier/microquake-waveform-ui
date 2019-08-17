import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { IComponent } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-inventory-component-list',
  templateUrl: './inventory-component-list.component.html',
  styleUrls: ['./inventory-component-list.component.scss']
})
export class InventoryComponentListComponent implements OnInit {

  @Input() data: IComponent[];
  @Input() loading = false;
  @Input() count = 0;
  @Input() showPagination = true;
  @Output() nextPage = new EventEmitter();
  @Output() previousPage = new EventEmitter();

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['id', 'sensor', 'cableLength', 'code', 'sensorType', 'motionType', 'enabled', 'actions'];
  dataSource: IComponent[];

  pageSize = 15;

  constructor() { }

  async ngOnInit() {
  }

  async onPageChange($event: PageEvent) {
    if ($event.previousPageIndex > $event.pageIndex) {
      this.previousPage.emit();
    } else {
      this.nextPage.emit();
    }
  }

}
