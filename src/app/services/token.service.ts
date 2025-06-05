import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root',
})
export class TokenService {
    private readonly TOKEN_KEY = 'access_token';

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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
}
