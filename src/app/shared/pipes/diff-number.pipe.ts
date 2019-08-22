import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'diffNumber',
  pure: true
})
export class DiffNumber implements PipeTransform {

  transform(n: number) {
    let rtn = ``;

    if (n < 0) {
      rtn = `<span class="negative">${n}</span>`;
    } else if (n > 0) {
      rtn = `<span class="positive">+${n}</span>`;
    } else {
      rtn = `<span class="neutral">${n}</span>`;
    }
    return rtn;
  }
}
