import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root',
})
export class CartService {
    private cart: Map<number, number> = new Map();

    constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            const storedCart = localStorage.getItem('cart');
            if (storedCart) {
                this.cart = new Map(JSON.parse(storedCart));
            }
        }
    }

    addToCart(productId: number, quantity: number) {
        debugger;
        if (this.cart.has(productId)) {
            this.cart.set(productId, this.cart.get(productId)! + quantity); //! đảm bảo không undefined
        } else {
            this.cart.set(productId, quantity);
        }

        this.saveCart();
    }

    saveCart(): void {
        debugger;
        localStorage.setItem('cart', JSON.stringify(Array.from(this.cart.entries())));
    }

    getCart(): Map<number, number> {
        return this.cart;
    }

    clearCart(): void {
        this.cart.clear(); // Xóa toàn bộ dữ liệu trong giỏ hàng
        this.saveCart(); // Lưu giỏ hàng mới vào Local Storage (trống)
    }
}
