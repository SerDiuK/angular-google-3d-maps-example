import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './components/map/map.component';
import { FrontMapRoutingModule } from './front-map.routing.module';

@NgModule({
  imports: [CommonModule, FrontMapRoutingModule],
  declarations: [MapComponent],
})
export class FrontMapModule {}
