import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import { environment } from '../../../environments/environment';
import { UserService } from '../../../services/user.service';
import { UserResponse } from '../../../responses/user/user.response';
import { UpdateUserDTO } from '../../../dtos/user/update.dto';
import { ResultPagination } from '../../../responses/user/result-pagination.response';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-account-admin',
    standalone: true,
    // Thêm ReactiveFormsModule để dùng FormBuilder
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './account.admin.component.html',
    styleUrl: './account.admin.component.scss',
})
export class AccountAdminComponent implements OnInit {
    users: UserResponse[] = [];
    filteredUsers: UserResponse[] = [];
    loading = false;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    totalPages = 1;
    itemsPerPage = 10;
    totalItems = 0;

    // Filter & Search
    searchTerm = '';
    selectedStatus = '';
    selectedRole = ''; // Để binding với template
    selectedRoleId: number | null = null;

    // Active filter property for UI state
    activeFilter = 'all'; // 'all', 'user', 'admin'

    // Role mapping chỉ có User và Admin
    roleMapping: { [key: string]: number } = {
        user: 1,
        admin: 2,
    };

    // Edit user
    editingUser: UserResponse | null = null;
    editForm!: FormGroup; // Reactive form

    // Confirmation modal state
    confirmModalVisible = false;
    confirmTargetUser: UserResponse | null = null;
    confirmAction: 'delete' | 'block' | 'activate' | null = null;
    // Loading state for confirm modal actions
    confirmProcessing = false;
    // View-only admin detail modal state
    viewingAdmin: UserResponse | null = null;

    constructor(private userService: UserService, private formBuilder: FormBuilder, private toastr: ToastrService) {}

    ngOnInit(): void {
        this.initializeEditForm();
        this.loadUsers();
    }

    // Khởi tạo FormGroup cho editForm
    private initializeEditForm(): void {
        this.editForm = this.formBuilder.group(
            {
                fullname: ['', [Validators.required, Validators.minLength(2)]],
                address: ['', [Validators.minLength(3)]],
                // current_password giữ để backend có thể cần (ẩn trong UI hiện tại)
                current_password: [''],
                password: ['', [Validators.minLength(3)]],
                retype_password: [''],
                date_of_birth: [new Date(), [Validators.required]],
            },
            { validators: this.passwordsMatchValidator }
        );
    }

