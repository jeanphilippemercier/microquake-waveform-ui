import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';
import { environment } from '../../environments/environment';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-notifier',
  templateUrl: './notifier.component.html',
  styles: []
})

export class NotifierComponent implements OnInit {

  constructor(private snackBar: MatSnackBar, private messageService: MessageService) {
  }

  sendMessage(message): void {
      // send message to subscribers via observable subject
      this.messageService.sendMessage(message);
  }

  clearMessage(): void {
      // clear message
      this.messageService.clearMessage();
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
    const source = new EventSource(environment.url + 'eventstream/');
    source.addEventListener('message', message => {
      console.log(message);
      const msg = JSON.parse(message['data']);
      msg.sender = 'notifier';
      this.openSnackBar('message received: ' + message['data'], 'OK');
      this.messageService.sendMessage(msg);
    });
  }


}
