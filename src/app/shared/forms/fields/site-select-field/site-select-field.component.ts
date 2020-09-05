import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { Site } from '@interfaces/inventory.interface';

/** Form field component in a style of a select box. Used for selecting mine site */
@Component({
  selector: 'app-site-select-field',
  templateUrl: './site-select-field.component.html',
  styleUrls: ['./site-select-field.component.scss']
})
export class SiteSelectFieldComponent {

  /** Defines all possible sites */
  @Input() sites: Site[] = [];

  /**  Value of the component. Field has a two-way data binding */
  @Input() site: Site | null = null;

  /** Emits event when value changes */
  @Output() siteChange: EventEmitter<Site> = new EventEmitter();

  onChangeSite(event: MatSelectChange) {
    this.siteChange.emit(event.value);
  }

}
