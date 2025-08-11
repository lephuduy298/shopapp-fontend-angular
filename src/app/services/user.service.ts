import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterDTO } from '../dtos/user/register.dto';
import { LoginDTO } from '../dtos/user/login.dto';
import { environment } from '../environments/environment';
import { UserResponse } from '../responses/user/user.response';
import { isPlatformBrowser } from '@angular/common';
import { Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { UpdateUserDTO } from '../dtos/user/update.dto';
import { signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private apiRegister = `${environment.apiBaseUrl}/users/register`;
    private apiLogin = `${environment.apiBaseUrl}/users/login`;
    private apiLogout = `${environment.apiBaseUrl}/users/logout`;
    private apiRefresh = `${environment.apiBaseUrl}/users/refresh`;
    private apiGetUserDetail = `${environment.apiBaseUrl}/users/details`;
    private memoryUser: UserResponse | null = null;

    private apiConfig = {
        headers: this.createHeaders(),
    };
    constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

    private createHeaders(): HttpHeaders {
        return new HttpHeaders({ 'Content-Type': 'application/json', 'Accept-Language': 'vi' });
    }

    register(registerDTO: RegisterDTO): Observable<any> {
        return this.http.post(this.apiRegister, registerDTO, this.apiConfig);
    }

    login(loginDTO: LoginDTO): Observable<any> {
        const options = {
            ...this.apiConfig,
            withCredentials: true,
        };
        return this.http.post(this.apiLogin, loginDTO, options);
    }

    logout(): Observable<any> {
        const options = {
            ...this.apiConfig,
            withCredentials: true,
        };
        return this.http.post(this.apiLogout, {}, options);
    }

    refreshAccessToken(): Observable<any> {
        debugger;
        const options = {
            ...this.apiConfig,
            withCredentials: true,
        };
        return this.http.get(this.apiRefresh, options);
    }

    getUserDetail(token: string): Observable<UserResponse> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        });

        return this.http.post<UserResponse>(this.apiGetUserDetail, {}, { headers });
    }

    saveUserToLocalStorage(userResponse?: UserResponse) {
        try {
            debugger;
            if (userResponse == null || !userResponse) {
                return;
            }
            
            // Chỉ lưu userId và userName vào localStorage
            const userInfo = {
                userId: userResponse.id,
                userName: userResponse.fullname
            };
            
            const userInfoJSON = JSON.stringify(userInfo);
            localStorage.setItem('user', userInfoJSON);

            console.log('User info (userId and userName) saved to local storage.');
        } catch (error) {
            console.log('Error saving user info to local storage.');
        }
    }

    // saveUserToMemory(userResponse?: UserResponse) {
    //     if (userResponse == null || !userResponse) {
    //         return;
    //     }
    //     this.memoryUser = userResponse;
    // }

    getUserFromLocalStorage(): { userId: number; userName: string } | null {
        try {
            if (isPlatformBrowser(this.platformId)) {
                const userInfoJSON = localStorage.getItem('user');

                if (userInfoJSON == null || !userInfoJSON) {
                    return null;
                }

                //convert Json string to object
                const userInfo = JSON.parse(userInfoJSON);

                console.log('User info retrieved from local storage.');
                return userInfo;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error retrieving user info from local storage:', error);
            return null;
        }
    }

    updateUserDetail(token: string, updateUserDTO: UpdateUserDTO) {
        debugger;
        let userInfo = this.getUserFromLocalStorage();
        return this.http.put(`${this.apiGetUserDetail}/${userInfo?.userId}`, updateUserDTO, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }),
        });
    }

    removeUserFromLocalStorage(): void {
        try {
            // Remove the user data from local storage using the key
            if (isPlatformBrowser(this.platformId)) {
                localStorage.removeItem('user');
                console.log('User data removed from local storage.');
            }
        } catch (error) {
            console.error('Error removing user data from local storage:', error);
            // Handle the error as needed
        }
    }

    // Phương thức tiện ích để lấy userId từ localStorage
    getUserIdFromLocalStorage(): number | null {
        const userInfo = this.getUserFromLocalStorage();
        return userInfo?.userId || null;
    }

    // Phương thức tiện ích để lấy userName từ localStorage
    getUserNameFromLocalStorage(): string | null {
        const userInfo = this.getUserFromLocalStorage();
        return userInfo?.userName || null;
    }
}
