# Hướng dẫn Migration Cart Service từ localStorage sang Server

## Tổng quan thay đổi

Cart service đã được cập nhật để lưu trữ giỏ hàng trên server thay vì localStorage. Điều này giúp đồng bộ giỏ hàng giữa các thiết bị và cải thiện trải nghiệm người dùng.

## Các thay đổi chính

### 1. Cart Service Changes

#### Trước (localStorage):
```typescript
addToCart(productId: number, quantity: number) {
    // Lưu vào localStorage
    this.saveCart();
}
```

#### Sau (server):
```typescript
addToCart(productId: number, quantity: number): Observable<void> {
    // Gọi API server
    return this.addItemToCartOnServer(this.currentCartId, productId, quantity);
}
```

### 2. Component Usage Changes

#### Trước:
```typescript
// Synchronous call
this.cartService.addToCart(productId, 1);
```

#### Sau:
```typescript
// Asynchronous call với Observable
this.cartService.addToCart(productId, 1).subscribe({
    next: () => {
        // Xử lý thành công
        this.toastr.success('Đã thêm vào giỏ hàng!');
    },
    error: (error) => {
        // Xử lý lỗi
        this.toastr.error('Có lỗi xảy ra!');
    }
});
```

## API Endpoints được sử dụng

### Cart Controller APIs:

1. **GET /api/v1/carts/{userId}** - Lấy cart theo userId
2. **POST /api/v1/carts/{userId}** - Tạo cart mới
3. **DELETE /api/v1/carts/{cartId}** - Xóa cart
4. **POST /api/v1/carts/items/{cartId}** - Thêm item vào cart
5. **PUT /api/v1/carts/items/{cartItemId}** - Cập nhật quantity của cart item
6. **DELETE /api/v1/carts/items/{cartItemId}** - Xóa cart item
7. **GET /api/v1/carts/{cartId}/items** - Lấy danh sách items trong cart

## Cart Service Methods

### Các method chính:

```typescript
// Thêm sản phẩm vào giỏ hàng
addToCart(productId: number, quantity: number): Observable<void>

// Xóa toàn bộ giỏ hàng
clearCart(): Observable<void>

// Cập nhật số lượng của cart item
updateCart(cartItemId: number, quantity: number): Observable<void>

// Xóa một cart item
removeFromCart(cartItemId: number): Observable<void>

// Lấy danh sách cart items
getCartItems(): Observable<CartItemResponse[]>

// Lấy cart hiện tại (Observable)
cart$: Observable<CartResponse | null>

// Load cart từ server
loadCartFromServer(userId: number): void

// Khôi phục cart (tương thích ngược)
restoreCart(): void
```

## Data Models

### CartResponse:
```typescript
interface CartResponse {
    id: number;
    items: CartItemResponse[];
    userId: number;
}
```

### CartItemResponse:
```typescript
interface CartItemResponse {
    id: number;
    cart?: any;
    product?: any; // Product object với full details
    quantity: number;
}
```

## Các Components đã được cập nhật:

1. **DetailProductComponent** - Cập nhật addToCart() và buyNow()
2. **HomeComponent** - Cập nhật addToCart() và buyNow()
3. Các components khác cần cập nhật tương tự

## Backend Logic Integration

### Cart Creation Flow:

1. **User chưa có cart**: 
   - Frontend gọi `addToCart()` với `userId` (thay vì `cartId`)
   - Backend trong method `addItemToCart(cartId, productId, quantity)`:
     - `cartId` thực tế là `userId`
     - Kiểm tra `Cart cart = cartRepository.findById(cartId)` sẽ không tìm thấy
     - Gọi `createCart(cartId)` để tạo cart mới với `userId = cartId`
   - CartItem được tạo và gắn vào cart mới
   - Frontend nhận response và cập nhật `currentCartId`

2. **User đã có cart**:
   - Frontend load cart khi user đăng nhập
   - Sử dụng `cartId` thực tế cho các operations

### Backend Method Logic:
```java
@Override
@Transactional
public CartItem addItemToCart(Long cartId, Long productId, int quantity) {
    // cartId có thể là userId (nếu chưa có cart) hoặc cartId thực (nếu đã có cart)
    Cart cart = cartRepository.findById(cartId).orElse(null);
    if (cart == null) {
        // Tạo cart mới với userId = cartId
        cart = createCart(cartId);
    }
    
    Product product = productRepository.findById(productId).orElseThrow();
    
    // Kiểm tra existing cart item
    CartItem existingCartItem = cartItemRepository.findByCartAndProduct(cart, product);
    if (existingCartItem != null) {
        existingCartItem.setQuantity(existingCartItem.getQuantity() + quantity);
        return cartItemRepository.save(existingCartItem);
    }
    
    // Tạo cart item mới
    CartItem cartItem = CartItem.builder()
            .cart(cart)
            .product(product)
            .quantity(quantity)
            .build();
    return cartItemRepository.save(cartItem);
}
```

## Frontend Flow:

### Add to Cart Process:
1. Kiểm tra user authentication
2. Nếu chưa có `currentCartId`:
   - Thử load cart từ server với `userId`
   - Nếu không có cart, gọi API với `userId` (backend sẽ tạo cart)
3. Nếu đã có `currentCartId`, sử dụng `cartId` thực tế
4. Cập nhật local state và reload cart từ server

## Error Handling

Tất cả các method trả về Observable và có error handling:
- Network errors
- Authentication errors
- Server errors

## Testing Notes

Để test cart service:
1. Đảm bảo user đã đăng nhập
2. Kiểm tra API endpoints hoạt động
3. Test với nhiều scenarios (add, update, remove, clear)

## Backward Compatibility

- Method `getCart()` vẫn trả về Map<number, number> cho tương thích
- Method `restoreCart()` bây giờ load từ server
- Signal `countItem` vẫn hoạt động như trước
