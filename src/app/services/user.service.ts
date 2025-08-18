import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RegisterDTO } from '../dtos/user/register.dto';
import { LoginDTO } from '../dtos/user/login.dto';
import { environment } from '../environments/environment';
import { UserResponse } from '../responses/user/user.response';
import { isPlatformBrowser } from '@angular/common';
import { Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { UpdateUserDTO } from '../dtos/user/update.dto';
import { signal } from '@angular/core';
import { ResultPagination } from '../responses/user/result-pagination.response';
import { ApiResponse } from '../responses/common/api-response';

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
        return this.http
            .post<ApiResponse<any>>(this.apiRegister, registerDTO, this.apiConfig)
            .pipe(map((resp) => resp.data));
    }

    login(loginDTO: LoginDTO): Observable<any> {
        const options = {
            ...this.apiConfig,
            withCredentials: true,
        };
        return this.http.post<ApiResponse<any>>(this.apiLogin, loginDTO, options).pipe(map((resp) => resp.data));
    }

    logout(): Observable<any> {
        const options = {
            ...this.apiConfig,
            withCredentials: true,
        };
        return this.http
            .post<ApiResponse<any>>(this.apiLogout, {}, options)
            .pipe(map((resp) => resp.data));
    }

    refreshAccessToken(): Observable<any> {
        debugger;
        const options = {
            ...this.apiConfig,
            withCredentials: true,
        };
        return this.http.get<ApiResponse<any>>(this.apiRefresh, options).pipe(map((resp) => resp.data));
    }

    getUserDetail(): Observable<UserResponse> {
        return this.http
            .post<ApiResponse<UserResponse>>(this.apiGetUserDetail, {}, this.apiConfig)
            .pipe(map((resp) => resp.data));
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
                userName: userResponse.fullname,
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

    updateUserDetail(updateUserDTO: UpdateUserDTO) {
        debugger;
        let userInfo = this.getUserFromLocalStorage();
        return this.http.put(`${this.apiGetUserDetail}/${userInfo?.userId}`, updateUserDTO, this.apiConfig);
    }

    // Lấy thông tin user theo ID
    getUserById(id: number): Observable<UserResponse> {
        return this.http
            .get<ApiResponse<UserResponse>>(`${environment.apiBaseUrl}/users/${id}`, this.apiConfig)
            .pipe(map((resp) => resp.data));
    }

    // Lấy danh sách tất cả users với filter và pagination
    getAllUsers(
        keyword?: string,
        roleId?: number,
        page?: number,
        limit?: number,
        is_active?: number
    ): Observable<ResultPagination> {
        let params: any = {};

        if (keyword && keyword.trim()) {
            params.keyword = keyword.trim();
        }

        if (roleId) {
            params.role_id = roleId.toString();
        }

        if (page !== undefined && page >= 0) {
            params.page = page.toString();
        }

        if (is_active !== undefined && is_active !== null) {
            params.is_active = is_active.toString(); // '1' | '0'
        }

        if (limit !== undefined && limit > 0) {
            params.limit = limit.toString();
        }

        const queryString =
            Object.keys(params).length > 0
                ? '?' +
                  Object.keys(params)
                      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
                      .join('&')
                : '';

        return this.http
            .get<ApiResponse<ResultPagination>>(
                `${environment.apiBaseUrl}/users${queryString}`,
                this.apiConfig
            )
            .pipe(map((resp) => resp.data));
    }

    // Cập nhật thông tin user theo ID
    updateUser(id: number, updateUserDTO: UpdateUserDTO): Observable<UserResponse> {
        return this.http
            .put<ApiResponse<UserResponse>>(
                `${environment.apiBaseUrl}/users/${id}`,
                updateUserDTO,
                this.apiConfig
            )
            .pipe(map((resp) => resp.data));
    }

    // Xóa user theo ID
    deleteUser(id: number): Observable<void> {
        return this.http
            .delete<ApiResponse<void>>(`${environment.apiBaseUrl}/users/${id}`, this.apiConfig)
            .pipe(map((resp) => resp.data));
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

    // Block user by ID (backend @DeleteMapping("/block/{id}"))
    blockAndActiveUser(id: number): Observable<void> {
        return this.http
            .delete<ApiResponse<void>>(`${environment.apiBaseUrl}/users/block/${id}`, this.apiConfig)
            .pipe(map((resp) => resp.data));
    }

    // Backward compatible alias
    // blockUser(id: number): Observable<void> {
    //     return this.blockAndActiveUser(id);
    // }
}
