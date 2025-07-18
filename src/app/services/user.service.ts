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
        return this.http.post(this.apiLogin, loginDTO, this.apiConfig);
    }

    getUserDetail(token: string) {
        debugger;
        return this.http.post(this.apiGetUserDetail, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }),
        });
    }

    saveUserToLocalStorage(userResponse?: UserResponse) {
        try {
            debugger;
            if (userResponse == null || !userResponse) {
                return;
            }
            //convert object to Json string
            const userResponseJSON = JSON.stringify(userResponse);

            localStorage.setItem('user', userResponseJSON);

            console.log('User response saved to local storage.');
        } catch (error) {
            console.log('Error response saved to local storage.');
        }
    }

    saveUserToMemory(userResponse?: UserResponse) {
        if (userResponse == null || !userResponse) {
            return;
        }
        this.memoryUser = userResponse;
    }

    getUserFromLocalStorage(): UserResponse | null {
        try {
            debugger;

            if (isPlatformBrowser(this.platformId)) {
                const userResponseJSON = localStorage.getItem('user');

                if (userResponseJSON == null || !userResponseJSON) {
                    return null;
                }

                //convert Json string to object
                const userResponse = JSON.parse(userResponseJSON);

                console.log('User response retrieved from local storage.');
                return userResponse;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error retrieving user response from local storage:', error);
            return null;
        }
    }

    updateUserDetail(token: string, updateUserDTO: UpdateUserDTO) {
        debugger;
        let userResponse = this.getUserFromLocalStorage();
        return this.http.put(`${this.apiGetUserDetail}/${userResponse?.id}`, updateUserDTO, {
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
}
