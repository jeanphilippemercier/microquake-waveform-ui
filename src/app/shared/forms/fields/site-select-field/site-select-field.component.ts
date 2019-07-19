import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material';

import { Site } from '@interfaces/site.interface';

@Component({
  selector: 'app-site-select-field',
  templateUrl: './site-select-field.component.html',
  styleUrls: ['./site-select-field.component.scss']
})
export class SiteSelectFieldComponent {

  @Input() sites: Site[];
  @Input() site: Site;
  @Output() siteChange: EventEmitter<Site> = new EventEmitter();
  @Output() clearSelection: EventEmitter<boolean> = new EventEmitter();

  onChangeSite(event: MatSelectChange) {
    this.siteChange.emit(event.value);
  }

  onClearSelection(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    this.clearSelection.emit(true);
  }
}
