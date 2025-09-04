import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrderResponse } from '../../responses/order/order.reponse';
import { OrderService } from '../../services/order.service';
import { response } from 'express';
import { OrderDetail } from '../models.ts/order.detail';
import { environment } from '../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
    selector: 'app-order-detail',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule],
    templateUrl: './order.detail.component.html',
    styleUrl: './order.detail.component.scss',
})
export class OrderDetailComponent implements OnInit {
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
        total_money: 0, // Hoặc bất kỳ giá trị số nào bạn muốn
        shipping_method: '',
        shipping_address: '',
        shipping_date: new Date(),
        payment_method: '',
        order_details: [],
    };

    constructor(
        private orderService: OrderService,
        private route: ActivatedRoute,
        private paymentService: PaymentService,
        private toastr: ToastrService,
        private router: Router
    ) {}

    ngOnInit(): void {
        debugger;
        const orderIdParam = this.route.snapshot.paramMap.get('id');
        const orderId = orderIdParam ? Number(orderIdParam) : null;
        if (orderId === null || isNaN(orderId)) {
            console.error('Invalid order id');
            return;
        }
        this.orderService.getOrderById(orderId).subscribe({
            next: (response: any) => {
                debugger;
                this.orderResponse.id = response.id;
                this.orderResponse.user_id = response.user_id;
                this.orderResponse.fullname = response.fullname;
                this.orderResponse.email = response.email;
                this.orderResponse.phone_number = response.phone_number;
                this.orderResponse.address = response.address;
                this.orderResponse.note = response.note;
                this.orderResponse.order_date = new Date(
                    response.order_date[0],
                    response.order_date[1] - 1,
                    response.order_date[2]
                );

                this.orderResponse.order_details = response.order_details.map((order_detail: OrderDetail) => {
                    if (!order_detail.product.thumbnail.startsWith('http'))
                        order_detail.product.thumbnail = `${environment.apiBaseUrl}/products/images/${order_detail.product.thumbnail}`;
                    return order_detail;
                });
                this.orderResponse.payment_method = response.payment_method;
                if (response.order_date) {
                    this.orderResponse.order_date = new Date(
                        response.order_date[0],
                        response.order_date[1] - 1,
                        response.order_date[2]
                    );
                }

                this.orderResponse.shipping_method = response.shipping_method;

                // Note: status is now handled at order_detail level
                this.orderResponse.total_money = response.total_money;
                this.orderResponse.status = response.status;
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                debugger;
                console.error(error);
            },
        });
    }

    payNow(): void {
        this.paymentService.createPaymentUrl(this.orderResponse.id, this.orderResponse.total_money).subscribe({
            next: (payUrl: string) => {
                debugger;
                window.location.href = payUrl;
            },
            error: () => {
                this.toastr.error('Không thể khởi tạo thanh toán VNPay!');
                this.router.navigate(['/orders', this.orderResponse.id]);
            },
        });
    }
}
