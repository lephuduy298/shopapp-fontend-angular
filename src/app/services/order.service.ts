import { Injectable } from '@angular/core';
import { OrderDTO } from '../dtos/order/order.dto';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { OrderResponse } from '../responses/order/order.reponse';
import { HttpParams } from '@angular/common/http';
import { CartService } from './cart.service';

@Injectable({
    providedIn: 'root',
})
export class OrderService {
    apiConfig: string = `${environment.apiBaseUrl}/orders`;
    apiGetAllOrders: string = `${environment.apiBaseUrl}/orders/get-orders-by-keyword`;

    constructor(private http: HttpClient, private cartService: CartService) {}

    placeOrder(orderData: OrderDTO): Observable<any> {
        debugger;
        this.cartService.clearCart(); // Xóa giỏ hàng sau khi đặt hàng
        return this.http.post(this.apiConfig, orderData);
    }

    getOrderById(orderId: number): Observable<any> {
        debugger;
        const apiGetOrderId: string = `${environment.apiBaseUrl}/orders/${orderId}`;

        return this.http.get(apiGetOrderId);
    }

    getOrdersByUser(userId: number, page: number, limit: number): Observable<OrderResponse[]> {
        const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        debugger;
        const apiGetOrdersByUser = `${this.apiConfig}/user/${userId}`;
        return this.http.get<OrderResponse[]>(apiGetOrdersByUser, { params });
    }

    getAllOrders(keyword: string, page: number, limit: number): Observable<OrderResponse[]> {
        debugger;
        const params = new HttpParams().set('keyword', keyword).set('page', page.toString()).set('limit', limit.toString());
        return this.http.get<any>(this.apiGetAllOrders, { params });
    }

    saveOrder(orderId: number, orderDTO: OrderDTO) {
        debugger;
        const apiUpdateOrder = `${environment.apiBaseUrl}/orders/${orderId}`;
        return this.http.put(apiUpdateOrder, orderDTO);
    }

    deleteOrder(orderId: number) {
        debugger;
        const apiDeleteOrder = `${environment.apiBaseUrl}/orders/${orderId}`;
        return this.http.delete(apiDeleteOrder, { responseType: 'text' });
    }
}
