import { Component, OnInit, Input } from '@angular/core';
import { IEvent, EventType } from '@interfaces/event.interface';

@Component({
  selector: 'app-event-info',
  templateUrl: './event-info.component.html',
  styleUrls: ['./event-info.component.scss']
})
export class EventInfoComponent implements OnInit {

  @Input() event: IEvent;
  @Input() eventTypes: EventType[];


  public evalTypes = [
    { status: 'preliminary', eval_status: 'A', viewValue: 'Preliminary (Accepted)' },
    // {status: 'confirmed', eval_status: 'A', viewValue: 'Confirmed (Accepted)'},
    { status: 'reviewed', eval_status: 'A', viewValue: 'Reviewed (Accepted)' },
    { status: 'final', eval_status: 'A', viewValue: 'Final (Accepted)' },
    // {status: 'reported', eval_status: 'A', viewValue: 'Reported (Accepted)'},
    { status: 'rejected', eval_status: 'R', viewValue: 'Rejected (R)' }
  ];
  public evalModes = [
    { evaluation_mode: 'automatic', viewValue: 'Automatic' },
    { evaluation_mode: 'manual', viewValue: 'Manual' }
  ];

  constructor() { }

  ngOnInit() {
  }

}
