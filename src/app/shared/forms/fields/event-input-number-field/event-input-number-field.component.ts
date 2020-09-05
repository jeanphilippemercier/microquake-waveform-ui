import { Component, Input, EventEmitter, Output } from '@angular/core';

/** Form field component for manipulation with numbers */
@Component({
  selector: 'app-event-input-number-field',
  templateUrl: './event-input-number-field.component.html',
  styleUrls: ['./event-input-number-field.component.scss']
})
export class EventInputNumberFieldComponent {

  /** Label at the top of the form field. Default value is empty string (no label) */
  @Input()
  label = ``;

  /** Placeholder text, that shows when no value is set. Default value is empty string (no placeholder) */
  @Input()
  placeholder = ``;

  /** Maximum allowed number */
  @Input()
  min: (number | null) = null;

  /** Maximum allowed number */
  @Input()
  max: (number | null) = null;

  /** Value of component. Field has a two-way data binding */
  @Input()
  value: (number | null) = null;

  /** Event emitted when [value] changes */
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter();

  onChange(event: any) {
    this.valueChange.emit(event);
  }

}
