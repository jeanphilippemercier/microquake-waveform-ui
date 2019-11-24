import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { IComponent, ISensorType, ComponentCode, CableType } from '@interfaces/inventory.interface';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { forkJoin } from 'rxjs';
import { InventoryApiService } from '@services/api/inventory-api.service';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { TableWithExpandableRows } from '@core/classes/table-with-expandable-rows.class';

@Component({
  selector: 'app-component-table',
  templateUrl: './component-table.component.html',
  styleUrls: ['./component-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ComponentTableComponent extends TableWithExpandableRows<IComponent> implements OnInit {

  @Input() sensorId!: number;

  sensorTypes: ISensorType[] = [];
  cables: CableType[] = [];

  displayedColumns: string[] = ['detail', 'enabled', 'component', 'cable', 'cableLength', 'sensorType', 'motionType', 'id', 'actions'];
  addingNewComponent = false;
  initialized = false;

  allComponentCodes = Object.values(ComponentCode);
  missingComponentCodes: ComponentCode[] = [];
  deleteDialogRef!: MatDialogRef<ConfirmationDialogComponent>;
  @Output() created: EventEmitter<IComponent> = new EventEmitter();
  @Output() updated: EventEmitter<IComponent> = new EventEmitter();

  constructor(
    private _inventoryApiService: InventoryApiService,
    protected _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    super(_matDialog);
  }

  async ngOnInit() {

    forkJoin([
      this._inventoryApiService.getSensorTypes(),
      this._inventoryApiService.getCableTypes()
    ]).subscribe(
      result => {
        this.sensorTypes = result[0];
        this.cables = result[1];
        this.initialized = true;
      }, err => {
        console.error(err);
      });
  }

  async onPageChange($event: PageEvent) {
    if ($event.previousPageIndex && $event.previousPageIndex > $event.pageIndex) {
      this.previousPage.emit();
    } else {
      this.nextPage.emit();
    }
  }

  componentEdited(currentComponent: IComponent, $event: IComponent) {
    this.expandedElement = null;
    currentComponent = Object.assign(currentComponent, $event);
  }

  componentCreated($event: IComponent) {
    this.expandedElement = null;
    this.addingNewComponent = false;
    if (this.dataSource) {
      this.dataSource.push($event);
    }
  }
}
