import { Injectable } from '@angular/core';
import { OrderDTO } from '../dtos/order/order.dto';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class OrderService {
    apiConfig: string = `${environment.apiBaseUrl}/orders`;

    constructor(private http: HttpClient) {}

    placeOrder(orderData: OrderDTO): Observable<any> {
        debugger;
        return this.http.post(this.apiConfig, orderData);
    }
}
