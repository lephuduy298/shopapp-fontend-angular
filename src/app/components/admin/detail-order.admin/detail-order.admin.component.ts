import { Component, OnInit } from '@angular/core';
import { OrderResponse } from '../../../responses/order/order.reponse';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { environment } from '../../../environments/environment';
import { OrderDTO } from '../../../dtos/order/order.dto';

@Component({
    selector: 'app-detail-order.admin',
    imports: [CommonModule, FormsModule],
    templateUrl: './detail-order.admin.component.html',
    styleUrl: './detail-order.admin.component.scss',
})
export class DetailOrderAdminComponent implements OnInit {
    orderId: number = 0;
    orderResponse: OrderResponse = {
        id: 0, // Hoặc bất kỳ giá trị số nào bạn muốn
        user_id: 0,
        fullname: '',
        phone_number: '',
        email: '',
        address: '',
        note: '',
        order_date: new Date(),
        total_money: 0,
        shipping_method: '',
        shipping_address: '',
        shipping_date: new Date(),
        payment_method: '',
        order_details: [],
    };

    constructor(private route: ActivatedRoute, private orderService: OrderService, private router: Router) {}

    ngOnInit(): void {
        this.getOrderDetail();
    }

    getOrderDetail() {
        this.orderId = Number(this.route.snapshot.paramMap.get('id'));
        this.orderService.getOrderById(this.orderId).subscribe({
            next: (response: any) => {
                debugger;
                this.orderResponse.id = response.id;
                this.orderResponse.user_id = response.user_id;
                this.orderResponse.fullname = response.fullname;
                this.orderResponse.email = response.email;
                this.orderResponse.phone_number = response.phone_number;
                this.orderResponse.address = response.address;
                this.orderResponse.note = response.note;
                this.orderResponse.total_money = response.total_money;
                if (response.order_date) {
                    this.orderResponse.order_date = new Date(
                        response.order_date[0],
                        response.order_date[1] - 1,
                        response.order_date[2]
                    );
                }
                this.orderResponse.order_details = response.order_details.map((order_detail: any) => {
                    order_detail.product.thumbnail = `${environment.apiBaseUrl}/products/images/${order_detail.product.thumbnail}`;
                    order_detail.number_of_products = order_detail.number_of_products;
                    order_detail.total_money = order_detail.total_money;
                    return order_detail;
                });
                this.orderResponse.payment_method = response.payment_method;
                if (response.shipping_date) {
                    this.orderResponse.shipping_date = new Date(
                        response.shipping_date[0],
                        response.shipping_date[1] - 1,
                        response.shipping_date[2]
                    );
                }
                // this.orderResponse.total_money = response.total_money != null ? response.total_money : ;
                this.orderResponse.shipping_method = response.shipping_method;
                // Note: status is now handled at order_detail level
                debugger;
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                debugger;
                console.error('Error fetching detail:', error);
            },
        });
    }

    saveOrder() {
        debugger;
        const orderDTO = new OrderDTO(this.orderResponse);
        this.orderService.saveOrder(this.orderId, orderDTO).subscribe({
            next: (response: any) => {
                debugger;
                // Handle the successful update
                console.log('Order updated successfully:', response);
                // Navigate back to the previous page
                this.router.navigate(['../'], { relativeTo: this.route });
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                // Handle the error
                debugger;
                // console.error('Error updating order:', error);
            },
        });
    }

    getOverallOrderStatus(): string {
        if (!this.orderResponse.order_details || this.orderResponse.order_details.length === 0) {
            return 'No Items';
        }

        const statuses = this.orderResponse.order_details.map((detail) => detail.status || 'pending');

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

        // Tính toán thống kê
        const statusCounts = statuses.reduce((acc, status) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const totalItems = this.orderResponse.order_details.length;
        const summaryParts: string[] = [];

        if (statusCounts['delivered']) {
            summaryParts.push(`${statusCounts['delivered']} delivered`);
        }
        if (statusCounts['shipped']) {
            summaryParts.push(`${statusCounts['shipped']} shipped`);
        }
        if (statusCounts['processing']) {
            summaryParts.push(`${statusCounts['processing']} processing`);
        }
        if (statusCounts['cancelled']) {
            summaryParts.push(`${statusCounts['cancelled']} cancelled`);
        }
        if (statusCounts['pending']) {
            summaryParts.push(`${statusCounts['pending']} pending`);
        }

        return summaryParts.join(', ') + ` (${totalItems} total)`;
    }

    // Navigation method
    goBack(): void {
        this.router.navigate(['/admin/orders']);
    }

    // Calculate total amount
    getTotalAmount(): number {
        if (!this.orderResponse.order_details || this.orderResponse.order_details.length === 0) {
            return 0;
        }
        return this.orderResponse.order_details.reduce((total, detail) => {
            return total + detail.product.price * detail.number_of_products;
        }, 0);
    }

    // Print order functionality
    printOrder(): void {
        window.print();
    }

    // Send notification
    sendNotification(): void {
        // Implement notification logic here
        console.log('Sending notification for order:', this.orderId);
        // You can integrate with notification service
        alert('Notification sent successfully!');
    }

    // Generate invoice
    generateInvoice(): void {
        // Implement invoice generation logic here
        console.log('Generating invoice for order:', this.orderId);
        // You can integrate with invoice generation service
        alert('Invoice generated successfully!');
    }

    // Cancel order
    cancelOrder(): void {
        if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            // Update all order details status to cancelled
            this.orderResponse.order_details.forEach((detail) => {
                detail.status = 'cancelled';
            });

            // Save the changes
            this.saveOrder();
            console.log('Order cancelled:', this.orderId);
        }
    }
}
