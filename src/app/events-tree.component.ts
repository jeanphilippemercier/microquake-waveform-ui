/*jshint esversion: 6 */
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, Injectable, OnInit, Output, EventEmitter} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CatalogApiService } from './catalog-api.service';
import * as miniseed from 'seisplotjs-miniseed';

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
}

/** Flat node with expandable and level information */
export class FileFlatNode {
  constructor(
    public expandable: boolean, public name: string, public level: number,
      public eval_status: string, public type: string, public evaluation_mode: string,
      public event_file: string, public event_type, public magnitude: number, public magnitude_type: string,
      public status: string, public time_utc, public waveform_file: string,
      public x: number, public y: number, public z: number, public npick: number,
      public time_residual: number, public uncertainty: number) {}
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

  constructor(private http: HttpClient) {
    this.initialize();
  }

  initialize() {
    const endTime =  new Date();
    const startTime = new Date(endTime.getTime() - 2 * 31536000000);
    const API_URL = environment.apiUrl + '?start_time=' + startTime.toISOString() + '&end_time=' + endTime.toISOString();

    this.http.get(API_URL).subscribe(events => {

//         console.log(events);

        const treeObject = this.convertTree(events);

        // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
        //     file node as children.
        const data = this.buildFileTree(treeObject, 0);

        // Notify the change.
        this.dataChange.next(data);
    });

  }

  convertTree(dataObject) {
    const dataTree = {};
    if (typeof dataObject === 'object') {
      for (const property of Object.keys(dataObject)) {
          const value = dataObject[property];
          if (typeof value === 'object' && value.hasOwnProperty('time_utc')) {
            const d = new Date(value.time_utc);
            const microsec = value.time_utc.slice(-8, -1);
            const year = d.getFullYear();
            // const month = monthNames[d.getMonth()];
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
    // console.log(dataTree);
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
export class EventsTreeComponent {
  treeControl: FlatTreeControl<FileFlatNode>;
  treeFlattener: MatTreeFlattener<FileNode, FileFlatNode>;
  dataSource: MatTreeFlatDataSource<FileNode, FileFlatNode>;

  @Output() messageEvent = new EventEmitter();

  constructor(database: FileDatabase) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
      this._isExpandable, this._getChildren);
    this.treeControl = new FlatTreeControl<FileFlatNode>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    database.dataChange.subscribe(data => this.dataSource.data = data);
  }

  transformer = (node: FileNode, level: number) => {
    return new FileFlatNode(!!node.children, node.name, level, node.eval_status, node.type,
      node.evaluation_mode, node.event_file, node.event_type, node.magnitude, node.magnitude_type,
      node.status, node.time_utc, node.waveform_file, node.x, node.y, node.z,
      node.npick, node.time_residual, node.uncertainty);
  }

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

  private _getLevel = (node: FileFlatNode) => node.level;

  private _isExpandable = (node: FileFlatNode) => node.expandable;

  private _getChildren = (node: FileNode): Observable<FileNode[]> => observableOf(node.children);

  hasChild = (_: number, _nodeData: FileFlatNode) => _nodeData.expandable;
}

/**  Copyright 2018 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license **/
