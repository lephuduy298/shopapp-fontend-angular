import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { UserResponse } from '../responses/user/user.response';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ApiResponse } from '../responses/common/api-response';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiRefresh = `${environment.apiBaseUrl}/users/refresh`;
    private apiUserDetails = `${environment.apiBaseUrl}/users/details`;
    private apiLoginWithSocial = `${environment.apiBaseUrl}/users/auth`;

    constructor(private http: HttpClient) {}
    private accessToken: string | null = null;

    private currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
    public currentUser$: Observable<UserResponse | null> = this.currentUserSubject.asObservable();

    // Thêm BehaviorSubject để track trạng thái token
    private tokenReadySubject = new BehaviorSubject<boolean>(false);
    public tokenReady$: Observable<boolean> = this.tokenReadySubject.asObservable();

    // Access token
    setAccessToken(token: string) {
        this.accessToken = token;
        // Thông báo rằng token đã sẵn sàng
        this.tokenReadySubject.next(true);
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    // User
    setCurrentUser(user: UserResponse) {
        this.currentUserSubject.next(user);
    }

    getCurrentUser(): UserResponse | null {
        return this.currentUserSubject.getValue();
    }

    // Get user details from API
    getCurrentUserFromApi(): Observable<UserResponse> {
        return this.http.post<ApiResponse<UserResponse>>(this.apiUserDetails, {}).pipe(map((resp) => resp.data));
    }

    // Update current user from API and return it
    refreshCurrentUser(): Observable<UserResponse> {
        return this.getCurrentUserFromApi().pipe(
            tap((user) => {
                this.setCurrentUser(user);
            })
        );
    }

    clearUser() {
        this.accessToken = null;
        this.currentUserSubject.next(null);
        this.tokenReadySubject.next(false);
    }

    refreshAccessToken(): Observable<any> {
        debugger;
        // Implement your logic to refresh the access token here
        // For example, you might call an API endpoint to get a new token
        return this.http.get<ApiResponse<any>>(this.apiRefresh, { withCredentials: true });
    }

    authenticate(login_type: 'google' | 'facebook'): Observable<any> {
        return this.http.get(`${this.apiLoginWithSocial}/social-login`, {
            params: { login_type },
            withCredentials: true,
            responseType: 'text' as 'json', // trick để Angular chấp nhận
        });
    }

    exchangeCodeForToken(code: string, login_type: 'google' | 'facebook'): Observable<any> {
        debugger;
        const body = { code, login_type };
        return this.http.post<any>(
            `${this.apiLoginWithSocial}/social/callback`,
            body, // ✅ đây là request body
            {
                withCredentials: true, // ✅ cookie sẽ lưu được
            }
        );
    }
}
