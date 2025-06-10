import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { environment } from '../../environments/environment';
import { Product } from '../models.ts/product';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-order-confirm',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule],
    templateUrl: './order-confirm.component.html',
    styleUrl: './order-confirm.component.scss',
})
export class OrderConfirmComponent implements OnInit {
    cartItems: { product: Product; quantity: number }[] = [];
    couponCode: string = '';
    totalPrice: number = 0;

    constructor(private cartService: CartService, private productService: ProductService) {}

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
}
