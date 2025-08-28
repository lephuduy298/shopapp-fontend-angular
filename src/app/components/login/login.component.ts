import { Component, OnInit, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { Router, RouterLink } from '@angular/router';
import { LoginDTO } from '../../dtos/user/login.dto';
import { LoginResponse } from '../../responses/user/login.response';
import { RoleService } from '../../services/role.service';
import { Role } from '../models.ts/role';
import { UserResponse } from '../../responses/user/user.response';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
    @ViewChild('loginForm') registerForm!: NgForm;

    phoneNumber: string = '';
    password: string = '';
    showPassword: boolean = false;
    roles: Role[] = [];
    rememberMe: boolean = true;
    selectedRole: Role | undefined;
    userResponse?: UserResponse;

    // Thêm thuộc tính để hiển thị thông báo lỗi
    errorMessage: string = '';
    isLoading: boolean = false;

    constructor(
        private userService: UserService,
        private router: Router,
        private tokenService: TokenService,
        private roleService: RoleService,
        private toastr: ToastrService,
        private cartService: CartService,
        private authService: AuthService
    ) {}

    //gọi ngonit để lấy roles
    ngOnInit() {
        debugger;
        this.roleService.getRoles().subscribe({
            next: (roles: Role[]) => {
                debugger;
                this.roles = roles;
                this.selectedRole = roles.length > 0 ? roles[0] : undefined;
            },
            error: (error: any) => {
                // Xử lý lỗi nếu có
                debugger;
                console.log(error);
            },
        });
    }

    createAccount() {
        debugger;
        // Chuyển hướng người dùng đến trang đăng ký (hoặc trang tạo tài khoản)
        this.router.navigate(['/register']);
    }

    login() {
        // Reset error message và bắt đầu loading
        this.errorMessage = '';
        this.isLoading = true;

        const message = `phone: ${this.phoneNumber} 
        password: ${this.password} role_id: ${this.selectedRole}`;
        debugger;
        // console.log('Information: ' + message);

        const loginDTO: LoginDTO = {
            phone_number: this.phoneNumber,
            password: this.password,
            role_id: this.phoneNumber.startsWith('admin') ? 2 : this.selectedRole?.id ?? 1,
        };

        this.userService.login(loginDTO).subscribe({
            next: (response: LoginResponse) => {
                debugger;
                // this.router.navigate(['/login']);
                console.log(response);
                // const { token } = response;
                const token = response.token;

                // Lưu token vào localStorage
                this.tokenService.setToken(token);

                this.userService.getUserDetail().subscribe({
                    next: (responseUser: any) => {
                        debugger;
                        this.userResponse = {
                            ...responseUser,
                            date_of_birth: new Date(responseUser.date_of_birth),
                        };

                        // Lưu user vào memory

                        this.cartService.restoreCart();

                        this.userService.saveUserToLocalStorage(this.userResponse);

                        this.isLoading = false;

                        // Hiển thị toast thông báo đăng nhập thành công
                        this.toastr.success(
                            `Chào mừng ${this.userResponse?.fullname || 'bạn'} đã quay trở lại!`,
                            'Đăng nhập thành công!',
                            {
                                timeOut: 3000,
                                progressBar: true,
                                closeButton: true,
                            }
                        );

                        // Điều hướng sau khi hiển thị toast
                        setTimeout(() => {
                            debugger;
                            if (this.userResponse?.role.name == 'admin') {
                                this.router.navigate(['/admin']);
                            } else if (this.userResponse?.role.name == 'user') {
                                this.router.navigate(['/']);
                            }
                        }, 1000); // Delay 1 giây để người dùng thấy toast
                    },
                    error: (error: any) => {
                        this.isLoading = false;
                        console.log(`Cannot get user details: ${error.error.message}`);

                        // Hiển thị message từ backend hoặc fallback message
                        const errorMsg = error.error?.message || 'Không thể tải thông tin người dùng. Vui lòng thử lại.';
                        this.errorMessage = errorMsg;

                        // Hiển thị toast lỗi
                        this.toastr.error(errorMsg, 'Lỗi đăng nhập', {
                            timeOut: 5000,
                            progressBar: true,
                            closeButton: true,
                        });
                    },
                });
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                // Xử lý lỗi đăng nhập
                this.isLoading = false;
                debugger;
                console.log(`Cannot login: ${error.error.message}`);

                // Hiển thị message từ backend hoặc fallback message
                if (error.error && error.error.message) {
                    this.errorMessage = error.error.message;
                } else {
                    this.errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
                }
            },
        });
    }

    // Method để xóa thông báo lỗi khi người dùng bắt đầu nhập lại
    clearErrorMessage() {
        this.errorMessage = '';
    }

    // Đăng nhập với Google
    loginWithGoogle() {
        debugger;
        this.authService.authenticate('google').subscribe({
            next: (url: string) => {
                debugger;
                window.location.href = url;
                // Sau khi xác thực thành công ở Google, các xử lý user/cart/toast sẽ thực hiện ở auth-callback.component.ts
            },
            error: (error) => {
                console.error('Google login failed:', error);
            },
        });
    }

    loginWithFacebook() {
        this.authService.authenticate('facebook').subscribe({
            next: (url: string) => {
                console.log('Facebook login successful:', url);
                window.location.href = url;
            },
            error: (error) => {
                console.error('Facebook login failed:', error);
            },
        });
    }
}
