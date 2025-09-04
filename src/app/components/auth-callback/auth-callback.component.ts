import { Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { ApiResponse } from '../../responses/common/api-response';
import { ApplicationRef } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CartService } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { NavigationEnd } from '@angular/router';
import { filter, first, combineLatestWith } from 'rxjs/operators';

@Component({
    selector: 'app-auth-callback',
    templateUrl: './auth-callback.component.html',
    styleUrls: ['./auth-callback.component.scss'],
    imports: [HeaderComponent, FooterComponent],
})
export class AuthCallbackComponent {
    userResponse: any;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private tokenService: TokenService,
        private appRef: ApplicationRef,
        private userService: UserService,
        private cartService: CartService,
        private toastr: ToastrService,
        private ngZone: NgZone
    ) {}
    ngAfterViewInit() {
        // Đợi Angular render xong UI và thêm delay nhỏ
        this.ngZone.onStable.pipe(first()).subscribe(() => {
            setTimeout(() => this.handleAuthCallback(), 1500);
        });
    }

    private handleAuthCallback() {
        debugger;
        this.activatedRoute.queryParamMap.pipe(first()).subscribe((params) => {
            const code = params.get('code');
            const url = this.router.url;

            let loginType: 'google' | 'facebook' | null = null;
            if (url.includes('/auth/google/callback')) {
                loginType = 'google';
            } else if (url.includes('/auth/facebook/callback')) {
                loginType = 'facebook';
            }

            if (!code || !loginType) {
                console.error('Thiếu code hoặc loginType');
                this.router.navigate(['/login']);
                return;
            }

            // 🔑 Gọi BE đổi code lấy token
            this.authService.exchangeCodeForToken(code, loginType).subscribe({
                next: (response: ApiResponse<any>) => {
                    const token = response.data.token;
                    this.tokenService.setToken(token);

                    // Lấy thông tin user
                    this.userService.getUserDetail().subscribe({
                        next: (responseUser) => {
                            debugger;
                            this.userResponse = {
                                ...responseUser,
                                date_of_birth: new Date(responseUser.date_of_birth),
                            };

                            this.cartService.restoreCart();
                            this.userService.saveUserToLocalStorage(this.userResponse);

                            this.toastr.success(
                                `Chào mừng ${this.userResponse?.fullname || 'bạn'} đã quay trở lại!`,
                                'Đăng nhập thành công!',
                                { timeOut: 3000, progressBar: true, closeButton: true }
                            );

                            // ✅ Xóa code khỏi URL để tránh reload gọi lại
                            this.router.navigate(['/'], { replaceUrl: true });
                        },
                        error: (err) => {
                            debugger;
                            console.error('Error fetching user detail', err);
                        },
                    });
                },
                error: (err) => {
                    debugger;
                    console.error('Error exchanging code', err);
                },
            });
        });
    }
}
