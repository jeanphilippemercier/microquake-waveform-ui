import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { ToastrNotificationService } from '@services/toastr-notification.service';

/**
 * A dialog component for Waveform manipulation. Opens from WaveformToolbarComponent. Used to get by how many
 * seconds should all the picks in currently loaded waveform chart move (no waveform manipulation logic included).
 * Dialog consists of one numerical input and dialog control buttons. Input element has validation for min
 * (optional), max (optional) and required (by default). You may supply [min] and [max] values. Input shows toastr
 * error if it is invalid. Successful submit triggers (submitClick) event.
 */
@Component({
  selector: 'app-event-waveform-shift-picks-dialog',
  templateUrl: './event-waveform-shift-picks-dialog.component.html',
  styleUrls: ['./event-waveform-shift-picks-dialog.component.scss']
})
export class EventWaveformShiftPicksDialogComponent implements OnInit {
  myForm!: FormGroup;
  loading = false;
  submited = false;
  error: String | null = null;
  value: number | null = null;

  /**
   * Min allowed value. Used for validation. If null, validation for min value is disabled.
   */
  @Input()
  min: number | null = null;

  /**
   * Max allowed value. Used for validation. If null, validation for max value is disabled.
   */
  @Input()
  max: number | null = null;

  /**
   * Event that triggers when user clicks on submit button and input is valid.
   */
  @Output()
  submitClick: EventEmitter<number> = new EventEmitter();

  constructor(
    private _fb: FormBuilder,
    private _toastrNotificationService: ToastrNotificationService
  ) { }

  ngOnInit(): void {
    const validators = [Validators.required];

    if (this.min !== null) {
      validators.push(Validators.min(this.min));
    }

    if (this.max !== null) {
      validators.push(Validators.min(this.max));
    }

    this.myForm = this._fb.group({
      seconds: [this.value, validators],
    });

  }

  /**
   * Returns validation errors.
   */
  getErrorMessage(): string {
    if (this.myForm?.controls?.['seconds']?.invalid) {
      const errors = this.myForm?.controls?.['seconds']?.errors;
      if (!!errors?.min) {
        return `Minimum value is ${this.min}`;
      } else if (!!errors?.max) {
        return `Maximum value is ${this.max}`;
      } else if (!!errors?.required) {
        return `Value is required`;
      }
    }
    return '';
  }

  /**
   * Triggers after click on dialog control submit button. If input is invalid, shows input and toastr error.
   * If it is valid, triggers (submitClick) event.
   */
  onSubmit(): void {
    this.submited = true;
    if (this.myForm.invalid) {
      this._toastrNotificationService.error(this.getErrorMessage(), 'Error');
      return;
    } else {
      this.submitClick.emit(this.myForm?.value?.seconds);
    }
  }

}
