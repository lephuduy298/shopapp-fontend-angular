// admin.routes.ts
import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { OrderAdminComponent } from './order.admin/order.admin.component';
import { ProductAdminComponent } from './product.admin/product.admin.component';
import { CategoryAdminComponent } from './category.admin/category.admin.component';
import { DetailOrderAdminComponent } from './detail-order.admin/detail-order.admin.component';

export const adminRoutes: Routes = [
    {
        path: 'admin',
        component: AdminComponent,
        children: [
            {
                path: '',
                redirectTo: 'orders',
                pathMatch: 'full',
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
