import { Injectable } from '@angular/core';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Observable, of, switchMap, catchError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard {
    constructor(private tokenService: TokenService, private userService: UserService, private router: Router) {}

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const isTokenExpired = this.tokenService.isTokenExpired();
        const isUserIdValid = this.tokenService.getUserId() > 0;
        
        // Nếu token còn hiệu lực
        if (!isTokenExpired && isUserIdValid) {
            return of(true);
        }
        
        // Nếu token hết hạn, thử refresh
        console.log('🔒 Token expired in guard, attempting refresh...');
        return this.userService.refreshAccessToken().pipe(
            switchMap((response: any) => {
                // Refresh thành công
                console.log('✅ Token refreshed successfully in guard');
                this.tokenService.setToken(response.token);
                return of(true);
            }),
            catchError((error) => {
                // Refresh thất bại, redirect login
                console.log('❌ Token refresh failed in guard, redirecting to login');
                this.router.navigate(['/login']);
                return of(false);
            })
        );
    }
}

// Sử dụng functional guard như sau:
export const AuthGuardFn: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
    return inject(AuthGuard).canActivate(next, state);
};
