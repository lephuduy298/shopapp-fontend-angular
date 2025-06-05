import { Component, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { Router } from '@angular/router';
import { LoginDTO } from '../../dtos/user/login.dto';
import { LoginResponse } from '../../responses/user/login.response';
import { RoleService } from '../../services/role.service';
import { Role } from '../models.ts/role';

@Component({
    selector: 'app-login',
    imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
})
export class LoginComponent {
    @ViewChild('loginForm') registerForm!: NgForm;

    phoneNumber: string = '';
    password: string = '';
    roles: Role[] = [];
    rememberMe: boolean = true;
    selectedRole: Role | undefined;

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
                    this.tokenService.setToken(token);
                }
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
