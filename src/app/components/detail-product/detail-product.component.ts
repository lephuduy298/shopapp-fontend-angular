import { Component, OnInit, HostListener } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../models.ts/product';
import { environment } from '../../environments/environment';
import { ProductImage } from '../models.ts/product.image';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductCommentService } from '../../services/product.comment.service';
import { ProductCommentDTO } from '../../dtos/product/prouduct.comment.dto';
import { ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { VndCurrencyPipe } from '../../pipes/vnd-currency.pipe';
import { ProductCommentResponse } from '../../responses/product/product.comment.response';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-detail-product',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule, VndCurrencyPipe],
    templateUrl: './detail-product.component.html',
    styleUrl: './detail-product.component.scss',
})
export class DetailProductComponent implements OnInit {
    product?: Product;
    comments: ProductCommentResponse[] = [];
    newCommentContent: string = '';
    newCommentContentEdit: string = '';
    currentImageIndex: number = 0;
    productId: number = 0;
    quantity: number = 1;
    category: string = '';
    originalPrice: number = 0;
    currentUser: any = null;
    isAdmin: boolean = false;
    editingCommentId: number | null = null;
    openMenuId: number | null = null;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private categoryService: CategoryService,
        private toastr: ToastrService,
        private productCommentService: ProductCommentService,
        private userService: UserService
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
                    response.thumbnail = `${environment.apiBaseUrl}/products/images/${response.thumbnail}`;
                    debugger;
                    this.product = response;
                    // Load comments for this product
                    this.loadComments();
                    // Load current user detail to check admin/owner permissions
                    this.userService.getUserDetail().subscribe({
                        next: (user) => {
                            this.currentUser = user;
                            this.isAdmin = !!(
                                user &&
                                user.role &&
                                user.role.name &&
                                user.role.name.toLowerCase() === 'admin'
                            );
                        },
                        error: () => {
                            this.currentUser = null;
                            this.isAdmin = false;
                        },
                    });
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

    loadComments() {
        debugger;
        if (!this.productId) return;
        this.productCommentService.getCommentsByProduct(this.productId).subscribe({
            next: (resp) => {
                this.comments = resp || [];
                debugger;
            },
            error: (err) => {
                console.error('Error loading comments', err);
            },
        });
    }

    canEdit(comment: any): boolean {
        if (!this.currentUser) return false;
        return this.currentUser.id === comment.user?.id;
    }

    canDelete(comment: any): boolean {
        if (!this.currentUser) return false;
        return this.isAdmin || this.currentUser.id === comment.user?.id;
    }

    startEdit(comment: any) {
        this.editingCommentId = comment.id;
        this.newCommentContentEdit = comment.content || '';
        debugger;
    }

    toggleMenu(id: number | null, event?: Event) {
        // Stop the click from bubbling to document so HostListener doesn't immediately close it
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
        if (this.openMenuId === id) {
            this.openMenuId = null;
        } else {
            this.openMenuId = id;
        }
    }

    closeMenu() {
        this.openMenuId = null;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event) {
        const target = event.target as HTMLElement | null;
        if (!target) {
            this.openMenuId = null;
            return;
        }
        // if the click is outside any .comment-menu element, close the open menu
        if (!target.closest('.comment-menu')) {
            this.openMenuId = null;
        }
    }

    cancelEdit() {
        this.editingCommentId = null;
        this.newCommentContentEdit = '';
    }

    saveEdit(commentId: number) {
        const dto: ProductCommentDTO = {
            product_id: this.productId,
            user_id: this.currentUser?.id,
            content: this.newCommentContentEdit,
        };

        this.productCommentService.updateComment(commentId, dto).subscribe({
            next: () => {
                this.toastr.success('Cập nhật bình luận thành công');
                this.editingCommentId = null;
                this.newCommentContentEdit = '';
                this.loadComments();
            },
            error: (err) => {
                console.error('Error updating comment', err);
                this.toastr.error('Không thể cập nhật bình luận');
            },
        });
    }

    // open confirmation modal for deleting a comment
    deleteTargetId: number | null = null;
    showDeleteModal: boolean = false;

    requestDelete(commentId: number) {
        this.deleteTargetId = commentId;
        this.showDeleteModal = true;
    }

    cancelDelete() {
        this.deleteTargetId = null;
        this.showDeleteModal = false;
    }

    performDelete() {
        if (!this.deleteTargetId) return;
        this.productCommentService.deleteComment(this.deleteTargetId).subscribe({
            next: (msg: any) => {
                const text = typeof msg === 'string' ? msg : 'Xóa bình luận thành công';
                this.toastr.success(text);
                this.loadComments();
                this.cancelDelete();
            },
            error: (err) => {
                console.error('Error deleting comment', err);
                this.toastr.error('Không thể xóa bình luận');
                this.cancelDelete();
            },
        });
    }

    submitComment() {
        debugger;
        // Try to get user id from local storage via UserService pattern
        // We'll use token/user info saved in local storage by UserService
        const userJson = localStorage.getItem('user');
        if (!userJson) {
            this.toastr.warning('Bạn cần đăng nhập để viết bình luận');
            return;
        }
        const user = JSON.parse(userJson);
        const dto: ProductCommentDTO = {
            product_id: this.productId,
            user_id: user.userId,
            content: this.newCommentContent,
        };

        this.productCommentService.createComment(dto).subscribe({
            next: () => {
                debugger;
                this.toastr.success('Bình luận đã được đăng');
                this.newCommentContent = '';
                this.loadComments();
            },
            error: (err) => {
                console.error('Error creating comment', err);
                this.toastr.error('Không thể gửi bình luận');
            },
        });
    }

    /**
     * Return relative time in Vietnamese, e.g. "vừa xong", "1 giờ trước", "2 ngày trước".
     */
    getRelativeTime(date: string | number | Date | null | undefined): string {
        if (!date) return '';

        let then: Date;
        try {
            if (Array.isArray(date)) {
                // Backend LocalDateTime: [year, month, day, hour, minute, second, nanoseconds]
                const [year, month, day, hour = 0, minute = 0, second = 0, nanos = 0] = date as any;
                const ms = Math.floor((nanos || 0) / 1e6); // convert nanoseconds to milliseconds
                then = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, second || 0, ms);
            } else {
                then = new Date(date as any);
            }
        } catch {
            return '';
        }

        if (isNaN(then.getTime())) return '';

        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (diffSeconds < 5) return 'vừa xong';
        if (diffSeconds < 60) return `${diffSeconds} giây trước`;

        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 30) return `${diffDays} ngày trước`;

        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths} tháng trước`;

        const diffYears = Math.floor(diffMonths / 12);
        return `${diffYears} năm trước`;
    }

    formatDateTime(date: Date | string | number[] | null | undefined): string {
        if (!date) return 'N/A';

        try {
            let dateObj: Date;

            if (Array.isArray(date)) {
                // Lưu ý: tháng trong JS bắt đầu từ 0, nên phải trừ 1
                const [year, month, day, hour = 0, minute = 0, second = 0] = date;
                dateObj = new Date(year, month - 1, day, hour, minute, second);
            } else {
                dateObj = new Date(date);
            }

            if (isNaN(dateObj.getTime())) return 'Invalid Date';

            return dateObj.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Invalid Date';
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
