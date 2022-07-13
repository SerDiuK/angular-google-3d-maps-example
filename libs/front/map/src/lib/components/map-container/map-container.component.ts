import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './map-container.component.html',
  styleUrls: ['./map-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapContainerComponent {
  showZoomOutButton: boolean;

  zoomOut$: Subject<void> = new Subject();

  zoomOut(): void {
    this.zoomOut$.next();
    this.showZoomOutButton = false;
  }

  onMarkerClicked(id: number) {
    this.showZoomOutButton = true;
    console.log('Building ID', id);
  }
}
