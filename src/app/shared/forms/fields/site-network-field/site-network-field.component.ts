import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { Network } from '@interfaces/inventory.interface';


/** Form field component in a style of a select box. Used for selecting site's network */
@Component({
  selector: 'app-site-network-field',
  templateUrl: './site-network-field.component.html',
  styleUrls: ['./site-network-field.component.scss']
})
export class SiteNetworkFieldComponent {

  /** Defines all possible networks */
  @Input() networks: Network[] = [];

  /**  Value of the component. Field has a two-way data binding */
  @Input() network: Network | null = null;

  /** Emits event when value changes */
  @Output() networkChange: EventEmitter<Network> = new EventEmitter();

  onChangeNetwork(event: MatSelectChange) {
    this.networkChange.emit(event.value);
  }
}
