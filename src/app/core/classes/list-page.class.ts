import { OnInit, TemplateRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDialog, PageEvent } from '@angular/material';

import { PageMode } from '@interfaces/core.interface';
import { ReplaySubject, Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { skipWhile, take } from 'rxjs/operators';
export class ListPage<T> implements OnInit, OnDestroy {

  dataSource: T[] | null = null;

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
  protected _unsubscribe = new Subject<void>();

  constructor(
    protected _activatedRoute: ActivatedRoute,
    protected _matDialog: MatDialog,
    protected _router: Router,
    protected _ngxSpinnerService: NgxSpinnerService
  ) { }

  async ngOnInit() {

    this._activatedRoute.queryParams.subscribe(async (params) => {
      let cursor: string | undefined;
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

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  public wiatForInitialization(): Promise<void> {
    return new Promise(resolve => {
      this.initialized.pipe(
        skipWhile(val => val !== true),
        take(1)
      ).subscribe(val => resolve());
    });
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }

  closeDialog() {
    this._matDialog.closeAll();
  }

  async loadData(cursor?: string) { }


  async changePage(cursor: string | null) {
    const queryParams: Params = { page_size: this.pageSize, cursor };

    this._router.navigate(
      [],
      {
        relativeTo: this._activatedRoute,
        queryParams: queryParams,
        queryParamsHandling: 'merge',
      });
  }

  async loadingTableStart() {
    await this._ngxSpinnerService.show('loadingTable', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingTableStop() {
    await this._ngxSpinnerService.hide('loadingTable');
  }

  async loadingStart() {
    await this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingStop() {
    await this._ngxSpinnerService.hide('loading');
  }
}
