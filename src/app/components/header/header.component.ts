import { Component, OnInit } from '@angular/core';
import { UserResponse } from '../../responses/user/user.response';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { TokenService } from '../../services/token.service';
import { NavigationEnd, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import { Category } from '../models.ts/category';
import { CategoryService } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-header',
    imports: [CommonModule, FormsModule, NgbPopoverModule, RouterLink],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
    userResponse?: UserResponse | null;
    isPopoverOpen = false;
    activeNavItem: number = 0;
    categories: Category[] = [];
    keyword: string = '';
    selectedCategoryId: number = 0;
    isMenuOpen = false;
    countItem: number = 0;

    constructor(
        private userService: UserService,
        private popoverModule: NgbPopoverModule,
        private tokenService: TokenService,
        private router: Router,
        private categoryService: CategoryService,
        public cartService: CartService,
        private toastr: ToastrService
    ) {
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            const url = event.urlAfterRedirects;
            if (url === '/') {
                this.activeNavItem = 0;
            } else if (url.startsWith('/notifications')) {
                this.activeNavItem = 1;
            } else if (url.startsWith('/orders')) {
                this.activeNavItem = 2;
            }
        });
    }

    ngOnInit(): void {
        this.userResponse = this.userService.getUserFromLocalStorage();
        this.getCategories();
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    togglePopover(event: Event): void {
        event.preventDefault();
        this.isPopoverOpen = !this.isPopoverOpen;
    }

    getCategories() {
        this.categoryService.getCategories().subscribe({
            next: (categories: Category[]) => {
                this.categories = categories;
            },
            complete: () => {},
            error: (error: any) => {
                console.error('Error fetching categories:', error);
            },
        });
    }

    handleCategoryClick(categoryId: number) {
        this.selectedCategoryId = categoryId;
        this.isMenuOpen = false;
        this.router.navigate(['/'], {
            queryParams: {
                category: categoryId,
                keyword: this.keyword || undefined,
            },
        });
    }

    handleSearch(event: Event) {
        event.preventDefault();
        this.router.navigate(['/'], {
            queryParams: {
                keyword: this.keyword || undefined,
                category: this.selectedCategoryId || undefined,
            },
        });
    }

    handleItemClick(index: number) {
        if (index === 0) {
            this.router.navigate(['/user-profile']);
        } else if (index === 1) {
            this.router.navigate(['/user-order']);
        } else if (index === 2) {
            // Lưu tên người dùng trước khi đăng xuất
            const userName = this.userResponse?.fullname || 'bạn';

            // Thực hiện đăng xuất
            this.userService.removeUserFromLocalStorage();
            this.tokenService.removeToken();
            this.cartService.clearCountItem();
            this.userResponse = this.userService.getUserFromLocalStorage();

            // Hiển thị toast thông báo đăng xuất thành công
            this.toastr.success(
                // `Hẹn gặp lại ${userName}!`,
                '',
                'Đăng xuất thành công',
                {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                }
            );

            // Điều hướng về trang chủ sau một chút delay
            setTimeout(() => {
                this.router.navigate(['/']);
            }, 500);
        }
        this.isPopoverOpen = false;
    }

    setActiveNavItem(index: number) {
        this.activeNavItem = index;
        console.log(this.activeNavItem);
    }
}
