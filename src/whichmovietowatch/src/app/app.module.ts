import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MoviemarkerComponent } from './moviemarker/moviemarker.component';
import { MaterialModule } from './material-module';
import { HttpClientModule } from '@angular/common/http';
import { GapiService } from './gapi.service';

@NgModule({
  declarations: [
    AppComponent,
    MoviemarkerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    MaterialModule,
    BrowserAnimationsModule,
    AppRoutingModule,
  ],
  providers: [
    GapiService,
  ],
  bootstrap: [MoviemarkerComponent]
})
export class AppModule { }
