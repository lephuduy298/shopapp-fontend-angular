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
    filteredOrders: OrderResponse[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 12;
    pages: number[] = [];
    totalPages: number = 0;
    totalItems: number = 0;
    keyword: string = '';
    visiblePages: number[] = [];
    activeFilter: string = 'all';
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
                this.applyFilter(); // Apply current filter after loading data
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

    getAllOrdersWithFilter(keyword: string, page: number, limit: number, status?: string) {
        debugger;
        this.orderService.getAllOrdersWithFilter(keyword, page, limit, status).subscribe({
            next: (response: any) => {
                debugger;
                this.orders = response.result;
                this.totalPages = response.meta.totalPage;
                this.totalItems = response.meta.totalItems || this.orders.length;
                this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
                // For server-side filtering, no need to apply client-side filter
                this.filteredOrders = [...this.orders];
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                debugger;
                console.error('Error fetching filtered orders:', error);
            },
        });
    }
    onPageChange(page: number) {
        debugger;
        this.currentPage = page;

        // Use server-side filtering if any filter is active
        if (this.activeFilter && this.activeFilter !== 'all') {
            this.getAllOrdersWithFilter(this.keyword, this.currentPage, this.itemsPerPage, this.activeFilter);
        } else {
            this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage);
        }
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
        return order.status || 'pending';
    }

    getPaymentStatus(order: OrderResponse): string {
        const status = order.status || 'pending';

        // Nếu order đã completed hoặc delivered
        if (status === 'completed' || status === 'delivered') {
            return 'Success';
        }

        // Nếu order đang processing hoặc shipped
        if (status === 'processing' || status === 'shipped') {
            return 'Success';
        }

        return 'Pending';
    }

    getFulfilmentStatus(order: OrderResponse): string {
        const status = order.status || 'pending';

        // Nếu order đã completed/delivered
        if (status === 'completed' || status === 'delivered') {
            return 'Fulfilled';
        }

        // Nếu order đã shipped
        if (status === 'shipped') {
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

        // Keep current filter when searching
        if (this.activeFilter && this.activeFilter !== 'all') {
            this.getAllOrdersWithFilter(this.keyword, this.currentPage, this.itemsPerPage, this.activeFilter);
        } else {
            this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage);
        }
    }

    // Filter methods
    setActiveFilter(filter: string): void {
        this.activeFilter = filter;
        this.currentPage = 1; // Reset to first page when filtering

        // Use server-side filtering for all filters
        this.getAllOrdersWithFilter(this.keyword, this.currentPage, this.itemsPerPage, filter);
    }

    applyFilter(): void {
        // This method is now only used for 'all' filter when loading initial data
        // For other filters, server-side filtering is used via getAllOrdersWithFilter()
        this.filteredOrders = [...this.orders];
    }

    updatePaginationInfo(): void {
        // This method is now integrated into applyFilter()
        // Keep it for future use if needed
    }
}
