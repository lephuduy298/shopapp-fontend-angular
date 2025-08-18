import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Product } from '../components/models.ts/product';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../responses/common/api-response';

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

        return this.http
            .get<ApiResponse<Product[]>>(this.apiGetProducts, { params })
            .pipe(map((resp) => resp.data));
    }

    getProductsWithFilter(
        keyword: string,
        selectedCategoryId: number,
        page: number,
        limit: number,
        selectedBrand?: string,
        priceRanges?: string[]
    ): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString())
            .set('keyword', keyword.toString());

        // Only add category_id if it's not 0 (all categories)
        if (selectedCategoryId > 0) {
            params = params.set('category_id', selectedCategoryId);
        }

        // Add optional filters
        if (selectedBrand && selectedBrand !== '') {
            params = params.set('brand', selectedBrand);
        }

        // Add multiple price ranges as JSON
        if (priceRanges && priceRanges.length > 0) {
            // Convert slugs to min/max objects for backend
            const priceRangeObjects = priceRanges
                .map((slug) => {
                    // Map slugs to actual price ranges
                    const rangeMap: { [key: string]: { min: number; max: number } } = {
                        'duoi-10-trieu': { min: 0, max: 10000000 },
                        'tu-10-15-trieu': { min: 10000000, max: 15000000 },
                        'tu-15-20-trieu': { min: 15000000, max: 20000000 },
                        'tu-20-25-trieu': { min: 20000000, max: 25000000 },
                        'tu-25-30-trieu': { min: 25000000, max: 30000000 },
                        'tren-30-trieu': { min: 30000000, max: 1000000000 },
                    };
                    return rangeMap[slug];
                })
                .filter((range) => range !== undefined);

            if (priceRangeObjects.length > 0) {
                params = params.set('price_ranges', JSON.stringify(priceRangeObjects));
            }
        }

    return this.http.get<ApiResponse<any>>(this.apiGetProducts, { params }).pipe(map((resp) => resp.data));
    }

    getDetailProduct(productId: number) {
        return this.http
            .get<ApiResponse<any>>(`${environment.apiBaseUrl}/products/${productId}`)
            .pipe(map((resp) => resp.data));
    }

    getProductsByIds(productIds: number[]): Observable<Product[]> {
        debugger;
        const apiConfig = `${environment.apiBaseUrl}/products/by-ids`;
        const params = new HttpParams().set('ids', productIds.join(','));

        return this.http
            .get<ApiResponse<Product[]>>(apiConfig, { params })
            .pipe(map((resp) => resp.data));
    }

    // Admin methods for CRUD operations
    getAllProductsForAdmin(page: number, limit: number, keyword: string, categoryId: number = 0): Observable<any> {
        // Convert 0-based page to 1-based for backend
        const backendPage = page + 1;
        console.log(
            `Calling API with: frontend page=${page}, backend page=${backendPage}, limit=${limit}, keyword="${keyword}", categoryId=${categoryId}`
        );

        let params = new HttpParams()
            .set('page', backendPage.toString())
            .set('limit', limit.toString())
            .set('keyword', keyword);

        // Only add category_id if it's not 0 (all categories)
        if (categoryId > 0) {
            params = params.set('category_id', categoryId.toString());
        }

        return this.http
            .get<ApiResponse<any>>(`${this.apiGetProducts}`, { params })
            .pipe(map((resp) => resp.data));
    }

    getProductById(id: number): Observable<Product> {
        return this.http
            .get<ApiResponse<Product>>(`${this.apiGetProducts}/${id}`)
            .pipe(map((resp) => resp.data));
    }

    createProduct(product: Omit<Product, 'id'> | FormData): Observable<Product> {
        return this.http
            .post<ApiResponse<Product>>(this.apiGetProducts, product)
            .pipe(map((resp) => resp.data));
    }

    updateProduct(id: number, product: Partial<Product> | FormData): Observable<Product> {
        return this.http
            .put<ApiResponse<Product>>(`${this.apiGetProducts}/${id}`, product)
            .pipe(map((resp) => resp.data));
    }

    deleteProduct(id: number): Observable<any> {
        return this.http
            .delete<ApiResponse<any>>(`${this.apiGetProducts}/${id}`)
            .pipe(map((resp) => resp.data));
    }

    uploadProductImage(productId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http
            .post<ApiResponse<any>>(`${this.apiGetProducts}/${productId}/upload-image`, formData)
            .pipe(map((resp) => resp.data));
    }

    // Create product with files
    createProductWithFiles(productData: any, mainImageFile?: File, otherImageFiles?: File[]): Observable<Product> {
        const formData = new FormData();

        // Add product data
        Object.keys(productData).forEach((key) => {
            if (productData[key] !== null && productData[key] !== undefined) {
                formData.append(key, productData[key]);
            }
        });

        // Add main image
        if (mainImageFile) {
            formData.append('mainImage', mainImageFile);
        }

        // Add other images
        if (otherImageFiles && otherImageFiles.length > 0) {
            otherImageFiles.forEach((file, index) => {
                formData.append('otherImages', file);
            });
        }

        return this.http
            .post<ApiResponse<Product>>(this.apiGetProducts, formData)
            .pipe(map((resp) => resp.data));
    }

    // Update product with files
    updateProductWithFiles(
        id: number,
        productData: any,
        mainImageFile?: File,
        otherImageFiles?: File[]
    ): Observable<Product> {
        const formData = new FormData();

        // Add product data
        Object.keys(productData).forEach((key) => {
            if (productData[key] !== null && productData[key] !== undefined) {
                formData.append(key, productData[key]);
            }
        });

        // Add main image
        if (mainImageFile) {
            formData.append('mainImage', mainImageFile);
        }

        // Add other images
        if (otherImageFiles && otherImageFiles.length > 0) {
            otherImageFiles.forEach((file, index) => {
                formData.append('otherImages', file);
            });
        }

        return this.http
            .put<ApiResponse<Product>>(`${this.apiGetProducts}/${id}`, formData)
            .pipe(map((resp) => resp.data));
    }

    // Delete product image
    deleteProductImage(imageId: number): Observable<any> {
        return this.http
            .delete<ApiResponse<any>>(`${this.apiGetProducts}/images/${imageId}`)
            .pipe(map((resp) => resp.data));
    }

    // Delete product thumbnail
    deleteProductThumbnail(productId: number): Observable<any> {
        return this.http
            .delete<ApiResponse<any>>(`${this.apiGetProducts}/${productId}/thumbnail`)
            .pipe(map((resp) => resp.data));
    }
}
