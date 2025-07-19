import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ValidationErrors,
    ValidatorFn,
    AbstractControl,
    ReactiveFormsModule,
    FormsModule,
} from '@angular/forms';
import { TokenService } from '../../services/token.service';
import { UserService } from '../../services/user.service';
import { UserResponse } from '../../responses/user/user.response';
import { UpdateUserDTO } from '../../dtos/user/update.dto';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, FormsModule, ReactiveFormsModule, CommonModule],
    templateUrl: './user.profile.component.html',
    styleUrl: './user.profile.component.scss',
})
export class UserProfileComponent implements OnInit {
    userProfileForm: FormGroup;
    token: string = '';
    userResponse?: UserResponse;
    isEditMode: boolean = false;

    constructor(
        private formBuilder: FormBuilder,
        private tokenService: TokenService,
        private userService: UserService,
        private router: Router
    ) {
        this.userProfileForm = this.formBuilder.group(
            {
                fullname: ['', [Validators.required]],
                address: ['', [Validators.minLength(3)]],
                password: ['', [Validators.minLength(3)]],
                retype_password: [''],
                date_of_birth: [Date.now()],
            },
            {
                validators: this.passwordMatchValidator(), // Custom validator function for password match
            }
        );
    }
    ngOnInit() {
        this.token = this.tokenService.getToken();
        this.userService.getUserDetail(this.token).subscribe({
            next: (response: any) => {
                debugger;
                this.userResponse = {
                    ...response,
                    date_of_birth: new Date(response.date_of_birth),
                };
                this.userProfileForm.patchValue({
                    fullname: this.userResponse?.fullname ?? '',
                    address: this.userResponse?.address ?? '',
                    date_of_birth: this.userResponse?.date_of_birth.toISOString().substring(0, 10),
                });
                this.userService.saveUserToLocalStorage(this.userResponse);
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                debugger;
                console.log(error.error.message);
            },
        });
    }

    passwordMatchValidator(): ValidatorFn {
        return (formGroup: AbstractControl): ValidationErrors | null => {
            const password = formGroup.get('password')?.value;
            const retypedPassword = formGroup.get('retype_password')?.value;
            if (password !== retypedPassword) {
                return { passwordMismatch: true };
            }

            return null;
        };
    }

    save(): void {
        debugger;
        if (this.userProfileForm.valid) {
            const updateUserDTO: UpdateUserDTO = {
                fullname: this.userProfileForm.get('fullname')?.value,
                address: this.userProfileForm.get('address')?.value,
                password: this.userProfileForm.get('password')?.value,
                retype_password: this.userProfileForm.get('retype_password')?.value,
                date_of_birth: this.userProfileForm.get('date_of_birth')?.value,
            };

            this.userService.updateUserDetail(this.token, updateUserDTO).subscribe({
                next: (response: any) => {
                    this.userService.removeUserFromLocalStorage();
                    this.tokenService.removeToken();
                    this.router.navigate(['/login']);
                    this.isEditMode = false;
                },
                error: (error: any) => {
                    console.log(error.error.message);
                },
            });
        } else {
            if (this.userProfileForm.hasError('passwordMismatch')) {
                console.log('Mật khẩu và mật khẩu gõ lại chưa chính xác');
            }
        }
    }
}
