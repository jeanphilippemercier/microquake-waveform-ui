import { OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';

import { PageMode } from '@interfaces/core.interface';

export class ListPage<T> implements OnInit {

  displayedColumns: string[];
  dataSource: T[];

  loading = false;
  pageSize = 15;
  count = 0;
  previous: string | null = null;
  next: string | null = null;
  PageMode = PageMode;
  paginationEnabled = true;

  constructor(
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog
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

      await this._loadData(cursor);
    });
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }

  closeDialog() {
    this._matDialog.closeAll();
  }

  protected async _loadData(cursor: string) { }


}
