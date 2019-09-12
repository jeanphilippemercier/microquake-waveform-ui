import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';


export interface CacheEntry {
  url: string;
  response: HttpResponse<any>;
  lastRead: number;
}
// maximum cache age in ms
// 5 min
const maxAge = 5 * 60 * 1000;

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

  set(req: HttpRequest<any>, response: HttpResponse<any>): void {
    const url = req.urlWithParams;

    const entry = { url, response, lastRead: Date.now() };
    this.cache.set(url, entry);

    // remove expired cache entries
    const expired = Date.now() - maxAge;
    this.cache.forEach(val => {
      if (val.lastRead < expired) {
        this.cache.delete(val.url);
      }
    });
  }
}
