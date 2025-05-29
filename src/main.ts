import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// import { HomeComponent } from './app/home/home.component';
import { OrderComponent } from './app/order/order.component';
// import { AppComponent } from './app/app.component';
// HomeComponent
// import { OrderConfirmComponent } from './app/order-confirm/order-confirm.component';
// import { LoginComponent } from './app/login/login.component';
// import { RegisterComponent } from './app/register/register.component';
import { DetailProductComponent } from './app/detail-product/detail-product.component';

bootstrapApplication(DetailProductComponent, appConfig)
  .catch((err) => console.error(err));
