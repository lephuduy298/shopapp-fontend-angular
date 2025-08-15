import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, forkJoin } from 'rxjs';
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
import { ToastrService } from 'ngx-toastr';
import { VndCurrencyPipe } from '../../pipes/vnd-currency.pipe';

@Component({
    selector: 'app-order',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule, ReactiveFormsModule, VndCurrencyPipe],
    templateUrl: './order.component.html',
    styleUrl: './order.component.scss',
})
export class OrderComponent implements OnInit {
    userResponse?: UserResponse | null;
    cartItems: { product: Product; quantity: number; selected: boolean; cartItemId?: number }[] = [];
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
    isOrderConfirmed: boolean = false;
    isOrderPlaced: boolean = false;
    isFormSubmitted: boolean = false;

    constructor(
        private cartService: CartService,
        private productService: ProductService,
        private orderService: OrderService,
        private formBuilder: FormBuilder,
        private tokenService: TokenService,
        private router: Router,
        private userService: UserService,
        private toastr: ToastrService
    ) {
        this.orderForm = this.formBuilder.group({
            fullname: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ỹà-ỹ\s.'-]{2,50}$/)]],
            email: ['', [Validators.email]],
            phone_number: [
                '',
                [
                    Validators.required,
                    Validators.pattern(/^0\d{9}$/), // bắt đầu bằng 0 và có đúng 10 chữ số
                ],
            ],
            address: ['', Validators.required],
            note: [''],
            shipping_method: ['express', Validators.required], // Giá trị mặc định
            payment_method: ['cod', Validators.required], // Giá trị mặc định
        });
    }

    ngOnInit(): void {
        debugger;
        this.userService.getUserDetail().subscribe({
            next: (user: UserResponse) => {
                debugger;
                this.userResponse = user;
                this.orderForm.patchValue({
                    fullname: user.fullname || '',
                    phone_number: user.phone_number || '',
                    address: user.address || '',
                });
            },
            error: (error) => {
                console.error('Error fetching user details:', error);
            },
        });

        // Detect if coming from 'Buy Now' (set a flag in router state)
        const isBuyNow = history.state.buyNow === true;
        const buyNowProductId = isBuyNow ? history.state.productId : null;

        debugger;
        // Lấy userId từ localStorage
        const userId = this.userService.getUserIdFromLocalStorage();
        if (!userId) {
            this.router.navigate(['/login']);
            return;
        }
        this.orderData.user_id = userId;

        // Lấy cart từ server và sử dụng luôn cart.items
        this.cartService.getCartByUserId(userId).subscribe({
            next: (cart) => {
                debugger;
                if (cart && cart.items && cart.items.length > 0) {
                    // Sắp xếp cart items theo id giảm dần (mới nhất trước) và map
                    this.cartItems = cart.items
                        .sort((a: any, b: any) => b.id - a.id) // Sắp xếp theo cart item id giảm dần
                        .map((cartItem: any) => {
                            debugger;
                            const product = cartItem.product;
                            if (product && !product.thumbnail.startsWith('http')) {
                                product.thumbnail = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                            }
                            return {
                                product: product,
                                quantity: cartItem.quantity,
                                selected: isBuyNow ? product.id === buyNowProductId : true,
                                cartItemId: cartItem.id, // Lưu cart item ID để có thể update/delete
                            };
                        });
                    this.allSelected = isBuyNow ? false : true;
                } else {
                    this.cartItems = [];
                    this.allSelected = true;
                }
                this.calculatePrice();
            },
            error: (error: any) => {
                console.error('Error fetching cart:', error);
                this.cartItems = [];
                this.allSelected = true;
                this.calculatePrice();
            },
        });
    }

    calculatePrice(): void {
        this.totalPrice = this.cartItems
            .filter((item) => item.selected)
            .reduce((total, item) => total + item.product.price * item.quantity, 0);
    }

    toggleSelectAll(): void {
        // Toggle the allSelected state first
        this.allSelected = !this.allSelected;

        // Then apply this state to all items
        this.cartItems.forEach((item) => (item.selected = this.allSelected));

        // Recalculate price
        this.calculatePrice();
    }

