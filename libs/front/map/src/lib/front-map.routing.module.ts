import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapContainerComponent } from './components/map-container/map-container.component';

const routes: Routes = [
  {
    path: '',
    component: MapContainerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FrontMapRoutingModule {}
