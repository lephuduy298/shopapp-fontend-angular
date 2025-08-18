import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../responses/common/api-response';

@Injectable({
    providedIn: 'root',
})
export class RoleService {
    constructor(private http: HttpClient) {}

    private apiGetRoles = `${environment.apiBaseUrl}/roles`;

    getRoles(): Observable<any> {
        return this.http.get<ApiResponse<any>>(this.apiGetRoles).pipe(map((resp) => resp.data));
    }
}
