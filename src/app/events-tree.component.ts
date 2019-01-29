/*jshint esversion: 6 */
import {NestedTreeControl} from '@angular/cdk/tree';
import {Component, Injectable, OnInit, AfterViewInit, Output, EventEmitter, ViewChild} from '@angular/core';
import {MatTreeNestedDataSource, MatTreeFlattener} from '@angular/material/tree';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CatalogApiService } from './catalog-api.service';
import * as moment from 'moment';
import { TreeComponent, TreeModel, TreeNode } from 'angular-tree-component';

/**
 * File node data with nested structure.
 * Each node has a name, and a type or a list of children.
 */
export class FileNode {
  children: FileNode[];
  name: string;
  eval_status: string;      // accepted or rejected, A or R
  type: string;             // event, blast or other, E, B or O
  evaluation_mode: string;  // from api, "automatic" or "manual"
  event_file: string;
  event_type: string;       // from api, "earthquake" or "explosion"
  magnitude: number;
  magnitude_type: string;   // from api, "preliminary" or "reviewed"
  status: string;           // from api, "preliminary" or "reviewed"
  time_utc: string;
  waveform_file: string;
  x: number;
  y: number;
  z: number;
  npick: number;
  time_residual: number;
  uncertainty: number;
  date: string;
  level: number;
}

/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has name and type.
 * For a directory, it has name and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
@Injectable()
export class FileDatabase {

  dataChange = new BehaviorSubject<FileNode[]>([]);

  get data(): FileNode[] { return this.dataChange.value; }

  public min_time: any;
  public max_time: any;
  public treeObject: any;
  public date: string;

  constructor(private _catalogService: CatalogApiService) {
    this.initialize();
  }
  initialize() {
    const self = this;

    this._catalogService.get_boundaries().subscribe(bounds => {
      if (typeof bounds === 'object'  && bounds.hasOwnProperty('min_time') && bounds.hasOwnProperty('max_time')) {
        self.treeObject = self.createTree(bounds);
        self.getEvents(bounds.max_time);
      }

    });
  }

  getEvents(date) {

    const self = this;
    this._catalogService.get_day_events(date).subscribe(events => {

        if (Array.isArray(events)) {
          events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
        }

        this.treeObject = this.convertTree(events, this.treeObject);

        // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
        //     file node as children.
        const data = this.buildFileTree(this.treeObject, 0);

        // Notify the change.
        this.dataChange.next(data);

      },
      err => console.error(err),
      () => {
        console.log('done loading');
      }
    );

  }


  createTree(bounds) {
    const dataTree = {};
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];

