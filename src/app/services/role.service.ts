import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RoleService {
    constructor(private http: HttpClient) {}

    private apiGetRoles = `${environment.apiBaseUrl}/roles`;

    getRoles(): Observable<any> {
        return this.http.get<any>(this.apiGetRoles);
    }
}
