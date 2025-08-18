import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { Product } from '../models.ts/product';
import { ProductService } from '../../services/product.service';
import { environment } from '../../environments/environment';
import { CategoryService } from '../../services/category.service';
import { Category } from '../models.ts/category';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { VndCurrencyPipe } from '../../pipes/vnd-currency.pipe';
import { BusyService } from '../../services/busy.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule, VndCurrencyPipe],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
    products: Product[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 12;
    totalPages: number = 0;
    visiblePages: number[] = [];
    categories: Category[] = [];
    keyword: string = '';
    selectedCategoryId: number = 0;

    // Thêm filter hãng và giá
    brands: string[] = [];
    selectedBrands: string[] = [];
    priceRanges = [
        { label: 'Dưới 10 triệu', min: 0, max: 10000000, slug: 'duoi-10-trieu' },
        { label: 'Từ 10 - 15 triệu', min: 10000000, max: 15000000, slug: 'tu-10-15-trieu' },
        { label: 'Từ 15 - 20 triệu', min: 15000000, max: 20000000, slug: 'tu-15-20-trieu' },
        { label: 'Từ 20 - 25 triệu', min: 20000000, max: 25000000, slug: 'tu-20-25-trieu' },
        { label: 'Từ 25 - 30 triệu', min: 25000000, max: 30000000, slug: 'tu-25-30-trieu' },
        { label: 'Trên 30 triệu', min: 30000000, max: 1000000000, slug: 'tren-30-trieu' },
    ];
    selectedPriceRanges: any[] = [];

    constructor(
        private productService: ProductService,
        private categoryService: CategoryService,
        private router: Router,
        private route: ActivatedRoute,
        private cartService: CartService,
        private toastr: ToastrService,
        private busyService: BusyService
    ) {}

    ngOnInit() {
        this.route.queryParams.subscribe((params: Params) => {
            this.keyword = params['keyword'] || '';
            this.selectedCategoryId = params['category'] ? +params['category'] : 0;
            this.currentPage = params['page'] ? +params['page'] : 1;

            // Convert brand string to array for consistency
            if (params['brand']) {
                this.selectedBrands = params['brand'].split(',');
            } else {
                this.selectedBrands = [];
            }

            // Handle price ranges from URL parameter 'muc-gia'
            if (params['muc-gia']) {
                // Parse slug-based price ranges
                const priceRangesSlugs = params['muc-gia'].split(',');
                this.selectedPriceRanges = [];

                for (const slug of priceRangesSlugs) {
                    const matchingRange = this.priceRanges.find((r) => r.slug === slug);
                    if (matchingRange) {
                        this.selectedPriceRanges.push(matchingRange);
                    }
                }
            } else {
                this.selectedPriceRanges = [];
            }

            // Check if any filters are applied
            const hasFilters = this.selectedBrands.length > 0 || this.selectedPriceRanges.length > 0;

            if (hasFilters) {
                this.getProductsWithFilter();
            } else {
                this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
            }
        });

        this.getCategories();

        this.categoryService.getBrandCategories().subscribe({
            next: (brands: any[]) => {
                this.brands = brands;
            },
            error: (err) => {
                console.error('Error fetching brands:', err);
            },
        });
    }

    searchProducts() {
        debugger;
        this.currentPage = 1;
        this.itemsPerPage = 12;

        // Kiểm tra có filter nào được áp dụng không
        const hasFilters = this.selectedBrands.length > 0 || this.selectedPriceRanges.length > 0;

        if (hasFilters) {
            this.getProductsWithFilter();
        } else {
            this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
        }
    }

    getCategories() {
        this.categoryService.getCategories().subscribe({
            next: (categories: Category[]) => {
                debugger;
                this.categories = categories;
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                console.error('Error fetching categories:', error);
            },
        });
    }

    onBrandToggle(event: Event, brand: string): void {
        const input = event.target as HTMLInputElement;
        const isChecked = input.checked;

        if (isChecked) {
            if (!this.selectedBrands.includes(brand)) {
                this.selectedBrands.push(brand);
            }
        } else {
            this.selectedBrands = this.selectedBrands.filter((b) => b !== brand);
        }

        // Reset về trang 1 và cập nhật URL
        this.currentPage = 1;
        this.updateUrlAndFetch();
    }

    getProducts(keyword: string, selectedCategoryId: number, page: number, limit: number) {
        // Luôn sử dụng pagination từ backend - không có filter
        debugger;
        this.busyService.busy();
        this.productService.getProducts(keyword, selectedCategoryId, page, limit).subscribe({
            next: (response: any) => {
                debugger;

                response.result.forEach((product: Product) => {
                    product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                });

                this.products = response.result;
                this.totalPages = response.meta.totalPage;
                this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
                this.busyService.idle();
                debugger;
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                debugger;
                console.log(`Cannot get all products: ${error.error.message}`);
                this.busyService.idle();
            },
        });
    }

    getProductsWithFilter() {
        // Gọi backend với filter parameters
        const brandFilter = this.selectedBrands.length > 0 ? this.selectedBrands.join(',') : undefined;

        // Gửi danh sách price ranges slugs xuống backend
        const priceRangesSlugs =
            this.selectedPriceRanges.length > 0 ? this.selectedPriceRanges.map((range) => range.slug) : undefined;

        this.busyService.busy();
        this.productService
            .getProductsWithFilter(
                this.keyword,
                this.selectedCategoryId,
                this.currentPage,
                this.itemsPerPage,
                brandFilter,
                priceRangesSlugs
            )
            .subscribe({
                next: (response: any) => {
                    debugger;

                    response.result.forEach((product: Product) => {
                        product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                    });

                    // Không cần filter ở client nữa vì backend đã xử lý
                    this.products = response.result;
                    this.totalPages = response.meta.totalPage;
                    this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
                    this.busyService.idle();
                    debugger;
                },
                complete: () => {
                    debugger;
                },
                error: (error: any) => {
                    debugger;
                    console.log(`Cannot get filtered products: ${error.error.message}`);
                    this.busyService.idle();
                },
            });
    }

    onPageChange(page: number, event?: Event) {
        if (event) {
            event.preventDefault();
        }

        // Kiểm tra bounds để ngăn chặn navigation không hợp lệ
        if (page < 1 || page > this.totalPages || page === this.currentPage) {
            return;
        }

        debugger;
        this.currentPage = page;

        // Update URL with new page
        this.updateUrlAndFetch();
    }

    generateVisiblePageArray(currentPage: number, totalPages: number): number[] {
        const maxVisiblePages = 5;
        const halfVisiblePages = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(currentPage - halfVisiblePages, 1);
        let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }

        return new Array(endPage - startPage + 1).fill(0).map((_, index) => startPage + index);
    }

    onProductClick(productId: number) {
        debugger;
        this.router.navigate(['/products', productId]);
    }

    onPriceRangeToggle(event: Event, range: any) {
        const input = event.target as HTMLInputElement;
        if (input.checked) {
            if (!this.isPriceRangeSelected(range)) {
                this.selectedPriceRanges.push(range);
            }
        } else {
            this.selectedPriceRanges = this.selectedPriceRanges.filter((r) => !(r.min === range.min && r.max === range.max));
        }
        this.currentPage = 1;
        this.updateUrlAndFetch();
    }

    isPriceRangeSelected(range: any): boolean {
        return this.selectedPriceRanges.some((r) => r.min === range.min && r.max === range.max);
    }

    // Update URL with current filter params and fetch data
    updateUrlAndFetch() {
        const queryParams: any = {};

        // Add keyword if exists
        if (this.keyword) {
            queryParams.keyword = this.keyword;
        }

        // Add category if selected
        if (this.selectedCategoryId > 0) {
            queryParams.category = this.selectedCategoryId;
        }

        // Add brand filter if exists
        if (this.selectedBrands.length > 0) {
            queryParams.brand = this.selectedBrands.join(',');
        }

        // Add price range if exists - sử dụng format muc-gia=slug1,slug2
        if (this.selectedPriceRanges.length > 0) {
            const priceRangesSlugs = this.selectedPriceRanges.map((range) => range.slug).join(',');
            queryParams['muc-gia'] = priceRangesSlugs;
        }

        // Add page if not first page
        if (this.currentPage > 1) {
            queryParams.page = this.currentPage;
        }

        // Navigate with new query params
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            queryParamsHandling: 'replace',
        });
    }

    // Clear all filters
    clearFilters() {
        this.selectedBrands = [];
        this.selectedPriceRanges = [];
        this.currentPage = 1;

        // Clear URL params but keep keyword and category
        const queryParams: any = {};
        if (this.keyword) {
            queryParams.keyword = this.keyword;
        }
        if (this.selectedCategoryId > 0) {
            queryParams.category = this.selectedCategoryId;
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            queryParamsHandling: 'replace',
        });
    }

    // Check if any filters are applied
    hasActiveFilters(): boolean {
        return this.selectedBrands.length > 0 || this.selectedPriceRanges.length > 0;
    }

    addToCart(productId: number) {
        debugger;

        // Tìm thông tin sản phẩm
        const product = this.products.find((p) => p.id === productId);
        const productName = product ? product.name : 'Sản phẩm';

        this.busyService.busy();
        this.cartService.addToCart(productId, 1).subscribe({
            next: () => {
                // Hiển thị toast thành công
                this.toastr.success(`${productName} đã được thêm vào giỏ hàng thành công!`, 'Thêm vào giỏ hàng', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                    positionClass: 'toast-top-right',
                });
                this.busyService.idle();
            },
            error: (error) => {
                // Hiển thị toast lỗi nếu có vấn đề
                console.error('Error adding to cart:', error);
                this.toastr.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!', 'Lỗi', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                    positionClass: 'toast-top-right',
                });
                this.busyService.idle();
            },
        });
    }

    buyNow(productId: number) {
        // Tìm thông tin sản phẩm
        const product = this.products.find((p) => p.id === productId);
        const productName = product ? product.name : 'Sản phẩm';

        this.cartService.addToCart(productId, 1).subscribe({
            next: () => {
                // Hiển thị toast thông báo
                this.toastr.info(
                    `${productName} đã được thêm vào giỏ hàng. Chuyển hướng đến trang đặt hàng...`,
                    'Mua ngay',
                    {
                        timeOut: 2000,
                        progressBar: true,
                        closeButton: true,
                        positionClass: 'toast-top-right',
                    }
                );

                // Chuyển hướng sau 1 giây để user thấy được toast
                setTimeout(() => {
                    this.router.navigate(['/orders'], { state: { buyNow: true, productId: productId } });
                }, 1000);
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
    }
}
