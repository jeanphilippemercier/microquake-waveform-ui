import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHeaders, HttpRequest, HttpResponse,
  HttpInterceptor, HttpHandler
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';

import { CacheService } from '../services/cache.service';


/**
 * If request is cachable (only GET requests are cachable), x-cache is set, x-cache-refresh is not set in header and
 * response is in cache return the cached response as observable. If not in cache or not cachable, pass the request to next().
 *
 * If x-cache is not set in rquest header, don't use cached data and fetch from API.
 *
 * If x-cache-refresh is set in header, reset cached data.
 *
 */
@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  constructor(private _cache: CacheService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    let refreshCache = false;
    let saveCache = false;
    let customCacheTimeout: number | undefined;

    if (req.headers.get('x-cache-refresh')) {
      req = req.clone({ headers: req.headers.delete('x-cache-refresh') });
      refreshCache = true;
    }

    if (req.headers.get('x-cache')) {
      req = req.clone({ headers: req.headers.delete('x-cache') });
      saveCache = true;
    }

    if (req.headers.get('x-cache-timeout') !== null) {
      const cacheTimeout = <string>req.headers.get('x-cache-timeout');
      customCacheTimeout = +cacheTimeout;
      req = req.clone({ headers: req.headers.delete('x-cache-timeout') });
    }

    const cachedResponse = this._cache.get(req);

    if (refreshCache) {
      const results$ = this._sendRequest(req, next, saveCache, customCacheTimeout);
      return cachedResponse ? results$.pipe(startWith(cachedResponse)) : results$;
    }

    return cachedResponse ? of(cachedResponse) : this._sendRequest(req, next, saveCache, customCacheTimeout);
  }

  private _sendRequest(req: HttpRequest<any>, next: HttpHandler, saveCache = false, customCacheTimeout: number | undefined): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const noHeaderReq = req.clone({ headers: new HttpHeaders() });

          if (saveCache) {
            // Update the cache.
            this._cache.set(noHeaderReq, event, customCacheTimeout);
          }
        }
      })
    );
  }

}


