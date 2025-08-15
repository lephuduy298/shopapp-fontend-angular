import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { Order } from '../models.ts/order';
import { OrderResponse } from '../../responses/order/order.reponse';
import { OrderService } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { offset } from '@popperjs/core';
import { VndCurrencyPipe } from '../../pipes/vnd-currency.pipe';

@Component({
    selector: 'app-user-order',
    imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule, RouterModule, VndCurrencyPipe],
    templateUrl: './user-order.component.html',
    styleUrl: './user-order.component.scss',
})
export class UserOrderComponent implements OnInit {
    userOrders: OrderResponse[] = [];
    filteredOrders: OrderResponse[] = [];
    activeFilter: string = 'all';
    startDate: string = '';
    endDate: string = '';
    page: number = 1;
    offset: number = 3;
    limit: number = 3;
    hasMoreData: boolean = true;
    isLoading: boolean = false;
    totalOrderCount: number = 0;

    constructor(private orderService: OrderService, private userService: UserService) {}

    ngOnInit(): void {
        this.getOrdersByUser();
    }

    getOrdersByUser(): void {
        this.isLoading = true;
        const userInfo = this.userService.getUserFromLocalStorage();
        const userId: number = userInfo && typeof userInfo.userId === 'number' ? userInfo.userId : 0; // Ensure userId is always a number
        this.orderService.getOrdersByUser(userId, this.page, this.limit).subscribe({
            next: (response: any) => {
                debugger;
                // Process product images
                response.result.forEach((order: OrderResponse) => {
                    order.order_details.forEach((detail) => {
                        if (detail.product.thumbnail && !detail.product.thumbnail.startsWith('http')) {
                            detail.product.thumbnail = `${environment.apiBaseUrl}/products/images/${detail.product.thumbnail}`;
                        }
                    });
                });

                this.userOrders = response.result;
                this.filteredOrders = response.result;

                // Check if there are more orders to load
                this.totalOrderCount = response.meta.totalItems;
                this.hasMoreData = response.result.length === this.limit && response.result.length !== this.totalOrderCount;

                this.applyFilters();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error fetching user orders:', error);
                this.isLoading = false;
            },
        });
    }

    loadMoreOrders(): void {
        if (!this.isLoading && this.hasMoreData) {
            this.limit = this.limit + this.offset; // Tăng limit thêm 5
            this.getOrdersByUser();
        }
    }

    setActiveFilter(filter: string): void {
        this.activeFilter = filter;
        this.limit = 3; // Reset limit về giá trị ban đầu
        this.hasMoreData = true; // Reset has more data flag
        this.getOrdersByUser(); // Fetch new data with filter
    }

    onDateChange(): void {
        this.limit = 3; // Reset limit về giá trị ban đầu
        this.hasMoreData = true; // Reset has more data flag
        this.getOrdersByUser(); // Fetch new data with date filter
    }

    applyFilters(): void {
        let filtered = [...this.userOrders];

        // Filter by status
        if (this.activeFilter !== 'all') {
            filtered = filtered.filter((order) => {
                const overallStatus = this.getOverallOrderStatus(order);
                switch (this.activeFilter) {
                    case 'completed':
                        return overallStatus === 'delivered' || overallStatus === 'completed';
                    case 'cancelled':
                        return overallStatus === 'cancelled';
                    case 'summary':
                        return overallStatus === 'pending' || overallStatus === 'processing';
                    default:
                        return true;
                }
            });
        }

        // Filter by date range
        if (this.startDate) {
            filtered = filtered.filter((order) => new Date(order.order_date) >= new Date(this.startDate));
        }

        if (this.endDate) {
            filtered = filtered.filter((order) => new Date(order.order_date) <= new Date(this.endDate));
        }

        this.filteredOrders = filtered;
    }

    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'delivered':
            case 'completed':
                return 'status-delivered';
            case 'cancelled':
                return 'status-cancelled';
            case 'pending':
                return 'status-pending';
            case 'processing':
                return 'status-processing';
            default:
                return 'status-default';
        }
    }

    getOverallOrderStatus(order: OrderResponse): string {
        // Lấy trạng thái trực tiếp từ order thay vì tính toán từ order_details
        return order.status || 'pending';
    }

    getOrderStatusSummary(order: OrderResponse): string {
        if (!order.order_details || order.order_details.length === 0) {
            return '';
        }

        const totalItems = order.order_details.length;
        const orderStatus = order.status || 'pending';

        // Hiển thị tổng quan về đơn hàng dựa trên trạng thái chung
        return `${this.getStatusText(orderStatus)} (${totalItems} items)`;
    }

    getStatusText(status: string): string {
        switch (status.toLowerCase()) {
            case 'delivered':
                return 'Delivered';
            case 'cancelled':
                return 'Cancelled';
            case 'pending':
                return 'Pending';
            case 'processing':
                return 'Processing';
            case 'completed':
                return 'Completed';
            default:
                return status;
        }
    }

    getOrderStatusText(order: OrderResponse): string {
        const status = order.status || 'pending';
        switch (status.toLowerCase()) {
            case 'delivered':
            case 'completed':
                return 'Payment Is Successful';
            case 'cancelled':
                return 'cancel order';
            case 'pending':
                return 'Payment Pending';
            case 'processing':
                return 'Payment Processing';
            default:
                return 'Payment Status Unknown';
        }
    }

    showInvoice(orderId: number): void {
        // Navigate to invoice page or show invoice modal
        console.log('Show invoice for order:', orderId);
        // You can implement navigation to invoice page here
    }

    buyNow(orderId: number): void {
        // Handle buy now functionality
        console.log('Buy now for order:', orderId);
        // You can implement re-order functionality here
    }

    onImageError(event: any): void {
        event.target.src = '/assets/images/default-product.png';
    }
}
