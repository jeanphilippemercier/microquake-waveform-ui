import { Component } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'waveform-ui';
}
