import { InjectionToken } from '@angular/core';

export const APP_CONFIG = new InjectionToken('Application config');

export interface AppConfig {
  baseMapId: string;
  googleMapsApi: string;
  production: boolean;
}
