import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { IComponent, ISensorType, ComponentCode, CableType } from '@interfaces/inventory.interface';
import {  MatDialog } from '@angular/material';
import { Table } from '@core/classes/table.class';
import { Router } from '@angular/router';

@Component({
  selector: 'app-component-table-2',
  templateUrl: './component-table-2.component.html',
  styleUrls: ['./component-table-2.component.scss'],
})
export class ComponentTable2Component extends Table<IComponent> implements OnInit {

  @Input() sensorId!: number;

  sensorTypes: ISensorType[] = [];
  cables: CableType[] = [];

  displayedColumns: string[] = ['detail', 'enabled', 'component', 'cable', 'cableLength', 'sensorType', 'motionType', 'id', 'actions'];
  addingNewComponent = false;
  initialized = false;

  allComponentCodes = Object.values(ComponentCode);
  missingComponentCodes: ComponentCode[] = [];

  constructor(
    protected _matDialog: MatDialog,
    private _router: Router
  ) {
    super(_matDialog);
  }

  async onPageChange($event: PageEvent) {
    if ($event.previousPageIndex && $event.previousPageIndex > $event.pageIndex) {
      this.previousPage.emit();
    } else {
      this.nextPage.emit();
    }
  }

  onModelEdited($event: IComponent, oldEvent: IComponent) {
    Object.assign(oldEvent, $event);
  }

  // editButtonClick(microquakeEventTypeId: number) {
  //   this._router.navigate(['inventory/microquake-event-types', microquakeEventTypeId], { preserveQueryParams: true });
  // }

  rowClicked($event: IComponent) {
    this.rowClick.emit($event);
  }
}
