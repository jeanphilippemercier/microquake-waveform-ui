import { Component, OnInit } from '@angular/core';
import { CatalogApiService } from '@app/core/services/catalog-api.service';
import { Site, Network } from '@app/core/interfaces/site.interface';
import { Router } from '@angular/router';

interface ViewerOptions {
  site?: string;
  network?: string;
}

@Component({
  selector: 'app-event-list-old',
  templateUrl: './event-list-old.component.html',
  styleUrls: ['./event-list-old.component.scss']
})
export class EventListOldComponent implements OnInit {

  sites: Site[];
  site: Site;
  network: Network;

  constructor(
    private _catalogApiService: CatalogApiService,
    private _router: Router
  ) { }

  async ngOnInit() {
    await this._loadSites();
  }

  clearSelectionClicked(event) {
    this.site = null;
    this.network = null;
  }

  submitClicked(event) {
    this._saveOptions();
    this._router.navigate(['v1/dashboard/reload']);
  }

  private _saveOptions() {
    const options: ViewerOptions = {};

    if (this.site) {
      options.site = this.site.code;
    }
    if (this.network) {
      options.network = this.network.code;
    }
    localStorage.setItem('viewer-options', JSON.stringify({ ...options }));
  }

  private async _loadSites() {
    this.sites = await this._catalogApiService.get_sites().toPromise();
    const options: ViewerOptions = JSON.parse(localStorage.getItem('viewer-options'));

    if (options) {
      if (options.site) {
        this.site = this.sites.find(site => site.code === options.site);
      }
      if (options.network && this.site && this.site.networks) {
        this.network = this.site.networks.find(network => network.code === options.network);
      }
    }
  }

}
