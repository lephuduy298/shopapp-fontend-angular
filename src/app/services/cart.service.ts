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
        debugger;

        const currentQuantity = this.cart.get(productId) ?? 0;
        const newQuantity = currentQuantity + quantity;

        // Tạo cart mới và đưa sản phẩm này lên đầu
        const newCart = new Map<number, number>();
        newCart.set(productId, newQuantity);

        // Sau đó thêm các phần tử còn lại (trừ productId vừa thêm)
        for (const [key, value] of this.cart) {
            if (key !== productId) {
                newCart.set(key, value);
            }
        }

        this.cart = newCart;

        // Nếu sản phẩm là mới (chưa từng có), thì tăng đếm số lượng item
        if (!this.cart.has(productId) || currentQuantity === 0) {
            this.incrementCountItem(quantity);
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
