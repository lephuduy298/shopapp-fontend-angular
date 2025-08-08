import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { parse } from 'path';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class TokenService {
    private readonly TOKEN_KEY = 'access_token';
    private jwtHelperService = new JwtHelperService();
    private memoryToken: string | null = null;

    constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService) {}

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    // getToken(): any {
    //     if (this.isBrowser()) {
    //         return localStorage.getItem(this.TOKEN_KEY) ?? '';
    //     }
    // }

    // setToken(token: string): void {
    //     if (this.isBrowser()) {
    //         localStorage.setItem(this.TOKEN_KEY, token);
    //     }
    // }

    setTokenToMemory(token: string) {
        this.memoryToken = token;
    }

    removeToken(): void {
        if (this.isBrowser()) {
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    getUserId(): number {
        let userObject = this.jwtHelperService.decodeToken(this.authService.getAccessToken() ?? '');
        if (userObject && 'userId' in userObject) {
            return parseInt(userObject['userId']);
        }
        return 0;
    }

    isTokenExpired(): any {
        if (this.isBrowser()) {
            const token = this.authService.getAccessToken();
            if (token) {
                return this.jwtHelperService.isTokenExpired(token);
            }
        }
        return false;
    }
}
