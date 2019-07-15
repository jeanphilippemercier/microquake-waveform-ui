import { Component, OnInit } from '@angular/core';
import { CatalogApiService } from '../core/services/catalog-api.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-site-network',
  templateUrl: './site-network.component.html',
  styleUrls: ['./site-network.component.scss']
})
export class SiteNetworkComponent implements OnInit {

  public options: any;
  public site: any;
  public sites: any[];
  public network: any;
  public networks: any[];
  private loadSites: Function;
  public onChangeSite: Function;
  public onChangeNetwork: Function;
  private saveOption: Function;
  private deleteOption: Function;
  private clearSelections: Function;

  constructor(private _catalogService: CatalogApiService, private router: Router) { }

  public submit() {
    this.saveOption('site');
    this.saveOption('network');
    this.router.navigate(['dashboard/reload']);
  }

  ngOnInit() {

    this.options = JSON.parse(window.localStorage.getItem('viewer-options'));
    this.options = this.options ? this.options : {};

    const emptyElement = {
      'code': '',
      'name': ''
    };

    this.site = this.options.hasOwnProperty('site') ? this.options.site : emptyElement;

    this.network = this.options.hasOwnProperty('network') ? this.options.network : emptyElement;

    this.loadSites = () => {
      this._catalogService.get_sites().subscribe(sites => {
        this.sites = sites;
        this.networks = this.options.hasOwnProperty('site') ? this.sites.find(v => v.code === this.site).networks : [];
      });
    };

    this.loadSites();

    this.clearSelections = () => {
      this.deleteOption('site');
      this.deleteOption('network');
      this.networks = [];
      this.site = emptyElement;
      this.network = emptyElement;
    };

    this.onChangeSite = event => {
      if (event.value) {
        this.site = event.value;
        this.networks = this.sites.find(v => v.code === event.value).networks;
      }
    };

    this.onChangeNetwork = event => {
      this.network = event.value;
    };

    this.saveOption = option => {
      this.options[option] = this[option];
      window.localStorage.setItem('viewer-options', JSON.stringify(this.options));
    };

    this.deleteOption = option => {
      delete this.options[option];
      window.localStorage.setItem('viewer-options', JSON.stringify(this.options));
    };


  }


}
