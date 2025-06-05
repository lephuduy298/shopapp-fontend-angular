import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { OrderComponent } from './components/order/order.component';
import { OrderConfirmComponent } from './components/order-confirm/order-confirm.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DetailProductComponent } from './components/detail-product/detail-product.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: '', component: OrderComponent },
    { path: '', component: OrderConfirmComponent },
    { path: '', component: LoginComponent },
    { path: '', component: RegisterComponent },
    { path: '', component: DetailProductComponent },
];
