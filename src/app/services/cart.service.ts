import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { CartResponse, CartItemResponse } from '../responses/cart/cart.response';
import { ApiResponse } from '../responses/common/api-response';
import { AddToCartDto, UpdateCartItemDto } from '../dtos/cart/cart.dto';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root',
})
export class CartService {
    private apiUrl = `${environment.apiBaseUrl}/carts`;
    private cart: Map<number, number> = new Map();
    private currentCartId: number | null = null;

    // Subject để theo dõi cart từ server
    private cartSubject = new BehaviorSubject<CartResponse | null>(null);
    public cart$ = this.cartSubject.asObservable();

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

    // Load cart từ server
    loadCartFromServer(userId: number): void {
        this.http
            .get<ApiResponse<CartResponse>>(`${this.apiUrl}/${userId}`)
            .pipe(map((resp) => resp.data))
            .pipe(
                catchError(() => {
                    // Nếu không có cart, trả về null - backend sẽ tự tạo khi add item đầu tiên
                    return of(null);
                })
            )
            .subscribe((cart) => {
                if (cart) {
                    this.cartSubject.next(cart);
                    this.currentCartId = cart.id;
                    this.updateLocalCartFromServer(cart);
                } else {
                    // Reset cart state khi chưa có cart
                    this.cartSubject.next(null);
                    this.currentCartId = null;
                    this.cart.clear();
                    this._countItem.set(0);
                }
            });
    }

    // Tạo cart mới trên server
    private createCartOnServer(userId: number): Observable<CartResponse> {
        return this.http
            .post<ApiResponse<CartResponse>>(`${this.apiUrl}/${userId}`, {})
            .pipe(map((resp) => resp.data));
    }

    // Cập nhật local cart từ server response
    private updateLocalCartFromServer(cart: CartResponse): void {
        debugger;
        this.cart.clear();
        cart.items.forEach((item) => {
            if (item.product?.id) {
                this.cart.set(item.product.id, item.quantity);
            }
        });

        // Đếm số loại sản phẩm khác nhau (không phải tổng số lượng)
        const numberOfProductTypes = this.cart.size;
        this._countItem.set(numberOfProductTypes);
        console.log('Updated cart count to:', numberOfProductTypes, 'product types');
    }

