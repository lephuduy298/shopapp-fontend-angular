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
    roles: Role[] = [];
    rememberMe: boolean = true;
    selectedRole: Role | undefined;
    userResponse?: UserResponse;

    constructor(
        private userService: UserService,
        private router: Router,
        private tokenService: TokenService,
        private roleService: RoleService
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
        const message = `phone: ${this.phoneNumber} 
        password: ${this.password} role_id: ${this.selectedRole}`;
        debugger;
        // alert('Information: ' + message);

        const loginDTO: LoginDTO = {
            phone_number: this.phoneNumber,
            password: this.password,
            role_id: this.selectedRole?.id ?? 1,
        };

        this.userService.login(loginDTO).subscribe({
            next: (response: LoginResponse) => {
                debugger;
                // this.router.navigate(['/login']);
                console.log(response);
                // const { token } = response;
                const token = response.token;

                if (this.rememberMe) {
                    this.tokenService.setToken(token); // setToken nên lưu vào localStorage
                } else {
                    this.tokenService.setTokenToMemory(token); // bạn tự định nghĩa phương thức này
                }

                this.userService.getUserDetail(token).subscribe({
                    next: (responseUser: any) => {
                        this.userResponse = {
                            ...responseUser,
                            date_of_birth: new Date(responseUser.date_of_birth),
                        };

                        if (this.rememberMe) {
                            this.userService.saveUserToLocalStorage(this.userResponse);
                            this.userService.saveUserToMemory(this.userResponse);
                        } else {
                            this.userService.saveUserToMemory(this.userResponse);
                        }

                        if (this.userResponse?.role.name == 'admin') {
                            this.router.navigate(['/admin']);
                        } else if (this.userResponse?.role.name == 'user') {
                            this.router.navigate(['/']);
                        }
                    },
                    error: (error: any) => {
                        alert(`Cannot login: ${error.error.message}`);
                    },
                });
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                // Xử lý lỗi nếu có
                debugger;
                alert(`Cannot login: ${error.error.message}`);
            },
        });
    }
}
