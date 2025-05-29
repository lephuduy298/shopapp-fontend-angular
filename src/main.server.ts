import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
// import { HomeComponent } from './app/home/home.component';
// import { OrderComponent } from './app/order/order.component';
// import { OrderConfirmComponent } from './app/order-confirm/order-confirm.component';
// import { LoginComponent } from './app/login/login.component';
// import { RegisterComponent } from './app/register/register.component';
import { DetailProductComponent } from './app/detail-product/detail-product.component';

const bootstrap = () => bootstrapApplication(DetailProductComponent, config);

export default bootstrap;
