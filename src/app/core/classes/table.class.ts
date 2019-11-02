import { OnInit, TemplateRef, Output, EventEmitter, Input } from '@angular/core';
import { MatDialog, PageEvent, Sort } from '@angular/material';

import { PageMode } from '@interfaces/core.interface';

export class Table<T> implements OnInit {

  displayedColumns: string[] = [];
  previous: string | null = null;
  next: string | null = null;
  PageMode = PageMode;
  paginationEnabled = true;


  initialized = false;

  @Input() dataSource: T[] | undefined;
  @Input() count = 0;
  @Input() pageSize = 15;
  @Input() showPagination = true;
  @Output() nextPage = new EventEmitter();
  @Output() previousPage = new EventEmitter();
  @Output() sort: EventEmitter<Sort> = new EventEmitter();
  @Output() delete: EventEmitter<number> = new EventEmitter();
  @Output() reloadDataSource: EventEmitter<void> = new EventEmitter();

  constructor(
    protected _matDialog: MatDialog
  ) { }

  async ngOnInit() {
  }

  onDelete($event: number) {
    this.delete.emit($event);
  }

  onSort($event: Sort) {
    this.sort.emit($event);
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }

  closeDialog() {
    this._matDialog.closeAll();
  }

  async onPageChange($event: PageEvent) {
    if ($event.previousPageIndex && $event.previousPageIndex > $event.pageIndex) {
      this.previousPage.emit();
    } else {
      this.nextPage.emit();
    }
  }

}
