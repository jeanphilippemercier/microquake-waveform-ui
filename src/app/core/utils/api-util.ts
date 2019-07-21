import { HttpParams, HttpResponse } from '@angular/common/http';

export default class ApiUtil {
  static getHttpParams(query: any): HttpParams {
    let params = new HttpParams();
    Object.keys(query).forEach(function (key) {
      params = params.append(key, query[key]);
    });
    return params;
  }

  static getAttachmentFilenameFromArrayBufferHttpResponse(response: HttpResponse<ArrayBuffer>) {
    let filename = '';
    try {
      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
    } catch (err) {
      console.error('Error getting Content-Disposition Headers');
      throw err;
    }
    return filename;
  }
}


