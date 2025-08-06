// admin.routes.ts
import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { OrderAdminComponent } from './order.admin/order.admin.component';
import { ProductAdminComponent } from './product.admin/product.admin.component';
import { CategoryAdminComponent } from './category.admin/category.admin.component';
import { DetailOrderAdminComponent } from './detail-order.admin/detail-order.admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminGuardFn } from '../../guards/admin.guard';

export const adminRoutes: Routes = [
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AdminGuardFn], // Thêm AdminGuard cho parent route
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full',
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
            },
            {
                path: 'orders',
                component: OrderAdminComponent,
            },
            {
                path: 'orders/:id',
                component: DetailOrderAdminComponent,
            },
            {
                path: 'products',
                component: ProductAdminComponent,
            },
            {
                path: 'categories',
                component: CategoryAdminComponent,
            },
        ],
    },
];
