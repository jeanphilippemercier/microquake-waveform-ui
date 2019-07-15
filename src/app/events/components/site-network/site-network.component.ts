import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material';

import { CatalogApiService } from '@services/catalog-api.service';
import { Site, Network } from '@interfaces/site.interface';
interface ViewerOptions {
  site?: string;
  network?: string;
}
// TODO: refactor to presentation component and move to shared module
@Component({
  selector: 'app-site-network',
  templateUrl: './site-network.component.html',
  styleUrls: ['./site-network.component.scss']
})
export class SiteNetworkComponent implements OnInit {

  public sites: Site[];
  public selectedSite: Site;
  public selectedNetwork: Network;

  constructor(
    private _router: Router,
    private _catalogService: CatalogApiService
  ) { }

  async ngOnInit() {
    await this._loadSites();

    const options: ViewerOptions = JSON.parse(localStorage.getItem('viewer-options'));

    if (options) {
      if (options.site) {
        this.selectedSite = this.sites.find(site => site.code === options.site);
      }
      if (options.network && this.selectedSite && this.selectedSite.networks) {
        this.selectedNetwork = this.selectedSite.networks.find(network => network.code === options.network);
      }
    }
  }

  private async _loadSites() {
    this.sites = await this._catalogService.get_sites().toPromise();
  }

  private _saveOptions() {
    const options: ViewerOptions = {};

    if (this.selectedSite) {
      options.site = this.selectedSite.code;
    }
    if (this.selectedNetwork) {
      options.network = this.selectedNetwork.code;
    }
    localStorage.setItem('viewer-options', JSON.stringify({ ...options }));
  }

  onChangeSite(event: MatSelectChange) { }

  onChangeNetwork(event: MatSelectChange) { }

  clearSelections(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    this.selectedSite = null;
    this.selectedNetwork = null;
    this._saveOptions();
  }

  submit() {
    this._saveOptions();
    this._router.navigate(['dashboard/reload']);
  }
}
