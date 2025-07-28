import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { OrderComponent } from './components/order/order.component';
import { OrderDetailComponent } from './components/order-detail/order.detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DetailProductComponent } from './components/detail-product/detail-product.component';
import { UserProfileComponent } from './components/user-profile/user.profile.component';
import { AdminComponent } from './components/admin/admin.component';
import { AuthGuardFn } from './guards/auth.guard';
import { AdminGuardFn } from './guards/admin.guard';
import { adminRoutes } from './components/admin/admin.routes';
import { UserOrderComponent } from './components/user-order/user-order.component';
import { ToastlertComponent } from './components/toastlert/toastlert.component';

export const routes: Routes = [
    ...adminRoutes,
    { path: '', component: HomeComponent },
    { path: 'admin', component: AdminComponent, canActivate: [AdminGuardFn] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'products/:id', component: DetailProductComponent },
    { path: 'orders', component: OrderComponent, canActivate: [AuthGuardFn] },
    { path: 'user-profile', component: UserProfileComponent, canActivate: [AuthGuardFn] },
    { path: 'user-order', component: UserOrderComponent, canActivate: [AuthGuardFn] },
    { path: 'orders/:id', component: OrderDetailComponent },
    { path: 'toastr', component: ToastlertComponent },
];
