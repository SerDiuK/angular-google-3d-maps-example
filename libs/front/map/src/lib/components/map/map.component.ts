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
import { untilDestroyed } from '@ngneat/until-destroy';
import { Easing, Tween, update } from '@tweenjs/tween.js';
import ThreejsOverlayView from '@ubilabs/threejs-overlay-view';
import { LatLngAltitudeLiteral } from '@ubilabs/threejs-overlay-view/dist/types';
import { Subject } from 'rxjs';
import {
  ExtrudeGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
  Shape,
} from 'three';
import { mockData } from '../../data/data';
export type ActiveMapData = 'availability' | 'intervention' | 'device-state';
import { APP_CONFIG } from '@angular-google-maps/front-app-config';

const BUILDING_HEIGHT = 31;
const BUILDING_FILL_COLOR = 0x272c6c;

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
  private hoveredMarkerId: number | null = null;

  private readonly apiOptions = {
    apiKey: 'AIzaSyD287J77V-jDg007vG6oCuSouXvLBbosCw',
  };

  private readonly initialCameraOptions: google.maps.CameraOptions = {
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
    mapId: this.appConfig.googleMapsApi,
  };

  private readonly DEFAULT_COLOR = 0xffffff;
  private readonly HIGHLIGHT_COLOR = 0xf0f0f0;

  @Output() public markerClicked: EventEmitter<number> = new EventEmitter();

  constructor(@Inject(APP_CONFIG) private appConfig: any) {}

  public async ngOnInit(): Promise<void> {
    this.map = await this.initMap();

    this.overlay = new ThreejsOverlayView({
      ...(this.initialCameraOptions.center as LatLngAltitudeLiteral),
    });

    this.scene = this.overlay.getScene();
    this.overlay.setMap(this.map);

    this.zoomOut$?.pipe(untilDestroyed(this)).subscribe(() => {
      this.selectedMarkerId = null;
      this.map.setZoom(14);

      this.removeMarkers();
      this.addMarkers();
    });

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
    await new Loader(this.apiOptions).load();
    return new google.maps.Map(
      document.querySelector('#map') as HTMLElement,
      this.mapOptions
    );
  }

  private setupBuilding(wireframePath: [[number, number]]): void {
    const points = wireframePath.map(([lng, lat]) =>
      this.overlay.latLngAltToVector3({ lat, lng })
    );

    this.scene.add(this.getBuilding(points));
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
          // zIndex: this.hoveredMarkerId === val.id ? 10000 : 1,
          title: val.addressline1,
        });

        marker.addListener('click', () => {
          this.map.setZoom(18);
          this.map.setTilt(67);
          this.map.setCenter(marker.getPosition() as google.maps.LatLng);

          this.markerClicked.emit(Number(val.id));
          this.selectedMarkerId = val.id;
          this.setupBuilding(val.coordinates);

          this.removeMarkers();
          this.addMarkers();
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

  private animateOnInit(): void {
    new Tween(this.initialCameraOptions) // Create a new tween that modifies 'cameraOptions'.
      .to({ tilt: 67, heading: 5, zoom: 14 }, 5000) // Move to destination in 15 second.
      .easing(Easing.Quadratic.Out) // Use an easing function to make the animation smooth.
      .onUpdate(() => {
        this.map.moveCamera(this.initialCameraOptions);
      })
      .start()
      .onComplete(() => {
        this.addMarkers();

        this.overlay.requestRedraw();
      });

    // Setup the animation loop.
    function animate(time: number) {
      requestAnimationFrame(animate);
      update(time);
    }

    requestAnimationFrame(animate);
  }

  private getBuilding(points: any) {
    const buildingMaterial = new MeshStandardMaterial({
      transparent: true,
      opacity: 0.5,
      color: BUILDING_FILL_COLOR,
    });

    const buildingShape = new Shape();
    points.forEach((p: any, i: any) => {
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
}
