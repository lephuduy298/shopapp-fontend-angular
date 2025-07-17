import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../models.ts/product';
import { environment } from '../../environments/environment';
import { ProductImage } from '../models.ts/product.image';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
    selector: 'app-detail-product',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule],
    templateUrl: './detail-product.component.html',
    styleUrl: './detail-product.component.scss',
})
export class DetailProductComponent implements OnInit {
    product?: Product;
    currentImageIndex: number = 0;
    productId: number = 0;
    quantity: number = 1;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        const idParam = this.activatedRoute.snapshot.paramMap.get('id');
        if (idParam !== null) {
            this.productId = +idParam;
        }
        if (!isNaN(this.productId)) {
            this.productService.getDetailProduct(this.productId).subscribe({
                next: (response: any) => {
                    // Lấy danh sách ảnh sản phẩm và thay đổi URL
                    debugger;
                    console.log(response.product_images[0].image_url);
                    if (response.product_images && response.product_images.length > 0) {
                        response.product_images.forEach((product_image: ProductImage) => {
                            if (!product_image.image_url.startsWith('http')) {
                                product_image.image_url = `${environment.apiBaseUrl}/products/images/${product_image.image_url}`;
                            }
                        });
                    }
                    debugger;
                    this.product = response;
                    // Bắt đầu với ảnh đầu tiên
                    this.showImage(0);
                },
                complete: () => {
                    debugger;
                },
                error: (error: any) => {
                    debugger;
                    console.error('Error fetching detail:', error);
                },
            });
        } else {
            console.error('Invalid productId:', idParam);
        }
    }

    showImage(index: number) {
        debugger;
        if (this.product && this.product.product_images && this.product.product_images.length > 0) {
            // Đảm bảo index nằm trong khoảng hợp lệ
            if (index < 0) {
                index = 0;
            } else if (index >= this.product.product_images.length) {
                index = this.product.product_images.length - 1;
            }
            // Gán index hiện tại và cập nhật ảnh hiển thị
            this.currentImageIndex = index;
        }
    }

    previousImage() {
        this.showImage(this.currentImageIndex - 1);
    }

    nextImage() {
        this.showImage(this.currentImageIndex + 1);
    }

    thumbnailClick(index: number) {
        this.currentImageIndex = index;
    }

    decreaseQuantity(): void {
        if (this.quantity > 1) this.quantity--;
    }

    increaseQuantity(): void {
        this.quantity++;
    }

    addToCart() {
        debugger;
        if (this.product) {
            this.cartService.addToCart(this.productId, this.quantity);
            console.log('Thêm sản phẩm thành công');
        } else console.log('không thể thêm sản phẩm vào giỏ hàng');
    }

    buyNow(): void {
        this.router.navigate(['/orders']);
    }
}
