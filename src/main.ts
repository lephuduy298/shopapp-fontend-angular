import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { HomeComponent } from './app/home/home.component';
// import { AppComponent } from './app/app.component';
// HomeComponent

bootstrapApplication(HomeComponent, appConfig)
  .catch((err) => console.error(err));
