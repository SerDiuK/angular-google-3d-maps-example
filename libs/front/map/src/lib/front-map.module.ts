import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './components/map/map.component';
import { FrontMapRoutingModule } from './front-map.routing.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MapContainerComponent } from './components/map-container/map-container.component';

@NgModule({
  imports: [
    CommonModule,
    FrontMapRoutingModule,
    MatButtonModule,
    MatIconModule,
  ],
  declarations: [MapComponent, MapContainerComponent],
})
export class FrontMapModule {}
