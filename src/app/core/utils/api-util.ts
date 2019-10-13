import { HttpParams, HttpHeaders } from '@angular/common/http';
import { UrlParameterEncodingCodec } from '@core/classes/url-parameter-encoding-codec.class';

export default class ApiUtil {
  static readonly URL_PARAMETER_ENCODING_CODEC = new UrlParameterEncodingCodec();
  static getHttpParams(query: any): HttpParams {
    let params = new HttpParams({ encoder: ApiUtil.URL_PARAMETER_ENCODING_CODEC });
    if (query) {

      Object.keys(query).forEach(function (key) {
        if (typeof query[key] !== 'undefined') {
          params = params.append(key, query[key]);
        }
      });
    }
    return params;
  }
  static getHttpHeaders(headersIn: any): HttpHeaders {
    let headers = new HttpHeaders();
    if (headersIn) {

      Object.keys(headersIn).forEach(function (key) {
        if (typeof headersIn[key] !== 'undefined') {
          switch (key) {
            case 'useCache':
              headers = headers.append('x-cache', headersIn.useCache);
              break;
            case 'refreshCache':
              headers = headers.append('x-cache-refresh', headersIn.useCache);
              break;
            case 'cacheTimeout':
              headers = headers.append('x-cache-timeout', headersIn.useCache);
              break;
            default:
              headers = headers.append(key, headersIn[key]);
              break;
          }

        }
      });
    }
    return headers;
  }

  static parseArrayHttpParams(params: HttpParams, arr: any[], key: string): HttpParams {
    if (arr && arr.length > 1) {
      params = params.delete(key);
      arr.forEach(el => params = params.append(key, el));
    }

    return params;
  }
}