    // Validator kiểm tra password và retype_password (nếu có nhập password)
    private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('password')?.value;
        const retype = group.get('retype_password')?.value;
        if (!password && !retype) return null; // Không bắt buộc đổi mật khẩu
        if (password && password.length < 3) return { passwordTooShort: true };
        return password === retype ? null : { passwordsMismatch: true };
    }

    loadUsers(): void {
        this.loading = true;
        this.error = null;
        const keyword = this.searchTerm.trim() || undefined;
        const roleId = this.selectedRoleId || undefined;
        let isActiveParam: number | undefined;
        if (this.selectedStatus === '1') isActiveParam = 1;
        else if (this.selectedStatus === '0') isActiveParam = 0;

        this.userService.getAllUsers(keyword, roleId, this.currentPage, this.itemsPerPage, isActiveParam).subscribe({
            next: (response: ResultPagination) => {
                this.users = response.result as UserResponse[];
                this.totalItems = response.meta.totalItems || 0;
                this.totalPages = response.meta.totalPage || 1;
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Failed to load users';
                console.error('Error loading users:', error);
                this.loading = false;
            },
        });
    }

    // Phương thức mới để refresh data khi filter thay đổi
    onFiltersChange(): void {
        this.currentPage = 1; // Reset về trang đầu
        this.loadUsers();
    }

    // Filter methods
    // filterByAll(): void {
    //     this.activeFilter = 'all';
    //     this.selectedRoleId = null;
    //     this.selectedRole = '';
    //     this.onFiltersChange();
    // }

    // filterByUser(): void {
    //     this.activeFilter = 'user';
    //     this.selectedRoleId = 1; // User role ID
    //     this.selectedRole = 'user';
    //     this.onFiltersChange();
    // }

    // filterByAdmin(): void {
    //     this.activeFilter = 'admin';
    //     this.selectedRoleId = 2; // Admin role ID
    //     this.selectedRole = 'admin';
    //     this.onFiltersChange();
    // }

    // Check if user can be edited (only users, not admins)
    canEditUser(user: UserResponse): boolean {
        return user.role.name.toLowerCase() === 'user';
    }

    // View admin details (open popup)
    viewAdminDetails(user: UserResponse): void {
        // Close edit modal if open
        this.editingUser = null;
        this.viewingAdmin = user;
    }

    closeViewAdmin(): void {
        this.viewingAdmin = null;
    }

    get paginatedUsers(): UserResponse[] {
        // Vì backend đã handle pagination, trả về toàn bộ users
        return this.users;
    }

    onSearch(): void {
        this.onFiltersChange();
    }

    onStatusFilterChange(): void {
        this.onFiltersChange();
    }

    onRoleFilterChange(): void {
        // Convert role name thành role_id
        this.selectedRoleId = this.roleMapping[this.selectedRole] || null;
        this.onFiltersChange();
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadUsers();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadUsers();
        }
    }

    // Pagination methods
    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadUsers();
        }
    }

    get visiblePages(): number[] {
        const pages: number[] = [];
        const maxVisiblePages = 5;

        if (this.totalPages <= maxVisiblePages) {
            // If total pages is less than max visible, show all pages
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages around current page
            let startPage = Math.max(1, this.currentPage - 2);
            let endPage = Math.min(this.totalPages, this.currentPage + 2);

            // Adjust if we're near the beginning or end
            if (endPage - startPage < maxVisiblePages - 1) {
                if (startPage === 1) {
                    endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
                } else {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    }

    editUser(user: UserResponse): void {
        this.editingUser = user;
        this.editForm.reset({
            fullname: user.fullname,
            address: user.address,
            current_password: '',
            password: '',
            retype_password: '',
            date_of_birth: user.date_of_birth ? new Date(user.date_of_birth as any) : new Date(),
        });
    }

    saveUser(): void {
        if (!this.editingUser) return;
        if (this.editForm.invalid) {
            this.markFormGroupTouched(this.editForm);
            return;
        }

        const formValue = this.editForm.value;
        // Chỉ gửi password nếu người dùng nhập
        const updatePayload: UpdateUserDTO = {
            fullname: formValue.fullname,
            phone_number: formValue.phone_number || '',
            address: formValue.address,
            current_password: formValue.current_password || '',
            password: formValue.password || '',
            retype_password: formValue.retype_password || '',
            date_of_birth: formValue.date_of_birth,
        };

        if (!updatePayload.password) {
            // Nếu không đổi mật khẩu, bỏ các field mật khẩu nếu backend cho phép
            updatePayload.password = '';
            updatePayload.retype_password = '';
        }

        this.userService.updateUser(this.editingUser.id, updatePayload).subscribe({
            next: (updatedUser) => {
                const index = this.users.findIndex((u) => u.id === this.editingUser!.id);
                if (index !== -1) {
                    this.users[index] = updatedUser;
                }
                this.cancelEdit();
                this.loadUsers();
                this.toastr.success(`Người dùng đã được cập nhật thành công`, 'Cập nhật thành công', {
                    timeOut: 1500,
                    progressBar: true,
                    closeButton: true,
                    positionClass: 'toast-top-right',
                });
            },
            error: (error) => {
                this.error = 'Failed to update user';
                const backendMsg = error?.error?.message || 'Có lỗi xảy ra khi cập nhật người dùng';
                this.toastr.error(backendMsg, 'Cập nhật thất bại', {
                    timeOut: 4000,
                    progressBar: true,
                    closeButton: true,
                    positionClass: 'toast-top-right',
                });
                console.error('Error updating user:', error);
            },
        });
    }

    cancelEdit(): void {
        this.editingUser = null;
        this.editForm.reset({
            fullname: '',
            address: '',
            current_password: '',
            password: '',
            retype_password: '',
            date_of_birth: new Date(),
        });
    }

    deleteUser(user: UserResponse): void {
        // Direct delete (used internally after confirmation)
        this.userService.deleteUser(user.id).subscribe({
            next: () => {
                this.loadUsers();
            },
            error: (error) => {
                this.error = 'Failed to delete user';
                console.error('Error deleting user:', error);
            },
        });
    }

    toggleUserStatus(user: UserResponse): void {
        this.openConfirm(user.is_active ? 'block' : 'activate', user);
    }

    // Toggle block/activate via backend (assumed same endpoint)
    blockAndActiveUser(userId: number): void {
        this.userService.blockAndActiveUser(userId).subscribe({
            next: () => {
                const idx = this.users.findIndex((u) => u.id === userId);
                if (idx !== -1) {
                    (this.users[idx] as any).is_active = !(this.users[idx] as any).is_active;
                }
                this.loadUsers();
            },
            error: (err) => {
                this.error = 'Failed to toggle user';
                console.error('Error toggling user:', err);
            },
        });
    }

    // Confirmation helpers
    openConfirm(action: 'delete' | 'block' | 'activate', user: UserResponse): void {
        this.confirmAction = action;
        this.confirmTargetUser = user;
        this.confirmModalVisible = true;
        this.confirmProcessing = false;
    }

    closeConfirm(): void {
        this.confirmModalVisible = false;
        this.confirmTargetUser = null;
        this.confirmAction = null;
        this.confirmProcessing = false;
    }

    confirmProceed(): void {
        if (!this.confirmTargetUser || !this.confirmAction) {
            return;
        }
        const user = this.confirmTargetUser;
        const action = this.confirmAction;
        if (this.confirmProcessing) return; // prevent double submit
        this.confirmProcessing = true;

        if (action === 'delete') {
            this.userService.deleteUser(user.id).subscribe({
                next: () => {
                    this.confirmProcessing = false;
                    this.closeConfirm();
                    this.loadUsers();
                },
                error: (error) => {
                    this.error = 'Failed to delete user';
                    console.error('Error deleting user:', error);
                    this.confirmProcessing = false;
                },
            });
        } else if (action === 'block' || action === 'activate') {
            this.userService.blockAndActiveUser(user.id).subscribe({
                next: () => {
                    // Optimistic toggle
                    const idx = this.users.findIndex((u) => u.id === user.id);
                    if (idx !== -1) {
                        (this.users[idx] as any).is_active = !(this.users[idx] as any).is_active;
                    }
                    this.confirmProcessing = false;
                    this.closeConfirm();
                    this.loadUsers();
                },
                error: (err) => {
                    this.error = 'Failed to toggle user';
                    console.error('Error toggling user:', err);
                    this.confirmProcessing = false;
                },
            });
        }
    }

    get confirmTitle(): string {
        if (this.confirmAction === 'delete') return 'Confirm Delete';
        if (this.confirmAction === 'block') return 'Confirm Block User';
        if (this.confirmAction === 'activate') return 'Confirm Activate User';
        return 'Confirm';
    }

    get confirmMessage(): string {
        const name = this.confirmTargetUser?.fullname || 'this user';
        if (this.confirmAction === 'delete') return `Are you sure you want to permanently delete user "${name}"?`;
        if (this.confirmAction === 'block')
            return `Block (deactivate) user "${name}"? They won't be able to access the system.`;
        if (this.confirmAction === 'activate') return `Activate user "${name}"? They will regain access.`;
        return '';
    }

    formatDate(date: Date | string | null | undefined): string {
        if (!date) return 'N/A';

        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return 'Invalid Date';

            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    formatDateTime(date: Date | string | number[] | null | undefined): string {
        if (!date) return 'N/A';

        try {
            let dateObj: Date;

            if (Array.isArray(date)) {
                // Lưu ý: tháng trong JS bắt đầu từ 0, nên phải trừ 1
                const [year, month, day, hour = 0, minute = 0, second = 0] = date;
                dateObj = new Date(year, month - 1, day, hour, minute, second);
            } else {
                dateObj = new Date(date);
            }

            if (isNaN(dateObj.getTime())) return 'Invalid Date';

            return dateObj.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Invalid Date';
        }
    }

    getRoleDisplayName(roleName: string): string {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return 'Admin';
            case 'user':
                return 'Member';
            case 'superuser':
                return 'Superuser';
            case 'editor':
                return 'Editor';
            case 'writer':
                return 'Writer';
            default:
                return roleName;
        }
    }

    getRoleClass(roleName: string): string {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return 'badge bg-danger';
            case 'superuser':
                return 'badge bg-info';
            case 'editor':
                return 'badge bg-primary';
            case 'writer':
                return 'badge bg-warning';
            default:
                return 'badge bg-secondary';
        }
    }

    trackByUserId(index: number, user: UserResponse): number {
        return user.id;
    }

    onDateChange(event: any): void {
        const value = event.target.value;
        if (value) {
            this.editForm.get('date_of_birth')?.setValue(new Date(value));
        }
    }

    // Add formatTime method for displaying time
    formatTime(date: Date | string | null | undefined): string {
        if (!date) return '';

        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return '';

            return dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return '';
        }
    }

    // Role options chỉ có User và Admin
    get roleOptions(): Array<{ value: string; label: string }> {
        return [
            { value: '', label: 'All Roles' },
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
        ];
    }

    // Helpers hiển thị lỗi
    getFieldError(fieldName: string): string {
        const control = this.editForm.get(fieldName);
        if (!control) return '';
        if (control.touched && control.errors) {
            if (control.errors['required']) return 'Trường này bắt buộc';
            if (control.errors['minlength']) return `Tối thiểu ${control.errors['minlength'].requiredLength} ký tự`;
        }
        if (fieldName === 'retype_password' && this.editForm.errors?.['passwordsMismatch']) {
            return 'Mật khẩu không trùng nhau';
        }
        if (fieldName === 'password' && this.editForm.errors?.['passwordTooShort']) {
            return 'Mật khẩu tối thiểu 3 ký tự';
        }
        return '';
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsTouched();
            if (control instanceof FormGroup) this.markFormGroupTouched(control);
        });
    }
}