    onSelectItem(): void {
        this.allSelected = this.cartItems.every((item) => item.selected);
        this.calculatePrice();
    }

    removeCartItem(index: number): void {
        const removed = this.cartItems[index];
        if (removed.cartItemId) {
            this.cartService.removeFromCart(removed.cartItemId).subscribe({
                next: () => {
                    this.cartItems.splice(index, 1);
                    this.calculatePrice();

                    // Hiển thị toast thông báo xóa thành công
                    this.toastr.info(`${removed.product.name} đã được xóa khỏi giỏ hàng`, 'Xóa sản phẩm', {
                        timeOut: 2000,
                        progressBar: true,
                        closeButton: true,
                        positionClass: 'toast-top-right',
                    });
                },
                error: (error) => {
                    console.error('Error removing item from cart:', error);
                    this.toastr.error('Có lỗi khi xóa sản phẩm khỏi giỏ hàng', 'Lỗi', {
                        timeOut: 3000,
                        progressBar: true,
                        closeButton: true,
                        positionClass: 'toast-top-right',
                    });
                },
            });
        }
    }

    increaseQty(index: number): void {
        const item = this.cartItems[index];
        const newQuantity = item.quantity + 1;

        if (item.cartItemId) {
            this.cartService.updateCart(item.cartItemId, newQuantity).subscribe({
                next: () => {
                    // Cập nhật UI ngay lập tức
                    this.cartItems[index].quantity = newQuantity;
                    this.calculatePrice();

                    // Hiển thị toast thông báo cập nhật số lượng
                    this.toastr.success(
                        `Đã tăng số lượng ${this.cartItems[index].product.name} lên ${this.cartItems[index].quantity}`,
                        'Cập nhật giỏ hàng',
                        {
                            timeOut: 1500,
                            progressBar: true,
                            closeButton: false,
                            positionClass: 'toast-top-right',
                        }
                    );
                },
                error: (error) => {
                    console.error('Error updating cart item:', error);
                    this.toastr.error('Có lỗi khi cập nhật số lượng sản phẩm', 'Lỗi', {
                        timeOut: 3000,
                        progressBar: true,
                        closeButton: true,
                        positionClass: 'toast-top-right',
                    });
                },
            });
        }
    }

    decreaseQty(index: number): void {
        debugger;
        const item = this.cartItems[index];
        if (item.quantity > 1) {
            const newQuantity = item.quantity - 1;

            if (item.cartItemId) {
                debugger;
                this.cartService.updateCart(item.cartItemId, newQuantity).subscribe({
                    next: () => {
                        // Cập nhật UI ngay lập tức
                        this.cartItems[index].quantity = newQuantity;
                        this.calculatePrice();

                        // Hiển thị toast thông báo cập nhật số lượng
                        this.toastr.success(
                            `Đã giảm số lượng ${this.cartItems[index].product.name} xuống ${this.cartItems[index].quantity}`,
                            'Cập nhật giỏ hàng',
                            {
                                timeOut: 1500,
                                progressBar: true,
                                closeButton: false,
                                positionClass: 'toast-top-right',
                            }
                        );
                    },
                    error: (error) => {
                        console.error('Error updating cart item:', error);
                        this.toastr.error('Có lỗi khi cập nhật số lượng sản phẩm', 'Lỗi', {
                            timeOut: 3000,
                            progressBar: true,
                            closeButton: true,
                            positionClass: 'toast-top-right',
                        });
                    },
                });
            }
        } else {
            // Thông báo cảnh báo khi số lượng không thể giảm thêm
            this.toastr.warning(`${this.cartItems[index].product.name} đã ở số lượng tối thiểu`, 'Không thể giảm thêm', {
                timeOut: 2000,
                progressBar: true,
                closeButton: false,
                positionClass: 'toast-top-right',
            });
        }
    }

    applyCoupon(): void {}

