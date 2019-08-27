import { HttpParams } from '@angular/common/http';

export default class ApiUtil {
  static getHttpParams(query: any): HttpParams {
    let params = new HttpParams();
    if (query) {

      Object.keys(query).forEach(function (key) {
        if (typeof query[key] !== 'undefined') {
          params = params.append(key, query[key]);
        }
      });
    }
    return params;
  }
}


