import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../responses/common/api-response';
import { ProductCommentDTO } from '../dtos/product/prouduct.comment.dto';
import { ProductCommentResponse } from '../responses/product/product.comment.response';

@Injectable({
    providedIn: 'root',
})
export class ProductCommentService {
    private apiBase = `${environment.apiBaseUrl}/comments`;

    constructor(private http: HttpClient) {}

    getCommentsByProduct(productId: number): Observable<ProductCommentResponse[]> {
        debugger;
        return this.http
            .get<ApiResponse<ProductCommentResponse[]>>(`${this.apiBase}/${productId}`)
            .pipe(map((resp) => resp.data));
    }

    createComment(dto: ProductCommentDTO): Observable<any> {
        debugger;
        return this.http.post<ApiResponse<any>>(`${this.apiBase}`, dto).pipe(map((resp) => resp.data));
    }

    updateComment(id: number, dto: ProductCommentDTO): Observable<string> {
        return this.http.put(`${this.apiBase}/${id}`, dto, { responseType: 'text' });
    }

    deleteComment(id: number): Observable<string> {
        // backend returns plain text (message), so request with responseType 'text'
        return this.http.delete(`${this.apiBase}/${id}`, { responseType: 'text' });
    }
}
