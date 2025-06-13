import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { parse } from 'path';

@Injectable({
    providedIn: 'root',
})
export class TokenService {
    private readonly TOKEN_KEY = 'access_token';
    private jwtHelperService = new JwtHelperService();
    private memoryToken: string | null = null;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    getToken(): any {
        if (this.isBrowser()) {
            return localStorage.getItem(this.TOKEN_KEY) ?? '';
        }
    }

    setToken(token: string): void {
        if (this.isBrowser()) {
            localStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    setTokenToMemory(token: string) {
        this.memoryToken = token;
    }

    removeToken(): void {
        if (this.isBrowser()) {
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    getUserId(): number {
        let userObject = this.jwtHelperService.decodeToken(this.getToken() ?? '');
        if (userObject && 'userId' in userObject) {
            return parseInt(userObject['userId']);
        }
        return 0;
    }

    isTokenExpired(): any {
        if (this.getToken() == null) {
            return false;
        }
        return this.jwtHelperService.isTokenExpired(this.getToken()!);
    }
}
