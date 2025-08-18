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
import { CategoryService } from '../../services/category.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { VndCurrencyPipe } from '../../pipes/vnd-currency.pipe';

@Component({
    selector: 'app-detail-product',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule, VndCurrencyPipe],
    templateUrl: './detail-product.component.html',
    styleUrl: './detail-product.component.scss',
})
export class DetailProductComponent implements OnInit {
    product?: Product;
    currentImageIndex: number = 0;
    productId: number = 0;
    quantity: number = 1;
    category: string = '';
    originalPrice: number = 0;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private categoryService: CategoryService,
        private toastr: ToastrService
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
                                debugger;
                                product_image.image_url = `${environment.apiBaseUrl}/products/images/${product_image.image_url}`;
                            }
                        });
                    }
                    response.thumbnail = `${environment.apiBaseUrl}/products/images/${response.thumbnail}`;
                    debugger;
                    this.product = response;
                    // Bắt đầu với ảnh đầu tiên
                    this.originalPrice = this.product && this.product.price !== undefined ? this.product.price * 1.2 : 0; // Giả sử giá gốc là 20% cao hơn giá hiện tại
                    this.showImage(0);
                    this.getCategoryName();
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

    getCategoryName(): void {
        if (this.product && this.product.category_id) {
            this.categoryService.getCategoryById(this.product.category_id).subscribe(
                (category: any) => {
                    this.category = category.name; // Adjust property as needed
                },
                (error: any) => {
                    console.error('Error fetching category:', error);
                }
            );
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
            try {
                this.cartService.addToCart(this.productId, this.quantity).subscribe({
                    next: () => {
                        // Hiển thị toast thành công
                        this.toastr.success(
                            `${this.product?.name} (x${this.quantity}) đã được thêm vào giỏ hàng thành công!`,
                            'Thêm vào giỏ hàng',
                            {
                                timeOut: 3000,
                                progressBar: true,
                                closeButton: true,
                                positionClass: 'toast-top-right',
                            }
                        );
                    },
                    error: (error) => {
                        console.error('Error adding to cart:', error);
                        this.toastr.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!', 'Lỗi', {
                            timeOut: 3000,
                            progressBar: true,
                            closeButton: true,
                            positionClass: 'toast-top-right',
                        });
                    },
                });

                console.log('Thêm sản phẩm thành công');
            } catch (error) {
                // Hiển thị toast lỗi
                this.toastr.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!', 'Lỗi', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                    positionClass: 'toast-top-right',
                });
                console.log('Không thể thêm sản phẩm vào giỏ hàng');
            }
        } else {
            this.toastr.warning('Không tìm thấy thông tin sản phẩm!', 'Cảnh báo', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
                positionClass: 'toast-top-right',
            });
            console.log('Không thể thêm sản phẩm vào giỏ hàng');
        }
    }

    buyNow(productId: number) {
        if (this.product) {
            this.cartService.addToCart(productId, 1).subscribe({
                next: () => {
                    // Hiển thị toast thông báo
                    this.toastr.info(
                        `${this.product?.name} đã được thêm vào giỏ hàng. Chuyển hướng đến trang đặt hàng...`,
                        'Mua ngay',
                        {
                            timeOut: 2000,
                            progressBar: true,
                            closeButton: true,
                            positionClass: 'toast-top-right',
                        }
                    );

                    // Chuyển hướng đến trang order sau 2 giây
                    setTimeout(() => {
                        this.router.navigate(['/orders']);
                    }, 2000);
                },
                error: (error) => {
                    console.error('Error in buyNow:', error);
                    this.toastr.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!', 'Lỗi', {
                        timeOut: 3000,
                        progressBar: true,
                        closeButton: true,
                        positionClass: 'toast-top-right',
                    });
                },
            });
        } else {
            this.toastr.warning('Không tìm thấy thông tin sản phẩm!', 'Cảnh báo', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
                positionClass: 'toast-top-right',
            });
        }
    }
}
