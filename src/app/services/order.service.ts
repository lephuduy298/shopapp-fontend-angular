import { Injectable } from '@angular/core';
import { OrderDTO } from '../dtos/order/order.dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { OrderResponse } from '../responses/order/order.reponse';
import { HttpParams } from '@angular/common/http';
import { CartService } from './cart.service';
import { ApiResponse } from '../responses/common/api-response';

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
        return this.http.post<ApiResponse<any>>(this.apiConfig, orderData).pipe(map((resp) => resp.data));
    }

    getOrderById(orderId: number): Observable<any> {
        debugger;
        const apiGetOrderId: string = `${environment.apiBaseUrl}/orders/${orderId}`;
        return this.http.get<ApiResponse<any>>(apiGetOrderId).pipe(map((resp) => resp.data));
    }

    getOrdersByUser(userId: number, page: number, limit: number): Observable<OrderResponse[]> {
        const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        debugger;
        const apiGetOrdersByUser = `${this.apiConfig}/user/${userId}`;
        return this.http.get<ApiResponse<OrderResponse[]>>(apiGetOrdersByUser, { params }).pipe(map((resp) => resp.data));
    }

    getAllOrders(keyword: string, page: number, limit: number): Observable<OrderResponse[]> {
        debugger;
        const params = new HttpParams().set('keyword', keyword).set('page', page.toString()).set('limit', limit.toString());
        return this.http.get<ApiResponse<OrderResponse[]>>(this.apiGetAllOrders, { params }).pipe(map((resp) => resp.data));
    }

    getAllOrdersWithFilter(keyword: string, page: number, limit: number, status?: string): Observable<any> {
        debugger;
        let params = new HttpParams().set('keyword', keyword).set('page', page.toString()).set('limit', limit.toString());

        if (status && status !== 'all') {
            params = params.set('status', status);
        }

        return this.http.get<ApiResponse<any>>(this.apiGetAllOrders, { params }).pipe(map((resp) => resp.data));
    }

    saveOrder(orderId: number, orderDTO: OrderDTO) {
        debugger;
        const apiUpdateOrder = `${environment.apiBaseUrl}/orders/${orderId}`;
        return this.http.put<ApiResponse<any>>(apiUpdateOrder, orderDTO).pipe(map((resp) => resp.data));
    }

    deleteOrder(orderId: number) {
        debugger;
        const apiDeleteOrder = `${environment.apiBaseUrl}/orders/${orderId}`;
        return this.http.delete<ApiResponse<any>>(apiDeleteOrder).pipe(map((resp) => resp.data));
    }
}
