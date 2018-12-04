/*jshint esversion: 6 */
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, Injectable} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';

/**
 * File node data with nested structure.
 * Each node has a name, and a type or a list of children.
 */
export class FileNode {
  children: FileNode[];
  name: string;
  type: any;
  info: string;
}

/** Flat node with expandable and level information */
export class FileFlatNode {
  constructor(
    public expandable: boolean, public name: string, public level: number, public type: any) {}
}

/**
 * The file structure tree data in string. The data could be parsed into a Json object
 */
const TREE_DATA = JSON.stringify({
  Applications: {
    Calendar: 'app',
    Chrome: 'app',
    Webstorm: 'app'
  },
  Documents: {
    angular: {
      src: {
        compiler: 'ts',
        core: 'ts'
      }
    },
    material2: {
      src: {
        button: 'ts',
        checkbox: 'ts',
        input: 'ts'
      }
    }
  },
  Downloads: {
    October: 'pdf',
    November: 'pdf',
    Tutorial: 'html'
  },
  Pictures: {
    'Photo Booth Library': {
      Contents: 'dir',
      Pictures: 'dir'
    },
    Sun: 'png',
    Woods: 'jpg'
  }
});

const TREE_EVENT_DATA = JSON.stringify([
    {
        'event_resource_id': 'smi:local/97f39d25-db59-40fb-bcf8-57de70589fd1',
        'x': 651146.0,
        'y': 4767340.0,
        'z': -154.999,
        'time_epoch': 1541675807968399872,
        'evaluation_mode': 'automatic',
        'status': 'preliminary',
        'event_type': 'earthquake',
        'time_residual': 0.0577068453478441,
        'npick': 143,
        'magnitude': -0.476779429523073,
        'magnitude_type': 'Mw',
        'uncertainty': '1.1381649382897496',
        'time_utc': '2018-11-08T11:16:47.968400Z',
        'modification_timestamp': '2018-12-01T18:16:55.363590Z',
        'insertion_timestamp': '2018-12-01T18:16:55.363693Z',
        'event_file': 'http://sppkube.eastus.cloudapp.azure.com/files/events/2018-11-08T11-16-47.968400Z_myeyQ64.xml',
        'waveform_file': 'http://sppkube.eastus.cloudapp.azure.com/files/events/2018-11-08T11-16-47.968400Z_bT9J3bc.mseed',
        'waveform_context_file': null
    },
    {
        'event_resource_id': 'smi:local/e7021615-e7f0-40d0-ad39-8ff8dc0edb73',
        'x': 651134.0,
        'y': 4767540.0,
        'z': -182.52,
        'time_epoch': 1541672509846298880,
        'evaluation_mode': 'automatic',
        'status': 'preliminary',
        'event_type': 'earthquake',
        'time_residual': 0.0602406839270605,
        'npick': 135,
        'magnitude': -0.701888904582125,
        'magnitude_type': 'Mw',
        'uncertainty': '1.4333591697936514',
        'time_utc': '2018-11-08T10:21:49.846299Z',
        'modification_timestamp': '2018-12-01T17:24:38.885095Z',
        'insertion_timestamp': '2018-12-01T17:24:38.885112Z',
        'event_file': 'http://sppkube.eastus.cloudapp.azure.com/files/events/2018-11-08T10-21-49.846299Z_4Umtk9o.xml',
        'waveform_file': 'http://sppkube.eastus.cloudapp.azure.com/files/events/2018-11-08T10-21-49.846299Z_uInNWuf.mseed',
        'waveform_context_file': null
    }
]);

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

  constructor() {
    this.initialize();
  }

  initialize() {
    // Parse the string to json object.
    const dataObject = JSON.parse(TREE_EVENT_DATA);

    const treeObject = this.convertTree(dataObject);

    // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
    //     file node as children.
    const data = this.buildFileTree(treeObject, 0);

    // Notify the change.
    this.dataChange.next(data);
  }

  convertTree(dataObject) {
    const dataTree = {};
    if (typeof dataObject === 'object') {
      for (const property of Object.keys(dataObject)) {
          const value = dataObject[property];
          if (typeof value === 'object' && value.hasOwnProperty('time_utc')) {
            const d = new Date(value.time_utc);
            const year = d.getFullYear();
            const month = d.getMonth();
            const day = d.getDate();
            const event_time = d.toLocaleTimeString('en-gb');
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
              dataTree[year][month][day][event_time] = dataObject[property];
          }
      }
    }
    console.log(dataTree);
    return dataTree;
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `FileNode`.
   */
  buildFileTree(obj: {[key: string]: any}, level: number): FileNode[] {
    return Object.keys(obj).reduce<FileNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new FileNode();
      node.name = key;

      if (value != null) {
        if (typeof value === 'object' && !value.hasOwnProperty('event_type')) {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          if (typeof value === 'object' && value.hasOwnProperty('event_type')) {
            node.type = value.event_type;
            node.info = value.status;
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
  selector: 'tree-flat-overview-example',
  templateUrl: 'tree-flat-overview-example.html',
  styleUrls: ['tree-flat-overview-example.css'],
  providers: [FileDatabase]
})
export class TreeFlatOverviewExample {
  treeControl: FlatTreeControl<FileFlatNode>;
  treeFlattener: MatTreeFlattener<FileNode, FileFlatNode>;
  dataSource: MatTreeFlatDataSource<FileNode, FileFlatNode>;

  constructor(database: FileDatabase) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
      this._isExpandable, this._getChildren);
    this.treeControl = new FlatTreeControl<FileFlatNode>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    database.dataChange.subscribe(data => this.dataSource.data = data);
  }

  transformer = (node: FileNode, level: number) => {
    return new FileFlatNode(!!node.children, node.name, level, node.type);
  }

  myFunc() {
    console.log('function called');
  }

  private _getLevel = (node: FileFlatNode) => node.level;

  private _isExpandable = (node: FileFlatNode) => node.expandable;

  private _getChildren = (node: FileNode): Observable<FileNode[]> => observableOf(node.children);

  hasChild = (_: number, _nodeData: FileFlatNode) => _nodeData.expandable;
}


/**  Copyright 2018 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license **/
