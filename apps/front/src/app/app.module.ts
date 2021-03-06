import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_CONFIG } from '@angular-google-maps/front-app-config';

import { HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule, BrowserAnimationsModule],
  providers: [{ provide: APP_CONFIG, useValue: environment }],
  bootstrap: [AppComponent],
})
export class AppModule {}
