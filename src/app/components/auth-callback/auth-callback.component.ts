import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { ApiResponse } from '../../responses/common/api-response';
import { ApplicationRef } from '@angular/core';
import { UserService } from '../../services/user.service';
import { first } from 'rxjs/operators';
import { CartService } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
    selector: 'app-auth-callback',
    templateUrl: './auth-callback.component.html',
    styleUrls: ['./auth-callback.component.scss'],
    imports: [HeaderComponent, FooterComponent],
})
export class AuthCallbackComponent implements OnInit {
    userResponse: any;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private tokenService: TokenService,
        private appRef: ApplicationRef,
        private userService: UserService,
        private cartService: CartService,
        private toastr: ToastrService
    ) {}

    ngOnInit() {
        // Chỉ chạy sau khi Angular load xong toàn bộ app
        this.appRef.isStable.pipe(first((stable) => stable)).subscribe(() => {
            this.activatedRoute.queryParams.pipe(first()).subscribe((params) => {
                debugger;
                const code = params['code'];
                const url = this.router.url;

                let loginType: 'google' | 'facebook';
                if (url.includes('/auth/google/callback')) {
                    loginType = 'google';
                } else if (url.includes('/auth/facebook/callback')) {
                    loginType = 'facebook';
                } else {
                    return;
                }

                if (code) {
                    this.authService.exchangeCodeForToken(code, loginType).subscribe({
                        next: (response: ApiResponse<any>) => {
                            debugger;
                            const token = response.data.token;
                            this.tokenService.setToken(token);
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
                                        {
                                            timeOut: 3000,
                                            progressBar: true,
                                            closeButton: true,
                                        }
                                    );
                                    this.router.navigate(['/']);
                                },
                                error: (err) => {
                                    console.error('Error fetching user detail', err);
                                },
                            });
                        },
                        error: (err) => {
                            debugger;
                            console.error('Error exchanging code', err);
                        },
                    });
                }
            });
        });
    }
}