    // Xóa local cart
    private clearLocalCart(): void {
        this.cart.clear();
        this.currentCartId = null;
        this.cartSubject.next(null);
        this._countItem.set(0);
    }

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object,
        private authService: AuthService,
        private userService: UserService
    ) {
        // Khi user đăng nhập thành công, load cart từ server
        this.authService.currentUser$.subscribe((user) => {
            if (user?.id) {
                this.loadCartFromServer(user.id);
            } else {
                this.clearLocalCart();
            }
        });
    }

    addToCart(productId: number, quantity: number): Observable<void> {
        console.log('addToCart called with:', { productId, quantity });
        debugger;

        // Lấy userId trực tiếp từ localStorage
        const userId = this.userService.getUserIdFromLocalStorage();
        if (!userId) {
            console.error('User not authenticated');
            return of(void 0);
        }

        // Backend sẽ tự động tạo cart nếu chưa có, chỉ cần gọi trực tiếp
        return this.addItemToCart(userId, productId, quantity).pipe(
            tap(() => {
                // Reload cart để cập nhật state sau khi add item thành công
                this.loadCartFromServer(userId);
            })
        );
    }

    // Thêm item vào cart trên server - backend sẽ tự tạo cart nếu chưa có
    private addItemToCart(userId: number, productId: number, quantity: number): Observable<void> {
        console.log('addItemToCart called with:', { userId, productId, quantity });
        debugger;
        return this.http
            .post<ApiResponse<CartItemResponse>>(`${this.apiUrl}/items/${userId}`, null, {
                params: { productId: productId.toString(), quantity: quantity.toString() },
            })
            .pipe(map((resp) => resp.data))
            .pipe(
                tap((cartItem) => {
                    console.log('Cart item response:', cartItem);
                    // Backend trả về cartItem, cập nhật currentCartId từ response
                    if (cartItem.cart?.id) {
                        this.currentCartId = cartItem.cart.id;
                        console.log('Updated cartId from response:', this.currentCartId);
                    }

                    // Cập nhật local cart
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

                    // Nếu sản phẩm là mới, tăng đếm số loại sản phẩm
                    if (currentQuantity === 0) {
                        this.incrementCountItem(1); // Tăng 1 loại sản phẩm
                    }

                    console.log('Local cart updated:', this.cart);
                    console.log('Item count:', this._countItem());
                }),
                map(() => void 0),
                catchError((error) => {
                    console.error('Error adding item to cart:', error);
                    throw error;
                })
            );
    }

    // Reload cart hiện tại
    private reloadCurrentCart(): void {
        const userId = this.userService.getUserIdFromLocalStorage();
        if (userId) {
            // Reload cart sau khi add item để đảm bảo đồng bộ
            this.loadCartFromServer(userId);
        }
    }

    // Không còn cần saveCart với localStorage
    // saveCart(): void {
    //     debugger;
    //     if (isPlatformBrowser(this.platformId)) {
    //         localStorage.setItem('cart', JSON.stringify(Array.from(this.cart.entries())));
    //     }
    // }

    // getCart(): Map<number, number> {
    //     return this.cart;
    // }

    clearCart(): Observable<void> {
        if (!this.currentCartId) {
            this.clearLocalCart();
            return of(void 0);
        }

        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${this.currentCartId}`).pipe(
            map((resp) => resp.data),
            tap(() => {
                this.clearLocalCart();
            })
        );
    }

    updateCart(cartItemId: number, quantity: number): Observable<void> {
        if (quantity <= 0) {
            return this.removeFromCart(cartItemId);
        }

        return this.http
            .put<ApiResponse<CartItemResponse>>(`${this.apiUrl}/items/${cartItemId}`, null, {
                params: { quantity: quantity.toString() },
            })
            .pipe(map((resp) => resp.data))
            .pipe(
                tap((updatedItem) => {
                    console.log('Cart item updated:', updatedItem);
                    // Cập nhật local cart ngay lập tức
                    if (updatedItem.product?.id) {
                        this.cart.set(updatedItem.product.id, updatedItem.quantity);
                    }
                }),
                map(() => void 0),
                catchError((error) => {
                    console.error('Error updating cart item:', error);
                    throw error;
                })
            );
    }

    removeFromCart(cartItemId: number): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/items/${cartItemId}`).pipe(
            map((resp) => resp.data),
            tap(() => {
                console.log('Cart item removed:', cartItemId);
                // Tìm và xóa item khỏi local cart
                // Reload cart để đảm bảo đồng bộ
                const userId = this.userService.getUserIdFromLocalStorage();
                if (userId) {
                    this.loadCartFromServer(userId);
                }
            }),
            catchError((error) => {
                console.error('Error removing cart item:', error);
                throw error;
            })
        );
    }

    // Method để lấy cart items từ server
    getCartItems(cartId: number): Observable<CartItemResponse[]> {
        debugger;
        if (!cartId) {
            return of([]);
        }

        return this.http
            .get<ApiResponse<CartItemResponse[]>>(`${this.apiUrl}/items/${cartId}`)
            .pipe(map((resp) => resp.data));
    }

    // Method để lấy cart theo userId
    getCartByUserId(userId: number): Observable<CartResponse | null> {
        return this.http.get<ApiResponse<CartResponse>>(`${this.apiUrl}/${userId}`).pipe(
            map((resp) => resp.data),
            tap((cart) => {
                if (cart) {
                    this.cartSubject.next(cart);
                    this.currentCartId = cart.id;
                    this.updateLocalCartFromServer(cart);
                }
            }),
            catchError((error) => {
                console.log('Cart not found for user:', userId, error);
                // Trả về null nếu cart không tồn tại
                return of(null);
            })
        );
    }

    // Giữ lại method này để backward compatibility
    restoreCart(): void {
        const userId = this.userService.getUserIdFromLocalStorage();
        if (userId) {
            this.loadCartFromServer(userId);
        }
    }

    // Helper method để lấy current cart
    getCurrentCart(): CartResponse | null {
        return this.cartSubject.value;
    }

    // Helper method để lấy cart id hiện tại
    getCurrentCartId(): number | null {
        return this.currentCartId;
    }
}
