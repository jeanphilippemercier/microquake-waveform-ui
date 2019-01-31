/*jshint esversion: 6 */
import {NestedTreeControl} from '@angular/cdk/tree';
import {Component, Injectable, OnInit, AfterViewInit, Output, EventEmitter, ViewChild} from '@angular/core';
import {MatTreeNestedDataSource, MatTreeFlattener} from '@angular/material/tree';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';
import { environment } from '../environments/environment';
import { CatalogApiService } from './catalog-api.service';
import * as moment from 'moment';

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
  event_resource_id: string;
  select: boolean;
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
  public eventId: string;

  constructor(private _catalogService: CatalogApiService) {
    this.initialize();
  }
  initialize() {

    const url_string = window.location.href;
    const url = new URL(url_string);
    this.eventId = url.searchParams.get('id');

    this._catalogService.get_boundaries().subscribe(bounds => {
      if (typeof bounds === 'object'  && bounds.hasOwnProperty('min_time') && bounds.hasOwnProperty('max_time')) {
        this.min_time = bounds['min_time'];
        this.max_time = bounds['max_time'];
        this.treeObject = this.createTree(bounds);
        if (this.eventId) {
           this._catalogService.get_event_by_id(this.eventId).subscribe(event => {
             this.getEventsForDate(event.time_utc);
           });

        } else {
            this.getEventsForDate(bounds.max_time);
        }
      }

    });
  }

  getEventsForDate(date) {

    this._catalogService.get_day_events(date).subscribe(events => {

        if (Array.isArray(events)) {
          events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
        }

        if (this.max_time === date) {
          this.eventId = events[0].event_resource_id;
        }

        this.treeObject = this.convertTree(events, this.treeObject);

        // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
        //     file node as children.
        let data = this.buildFileTree(this.treeObject, 0);

        data = this.markNodeSelected(data);

        // Notify the change.
        this.dataChange.next(data);

      },
      err => console.error(err)
      // , () => console.log('done loading')
    );

  }

  markNodeSelected(data) {
      for (let i = 0; i <= data.length - 1; i++) {
        if (data[i].hasOwnProperty('children')) {
          for (let j = 0; j <= data[i].children.length - 1; j++) {
            if (data[i].children[j].hasOwnProperty('children')) {
              for (let k = 0; k <= data[i].children[j].children.length - 1; k++) {
                if (data[i].children[j].children[k].hasOwnProperty('children')) {
                  for (let m = 0; m <= data[i].children[j].children[k].children.length - 1; m++) {
                    if (data[i].children[j].children[k].children[m].event_resource_id === this.eventId) {
                      data[i].children[j].children[k].children[m]['select'] = true;
                      console.log(data[i].children[j].children[k].children[m]);
                      return data;
                    }
                  }
                }
              }
            }
          }
        }
      }
  }


  createTree(bounds) {
    const dataTree = {};
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
    if (moment(this.min_time).isValid() && moment(this.max_time).isValid()) {
      const date = moment(this.max_time);
      const dateMin = moment(this.min_time);
      while (date.isSameOrAfter(dateMin)) {
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
            node.event_resource_id = value.event_resource_id;
            node.select = value.select;
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
export class EventsTreeComponent {
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

      if (data.length > 0) {
        const message = this.findNode(data, database.eventId);
        message['action'] = 'load';

        this.messageEvent.emit(message);   // send message to load data
        this.treeControl.expandAll();
      }

    });
  }

  hasNestedChild = (_: number, nodeData: FileNode) => !nodeData.type;

  private _getChildren = (node: FileNode) => node.children;

  findNode(data, eventId) {
    let message = {};
    if (data.length === 0) {
      return message;
    }
    for (let i = 0; i <= data.length - 1; i++) {
      if (data[i].hasOwnProperty('children')) {
        for (let j = 0; j <= data[i].children.length - 1; j++) {
          if (data[i].children[j].hasOwnProperty('children')) {
            for (let k = 0; k <= data[i].children[j].children.length - 1; k++) {
              if (data[i].children[j].children[k].hasOwnProperty('children')) {
                for (let m = 0; m <= data[i].children[j].children[k].children.length - 1; m++) {
                  if (data[i].children[j].children[k].children[m].event_resource_id === eventId) {
                    message = data[i].children[j].children[k].children[m];
                    return message;
                  }
                }
              }
            }
          }
        }
      }
    }
  }



  selectEvent() {

    if (this.hasOwnProperty('selectedNode')) {

      const message = this['selectedNode'];
      this.database.eventId = message.event_resource_id;  // save selection
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

      if (parent.level === 2 && this.treeControl.getDescendants(parent).length === 0) {
        const date = moment(parent.date);
        if (date.isValid()) {
          this.database.getEventsForDate(date);
        }
        console.log('need to load more data');
      }

    }
  }

}

/**  Copyright 2018 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license **/
