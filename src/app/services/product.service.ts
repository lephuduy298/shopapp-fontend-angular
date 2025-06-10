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
}
