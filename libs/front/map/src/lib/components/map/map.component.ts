import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  Inject,
} from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Easing, Tween, update } from '@tweenjs/tween.js';
import ThreejsOverlayView from '@ubilabs/threejs-overlay-view';
import { LatLngAltitudeLiteral } from '@ubilabs/threejs-overlay-view/dist/types';
import { Subject, tap } from 'rxjs';
import {
  Event,
  ExtrudeGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
  Shape,
  Vector3,
} from 'three';
import { mockData } from '../../data/data';
export type ActiveMapData = 'availability' | 'intervention' | 'device-state';
import { AppConfig, APP_CONFIG } from '@angular-google-maps/front-app-config';

const BUILDING_HEIGHT = 31;
const BUILDING_FILL_COLOR = 0x272c6c;

@UntilDestroy()
@Component({
  selector: 'front-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, OnChanges {
  @Input() public activeMapData: ActiveMapData = 'availability';

  @Input() public zoomOut$: Subject<void>;

  private overlay: ThreejsOverlayView;
  private map: google.maps.Map;
  private scene: Scene;
  private markers: google.maps.Marker[] = [];
  private selectedMarkerId: number | null = null;
  private selectedBuilding: Object3D<Event>;

  private cameraOptions: google.maps.CameraOptions = {
    tilt: 0,
    heading: -10,
    zoom: 3,
    center: { lat: 48.87199020385742, lng: 2.3356521129608154 },
  };

  private readonly mapOptions = {
    heading: 10,
    tilt: 67,
    zoom: 6,
    center: { lat: 48.87199020385742, lng: 2.3356521129608154 },
    disableDefaultUI: true,
    mapId: this.appConfig.baseMapId,
  };

  @Output() public markerClicked: EventEmitter<number> = new EventEmitter();

  constructor(@Inject(APP_CONFIG) private appConfig: AppConfig) {}

  public async ngOnInit(): Promise<void> {
    this.map = await this.initMap();

    this.overlay = new ThreejsOverlayView({
      ...(this.cameraOptions.center as LatLngAltitudeLiteral),
    });

    this.scene = this.overlay.getScene();
    this.overlay.setMap(this.map);

    this.handleZoomOut();
    this.animateOnInit();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }

  private activeMapDataChanged() {
    this.removeMarkers();
    this.addMarkers();
  }

  private async initMap() {
    await new Loader({ apiKey: this.appConfig.googleMapsApi }).load();
    return new google.maps.Map(
      document.querySelector('#map') as HTMLElement,
      this.mapOptions
    );
  }

  private setupBuilding(wireframePath: [[number, number]]): void {
    const points = wireframePath.map(([lng, lat]) =>
      this.overlay.latLngAltToVector3({ lat, lng })
    );

    this.selectedBuilding = this.highlightBuilding(points);

    this.scene.add(this.selectedBuilding);
  }

  private addMarkers() {
    mockData
      .reduce((a, b) => {
        if (!a.some((el) => el.addressline1 === b.addressline1)) {
          a.push(b);
        }

        return a;
      }, [] as any[])
      .forEach(async (val) => {
        let url;

        if (this.selectedMarkerId) {
          if (this.selectedMarkerId === val.id) {
            url = `assets/tooltips/${this.activeMapData}-${val.id}.png`;
          } else {
            url = `assets/tooltips/${this.activeMapData}-disabled-${val.id}.png`;
          }
        } else {
          url = `assets/tooltips/${this.activeMapData}-${val.id}.png`;
        }

        const marker = new google.maps.Marker({
          position: { lat: val.latitude, lng: val.longitude },
          map: this.map,
          icon: {
            url,
          },
          title: val.addressline1,
        });

        marker.addListener('click', () => {
          this.zoomToBuilding(marker);

          this.markerClicked.emit(Number(val.id));
          this.selectedMarkerId = val.id;
          this.setupBuilding(val.coordinates);
          this.removeMarkers();
        });

        this.markers.push(marker);
      });
  }

  // Removes the markers from the map, but keeps them in the array.
  private removeMarkers(): void {
    for (const marker of this.markers) {
      marker.setMap(null);
    }
    this.markers = [];
  }

  private highlightBuilding(points: Vector3[]): Object3D<Event> {
    const buildingMaterial = new MeshStandardMaterial({
      transparent: true,
      opacity: 0.5,
      color: BUILDING_FILL_COLOR,
    });

    const buildingShape = new Shape();
    points.forEach((p, i) => {
      i === 0 ? buildingShape.moveTo(p.x, p.y) : buildingShape.lineTo(p.x, p.y);
    });

    const extrudeSettings = {
      depth: BUILDING_HEIGHT,
      bevelEnabled: false,
    };
    const buildingGeometry = new ExtrudeGeometry(
      buildingShape,
      extrudeSettings
    );
    return new Mesh(buildingGeometry, buildingMaterial);
  }

  private clearHighlightedBuilding(): void {
    this.scene.remove(this.selectedBuilding);
  }

  private animateOnInit(): void {
    this.moveCamera({ tilt: 67, heading: 5, zoom: 14 }, 5000, () => {
      this.addMarkers();
    });
  }

  private zoomToBuilding(marker: google.maps.Marker): void {
    const to = {
      tilt: 67,
      heading: 67,
      zoom: 19,
      lat: marker.getPosition()?.lat() as number,
      lng: marker.getPosition()?.lng() as number,
    };

    this.moveCamera(to, 2000);
  }

  private handleZoomOut(): void {
    this.zoomOut$
      .pipe(
        tap(() => {
          this.selectedMarkerId = null;
          this.moveCamera({ zoom: 14, heading: 10 }, 2000);

          this.clearHighlightedBuilding();

          this.removeMarkers();
          this.addMarkers();
        }),
        untilDestroyed(this)
      )
      .subscribe();
  }

  private moveCamera(
    to: google.maps.CameraOptions,
    duration = 5000,
    onComplete?: () => void
  ): void {
    const tweenVal = {
      ...this.cameraOptions,
      tilt: this.map.getTilt(),
      heading: this.map.getHeading(),
      zoom: this.map.getZoom(),
      lat: this.map.getCenter()?.lat(),
      lng: this.map.getCenter()?.lng(),
    };

    new Tween(tweenVal)
      .to(to, duration)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        this.cameraOptions = {
          tilt: tweenVal.tilt,
          heading: tweenVal.heading,
          zoom: tweenVal.zoom,
          center: { lat: tweenVal.lat as number, lng: tweenVal.lng as number },
        };
        this.map.moveCamera(this.cameraOptions);
      })
      .start()
      .onComplete(() => {
        if (onComplete) {
          onComplete();
        }

        this.overlay.requestRedraw();
      });

    const animate = (time: number) => {
      requestAnimationFrame(animate);
      update(time);
    };

    requestAnimationFrame(animate);
  }
}
