import { OnInit, TemplateRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import { PageMode } from '@interfaces/core.interface';
import { ReplaySubject, Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { skipWhile, take, debounceTime, takeUntil } from 'rxjs/operators';
export class ListPage<T> implements OnInit, OnDestroy {

  dataSource: T[] | null = null;

  loading = false;
  pageSize = 15;
  count = 0;
  cursorPrevious: string | null = null;
  cursorNext: string | null = null;
  currentPage = 0;
  PageMode = PageMode;
  paginationEnabled = true;
  initialized: ReplaySubject<boolean> = new ReplaySubject(1);
  @Output() nextPage = new EventEmitter();
  @Output() previousPage = new EventEmitter();
  protected _unsubscribe = new Subject<void>();

  // search filter
  search = '';
  searchChange = new Subject<string>();

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
        if (params.search) {
          this.search = params.search;
        } else {
          this.search = '';
        }
      }

      await this.loadData(cursor);
    });

    this.afterNgOnInit();
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  async afterNgOnInit() { }

  public wiatForInitialization(): Promise<void> {
    return new Promise(resolve => {
      this.initialized.pipe(
        skipWhile(val => val !== true),
        take(1)
      ).subscribe(val => resolve());
    });
  }

  protected _subscribeToSearch() {
    this.searchChange.pipe(
      debounceTime(400),
      takeUntil(this._unsubscribe)
    ).subscribe(value => {
      this.search = value;
      const queryParams: Params = {};

      if (this.search) {
        queryParams.search = this.search;
      }

      this._router.navigate(
        [],
        {
          relativeTo: this._activatedRoute,
          queryParams: queryParams,
          replaceUrl: true
        });
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
        replaceUrl: true
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

  clearFilter() {
    this._router.navigate(
      [],
      {
        relativeTo: this._activatedRoute,
        queryParams: {},
      });
  }
}