    if (typeof bounds === 'object' && bounds.hasOwnProperty('min_time') && bounds.hasOwnProperty('max_time')) {
      if (moment(bounds['min_time']).isValid() && moment(bounds['max_time']).isValid()) {
        this.min_time = moment(bounds['min_time']);
        this.max_time = moment(bounds['max_time']);
        const date = this.max_time;
        while (date.isSameOrAfter(this.min_time)) {
          const year = date.year();
          const month = date.month();
          const day = ('0' + date.date()).slice(-2);
          if (!dataTree.hasOwnProperty(year)) {
            dataTree[year] = {};
          }
          if (!dataTree[year].hasOwnProperty(month)) {
            dataTree[year][month] = {};
          }
          if (!dataTree[year][month].hasOwnProperty(day)) {
            dataTree[year][month][day] = {};
          }
          date.subtract(1, 'days');
        }
      }
    }
    // console.log(dataTree);
    return dataTree;
  }

  convertTree(dataObject, dataTree) {
    if (typeof dataObject === 'object') {
      for (const property of Object.keys(dataObject)) {
          const value = dataObject[property];
          if (typeof value === 'object' && value.hasOwnProperty('time_utc')) {
            const d = new Date(value.time_utc);
            const microsec = value.time_utc.slice(-8, -1);
            const year = d.getFullYear();
            const month = d.getMonth();
            const day =  ('0' + d.getDate()).slice(-2);
            const event_time = d.toLocaleTimeString('en-gb') + microsec;
              if (!dataTree.hasOwnProperty(year)) {
                dataTree[year] = {};
              }
              if (!dataTree[year].hasOwnProperty(month)) {
                dataTree[year][month] = {};
              }
              if (!dataTree[year][month].hasOwnProperty(day)) {
                dataTree[year][month][day] = {};
              }
              if (!dataTree[year][month][day].hasOwnProperty(event_time)) {
                dataTree[year][month][day][event_time] = {};
              }
              dataTree[year][month][day][event_time] = value;
          }
      }
    }
    return dataTree;
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `FileNode`.
   */
  buildFileTree(obj: {[key: string]: any}, level: number): FileNode[] {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December'];
    const numKeys = Object.keys(obj).map(function(item) {
      return parseInt(item, 10);
    });
    const self = this;
    let sortedEntries = Object.keys(obj).sort().reverse();
    if (level < 2) {
      sortedEntries = numKeys.sort(function(a, b) { return b - a; }).map(String);
    }
    return sortedEntries.reduce<FileNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new FileNode();
      node.name = level === 1 ? monthNames[key] : key;
      self.date = level === 0 ? key : level === 1 ? self.date.substring(0, 4) + '-' + ('0' + (1 + parseInt(key, 10)).toString()).slice(-2) :
                  level === 2 ? self.date.substring(0, 7) + '-' + key : self.date;
      node.date = level === 2 ? self.date : null;
      node.level = level;

      if (value != null) {
        if (typeof value === 'object' && !value.hasOwnProperty('event_type')) {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          if (typeof value === 'object' && value.hasOwnProperty('event_type')) {
            node.eval_status = (value.status === 'reviewed' && value.evaluation_mode === 'manual') ? 'A' : 'R';
            node.type = value.event_type === 'earthquake' ? 'E' :
                          value.event_type === 'blast' || value.event_type === 'explosion' ? 'B' : 'O';
            node.evaluation_mode = value.evaluation_mode;
            node.magnitude = value.magnitude.toPrecision(2);
            node.magnitude_type = value.magnitude_type;
            node.event_file = value.event_file;
            node.event_type = value.event_type;
            node.status = value.status;
            node.time_utc = value.time_utc;
            node.waveform_file = value.waveform_file;
            node.x = value.x;
            node.y = value.y;
            node.z = value.z;
            node.npick = value.npick;
            node.time_residual = value.time_residual;
            node.uncertainty = value.uncertainty;
          } else {
            node.type = value;
          }
        }
      }

      return accumulator.concat(node);
    }, []);
  }
}

/**
 * @title Tree with flat nodes
 */
@Component({
  selector: 'app-events-tree',
  templateUrl: 'events-tree.component.html',
  styleUrls: ['events-tree.component.css'],
  providers: [FileDatabase]
})
export class EventsTreeComponent implements AfterViewInit {
  treeControl: NestedTreeControl<FileNode>;
  dataSource: MatTreeNestedDataSource<FileNode>;

  @Output() messageEvent = new EventEmitter();

  @ViewChild('tree') tree;

  constructor(private database: FileDatabase) {
    this.treeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.dataSource = new MatTreeNestedDataSource();

    database.dataChange.subscribe(data => {
      this.dataSource.data = data;
      this.treeControl.dataNodes = data;
    });
  }

  ngAfterViewInit() {
    this.tree.treeControl.expandAll();
  }

  hasNestedChild = (_: number, nodeData: FileNode) => !nodeData.type;

  private _getChildren = (node: FileNode) => node.children;

  selectEvent() {

    if (this.hasOwnProperty('selectedNode')) {

      const message = this['selectedNode'];
      message.action = 'load';

      this.messageEvent.emit(message);
    }

  }

  activeEvent() {

    if (this.hasOwnProperty('activeNode')) {

      const message = this['activeNode'];
      message.action = 'info';

      this.messageEvent.emit(message);
    }
  }

  activeDay() {
    if (this.hasOwnProperty('activeParent')) {

      const parent = this['activeParent'];

      if (parent.level === 2 && this.treeControl.isExpanded(parent) && this.treeControl.getDescendants(parent).length === 0) {
        const date = moment(parent.date);
        if (date.isValid()) {
          this.database.getEvents(date);
        }
        console.log('need to load more data');
      }

    }
  }

}

/**  Copyright 2018 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license **/
