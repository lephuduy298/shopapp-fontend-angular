import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class TokenService {
    private readonly TOKEN_KEY = 'access_token';
    private jwtHelperService = new JwtHelperService();

    constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService) {}

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    getToken(): string | null {
        if (this.isBrowser()) {
            return localStorage.getItem(this.TOKEN_KEY);
        }
        return null;
    }

    setToken(token: string): void {
        if (this.isBrowser()) {
            localStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    removeToken(): void {
        if (this.isBrowser()) {
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    getUserId(): number {
        if (this.isBrowser()) {
            const token = this.getToken();
            if (token) {
                let userObject = this.jwtHelperService.decodeToken(token);
                if (userObject && 'userId' in userObject) {
                    return parseInt(userObject['userId']);
                }
            }
        }
        return 0;
    }

    isTokenExpired(): boolean {
        if (this.isBrowser()) {
            const token = this.getToken();
            if (token) {
                return this.jwtHelperService.isTokenExpired(token);
            }
        }
        return false;
    }
}
