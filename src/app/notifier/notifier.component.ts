import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-notifier',
  templateUrl: './notifier.component.html',
  styles: []
})
export class NotifierComponent implements OnInit {

  constructor(private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.connect();
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 2000,
    });
  }

  connect(): void {
    let source = new EventSource(environment.url + 'events/');
    source.addEventListener('message', message => {
      this.openSnackBar('message received', 'OK');
    });
  }


}
