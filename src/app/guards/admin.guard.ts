import { Injectable } from '@angular/core';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';
import { UserResponse } from '../responses/user/user.response';
import { Observable, of, switchMap, catchError, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root',
})
export class AdminGuard {
    userResponse?: UserResponse | null;

    constructor(
        private tokenService: TokenService,
        private router: Router,
        private userService: UserService,
        private toastr: ToastrService
    ) {}

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const isTokenExpired = this.tokenService.isTokenExpired();
        const isUserIdValid = this.tokenService.getUserId() > 0;

        // Nếu token còn hiệu lực
        if (!isTokenExpired && isUserIdValid) {
            return this.checkAdminRole();
        }

        // Nếu token hết hạn, thử refresh
        console.log('🔒 Token expired in admin guard, attempting refresh...');
        return this.userService.refreshAccessToken().pipe(
            switchMap((response: any) => {
                // Refresh thành công
                console.log('✅ Token refreshed successfully in admin guard');
                this.tokenService.setToken(response.token);

                // Sau khi refresh token, cần lấy lại user data và kiểm tra role
                return this.getUserAndCheckRole();
            }),
            catchError((error) => {
                // Refresh thất bại, redirect login
                console.log('❌ Token refresh failed in admin guard, redirecting to login');
                this.router.navigate(['/login']);
                return of(false);
            })
        );
    }

    private checkAdminRole(): Observable<boolean> {
        // Lấy token để gọi API getUserDetail thay vì dùng localStorage
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.log('❌ No token found, redirecting to login');
            this.router.navigate(['/login']);
            return of(false);
        }

        return this.userService.getUserDetail().pipe(
            map((userResponse) => {
                this.userResponse = userResponse;
                
                if (userResponse && userResponse.role && userResponse.role.name === 'admin') {
                    console.log('✅ Admin access granted');
                    return true;
                } else {
                    console.log('❌ Access denied: User is not admin');
                    // Hiển thị toast notification và redirect về trang chủ
                    this.toastr.error('Bạn không có quyền truy cập trang Admin!', 'Truy cập bị từ chối', {
                        timeOut: 5000,
                        progressBar: true,
                        closeButton: true,
                    });
                    this.router.navigate(['/']);
                    return false;
                }
            }),
            catchError(() => {
                console.log('❌ Error getting user details, redirecting to login');
                this.router.navigate(['/login']);
                return of(false);
            })
        );
    }

    private getUserAndCheckRole(): Observable<boolean> {
        // Gọi API để lấy user detail mới với token đã refresh
        return this.userService.getUserDetail().pipe(
            switchMap((userResponse: any) => {
                // Lưu user data vào memory/localStorage
                // this.userService.saveUserToMemory(userResponse);

                // Kiểm tra role admin
                if (userResponse && userResponse.role.name === 'admin') {
                    console.log('✅ Admin access granted after token refresh');
                    return of(true);
                } else {
                    console.log('❌ Access denied: User is not admin after token refresh');
                    this.toastr.error('Bạn không có quyền truy cập trang Admin!', 'Truy cập bị từ chối', {
                        timeOut: 5000,
                        progressBar: true,
                        closeButton: true,
                    });
                    this.router.navigate(['/']);
                    return of(false);
                }
            }),
            catchError((error) => {
                console.error('❌ Failed to get user details after token refresh:', error);
                this.router.navigate(['/login']);
                return of(false);
            })
        );
    }
}

// Sử dụng functional guard như sau:
export const AdminGuardFn: CanActivateFn = (
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Observable<boolean> => {
    return inject(AdminGuard).canActivate(next, state);
};
