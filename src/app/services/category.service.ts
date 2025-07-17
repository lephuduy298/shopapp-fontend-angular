import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../components/models.ts/category';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private apiConfig = `${environment.apiBaseUrl}/categories`;

    constructor(private http: HttpClient) {}

    getCategoryById(id: number): Observable<Category> {
        return this.http.get<Category>(`${this.apiConfig}/${id}`);
    }

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.apiConfig);
    }

    getBrandCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.apiConfig}/brands`);
    }
}
