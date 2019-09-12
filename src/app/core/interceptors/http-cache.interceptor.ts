import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHeaders, HttpRequest, HttpResponse,
  HttpInterceptor, HttpHandler
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';

import { CacheService } from '../services/cache.service';


/**
 * If request is cachable (only GET requests are cachable), x-refresh is not set in header and
 * response is in cache return the cached response as observable.
 *
 * If x-refresh is set in rquest header, don't use cached data and refetch from API.
 *
 * If not in cache or not cachable, pass the request to next()
 */
@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  constructor(private _cache: CacheService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    if (req.method !== 'GET') {
      return next.handle(req);
    }

    const cachedResponse = this._cache.get(req);

    if (req.headers.get('x-refresh')) {
      const results$ = this._sendRequest(req, next);
      return cachedResponse ? results$.pipe(startWith(cachedResponse)) : results$;
    }

    return cachedResponse ? of(cachedResponse) : this._sendRequest(req, next);
  }

  private _sendRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const noHeaderReq = req.clone({ headers: new HttpHeaders() });
          // Update the cache.
          this._cache.set(noHeaderReq, event);
        }
      })
    );
  }

}


