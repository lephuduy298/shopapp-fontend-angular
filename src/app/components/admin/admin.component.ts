import { Component, OnInit } from '@angular/core';
import { UserResponse } from '../../responses/user/user.response';
import { UserService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryAdminComponent } from './category.admin/category.admin.component';
import { ProductAdminComponent } from './product.admin/product.admin.component';
import { OrderAdminComponent } from './order.admin/order.admin.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, CategoryAdminComponent, ProductAdminComponent, OrderAdminComponent, RouterOutlet],
    templateUrl: './admin.component.html',
    styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
    adminComponent: string = 'orders';
    userResponse?: UserResponse | null;
    constructor(private userService: UserService, private tokenService: TokenService, private router: Router) {}
    ngOnInit() {
        this.userResponse = this.userService.getUserFromLocalStorage();
    }
    logout() {
        this.userService.removeUserFromLocalStorage();
        this.tokenService.removeToken();
        this.userResponse = this.userService.getUserFromLocalStorage();
    }

    showAdminComponent(componentName: string): void {
        //this.adminComponent = componentName;orders,categories
        if (componentName == 'orders') {
            this.router.navigate(['/admin/orders']);
        } else if (componentName == 'categories') {
            this.router.navigate(['/admin/categories']);
        } else if (componentName == 'products') {
            this.router.navigate(['/admin/products']);
        }
    }
}
