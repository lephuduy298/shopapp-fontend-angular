import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, catchError, map } from 'rxjs';
import { environment } from '../environments/environment';
import { OrderService } from './order.service';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';

export interface DashboardStats {
    totalOrders: number;
    totalProducts: number;
    totalCategories: number;
    totalUsers: number;
}

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private apiDashboard = `${environment.apiBaseUrl}/dash-board`;

    constructor(
        private http: HttpClient,
        private orderService: OrderService,
        private productService: ProductService,
        private categoryService: CategoryService
    ) {}

    getDashboardStats(): Observable<DashboardStats> {
        // Phương pháp 1: Thử lấy từ API dashboard chuyên dụng trước
        return this.http.get<DashboardStats>(`${this.apiDashboard}/stats`).pipe(
            catchError((error) => {
                console.log('Dashboard API không khả dụng, fallback to individual APIs:', error);
                return this.getDashboardStatsFromIndividualAPIs();
            })
        );
    }

    /**
     * Phương pháp 2: Lấy từ các API riêng lẻ nếu dashboard API không có
     */
    private getDashboardStatsFromIndividualAPIs(): Observable<DashboardStats> {
        return forkJoin({
            orders: this.getTotalOrders(),
            products: this.getTotalProducts(),
            categories: this.getTotalCategories(),
            users: this.getTotalUsers(),
        }).pipe(
            map((results) => ({
                totalOrders: results.orders,
                totalProducts: results.products,
                totalCategories: results.categories,
                totalUsers: results.users,
            })),
            catchError((error) => {
                console.error('Lỗi khi lấy dữ liệu từ individual APIs, sử dụng mock data:', error);
                return of(this.getMockData());
            })
        );
    }

    /**
     * Lấy tổng số đơn hàng từ OrderService
     */
    private getTotalOrders(): Observable<number> {
        return this.orderService.getAllOrders('', 0, 1).pipe(
            map((response: any) => {
                // Backend có thể trả về totalElements, total, hoặc count
                return response.totalElements || response.total || response.count || 0;
            }),
            catchError(() => {
                console.log('Không thể lấy tổng đơn hàng');
                return of(0);
            })
        );
    }

    /**
     * Lấy tổng số sản phẩm từ ProductService
     */
    private getTotalProducts(): Observable<number> {
        return this.productService.getProducts('', 0, 0, 1).pipe(
            map((response: any) => {
                return response.totalElements || response.total || response.count || 0;
            }),
            catchError(() => {
                console.log('Không thể lấy tổng sản phẩm');
                return of(0);
            })
        );
    }

    /**
     * Lấy tổng số categories từ CategoryService
     */
    private getTotalCategories(): Observable<number> {
        return this.categoryService.getCategories().pipe(
            map((categories: any[]) => (categories ? categories.length : 0)),
            catchError(() => {
                console.log('Không thể lấy tổng danh mục');
                return of(0);
            })
        );
    }

    /**
     * Lấy tổng số users - cần backend tạo endpoint mới
     */
    private getTotalUsers(): Observable<number> {
        return this.http.get<{ total: number }>(`${environment.apiBaseUrl}/users/count`).pipe(
            map((response) => response.total || 0),
            catchError(() => {
                console.log('API /users/count chưa có, backend cần tạo endpoint này');
                return of(0);
            })
        );
    }

    /**
     * Mock data cuối cùng nếu tất cả fail
     */
    private getMockData(): DashboardStats {
        return {
            totalOrders: 156,
            totalProducts: 89,
            totalCategories: 12,
            totalUsers: 45,
        };
    }
}
