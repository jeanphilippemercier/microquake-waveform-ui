import { Table } from './table.class';
import { Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

export class TableWithExpandableRows<T> extends Table<T> {
  expandedElement: T | null = null;
  addingNewComponent = false;

  @Output() modelCreated: EventEmitter<T> = new EventEmitter();
  @Output() modelEdited: EventEmitter<T> = new EventEmitter();

  constructor(
    protected _matDialog: MatDialog
  ) {
    super(_matDialog);
  }

}
