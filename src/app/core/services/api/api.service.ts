import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { WebSocketService } from '@services/websocket.service';
import { WebsocketEventResponse } from '@interfaces/event.interface';
import { retryWhen, delay, filter, repeatWhen } from 'rxjs/operators';
import ApiUtil from '@core/utils/api-util';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private _http: HttpClient,
    private _websocket: WebSocketService
  ) { }



  /**
   * Download file and store it in ArrayBuffer
   *
   * @remarks
   *
   * Used to download mseed files containing data for waveform charts.
   * {@link EventApiService.getWaveformInfo()} to obtain urls for mseed files.
   *
   * @param fileUrl - url of file to download
   * @returns raw binary file data in ArrayBuffer
   *
   */
  getFileInRawBinary(fileUrl: string): Observable<ArrayBuffer> {
    const url = `${fileUrl} `;
    const params = ApiUtil.getHttpParams({});
    const responseType = `arraybuffer`;

    return this._http.get(url, { params, responseType });
  }



  /**
   * WEBSOCKETS
   */

  /**
   * Init websocket connection
   *
   * @remarks
   *
   * Websockets should init only once.
   * Connection tries to automatically reconnect on unsuccessful connection or error during connection.
   *
   */
  onWebsocketNotification(): Observable<WebsocketEventResponse> {
    const url = environment.wss;

    return this._websocket.connect<WebsocketEventResponse>(url).pipe(
      retryWhen(errors => errors.pipe(
        delay(1000),
        filter(val => this._websocket.isClosing.getValue() === false)
      )),
      repeatWhen(compleated => compleated.pipe(
        delay(1000),
        filter(val => this._websocket.isClosing.getValue() === false)
      )
      )
    );
  }

  /**
   * Close websocket connection
   *
   * @remarks
   *
   * used only to reinit websockets!
   * After losing connection to ws, we need to reconect to start receiving notifications again.
   * After successfuly closing ws connection, onWebsocketNotification() fn automatically reinits the connection.
   *
   * @param timeout - minimal allowed time difference from last successfull connection
   * @param reasonToClose - object that should be send to server as reason why are we closing connection
   */
  closeWebsocketNotification(timeout = 30000, reasonToClose: { code: number, reason: string }) {
    if (
      this._websocket.subject &&
      this._websocket.isClosing.getValue() === false &&
      (new Date().getTime() - this._websocket.lastConnectionInitTimestamp.getValue() > timeout)
    ) {
      this._websocket.subject.error(reasonToClose);
    }
  }

}
