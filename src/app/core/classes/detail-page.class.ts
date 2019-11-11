import { Input, Output, EventEmitter, TemplateRef, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatTabChangeEvent } from '@angular/material';

import { PageMode } from '@interfaces/core.interface';
import { NgxSpinnerService } from 'ngx-spinner';
import { BehaviorSubject, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

export class DetailPage<T> implements OnInit, OnDestroy {

  @Input() mode: PageMode = PageMode.CREATE;
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  model: T | null = null;
  id!: number;
  basePageUrlArr: string[] = [];
  editDisabled = false;
  pageMode: PageMode = PageMode.EDIT;
  loading = false;
  currentTabId = 0;
  detailInitialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  mapTabs = [
    ''
  ];
  protected _unsubscribe = new Subject<void>();

  constructor(
    protected _activatedRoute: ActivatedRoute,
    protected _router: Router,
    protected _matDialog: MatDialog,
    protected _ngxSpinnerService: NgxSpinnerService,
  ) { }

  async ngOnInit() {
    const params = this._activatedRoute.snapshot.params;
    if (params['id'] === PageMode.CREATE) {
      this.pageMode = PageMode.CREATE;
    } else {
      this.pageMode = PageMode.EDIT;
      this.id = params['id'];
    }

    this.currentTabId = this.getTabId(params['tabId']);
    this.handleTabInit(this.currentTabId);
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  handleTabInit(idx: number) { }

  getTabId(tabName: string | null): number {
    const found = this.mapTabs.findIndex((el, i) => el === tabName);
    return found < 0 ? 0 : found;
  }

  getTabName(tabId: number | null): string {
    return tabId !== null && tabId > -1 && tabId < this.mapTabs.length ? this.mapTabs[tabId] : '';
  }

  tabChanged($event: MatTabChangeEvent) {
    const idx = $event.index;
    this._router.navigate([...this.basePageUrlArr, this.id, this.getTabName(idx)], { replaceUrl: true });
    this.handleTabInit(idx);
  }

  onCancel() {
    this.cancel.emit();
  }

  openDialog(templateRef: TemplateRef<any>) {
    this._matDialog.open(templateRef);
  }

  closeDialog() {
    this._matDialog.closeAll();
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