    placeOrder(): void {
        if (!this.isOrderConfirmed) {
            // Đánh dấu form đã được submit
            this.isFormSubmitted = true;

            // Lần đầu: xác nhận đơn, disable form
            if (this.orderForm.valid) {
                this.isOrderConfirmed = true;
                this.orderForm.disable();

                // Hiển thị toast thông báo xác nhận đơn hàng
                this.toastr.info(
                    'Thông tin đặt hàng đã được xác nhận. Nhấn "Đặt hàng" lần nữa để hoàn tất.',
                    'Xác nhận thông tin',
                    {
                        timeOut: 3000,
                        progressBar: true,
                        closeButton: true,
                        positionClass: 'toast-top-right',
                    }
                );
            } else {
                // Đánh dấu tất cả các trường là touched để hiển thị lỗi
                this.orderForm.markAllAsTouched();
                console.log('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');

                // Hiển thị toast cảnh báo về form không hợp lệ
                this.toastr.warning('Vui lòng kiểm tra và điền đầy đủ thông tin bắt buộc.', 'Thông tin chưa đầy đủ', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                    positionClass: 'toast-top-right',
                });
            }
        } else if (!this.isOrderPlaced) {
            // Lần hai: đặt hàng thật sự
            this.orderData = {
                ...this.orderData,
                ...this.orderForm.getRawValue(),
            };
            this.orderData.cart_items = this.cartItems
                .filter((item) => item.selected)
                .map((cartItem) => ({
                    product_id: cartItem.product.id,
                    quantity: cartItem.quantity,
                    status: 'pending',
                }));
            debugger;
            this.calculatePrice();
            this.orderData.total_money = this.totalPrice;
            this.isOrderPlaced = true;
            this.orderService.placeOrder(this.orderData).subscribe({
                next: (response: any) => {
                    // Hiển thị toast thành công
                    this.toastr.success(
                        `Đơn hàng của bạn đã được đặt thành công! Mã đơn hàng: #${response.id || 'N/A'}`,
                        'Đặt hàng thành công',
                        {
                            timeOut: 5000,
                            progressBar: true,
                            closeButton: true,
                            positionClass: 'toast-top-right',
                        }
                    );

                    // Xóa sản phẩm trong giỏ hàng sau khi đặt hàng thành công
                    const selectedItems = this.cartItems.filter((item) => item.selected);
                    const allItemsSelected = selectedItems.length === this.cartItems.length;

                    if (allItemsSelected) {
                        // Nếu chọn hết tất cả sản phẩm, xóa toàn bộ cart
                        this.cartService.clearCart().subscribe({
                            next: () => {
                                console.log('Entire cart cleared successfully');
                            },
                            error: (error) => {
                                console.error('Error clearing entire cart:', error);
                            },
                        });
                    } else {
                        // Nếu chỉ chọn một số sản phẩm, xóa từng item đã chọn
                        const removeOrderedCartItem = selectedItems
                            .filter((item) => item.cartItemId !== undefined) // Lọc bỏ các item không có cartItemId
                            .map((item) => this.cartService.removeFromCart(item.cartItemId!));

                        // Thực hiện xóa tất cả song song
                        if (removeOrderedCartItem.length > 0) {
                            forkJoin(removeOrderedCartItem).subscribe({
                                next: () => {
                                    console.log('All selected items removed successfully');
                                },
                                error: (error: any) => {
                                    console.error('Error removing some items:', error);
                                },
                            });
                        }
                    }

                    // Điều hướng sang trang chi tiết đơn hàng vừa đặt
                    if (response && response.id) {
                        this.router.navigate(['/orders', response.id]);
                    } else {
                        this.router.navigate(['/']);
                    }
                },
                complete: () => {
                    this.calculatePrice();
                },
                error: (error: any) => {
                    console.log(`Lỗi khi đặt hàng: ${error}`);

                    // Hiển thị toast lỗi với thông báo từ backend
                    const errorMessage = error.error?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!';
                    this.toastr.error(errorMessage, 'Đặt hàng thất bại', {
                        timeOut: 5000,
                        progressBar: true,
                        closeButton: true,
                        positionClass: 'toast-top-right',
                        enableHtml: true,
                    });

                    // Cho phép người dùng thử đặt hàng lại
                    this.isOrderPlaced = false;
                },
            });
        }
    }
}
