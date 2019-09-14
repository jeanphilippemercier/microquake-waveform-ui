import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { IComponent, SensorType, Cable, ISensorType, ComponentCode } from '@interfaces/inventory.interface';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ComponentCreateInput } from '@interfaces/inventory-dto.interface';
import { forkJoin } from 'rxjs';
import { InventoryApiService } from '@services/inventory-api.service';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { first } from 'rxjs/operators';
import { ConfirmationDialogData } from '@interfaces/dialogs.interface';

@Component({
  selector: 'app-inventory-component-list',
  templateUrl: './inventory-component-list.component.html',
  styleUrls: ['./inventory-component-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class InventoryComponentListComponent implements OnInit {

  @Input()

  public set data(v: IComponent[]) {
    this._data = v;
    this.missingComponentCodes = [];

    if (this._data) {
      this.allComponentCodes.forEach(val => {
        if (this._data.findIndex(val2 => val2.code === val) === -1) {
          this.missingComponentCodes.push(val);
        }
      });
    }
  }

  public get data(): IComponent[] {
    return this._data;
  }
  private _data: IComponent[];

  @Input() sensorId: number;
  @Input() loading = false;
  @Input() count = 0;
  @Input() showPagination = true;
  @Output() nextPage = new EventEmitter();
  @Output() previousPage = new EventEmitter();

  sensorTypes: ISensorType[] = [];
  cables: Cable[] = [];

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['detail', 'component', 'cable', 'cableLength', 'sensorType', 'motionType', 'id', 'enabled', 'actions'];
  dataSource: IComponent[];
  expandedElement: IComponent | null = null;
  pageSize = 15;
  addingNewComponent = false;
  initialized = false;

  allComponentCodes = Object.values(ComponentCode);
  missingComponentCodes: ComponentCode[] = [];
  deleteDialogRef: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    private _inventoryApiService: InventoryApiService,
    private _matDialog: MatDialog
  ) { }

  async ngOnInit() {

    forkJoin([
      this._inventoryApiService.getSensorTypes(),
      this._inventoryApiService.getCables()
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
    if ($event.previousPageIndex > $event.pageIndex) {
      this.previousPage.emit();
    } else {
      this.nextPage.emit();
    }
  }


  delete(componentId: number) {
    if (!componentId) {
      console.error(`No componentId`);
    }

    this.deleteDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(
      ConfirmationDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          header: `Are you sure?`,
          text: `Do you want to proceed and delete this component?`
        }
      });

    this.deleteDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      if (val) {
        try {
          const response = await this._inventoryApiService.deleteComponent(componentId).toPromise();
        } catch (err) {
          console.error(err);
        }
      }
    });
  }

}
