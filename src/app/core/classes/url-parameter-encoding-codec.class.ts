import { HttpUrlEncodingCodec } from '@angular/common/http';

export class UrlParameterEncodingCodec extends HttpUrlEncodingCodec {

  encodeKey(key: string): string {
    return encodeURIComponent(key);
  }

  encodeValue(value: string): string {
    return encodeURIComponent(value);
  }

}
