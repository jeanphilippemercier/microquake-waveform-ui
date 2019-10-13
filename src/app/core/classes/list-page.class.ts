import { OnInit, TemplateRef, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDialog, PageEvent } from '@angular/material';

import { PageMode } from '@interfaces/core.interface';
import { ReplaySubject } from 'rxjs';
export class ListPage<T> implements OnInit {

  displayedColumns: string[];
  dataSource: T[];

  loading = false;
  pageSize = 15;
  count = 0;
  cursorPrevious: string | null = null;
  cursorNext: string | null = null;
  PageMode = PageMode;
  paginationEnabled = true;
  initialized: ReplaySubject<boolean> = new ReplaySubject(1);
  @Output() nextPage = new EventEmitter();
  @Output() previousPage = new EventEmitter();

  constructor(
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    protected _router: Router
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

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }

  closeDialog() {
    this._matDialog.closeAll();
  }

  async loadData(cursor: string) { }


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
