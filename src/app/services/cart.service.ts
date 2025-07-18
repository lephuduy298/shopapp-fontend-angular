import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CartService {
    private cart: Map<number, number> = new Map();

    private _countItem = signal<number>(0);

    // Getter
    readonly countItem = this._countItem;

    // Hàm tăng thêm vào count hiện tại
    incrementCountItem(delta: number): void {
        this._countItem.update((current) => current + delta);
    }

    decrementCountItem(delta: number): void {
        this._countItem.update((current) => current - delta);
    }

    clearCountItem(): void {
        this._countItem.set(0);
    }

    constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            const storedCart = localStorage.getItem('cart');
            if (storedCart) {
                this.cart = new Map(JSON.parse(storedCart));

                // ✅ Cập nhật lại _countItem theo số loại sản phẩm (số key trong cart)
                this._countItem.set(this.cart.size);
            }
        }
    }

    addToCart(productId: number, quantity: number) {
        // this.clearCart(); // Xóa giỏ hàng trước khi thêm mới
        debugger;
        if (this.cart.has(productId)) {
            this.cart.set(productId, this.cart.get(productId)! + quantity); //! đảm bảo không undefined
        } else {
            this.cart.set(productId, quantity);
            this.incrementCountItem(quantity); // Cập nhật số lượng sản phẩm trong giỏ hàng
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
        this.clearCountItem();
        this.cart.clear(); // Xóa toàn bộ dữ liệu trong giỏ hàng
        this.saveCart(); // Lưu giỏ hàng mới vào Local Storage (trống)
    }

    updateCart(productId: number, quantity: number): void {
        if (this.cart.has(productId)) {
            this.cart.set(productId, quantity);
            this.saveCart();
        }
    }

    removeFromCart(productId: number): void {
        if (this.cart.has(productId)) {
            this.cart.delete(productId);
            this._countItem.set(this.cart.size);
            this.saveCart();
        }
    }
}
