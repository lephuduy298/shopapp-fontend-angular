export interface CartItemDto {
    id?: number;
    cart?: any; // Reference to Cart
    product?: any; // Product object
    quantity: number;
}

export interface CartDto {
    id?: number;
    items: CartItemDto[];
    user?: any; // User object
}

export interface AddToCartDto {
    productId: number;
    quantity: number;
}

export interface UpdateCartItemDto {
    quantity: number;
}
