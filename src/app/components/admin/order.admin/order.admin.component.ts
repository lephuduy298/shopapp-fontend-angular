import { Component, OnInit } from '@angular/core';
import { OrderResponse } from '../../../responses/order/order.reponse';
import { OrderService } from '../../../services/order.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-order-admin',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './order.admin.component.html',
    styleUrl: './order.admin.component.scss',
})
export class OrderAdminComponent implements OnInit {
    orders: OrderResponse[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 12;
    pages: number[] = [];
    totalPages: number = 0;
    keyword: string = '';
    visiblePages: number[] = [];

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
}
