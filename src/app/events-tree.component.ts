/*jshint esversion: 6 */
import {NestedTreeControl} from '@angular/cdk/tree';
import {Component, Injectable, OnInit, AfterViewInit, Output, EventEmitter, ViewChild} from '@angular/core';
import {MatTreeNestedDataSource, MatTreeFlattener} from '@angular/material/tree';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatIconModule} from '@angular/material/icon';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';
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
  waveform_context_file: string;
  variable_size_waveform_file: string;
  preferred_origin_id: string;
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

  public max_time: any;
  public treeObject: any;
  public date: string;
  public eventId: string;
  public timezone: string;
  public bInit: boolean;

  constructor(private _catalogService: CatalogApiService) {
    this.initialize();
  }
  initialize() {

    const url_string = window.location.href;
    const url = new URL(url_string);
    this.eventId = url.searchParams.get('id');
    this.bInit = true;

    this._catalogService.get_boundaries().subscribe(boundsArray => {
      const bounds = boundsArray[0];
      this.timezone = bounds.timezone;
      if (typeof bounds === 'object'  && bounds.hasOwnProperty('min_time') && bounds.hasOwnProperty('max_time')) {
        this.max_time = bounds['max_time'];
        this.treeObject = this.createTree(bounds);
        if (this.eventId) {
           this._catalogService.get_event_by_id(this.eventId).subscribe(event => {
             this.getEventsForDate(event.time_utc, null);
           });

        } else {
            this.getEventsForDate(bounds.max_time, null);
        }
      }

    });
  }

  getEventsForDate(date, tree) {
    const day = moment(date).utc().utcOffset(this.timezone);
    day.hour(0);
    day.minute(0);
    day.second(0);
    day.millisecond(0);
    const startTime = day.toISOString();
    const endTime = day.add(1, 'days').toISOString();

    this._catalogService.get_events(startTime, endTime).subscribe(events => {

        if (Array.isArray(events)) {
          events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
        }

        if (this.max_time === date) {
          this.eventId = events[0].event_resource_id;
        }

        this.treeObject = this.convertTree(events, this.treeObject);

        // Build the tree nodes from Json object. The result is a list of `FileNode` with nested file node as children.
        const data = this.buildFileTree(this.treeObject, 0);

        this.selectNode(tree, data, this.eventId, 'select');

        // Notify the change.
        this.dataChange.next(data);
      },
      err => console.error(err)
      // , () => console.log('done loading')
    );

  }

  selectNode(tree, data, eventId, action) {
    let message = {};
    for (const yearNode of data) {
      if (yearNode.hasOwnProperty('children')) {
        for (const monthNode of yearNode.children) {
          if (monthNode.hasOwnProperty('children')) {
            for (const dayNode of monthNode.children) {
              if (dayNode.hasOwnProperty('children') && dayNode.children.length > 0) {
                if (tree) {
                  tree.expand(yearNode);
                  tree.expand(monthNode);
                  tree.expand(dayNode);
                }
                for (const event of dayNode.children) {
                  if (event.event_resource_id === eventId) {
                    if (action === 'select') {
                      event[action] = true;
                      return event;
                    } else {
                      message = event;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return message;
  }

  createTree(bounds) {
    const dataTree = {};
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
    if (moment(bounds.min_time).isValid() && moment(bounds.max_time).isValid()) {
      const date = moment(bounds.max_time).utc().utcOffset(this.timezone);
      const dateMin = moment(bounds.min_time).utc().utcOffset(this.timezone);
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
            const d = moment(value.time_utc).utc().utcOffset(this.timezone);
            const fsec = value.time_utc.slice(-8, -1);
            const year = d.year();
            const month = d.month();
            const day =  ('0' + d.date()).slice(-2);
            const event_time = d.format('HH:mm:ss') + parseFloat(fsec).toFixed(3).slice(-4);
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
                dataTree[year][month][day][event_time] = value;
              } else { // duplicate node, same origin time already exists
                const event_time_duplicate = d.format('HH:mm:ss') + parseFloat(fsec).toFixed(4).slice(-5);
                if (!dataTree[year][month][day].hasOwnProperty(event_time_duplicate)) {
                  dataTree[year][month][day][event_time_duplicate] = {};
                  dataTree[year][month][day][event_time_duplicate] = value;
                } else {
                  console.log('More than 2 events with same origin time found, skipped')
                }
              }
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
    let sortedEntries = Object.keys(obj).sort().reverse();
    if (level < 2) {
      sortedEntries = numKeys.sort(function(a, b) { return b - a; }).map(String);
    }
    return sortedEntries.reduce<FileNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new FileNode();
      node.name = level === 1 ? monthNames[key] : key;
      this.date = level === 0 ? key : level === 1 ? this.date.substring(0, 4) + '-' + ('0' + (1 + parseInt(key, 10)).toString()).slice(-2) :
                  level === 2 ? this.date.substring(0, 7) + '-' + key : this.date;
      node.date = level === 2 ? this.date : null;
      node.level = level;

      if (value != null) {
        if (typeof value === 'object' && !value.hasOwnProperty('event_type')) {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          if (typeof value === 'object' && value.hasOwnProperty('event_type')) {
            // Evaluation = A (accepted) if status is "preliminary", "confirmed", "reviewed", "final", "reported"
            // Evaluation = R (rejected) if status is "rejected"
            node.eval_status = (value.status === 'rejected') ? 'R' : 'A';
            node.type = value.event_type === 'earthquake' ? 'E' :
                          value.event_type === 'blast' || value.event_type === 'explosion' ? 'B' : 'O';
            node.evaluation_mode = value.evaluation_mode;
            node.magnitude = value.magnitude.toFixed(1);
            node.magnitude_type = value.magnitude_type;
            node.event_file = value.event_file;
            node.event_type = value.event_type;
            node.status = value.status;
            node.time_utc = value.time_utc;
            node.waveform_file = value.waveform_file;
            node.variable_size_waveform_file = value.variable_size_waveform_file;
            node.waveform_context_file = value.waveform_context_file;
            node.preferred_origin_id = value.preferred_origin_id;
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

      if (data && data.length > 0) {
        const message = this.database.selectNode(this.treeControl, this.treeControl.dataNodes, database.eventId, 'expand');
        message['action'] = 'load';
        message['timezone'] = database.timezone;

        this.messageEvent.emit(message);   // send message to load data
      }

    });
  }

  hasNestedChild = (_: number, nodeData: FileNode) => !nodeData.type;

  private _getChildren = (node: FileNode) => node.children;

  selectEvent() {

    if (this.hasOwnProperty('selectedNode')) {

      const message = this['selectedNode'];
      this.database.eventId = message.event_resource_id;  // save selection
      message.action = 'load';
      message.timezone = this.database.timezone;

      this.messageEvent.emit(message);
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

      if (node.level === 2 && this.treeControl.getDescendants(node).length === 0) {
        const date = moment.parseZone(node.date + ' ' + this.database.timezone, 'YYYY-MM-DD ZZ', true);  // date on timezone
        if (date.isValid()) {
          this.database.getEventsForDate(date, this.treeControl);
        }
      }

    }
  }

}

/**  Copyright 2018 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license **/
