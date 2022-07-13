import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'front-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
