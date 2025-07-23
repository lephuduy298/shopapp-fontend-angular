import { Component, OnInit } from '@angular/core';
import { OrderResponse } from '../../../responses/order/order.reponse';
import { OrderService } from '../../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-order-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './order.admin.component.html',
    styleUrl: './order.admin.component.scss',
})
export class OrderAdminComponent implements OnInit {
    orders: OrderResponse[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 12;
    pages: number[] = [];
    totalPages: number = 0;
    totalItems: number = 0;
    keyword: string = '';
    visiblePages: number[] = [];
    Math = Math;

    constructor(private orderService: OrderService, private router: Router) {}
    ngOnInit(): void {
        debugger;
        this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage);
    }
    getAllOrders(keyword: string, page: number, limit: number) {
        debugger;
        this.orderService.getAllOrders(keyword, page, limit).subscribe({
            next: (response: any) => {
                debugger;
                this.orders = response.result;
                this.totalPages = response.meta.totalPage;
                this.totalItems = response.meta.totalItems || this.orders.length;
                this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                debugger;
                // console.error('Error fetching products:', error);
            },
        });
    }
    onPageChange(page: number) {
        debugger;
        this.currentPage = page;
        this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage);
    }

    generateVisiblePageArray(currentPage: number, totalPages: number): number[] {
        const maxVisiblePages = 5;
        const halfVisiblePages = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(currentPage - halfVisiblePages, 1);
        let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }

        return new Array(endPage - startPage + 1).fill(0).map((_, index) => startPage + index);
    }
    deleteOrder(orderId: number) {
        const confirmDelete = window.confirm('Are you sure to delete this order?');

        if (confirmDelete) {
            this.orderService.deleteOrder(orderId).subscribe({
                next: (response: any) => {
                    debugger;
                    location.reload();
                },
                complete: () => {
                    debugger;
                },
                error: (error: any) => {
                    debugger;
                    console.error('Error fetching products:', error);
                },
            });
        }
    }

    viewDetails(order: OrderResponse) {
        debugger;
        this.router.navigate(['admin/orders', order.id]);
    }

    getOrderStatus(order: OrderResponse): string {
        if (!order.order_details || order.order_details.length === 0) {
            return 'No Items';
        }

        const statuses = order.order_details.map((detail) => detail.status || 'pending');

        // Nếu tất cả items đều cancelled
        if (statuses.every((status) => status === 'cancelled')) {
            return 'All Cancelled';
        }

        // Nếu tất cả items đều delivered
        if (statuses.every((status) => status === 'delivered' || status === 'completed')) {
            return 'All Delivered';
        }

        // Nếu có ít nhất một item đang processing
        if (statuses.some((status) => status === 'processing')) {
            return 'Processing';
        }

        // Nếu có ít nhất một item đang shipped
        if (statuses.some((status) => status === 'shipped')) {
            return 'Shipped';
        }

        // Mặc định là pending
        return 'Pending';
    }

    getPaymentStatus(order: OrderResponse): string {
        // Lấy status từ order_details đầu tiên hoặc tổng hợp
        if (!order.order_details || order.order_details.length === 0) {
            return 'Pending';
        }

        const statuses = order.order_details.map((detail) => detail.status || 'pending');

        // Nếu có bất kỳ item nào đã payment success
        if (statuses.some((status) => status === 'completed' || status === 'delivered')) {
            return 'Success';
        }

        // Nếu có item đang processing
        if (statuses.some((status) => status === 'processing' || status === 'shipped')) {
            return 'Success';
        }

        return 'Pending';
    }

    getFulfilmentStatus(order: OrderResponse): string {
        if (!order.order_details || order.order_details.length === 0) {
            return 'Unfulfilled';
        }

        const statuses = order.order_details.map((detail) => detail.status || 'pending');

        // Nếu tất cả items đều completed/delivered
        if (statuses.every((status) => status === 'completed' || status === 'delivered')) {
            return 'Fulfilled';
        }

        // Nếu có ít nhất một item đã shipped hoặc delivered
        if (statuses.some((status) => status === 'shipped' || status === 'delivered')) {
            return 'Fulfilled';
        }

        return 'Unfulfilled';
    }

    getItemsCount(order: OrderResponse): number {
        return order.order_details ? order.order_details.length : 0;
    }

    handleSearch(event: Event): void {
        event.preventDefault();
        this.currentPage = 1; // Reset to first page when searching
        this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage);
    }
}
