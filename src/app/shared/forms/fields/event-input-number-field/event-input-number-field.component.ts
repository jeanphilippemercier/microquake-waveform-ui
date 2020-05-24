import { Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-event-input-number-field',
  templateUrl: './event-input-number-field.component.html',
  styleUrls: ['./event-input-number-field.component.scss']
})
export class EventInputNumberFieldComponent {

  @Input() label = ``;
  @Input() placeholder = ``;
  @Input() min: (number | null) = null;
  @Input() max: (number | null) = null;
  @Input() value: (number | null) = null;
  @Output() valueChange: EventEmitter<number> = new EventEmitter();

  onChange(event: any) {
    this.valueChange.emit(event);
  }

}
