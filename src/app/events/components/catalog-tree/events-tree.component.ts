import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Output, EventEmitter } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import * as moment from 'moment';

import { FileNode } from './file-node.class';
import { FileDatabase } from './file-node.service';


/**
 * @title Tree with flat nodes
 */
@Component({
  selector: 'app-events-tree',
  templateUrl: 'events-tree.component.html',
  styleUrls: ['events-tree.component.scss'],
  providers: [FileDatabase]
})
export class EventsTreeComponent {
  treeControl: NestedTreeControl<FileNode>;
  dataSource: MatTreeNestedDataSource<FileNode>;
  init: boolean;
  public selectedEventTypes: any[];
  public eventTypes = [];
  public selectedStatusTypes: any[];
  public statusTypes = [];
  public selectedNode;

  @Output() messageEvent = new EventEmitter();

  constructor(public database: FileDatabase) {
    this.treeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.dataSource = new MatTreeNestedDataSource();

    this.init = true;

    database.dataChange.subscribe(data => {
      this.dataSource.data = data;
      this.treeControl.dataNodes = data;

      if (data && data.length === 0) {
        this.messageEvent.emit({ 'action': 'treeLoaded' });
        return;
      }

      if (data && data.length > 0) {

        if (this.init) {
          const init_msg = { 'init': this.database.eventTypes };
          this.messageEvent.emit(init_msg);   // send message to init data
          this.init = false;
          this.eventTypes = this.database.eventTypes;
          this.selectedEventTypes = this.eventTypes.map(el => el.quakeml_type);
          this.statusTypes = this.database.statusTypes;
          this.selectedStatusTypes = this.database.selectedStatusTypes;
        }

        const message = this.database.selectNode(this.treeControl, this.treeControl.dataNodes, database.eventId, 'expand');
        message['action'] = 'load';
        message['timezone'] = database.timezone;

        this.messageEvent.emit(message);   // send message to load data

      }

    });

  }

  hasNestedChild = (_: number, nodeData: FileNode) => !nodeData.type;

  private _getChildren = (node: FileNode) => node.children;

  filterEventsByTypeStatus() {
    this.database.treeObject = this.database.createTree(this.database.bounds);
    const statusTypes = this.selectedStatusTypes ? this.selectedStatusTypes.toString() : '';
    const eventTypes = this.selectedEventTypes ? this.selectedEventTypes.toString() : '';
    this.messageEvent.emit({ 'action': 'treeLoading' });
    this.database.clearExpandedDays();
    this.database.getEventsForDate(this.database.bounds.max_time, this.treeControl, eventTypes, statusTypes, true);
  }

  selectEvent() {

    if (this.hasOwnProperty('selectedNode')) {

      this.clearSelectTree();
      this.selectedNode.select = true;
      const message = this.selectedNode;
      this.database.eventId = message.event_resource_id;  // save selection
      message.action = 'load';
      message.timezone = this.database.timezone;

      this.messageEvent.emit(message);
    }

  }

  clearSelectTree() {
    for (const yearNode of this.treeControl.dataNodes) {
      if (yearNode.hasOwnProperty('children')) {
        for (const monthNode of yearNode.children) {
          if (monthNode.hasOwnProperty('children')) {
            for (const dayNode of monthNode.children) {
              if (dayNode.hasOwnProperty('children') && dayNode.children.length > 0) {
                for (const event of dayNode.children) {
                  event.select = false;
                }
              }
            }
          }
        }
      }
    }
  }

  activeEvent() {

    if (this.hasOwnProperty('activeNode')) {

      const message = this['activeNode'];
      message.action = 'info';
      message.timezone = this.database.timezone;

      this.messageEvent.emit(message);
    }
  }

  activeDay() {

    if (this.hasOwnProperty('activeParent')) {

      const node = this['activeParent'];
      this.database.bInit = false;

      if (node.level === 2 && this.treeControl.isExpanded(node)) {
        const date = moment.parseZone(node.date + ' ' + this.database.timezone, 'YYYY-MM-DD ZZ', true);  // date on timezone
        if (date.isValid()) {
          const statusTypes = this.selectedStatusTypes ? this.selectedStatusTypes.toString() : '';
          const eventTypes = this.selectedEventTypes ? this.selectedEventTypes.toString() : '';
          this.database.saveExpandedNodes(this.treeControl);
          this.database.getEventsForDate(date, this.treeControl, eventTypes, statusTypes, false);
        }
      }
    }
  }
}
