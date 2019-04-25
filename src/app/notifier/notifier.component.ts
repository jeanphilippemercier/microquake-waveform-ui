import { Component, OnInit } from '@angular/core';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-notifier',
  templateUrl: './notifier.component.html',
  styles: []
})
export class NotifierComponent implements OnInit {

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 2000,
    });
  }

}
