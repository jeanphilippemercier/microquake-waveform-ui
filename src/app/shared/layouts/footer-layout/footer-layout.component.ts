import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-layout',
  templateUrl: './footer-layout.component.html',
  styleUrls: ['./footer-layout.component.scss']
})
export class FooterLayoutComponent {
  today = new Date();
}
