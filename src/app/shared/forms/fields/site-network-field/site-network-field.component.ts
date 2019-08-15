import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material';

import { Site, Network } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-site-network-field',
  templateUrl: './site-network-field.component.html',
  styleUrls: ['./site-network-field.component.scss']
})
export class SiteNetworkFieldComponent {

  @Input() networks: Network[];

  @Input() network: Network;
  @Output() networkChange: EventEmitter<Network> = new EventEmitter();

  @Input() network_code: string;
  @Output() network_codeChange: EventEmitter<string> = new EventEmitter();

  onChangeNetwork(event: MatSelectChange) {
    this.networkChange.emit(event.value);

    if (event.value && event.value.network_code) {
      this.network_codeChange.emit(event.value.code);
    }
  }
}
