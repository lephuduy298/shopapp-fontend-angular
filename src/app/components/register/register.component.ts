import { Component, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RegisterDTO } from '../../dtos/user/register.dto';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss',
})
export class RegisterComponent {
    @ViewChild('registerForm') registerForm!: NgForm;

    phoneNumber: string;
    password: string;
    retypePassword: string;
    fullName: string;
    address: string;
    isAccepted: boolean;
    dateOfBirth: Date;

    constructor(private userService: UserService, private router: Router) {
        this.phoneNumber = '';
        this.password = '';
        this.retypePassword = '';
        this.fullName = '';
        this.address = '';
        this.isAccepted = false;
        this.dateOfBirth = new Date();
        this.dateOfBirth.setFullYear(this.dateOfBirth.getFullYear() - 18);
    }

    // private getDefaultBirthDate(): Date {
    //     const today = new Date();
    //     const birthDate = new Date(today); // tạo bản sao để tránh thay đổi today
    //     birthDate.setFullYear(today.getFullYear() - 18);
    //     return birthDate;
    // }

    // onPhoneChange() {
    //     console.log(this.phone);
    // }

    register() {
        const message = `phone: ${this.phoneNumber} 
        password: ${this.password} 
        retypePassword: ${this.retypePassword} 
        fullName: ${this.fullName} 
        address: ${this.address} 
        isAccept: ${this.isAccepted}
        dateOfBirth: ${this.dateOfBirth}`;
        // alert('Information: ' + message);

        const registerDTO: RegisterDTO = {
            fullname: this.fullName,
            phone_number: this.phoneNumber,
            address: this.address,
            password: this.password,
            retype_password: this.retypePassword,
            date_of_birth: this.dateOfBirth,
            facebook_account_id: 0,
            google_account_id: 0,
            role_id: 1,
        };

        this.userService.register(registerDTO).subscribe({
            next: (response: any) => {
                debugger;
                this.router.navigate(['/login']);
                console.log(response);
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                // Xử lý lỗi nếu có
                debugger;
                alert(`Cannot register: ${error.error.message}`);
            },
        });
    }

    //how to check password match ?
    checkPasswordsMatch() {
        if (this.password !== this.retypePassword) {
            this.registerForm.form.controls['retypePassword'].setErrors({ passwordMismatch: true });
        } else {
            this.registerForm.form.controls['retypePassword'].setErrors(null);
        }
    }

    checkAge() {
        if (this.dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(this.dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 18) {
                this.registerForm.form.controls['dateOfBirth'].setErrors({ invalidAge: true });
            } else {
                this.registerForm.form.controls['dateOfBirth'].setErrors(null);
            }
        }
    }
}
