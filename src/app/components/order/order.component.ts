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
import { TokenService } from '../../services/token.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserResponse } from '../../responses/user/user.response';

@Component({
    selector: 'app-order',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule, ReactiveFormsModule],
    templateUrl: './order.component.html',
    styleUrl: './order.component.scss',
})
export class OrderComponent implements OnInit {
    userResponse?: UserResponse | null;
    cartItems: { product: Product; quantity: number; selected: boolean }[] = [];
    allSelected: boolean = true;
    couponCode: string = '';
    totalPrice: number = 0;
    orderForm: FormGroup;
    orderData: OrderDTO = {
        user_id: 0, // Thay bằng user_id thích hợp
        fullname: '', // Khởi tạo rỗng, sẽ được điền từ form
        email: '', // Khởi tạo rỗng, sẽ được điền từ form
        phone_number: '', // Khởi tạo rỗng, sẽ được điền từ form
        address: '', // Khởi tạo rỗng, sẽ được điền từ form
        status: 'pending',
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
        private formBuilder: FormBuilder,
        private tokenService: TokenService,
        private router: Router,
        private userService: UserService
    ) {
        this.orderForm = this.formBuilder.group({
            fullname: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone_number: ['', [Validators.required, Validators.minLength(6)]],
            address: ['', [Validators.required, Validators.minLength(5)]],
            note: [''],
            shipping_method: [''],
            payment_method: [''],
        });
    }

    ngOnInit(): void {
        this.userResponse = this.userService.getUserFromLocalStorage();
        if (this.userResponse) {
            this.orderForm.patchValue({
                fullname: this.userResponse.fullname || '',
                phone_number: this.userResponse.phone_number || '',
                address: this.userResponse.address || '',
            });
        }
        this.orderData.user_id = this.tokenService.getUserId();
        const cart = this.cartService.getCart();
        const productIds = Array.from(cart.keys());
        if (productIds.length === 0) return;

        // Detect if coming from 'Buy Now' (set a flag in router state)
        const isBuyNow = history.state.buyNow === true;
        const buyNowProductId = isBuyNow ? history.state.productId : null;

        debugger;
        this.productService.getProductsByIds(productIds).subscribe({
            next: (response: any) => {
                debugger;
                this.cartItems = productIds.map((productId, idx) => {
                    debugger;
                    const product = response.find((p: any) => p.id === productId);
                    if (product) {
                        debugger;
                        if (!product.thumbnail.startsWith('http'))
                            product.thumbnail = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                    }
                    return {
                        product: product!,
                        quantity: cart.get(productId)!,
                        selected: isBuyNow ? productId === buyNowProductId : true,
                    };
                });
                debugger;
                this.allSelected = isBuyNow ? false : true;
            },
            complete: () => {
                this.calculatePrice();
            },
            error: (error: any) => {
                console.error('Error fetching detail:', error);
            },
        });
    }

    calculatePrice(): void {
        this.totalPrice = this.cartItems
            .filter((item) => item.selected)
            .reduce((total, item) => total + item.product.price * item.quantity, 0);
    }

    toggleSelectAll(): void {
        this.cartItems.forEach((item) => (item.selected = this.allSelected));
        this.calculatePrice();
    }

    onSelectItem(): void {
        this.allSelected = this.cartItems.every((item) => item.selected);
        this.calculatePrice();
    }

    removeCartItem(index: number): void {
        const removed = this.cartItems.splice(index, 1)[0];
        this.cartService.removeFromCart(removed.product.id);
        this.calculatePrice();
    }

    increaseQty(index: number): void {
        this.cartItems[index].quantity++;
        this.cartService.updateCart(this.cartItems[index].product.id, this.cartItems[index].quantity);
        this.calculatePrice();
    }

    decreaseQty(index: number): void {
        if (this.cartItems[index].quantity > 1) {
            this.cartItems[index].quantity--;
            this.cartService.updateCart(this.cartItems[index].product.id, this.cartItems[index].quantity);
            this.calculatePrice();
        }
    }

    applyCoupon(): void {}

    placeOrder(): void {
        if (this.orderForm.valid) {
            this.orderData = {
                ...this.orderData,
                ...this.orderForm.value,
            };
            this.orderData.cart_items = this.cartItems
                .filter((item) => item.selected)
                .map((cartItem) => ({
                    product_id: cartItem.product.id,
                    quantity: cartItem.quantity,
                }));
            this.calculatePrice();
            this.orderData.total_money = this.totalPrice;
            this.orderService.placeOrder(this.orderData).subscribe({
                next: (response: any) => {
                    this.cartService.clearCart();
                    this.router.navigate(['/']);
                },
                complete: () => {
                    this.calculatePrice();
                },
                error: (error: any) => {
                    console.log(`Lỗi khi đặt hàng: ${error}`);
                },
            });
        } else {
            console.log('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
        }
    }
}
