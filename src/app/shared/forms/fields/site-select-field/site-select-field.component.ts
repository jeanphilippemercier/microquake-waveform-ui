import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { Site } from '@interfaces/inventory.interface';

@Component({
  selector: 'app-site-select-field',
  templateUrl: './site-select-field.component.html',
  styleUrls: ['./site-select-field.component.scss']
})
export class SiteSelectFieldComponent {

  @Input() sites: Site[] = [];
  @Input() site: Site | null = null;
  @Output() siteChange: EventEmitter<Site> = new EventEmitter();

  @Input() site_code: string | null = null;
  @Output() site_codeChange: EventEmitter<string> = new EventEmitter();

  @Output() clearSelection: EventEmitter<boolean> = new EventEmitter();

  onChangeSite(event: MatSelectChange) {

    this.siteChange.emit(event.value);

    if (event.value && event.value.site_code) {
      this.site_codeChange.emit(event.value.code);
    }
  }

  onClearSelection(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
    }
    this.clearSelection.emit(true);
  }
}
