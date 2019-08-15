import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Site, Timezone, CoordinateSystem } from '@interfaces/inventory.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { SiteCreateInput } from '@interfaces/inventory-dto.interface';


enum PageMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create'
}

@Component({
  selector: 'app-inventory-site-detail-page',
  templateUrl: './inventory-site-detail-page.component.html',
  styleUrls: ['./inventory-site-detail-page.component.scss']
})

export class InventorySiteDetailPageComponent implements OnInit, OnDestroy {

  params$: Subscription;
  siteId: number;
  site: Site | SiteCreateInput = {};
  timezones: Timezone[] = Object.values(Timezone);
  coordinateSystems: CoordinateSystem[] = Object.values(CoordinateSystem);
  editDisabled = true;
  pageMode: PageMode = PageMode.VIEW;
  PageMode = PageMode;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _inventoryApiService: InventoryApiService
  ) { }

  async ngOnInit() {

    this.params$ = this._activatedRoute.params.subscribe(async params => {

      if (params['siteId'] !== 'create') {
        this.siteId = params['siteId'];
        this.site = await this._inventoryApiService.getSite(this.siteId).toPromise();
        this.pageMode = PageMode.VIEW;
      } else if (params['siteId'] === 'create') {
        this.pageMode = PageMode.CREATE;
      }
    });
  }

  ngOnDestroy() {
    if (this.params$) {
      this.params$.unsubscribe();
    }
  }

  editDisabledFn() {
    this.editDisabled = !this.editDisabled;
  }
}
