import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';


export interface CacheEntry {
  url: string;
  response: HttpResponse<any>;
  lastRead: number;
}
// maximum default cache age in ms
// 5 sec
const maxAge = 10 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  cache = new Map<string, CacheEntry>();

  get(req: HttpRequest<any>): HttpResponse<any> | undefined {
    const url = req.urlWithParams;
    const cached = this.cache.get(url);

    if (!cached) {
      return undefined;
    }

    const isExpired = cached.lastRead < (Date.now() - maxAge);
    return isExpired ? undefined : cached.response;
  }

  set(req: HttpRequest<any>, response: HttpResponse<any>, customCacheTimeout?: number): void {
    const url = req.urlWithParams;

    const timeout = customCacheTimeout ? customCacheTimeout : maxAge;
    const entry = { url, response, lastRead: Date.now() };
    this.cache.set(url, entry);

    // remove expired cache entries
    const expired = Date.now() - timeout;
    this.cache.forEach(val => {
      if (val.lastRead < expired) {
        this.cache.delete(val.url);
      }
    });
  }
}
