import { Component, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../service/user.service';
import { Router } from '@angular/router';
import { LoginDTO } from '../dtos/user/login.dto';

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

    constructor(private userService: UserService, private router: Router) {}

    login() {
        const message = `phone: ${this.phoneNumber} 
        password: ${this.password}`;
        // alert('Information: ' + message);

        const loginDTO: LoginDTO = {
            phone_number: this.phoneNumber,
            password: this.password,
        };

        this.userService.login(loginDTO).subscribe({
            next: (response: any) => {
                debugger;
                // this.router.navigate(['/login']);
                console.log(response);
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
