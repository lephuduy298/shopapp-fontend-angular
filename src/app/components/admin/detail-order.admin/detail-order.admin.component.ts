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

    // Store original statuses to detect changes
    private originalStatuses: { [key: number]: string } = {};
    private originalOrderStatus: string = 'pending';

    // Current overall order status
    currentOrderStatus: string = 'pending';

    constructor(private route: ActivatedRoute, private orderService: OrderService, private router: Router) {}

    ngOnInit(): void {
        this.getOrderDetail();
    }

    getOrderDetail() {
        this.orderId = Number(this.route.snapshot.paramMap.get('id'));
        this.orderService.getOrderById(this.orderId).subscribe({
            next: (response: any) => {
                console.log('Order details received:', response);
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

                    // Initialize status if not present
                    if (!order_detail.status) {
                        order_detail.status = 'pending';
                    }

                    // Store original status for change detection
                    this.originalStatuses[order_detail.id] = order_detail.status;

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
                this.orderResponse.shipping_method = response.shipping_method;

                // Set current order status and store original
                this.currentOrderStatus = response.status || this.getOverallOrderStatus();
                this.originalOrderStatus = this.currentOrderStatus;

                console.log('Order loaded successfully');
            },
            complete: () => {
                console.log('Order details loading completed');
            },
            error: (error: any) => {
                console.error('Error fetching detail:', error);
            },
        });
    }

    saveOrder() {
        console.log('=== SAVE ORDER DEBUG ===');
        
        // Check if any order detail status has been changed
        const hasOrderDetailChanges = this.orderResponse.order_details.some((detail) => {
            const currentStatus = detail.status || 'pending';
            const originalStatus = this.originalStatuses[detail.id] || 'pending';
            const hasChange = currentStatus !== originalStatus;
            console.log(`Detail ${detail.id}: ${originalStatus} -> ${currentStatus} (changed: ${hasChange})`);
            return hasChange;
        });

        // Check if order status has been changed
        const hasOrderStatusChange = this.currentOrderStatus !== this.originalOrderStatus;
        console.log(`Order status: ${this.originalOrderStatus} -> ${this.currentOrderStatus} (changed: ${hasOrderStatusChange})`);

        if (!hasOrderDetailChanges && !hasOrderStatusChange) {
            alert('No changes detected. Please update order status or at least one order item status before saving.');
            return;
        }

        // Prepare the order update data
        const updateData = {
            user_id: this.orderResponse.user_id,
            fullname: this.orderResponse.fullname,
            email: this.orderResponse.email,
            phone_number: this.orderResponse.phone_number,
            address: this.orderResponse.address,
            note: this.orderResponse.note,
            status: this.currentOrderStatus,
            total_money: this.orderResponse.total_money,
            shipping_method: this.orderResponse.shipping_method,
            payment_method: this.orderResponse.payment_method,
            coupon_code: '',
            order_date: this.orderResponse.order_date,
            cart_items: this.orderResponse.order_details.map((detail) => ({
                product_id: detail.product.id,
                quantity: detail.number_of_products,
                status: detail.status || 'pending' // Include status in cart items
            })),
        };

        console.log('Update data to send:', updateData);

        // Create OrderDTO with the update data
        const orderDTO = new OrderDTO(updateData);
        console.log('OrderDTO created:', orderDTO);

        this.orderService.saveOrder(this.orderId, orderDTO).subscribe({
            next: (response: any) => {
                console.log('Order updated successfully:', response);

                // If there are individual order detail status changes, update them separately
                if (hasOrderDetailChanges) {
                    this.updateOrderDetailStatuses();
                }

                // Show success message
                let successMessage = 'Order updated successfully!';
                if (hasOrderDetailChanges) {
                    const changedItems = this.orderResponse.order_details.filter((detail) => {
                        const currentStatus = detail.status || 'pending';
                        const originalStatus = this.originalStatuses[detail.id] || 'pending';
                        return currentStatus !== originalStatus;
                    }).length;
                    successMessage += ` ${changedItems} item(s) status changed.`;
                }
                if (hasOrderStatusChange) {
                    successMessage += ' Order status updated.';
                }

                alert(successMessage);

                // Update original statuses after successful save
                this.originalOrderStatus = this.currentOrderStatus;
                this.orderResponse.order_details.forEach((detail) => {
                    this.originalStatuses[detail.id] = detail.status || 'pending';
                });

                // Refresh the order data to show latest changes
                this.getOrderDetail();
            },
            complete: () => {
                console.log('Order update completed');
            },
            error: (error: any) => {
                console.error('Error updating order:', error);

                // Show error message
                let errorMessage = 'Failed to update order status. Please try again.';
                if (error?.error?.message) {
                    errorMessage = error.error.message;
                } else if (error?.message) {
                    errorMessage = error.message;
                }

                alert('Error: ' + errorMessage);

                // Optionally refresh the data to revert any local changes
                this.getOrderDetail();
            },
        });
    }

    // Update individual order detail statuses
    private updateOrderDetailStatuses(): void {
        console.log('Updating individual order detail statuses...');
        
        // For now, we'll handle this through the main order update
        // In the future, you might want to add a separate API endpoint for updating order details
        const changedDetails = this.orderResponse.order_details.filter((detail) => {
            const currentStatus = detail.status || 'pending';
            const originalStatus = this.originalStatuses[detail.id] || 'pending';
            return currentStatus !== originalStatus;
        });

        console.log('Changed order details:', changedDetails);
        
        // If your backend supports updating individual order details, 
        // you can call a separate API here
        // For example:
        // changedDetails.forEach(detail => {
        //     this.orderService.updateOrderDetail(detail.id, detail.status).subscribe(...);
        // });
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

    // Check if a specific order detail status has been changed
    isStatusChanged(orderDetailId: number): boolean {
        const detail = this.orderResponse.order_details.find((d) => d.id === orderDetailId);
        if (!detail) return false;

        const currentStatus = detail.status || 'pending';
        const originalStatus = this.originalStatuses[orderDetailId] || 'pending';
        return currentStatus !== originalStatus;
    }

    // Check if there are unsaved changes
    hasUnsavedChanges(): boolean {
        const hasOrderDetailChanges = this.orderResponse.order_details.some((detail) => {
            const currentStatus = detail.status || 'pending';
            const originalStatus = this.originalStatuses[detail.id] || 'pending';
            return currentStatus !== originalStatus;
        });

        const hasOrderStatusChange = this.currentOrderStatus !== this.originalOrderStatus;

        return hasOrderDetailChanges || hasOrderStatusChange;
    }

    // Get available order statuses
    getOrderStatuses(): string[] {
        return ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    }

    // Debug method to test status changes
    testStatusChange(): void {
        console.log('=== CURRENT STATE ===');
        console.log('Current order status:', this.currentOrderStatus);
        console.log('Original order status:', this.originalOrderStatus);
        console.log('Order details statuses:');
        this.orderResponse.order_details.forEach(detail => {
            console.log(`Detail ${detail.id}: current=${detail.status}, original=${this.originalStatuses[detail.id]}`);
        });
        console.log('Has unsaved changes:', this.hasUnsavedChanges());
    }

    // When overall status changes, update all order details
    onOverallStatusChange(): void {
        console.log('Overall status changed to:', this.currentOrderStatus);
        
        // Update all order detail statuses to match the overall status
        this.orderResponse.order_details.forEach((detail) => {
            detail.status = this.currentOrderStatus;
        });
        
        console.log('All order detail statuses updated to:', this.currentOrderStatus);
    }

    // When individual order detail status changes, update overall status
    onOrderDetailStatusChange(): void {
        console.log('Order detail status changed, recalculating overall status...');
        
        // Get all current statuses
        const statuses = this.orderResponse.order_details.map((detail) => detail.status || 'pending');
        console.log('Current detail statuses:', statuses);
        
        // Auto-update overall status based on detail statuses
        const calculatedStatus = this.calculateOverallStatus(statuses);
        console.log('Calculated overall status:', calculatedStatus);
        
        // Only update if it's a simple status (not a complex summary)
        const simpleStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (simpleStatuses.includes(calculatedStatus)) {
            this.currentOrderStatus = calculatedStatus;
            console.log('Overall status updated to:', this.currentOrderStatus);
        }
    }

    // Calculate overall status from order detail statuses
    private calculateOverallStatus(statuses: string[]): string {
        if (statuses.length === 0) {
            return 'pending';
        }

        // If all items have the same status, use that status
        if (statuses.every(status => status === statuses[0])) {
            return statuses[0];
        }

        // Priority logic for mixed statuses
        if (statuses.some(status => status === 'cancelled')) {
            // If any item is cancelled, check if all are cancelled
            if (statuses.every(status => status === 'cancelled')) {
                return 'cancelled';
            }
            // If mixed with cancelled, keep current overall status or set to processing
            return 'processing';
        }

        if (statuses.some(status => status === 'delivered')) {
            // If any delivered, check if all are delivered
            if (statuses.every(status => status === 'delivered')) {
                return 'delivered';
            }
            // If mixed with delivered, set to shipped
            return 'shipped';
        }

        if (statuses.some(status => status === 'shipped')) {
            return 'shipped';
        }

        if (statuses.some(status => status === 'processing')) {
            return 'processing';
        }

        // Default to pending if all are pending or mixed
        return 'pending';
    }

    // Navigation method
    goBack(): void {
        if (this.hasUnsavedChanges()) {
            const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave without saving?');
            if (!confirmLeave) {
                return;
            }
        }
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
            // Update order status to cancelled
            this.currentOrderStatus = 'cancelled';

            // Update all order details status to cancelled
            this.orderResponse.order_details.forEach((detail) => {
                detail.status = 'cancelled';
            });

            // Save the changes
            this.saveOrder();
            console.log('Order cancellation initiated for order:', this.orderId);
        }
    }
}
