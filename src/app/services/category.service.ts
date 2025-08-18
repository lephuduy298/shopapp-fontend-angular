import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Category } from '../components/models.ts/category';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ApiResponse } from '../responses/common/api-response';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private apiConfig = `${environment.apiBaseUrl}/categories`;

    constructor(private http: HttpClient) {}

    getCategoryById(id: number): Observable<Category> {
        return this.http
            .get<ApiResponse<Category>>(`${this.apiConfig}/${id}`)
            .pipe(map((resp) => resp.data));
    }

    getCategories(): Observable<Category[]> {
        return this.http
            .get<ApiResponse<Category[]>>(this.apiConfig)
            .pipe(map((resp) => resp.data));
    }

    // Get categories with pagination
    getCategoriesWithPagination(keyword: string, page: number, limit: number): Observable<any> {
        const params = new HttpParams().set('keyword', keyword).set('page', page.toString()).set('limit', limit.toString());
        return this.http
            .get<ApiResponse<any>>(`${this.apiConfig}/fetch-by-keyword`, { params })
            .pipe(map((resp) => resp.data));
    }

    // Create category
    createCategory(category: Omit<Category, 'id'>): Observable<Category> {
        return this.http
            .post<ApiResponse<Category>>(this.apiConfig, category)
            .pipe(map((resp) => resp.data));
    }

    // Update category
    updateCategory(id: number, category: Partial<Category>): Observable<Category> {
        return this.http
            .put<ApiResponse<Category>>(`${this.apiConfig}/${id}`, category)
            .pipe(map((resp) => resp.data));
    }

    // Delete category
    deleteCategory(id: number): Observable<any> {
        return this.http
            .delete<ApiResponse<any>>(`${this.apiConfig}/${id}`)
            .pipe(map((resp) => resp.data));
    }

    getBrandCategories(): Observable<Category[]> {
        return this.http
            .get<ApiResponse<Category[]>>(`${this.apiConfig}/brands`)
            .pipe(map((resp) => resp.data));
    }
}
