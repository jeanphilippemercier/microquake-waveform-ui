import { Component, Inject, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
import { EventFilterDialogData, EventSitePickerDialogData } from '@interfaces/dialogs.interface';
import { Site, Network } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-event-site-picker-dialog',
  templateUrl: './event-site-picker-dialog.component.html',
  styleUrls: ['./event-site-picker-dialog.component.scss']
})
export class EventSitePickerDialogComponent {

  loading = true;
  sites: Site[] = [];
  networks: Network[] = [];
  currentNetwork: Network;
  currentSite: Site;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _dialogData: EventSitePickerDialogData
  ) {
    this.sites = this._dialogData.sites;
    this.networks = this._dialogData.networks;
    this.currentSite = this._dialogData.currentSite;
    this.currentNetwork = this._dialogData.currentNetwork;

    if (!this.currentSite && this.sites) {
      this.currentSite = this.sites[0];
    }

    if (!this.currentNetwork && this.networks) {
      this.currentNetwork = this.networks[0];
    }
  }

  onAcceptClick() { }
}
