import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  exports: [RouterModule],
  imports: [
    RouterModule.forRoot([
      {
        path: '',
        loadChildren: () =>
          import('@angular-google-maps/front-map').then(
            (m) => m.FrontMapModule
          ),
      },
    ]),
  ],
})
export class AppRoutingModule {}
