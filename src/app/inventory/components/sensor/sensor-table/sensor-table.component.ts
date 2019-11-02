import { Component, Output, EventEmitter, Input } from '@angular/core';

import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { Table } from '@core/classes/table.class';
import { Sensor, Station, Borehole } from '@interfaces/inventory.interface';


@Component({
  selector: 'app-sensor-table',
  templateUrl: './sensor-table.component.html',
  styleUrls: ['./sensor-table.component.scss'],
})
export class SensorTableComponent extends Table<Sensor> {

  @Input() stations: Station[] = [];
  @Input() boreholes: Borehole[] = [];
  @Output() rowClick: EventEmitter<Sensor> = new EventEmitter();

  displayedColumns: string[] = ['enabled', 'sensor', 'station', 'borehole', 'components', 'actions'];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    protected _matDialog: MatDialog,
    protected _activatedRoute: ActivatedRoute
  ) {
    super(_matDialog);
  }

  rowClicked($event: Sensor) {
    this.rowClick.emit($event);
  }

}
