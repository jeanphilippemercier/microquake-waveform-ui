import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material';

import { Site, Network } from '@interfaces/site.interface';

@Component({
  selector: 'app-site-network-field',
  templateUrl: './site-network-field.component.html',
  styleUrls: ['./site-network-field.component.scss']
})
export class SiteNetworkFieldComponent {

  @Input() site: Site;
  @Input() network: Network;
  @Output() networkChange: EventEmitter<Network> = new EventEmitter();

  onChangeNetwork(event: MatSelectChange) {
    this.networkChange.emit(event.value);
  }
}
