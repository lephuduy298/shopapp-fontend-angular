export interface CartItemResponse {
    id: number;
    cart?: any; // Reference to Cart
    product?: any; // Product object with full details
    quantity: number;
}

export interface CartResponse {
    id: number;
    items: CartItemResponse[];
    userId: number; // This comes from ResCart model
}
