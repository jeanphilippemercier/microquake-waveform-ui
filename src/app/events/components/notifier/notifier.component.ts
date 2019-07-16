import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { MessageService } from '@services/message.service';
import { environment } from '@env/environment';

// TODO: move to service
@Component({
  selector: 'app-notifier',
  templateUrl: './notifier.component.html',
  styles: []
})

export class NotifierComponent implements OnInit {

  constructor(
    private _snackBar: MatSnackBar,
    private _messageService: MessageService
  ) { }

  sendMessage(message): void {
    // send message to subscribers via observable subject
    this._messageService.sendMessage(message);
  }

  clearMessage(): void {
    // clear message
    this._messageService.clearMessage();
  }

  ngOnInit() {
    this.connect();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
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
      this._messageService.sendMessage(msg);
    });
  }


}
