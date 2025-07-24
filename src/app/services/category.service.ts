import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

    // Get categories with pagination
    getCategoriesWithPagination(keyword: string, page: number, limit: number): Observable<any> {
        const params = new HttpParams().set('keyword', keyword).set('page', page.toString()).set('limit', limit.toString());
        return this.http.get<any>(`${this.apiConfig}/fetch-by-keyword`, { params });
    }

    // Create category
    createCategory(category: Omit<Category, 'id'>): Observable<Category> {
        return this.http.post<Category>(this.apiConfig, category);
    }

    // Update category
    updateCategory(id: number, category: Partial<Category>): Observable<Category> {
        return this.http.put<Category>(`${this.apiConfig}/${id}`, category);
    }

    // Delete category
    deleteCategory(id: number): Observable<any> {
        return this.http.delete(`${this.apiConfig}/${id}`, { responseType: 'text' });
    }

    getBrandCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.apiConfig}/brands`);
    }
}
