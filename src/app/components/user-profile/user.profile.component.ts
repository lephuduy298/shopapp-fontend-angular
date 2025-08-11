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
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

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
        private router: Router,
        private toastr: ToastrService,
        private authService: AuthService
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
        debugger;
        this.token = this.tokenService.getToken() || '';
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
                    // Hiển thị toast thông báo cập nhật thành công
                    this.toastr.success(
                        'Thông tin người dùng đã được cập nhật thành công. Vui lòng đăng nhập lại.',
                        'Cập nhật thành công',
                        {
                            timeOut: 5000,
                            progressBar: true,
                            closeButton: true,
                            positionClass: 'toast-top-right',
                        }
                    );

                    // Chờ 2 giây trước khi chuyển hướng để người dùng có thể đọc thông báo
                    // setTimeout(() => {
                    //     this.userService.removeUserFromLocalStorage();
                    //     this.tokenService.removeToken();
                    //     this.router.navigate(['/login']);
                    // }, 2000);

                    this.isEditMode = false;
                },
                error: (error: any) => {
                    console.log(error.error.message);

                    // Hiển thị toast lỗi với thông báo từ backend
                    const errorMessage = error.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
                    this.toastr.error(errorMessage, 'Cập nhật thất bại', {
                        timeOut: 5000,
                        progressBar: true,
                        closeButton: true,
                        positionClass: 'toast-top-right',
                    });
                },
            });
        } else {
            if (this.userProfileForm.hasError('passwordMismatch')) {
                console.log('Mật khẩu và mật khẩu gõ lại chưa chính xác');

                // Hiển thị toast cảnh báo về mật khẩu không khớp
                this.toastr.warning('Mật khẩu và mật khẩu gõ lại không khớp', 'Lỗi xác thực', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                    positionClass: 'toast-top-right',
                });
            } else {
                // Hiển thị toast cảnh báo về form không hợp lệ
                this.toastr.warning('Vui lòng kiểm tra và điền đầy đủ thông tin bắt buộc', 'Thông tin chưa hợp lệ', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                    positionClass: 'toast-top-right',
                });
            }
        }
    }

    /**
     * Toggle chế độ chỉnh sửa profile
     * Bật/tắt chế độ chỉnh sửa và hiển thị thông báo tương ứng
     */
    toggleEditMode(): void {
        this.isEditMode = !this.isEditMode;

        if (this.isEditMode) {
            // Bắt đầu chế độ chỉnh sửa
            // this.toastr.info(
            //     'Bạn đang ở chế độ chỉnh sửa. Hãy cập nhật thông tin và nhấn "Lưu thay đổi".',
            //     'Chế độ chỉnh sửa',
            //     {
            //         timeOut: 3000,
            //         progressBar: true,
            //         closeButton: true,
            //         positionClass: 'toast-top-right',
            //     }
            // );

            // Reset validation errors khi bắt đầu chỉnh sửa
            this.userProfileForm.markAsUntouched();
            this.userProfileForm.markAsPristine();
        } else {
            // Hủy chế độ chỉnh sửa
            // this.toastr.info(
            //     'Đã hủy chế độ chỉnh sửa. Thông tin đã được khôi phục về trạng thái ban đầu.',
            //     'Hủy chỉnh sửa',
            //     {
            //         timeOut: 2500,
            //         progressBar: true,
            //         closeButton: false,
            //         positionClass: 'toast-top-right',
            //     }
            // );

            // Khôi phục lại dữ liệu ban đầu từ userResponse
            if (this.userResponse) {
                this.userProfileForm.patchValue({
                    fullname: this.userResponse.fullname ?? '',
                    address: this.userResponse.address ?? '',
                    date_of_birth: this.userResponse.date_of_birth.toISOString().substring(0, 10),
                    password: '',
                    retype_password: '',
                });
            }

            // Reset tất cả validation states
            this.userProfileForm.markAsUntouched();
            this.userProfileForm.markAsPristine();

            // Clear any form errors
            Object.keys(this.userProfileForm.controls).forEach((key) => {
                this.userProfileForm.get(key)?.setErrors(null);
            });
        }
    }
}
