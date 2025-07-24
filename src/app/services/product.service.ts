import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Product } from '../components/models.ts/product';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ProductService {
    private apiGetProducts = `${environment.apiBaseUrl}/products`;

    constructor(private http: HttpClient) {}

    getProducts(keyword: string, selectedCategoryId: number, page: number, limit: number): Observable<Product[]> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString())
            .set('keyword', keyword.toString())
            .set('category_id', selectedCategoryId);

        debugger;

        return this.http.get<Product[]>(this.apiGetProducts, { params });
    }

    getDetailProduct(productId: number) {
        return this.http.get(`${environment.apiBaseUrl}/products/${productId}`);
    }

    getProductsByIds(productIds: number[]): Observable<Product[]> {
        debugger;
        const apiConfig = `${environment.apiBaseUrl}/products/by-ids`;
        const params = new HttpParams().set('ids', productIds.join(','));

        return this.http.get<Product[]>(apiConfig, { params });
    }

    // Admin methods for CRUD operations
    getAllProductsForAdmin(page: number, limit: number, keyword: string): Observable<any> {
        debugger;
        // Convert 0-based page to 1-based for backend
        const backendPage = page + 1;
        const params = new HttpParams()
            .set('page', backendPage.toString())
            .set('limit', limit.toString())
            .set('keyword', keyword);

        return this.http.get<any>(`${this.apiGetProducts}`, { params });
    }

    getProductById(id: number): Observable<Product> {
        return this.http.get<Product>(`${this.apiGetProducts}/${id}`);
    }

    createProduct(product: Omit<Product, 'id'>): Observable<Product> {
        return this.http.post<Product>(this.apiGetProducts, product);
    }

    updateProduct(id: number, product: Partial<Product>): Observable<Product> {
        return this.http.put<Product>(`${this.apiGetProducts}/${id}`, product);
    }

    deleteProduct(id: number): Observable<any> {
        return this.http.delete(`${this.apiGetProducts}/${id}`, { responseType: 'text' });
    }

    uploadProductImage(productId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiGetProducts}/${productId}/upload-image`, formData);
    }
}
