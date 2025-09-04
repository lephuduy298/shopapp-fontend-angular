import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../services/order.service';
import { HttpClient } from '@angular/common/http';
import { PaymentService } from '../../services/payment.service';
import { filter } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
    selector: 'app-payment-callback',
    imports: [HeaderComponent, FooterComponent],
    templateUrl: './payment-callback.component.html',
    styleUrl: './payment-callback.component.scss',
})
export class PaymentCallbackComponent implements OnInit {
    // payment-callback.component.ts
    private orderService: OrderService;

    constructor(
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private router: Router,
        orderService: OrderService,
        private http: HttpClient,
        private paymentService: PaymentService
    ) {
        this.orderService = orderService;
    }

    ngOnInit() {
        // Lấy nguyên query string từ URL (window.location.search)
        const queryString = window.location.search.substring(1); // loại dấu '?' đầu
        debugger;
        if (queryString.includes('vnp_TxnRef')) {
            this.paymentService.paymentCallback(queryString).subscribe({
                next: (res) => {
                    debugger;
                    const params = new URLSearchParams(queryString);
                    const txnRef = params.get('vnp_TxnRef');
                    if (res.data.RspCode === '00') {
                        this.toastr.success('Thanh toán thành công!', 'VNPay');
                    } else {
                        this.toastr.error('Thanh toán thất bại hoặc đã hủy.', 'VNPay');
                    }
                    this.router.navigate(['/orders', txnRef]);
                },
                error: (err) => {
                    debugger;
                    this.toastr.error('Có lỗi khi xác thực với VNPay', 'VNPay');
                },
            });
        }
    }
}
