import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenService = inject(TokenService);
    const userService = inject(UserService);
    const router = inject(Router);

    // Không thêm token ở đây - token interceptor sẽ làm việc đó
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Chỉ xử lý lỗi 401 và không phải refresh endpoint
            if (error.status === 401 && !req.url.includes('/users/refresh')) {
                return handle401Error(req, next, tokenService, userService, router);
            }

            return throwError(() => error);
        })
    );
};

// Biến static để quản lý việc refresh token
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

function handle401Error(
    req: HttpRequest<any>,
    next: HttpHandlerFn,
    tokenService: TokenService,
    userService: UserService,
    router: Router
) {
    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);
        debugger;

        return userService.refreshAccessToken().pipe(
            switchMap((response: any) => {
                debugger;
                isRefreshing = false;
                refreshTokenSubject.next(response.token);

                // Lưu token mới
                tokenService.setToken(response.token);

                // Retry request ban đầu với token mới
                const newReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${response.token}`,
                    },
                });

                return next(newReq);
            }),
            catchError((refreshError) => {
                isRefreshing = false;

                // Refresh token cũng hết hạn, redirect về login
                console.error('Refresh token expired:', refreshError);
                tokenService.removeToken();
                router.navigate(['/login']);

                return throwError(() => refreshError);
            })
        );
    } else {
        // Nếu đang refresh, chờ cho đến khi có token mới
        return refreshTokenSubject.pipe(
            filter((token) => token != null),
            take(1),
            switchMap((token) => {
                const newReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                return next(newReq);
            })
        );
    }
}
