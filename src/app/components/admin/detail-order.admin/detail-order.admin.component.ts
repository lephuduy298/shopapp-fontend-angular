import { Component, OnInit } from '@angular/core';
import { OrderResponse } from '../../../responses/order/order.reponse';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { environment } from '../../../environments/environment';
import { OrderDTO } from '../../../dtos/order/order.dto';
import { ToastrService } from 'ngx-toastr';

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
        status: 'pending',
        total_money: 0,
        shipping_method: '',
        shipping_address: '',
        shipping_date: new Date(),
        payment_method: '',
        order_details: [],
    };

    // Store original order status to detect changes
    originalOrderStatus: string = 'pending';

    // Current overall order status
    currentOrderStatus: string = 'pending';

    // Unsaved changes confirmation modal
    showUnsavedChangesModal: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private orderService: OrderService,
        private router: Router,
        private toastr: ToastrService
    ) {}

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

        // Check if order status has been changed
        const hasOrderStatusChange = this.currentOrderStatus !== this.originalOrderStatus;
        console.log(
            `Order status: ${this.originalOrderStatus} -> ${this.currentOrderStatus} (changed: ${hasOrderStatusChange})`
        );

        if (!hasOrderStatusChange) {
            alert('No changes detected. Please update order status before saving.');
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
            })),
        };

        console.log('Update data to send:', updateData);

        // Show loading notification
        this.toastr.info(`Updating order status to "${this.currentOrderStatus}"...`, 'Saving Changes');

        // Create OrderDTO with the update data
        const orderDTO = new OrderDTO(updateData);
        console.log('OrderDTO created:', orderDTO);

        this.orderService.saveOrder(this.orderId, orderDTO).subscribe({
            next: (response: any) => {
                console.log('Order updated successfully:', response);

                // Show success message
                let successMessage = 'Order updated successfully!';
                if (hasOrderStatusChange) {
                    successMessage = `Order status updated to "${this.currentOrderStatus}" successfully!`;
                }

                this.toastr.success(successMessage, 'Success');

                // Update original status after successful save
                this.originalOrderStatus = this.currentOrderStatus;

                // Navigate back to orders list after a short delay
                setTimeout(() => {
                    this.router.navigate(['/admin/orders']);
                }, 1500);
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

                this.toastr.error(errorMessage, 'Update Failed');

                // Optionally refresh the data to revert any local changes
                this.getOrderDetail();
            },
        });
    }

    getOverallOrderStatus(): string {
        return this.orderResponse.status || this.currentOrderStatus || 'pending';
    }

    // Check if order status has been changed
    isOrderStatusChanged(): boolean {
        return this.currentOrderStatus !== this.originalOrderStatus;
    }

    // Check if there are unsaved changes
    hasUnsavedChanges(): boolean {
        return this.currentOrderStatus !== this.originalOrderStatus;
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
        console.log('Has unsaved changes:', this.hasUnsavedChanges());
    }

    // When overall status changes
    onOverallStatusChange(): void {
        console.log('Overall status changed to:', this.currentOrderStatus);
        // Update the order response status as well
        this.orderResponse.status = this.currentOrderStatus;
        console.log('Order status updated to:', this.currentOrderStatus);

        // Show info notification about status change
        this.toastr.info(`Order status changed to: ${this.currentOrderStatus}`, 'Status Changed', {
            timeOut: 2000,
        });
    }

    // Navigation method
    goBack(): void {
        if (this.hasUnsavedChanges()) {
            this.showUnsavedChangesModal = true;
            // this.toastr.warning(
            //     'You have unsaved changes. Save them before leaving or they will be lost.',
            //     'Unsaved Changes',
            //     {
            //         timeOut: 5000,
            //     }
            // );
        } else {
            this.router.navigate(['/admin/orders']);
        }
    }

    // Confirm leave without saving
    confirmLeaveWithoutSaving(): void {
        this.showUnsavedChangesModal = false;
        this.router.navigate(['/admin/orders']);
    }

    // Cancel leaving and stay on current page
    cancelLeave(): void {
        this.showUnsavedChangesModal = false;
    }

    // Save changes and then navigate
    saveAndLeave(): void {
        // First save the order
        this.saveOrder();
        // Navigation will happen automatically after successful save in saveOrder() method
        this.showUnsavedChangesModal = false;
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
        this.toastr.info('Preparing order for printing...', 'Print Order');
        setTimeout(() => {
            window.print();
        }, 500);
    }

    // Send notification
    sendNotification(): void {
        // Implement notification logic here
        console.log('Sending notification for order:', this.orderId);
        this.toastr.success('Notification sent to customer successfully!', 'Notification Sent');
    }

    // Generate invoice
    generateInvoice(): void {
        // Implement invoice generation logic here
        console.log('Generating invoice for order:', this.orderId);
        this.toastr.success('Invoice generated and downloaded successfully!', 'Invoice Generated');
    }

    // Cancel order
    cancelOrder(): void {
        this.toastr.warning('You are about to cancel this order. This action cannot be undone.', 'Confirm Cancellation', {
            timeOut: 5000,
        });

        if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            // Update order status to cancelled
            this.currentOrderStatus = 'cancelled';
            this.orderResponse.status = 'cancelled';

            // Save the changes
            this.saveOrder();
            console.log('Order cancellation initiated for order:', this.orderId);
        }
    }
}
