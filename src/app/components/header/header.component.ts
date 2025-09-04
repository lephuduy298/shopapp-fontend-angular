import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserResponse } from '../../responses/user/user.response';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { TokenService } from '../../services/token.service';
import { NavigationEnd, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { filter, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
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
export class HeaderComponent implements OnInit, OnDestroy {
    userResponse?: UserResponse | null;
    isPopoverOpen = false;
    activeNavItem: number = 0;
    categories: Category[] = [];
    keyword: string = '';
    selectedCategoryId: number = 0;
    isMenuOpen = false;
    countItem: number = 0;
    isUserDataLoaded = false; // Thêm flag để track việc load user data

    private destroy$ = new Subject<void>();

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
        // Khởi tạo userResponse là null để tránh hiển thị avatar default ban đầu
        this.userResponse = null;
        this.getCategories();
        this.loadUserData();
        this.loadCartData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadUserData(): void {
        const token = this.tokenService.getToken();
        if (!token) {
            this.userResponse = null;
            this.isUserDataLoaded = true;
            return;
        }

        this.userService.getUserDetail().subscribe({
            next: (response: any) => {
                debugger;
                this.userResponse = response;
                this.isUserDataLoaded = true;
            },
            error: (error: any) => {
                this.userResponse = null;
                this.isUserDataLoaded = true;
                console.error('Error loading user data:', error);
            },
        });
    }

    private loadCartData(): void {
        // Lấy userId từ localStorage
        const userId = this.userService.getUserIdFromLocalStorage();
        if (userId) {
            console.log('Loading cart for user:', userId);
            this.cartService.loadCartFromServer(userId);
        } else {
            console.log('No user found, clearing cart');
            this.cartService.clearCountItem();
        }
    }

    /**
     * Public method để refresh user data từ bên ngoài
     * Có thể gọi từ các component khác khi user login/logout
     */
    public refreshUserData(): void {
        this.isUserDataLoaded = false;
        this.loadUserData();
        this.loadCartData();
    }

    navigateToLogin(): void {
        this.router.navigate(['/login']);
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

            // Gọi API logout
            this.userService.logout().subscribe({
                next: (response) => {
                    console.log('Logout successful:', response);

                    // Thực hiện đăng xuất local
                    this.performLocalLogout(userName);
                },
                error: (error) => {
                    console.error('Logout API error:', error);

                    // Vẫn thực hiện đăng xuất local ngay cả khi API lỗi
                    this.performLocalLogout(userName);
                },
            });
        }
        this.isPopoverOpen = false;
    }

    setActiveNavItem(index: number) {
        this.activeNavItem = index;
        console.log(this.activeNavItem);
    }

    private performLocalLogout(userName: string): void {
        // Thực hiện đăng xuất local
        this.userService.removeUserFromLocalStorage();
        this.tokenService.removeToken();
        this.cartService.clearCountItem();

        // Cập nhật userResponse và đảm bảo data đã được loaded
        this.userResponse = null;
        this.isUserDataLoaded = true;

        // Hiển thị toast thông báo đăng xuất thành công
        this.toastr.success('', 'Đăng xuất thành công', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true,
        });

        // Điều hướng về trang chủ sau một chút delay
        setTimeout(() => {
            this.router.navigate(['/']);
        }, 500);
    }
}
