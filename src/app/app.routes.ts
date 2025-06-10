import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { OrderComponent } from './components/order/order.component';
import { OrderDetailComponent } from './components/order-detail/order.detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DetailProductComponent } from './components/detail-product/detail-product.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: '', component: OrderComponent },
    { path: '', component: OrderDetailComponent },
    { path: '', component: LoginComponent },
    { path: '', component: RegisterComponent },
    { path: '', component: DetailProductComponent },
];
