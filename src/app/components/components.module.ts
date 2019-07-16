import { NgModule } from '@angular/core';

import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { SharedModule } from '@app/shared/shared.module';
import { EventsModule } from '@app/events/events.module';

@NgModule({
  imports: [
    SharedModule,
    EventsModule
  ],
  declarations: [
    SidebarComponent
  ],
  exports: [
    SidebarComponent
  ]
})
export class ComponentsModule { }
