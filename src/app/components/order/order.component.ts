import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrderDTO } from '../../dtos/order/order.dto';
import { Product } from '../models.ts/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { environment } from '../../environments/environment';
import { OrderService } from '../../services/order.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-order',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule, ReactiveFormsModule],
    templateUrl: './order.component.html',
    styleUrl: './order.component.scss',
})
export class OrderComponent implements OnInit {
    cartItems: { product: Product; quantity: number }[] = [];
    couponCode: string = '';
    totalPrice: number = 0;
    orderForm: FormGroup;
    orderData: OrderDTO = {
        user_id: 1, // Thay bằng user_id thích hợp
        fullname: '', // Khởi tạo rỗng, sẽ được điền từ form
        email: '', // Khởi tạo rỗng, sẽ được điền từ form
        phone_number: '', // Khởi tạo rỗng, sẽ được điền từ form
        address: '', // Khởi tạo rỗng, sẽ được điền từ form
        note: '', // Có thể thêm trường ghi chú nếu cần
        total_money: 0, // Sẽ được tính toán dựa trên giỏ hàng và mã giảm giá
        payment_method: 'cod', // Mặc định là thanh toán khi nhận hàng (COD)
        shipping_method: 'express', // Mặc định là vận chuyển nhanh (Express)
        coupon_code: '', // Sẽ được điền từ form khi áp dụng mã giảm giá
        cart_items: [],
    };

    constructor(
        private cartService: CartService,
        private productService: ProductService,
        private orderService: OrderService,
        private formBuilder: FormBuilder
    ) {
        this.orderForm = this.formBuilder.group({
            fullname: ['hoàng xx', Validators.required], // fullname là FormControl bắt buộc
            email: ['hoang234@gmail.com', [Validators.required, Validators.email]], // Sử dụng Validators.email cho kiểm tra định dạng email
            phone_number: ['11445547', [Validators.required, Validators.minLength(6)]], // phone_number bắt buộc và ít nhất 6 ký tự
            address: ['nhà x ngõ y', [Validators.required, Validators.minLength(5)]], // address bắt buộc và ít nhất 5 ký tự
            note: ['dễ vữ'],
            shipping_method: ['express'],
            payment_method: ['cod'],
        });
    }

    ngOnInit(): void {
        debugger;
        const cart = this.cartService.getCart();
        const productIds = Array.from(cart.keys());

        this.productService.getProductsByIds(productIds).subscribe({
            next: (response: any) => {
                debugger;
                // Lấy thông tin sản phẩm và số lượng từ danh sách sản phẩm và giỏ hàng
                this.cartItems = productIds.map((productId) => {
                    debugger;
                    const product = response.find((p: any) => p.id === productId);
                    if (product) {
                        if (!product.thumbnail.startsWith('http'))
                            product.thumbnail = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                    }
                    return {
                        product: product!,
                        quantity: cart.get(productId)!,
                    };
                });
            },
            complete: () => {
                debugger;
                this.calculatePrice();
            },
            error: (error: any) => {
                debugger;
                console.error('Error fetching detail:', error);
            },
        });
    }

    calculatePrice(): void {
        this.totalPrice = this.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    }

    applyCoupon(): void {}

    placeOrder(): void {
        debugger;
        if (this.orderForm.valid) {
            this.orderData = {
                ...this.orderData,
                ...this.orderForm.value,
            };

            this.orderData.cart_items = this.cartItems.map((cartItem) => ({
                product_id: cartItem.product.id,
                quantity: cartItem.quantity,
            }));

            this.calculatePrice();
            this.orderData.total_money = this.totalPrice;

            this.orderService.placeOrder(this.orderData).subscribe({
                next: (response: any) => {
                    debugger;
                    console.log('Đặt hàng thành công');
                },
                complete: () => {
                    debugger;
                    this.calculatePrice();
                },
                error: (error: any) => {
                    debugger;
                    console.error('Lỗi khi đặt hàng:', error);
                },
            });
        } else {
            // Hiển thị thông báo lỗi hoặc xử lý khác
            alert('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
        }
    }
}
