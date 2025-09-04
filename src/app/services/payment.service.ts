import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class PaymentService {
    apiConfig: string = `${environment.apiBaseUrl}/payments`;

    constructor(private http: HttpClient) {}

    createPaymentUrl(orderId: number, amount: number): Observable<any> {
        const body = new HttpParams().set('orderId', orderId.toString()).set('amount', amount.toString());

        return this.http.post(`${this.apiConfig}/create-payment`, body, {
            responseType: 'text',
        });
    }

    paymentCallback(queryString: string): Observable<any> {
        // Gửi nguyên query string, không dùng params
        debugger;
        return this.http.get(`${this.apiConfig}/callback?${queryString}`);
    }
}
