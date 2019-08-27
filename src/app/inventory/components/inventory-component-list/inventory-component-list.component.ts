import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { IComponent } from '@interfaces/inventory.interface';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-inventory-component-list',
  templateUrl: './inventory-component-list.component.html',
  styleUrls: ['./inventory-component-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class InventoryComponentListComponent implements OnInit {

  @Input() data: IComponent[];
  @Input() loading = false;
  @Input() count = 0;
  @Input() showPagination = true;
  @Output() nextPage = new EventEmitter();
  @Output() previousPage = new EventEmitter();

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['detail', 'id', 'sensor', 'cableLength', 'code', 'sensorType', 'motionType', 'enabled', 'actions'];
  dataSource: IComponent[];
  expandedElement: IComponent | null;
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
