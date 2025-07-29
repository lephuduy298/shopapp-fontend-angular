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
    selectedBrand: string = '';
    minPrice?: number;
    maxPrice?: number;
    priceRanges = [
        { label: 'Dưới 10 triệu', min: 0, max: 10000000 },
        { label: 'Từ 10 - 15 triệu', min: 10000000, max: 15000000 },
        { label: 'Từ 15 - 20 triệu', min: 15000000, max: 20000000 },
        { label: 'Từ 20 - 25 triệu', min: 20000000, max: 25000000 },
        { label: 'Từ 25 - 30 triệu', min: 25000000, max: 30000000 },
        { label: 'Trên 30 triệu', min: 30000000, max: 1000000000 },
    ];
    selectedPriceRange: any = null;

    constructor(
        private productService: ProductService,
        private categoryService: CategoryService,
        private router: Router,
        private route: ActivatedRoute,
        private cartService: CartService,
        private toastr: ToastrService,
        private busyService: BusyService
    ) {}

    // ngOnInit() {
    //     this.route.queryParams.subscribe((params: Params) => {
    //         this.keyword = params['keyword'] || '';
    //         this.selectedCategoryId = params['category'] ? +params['category'] : 0;
    //         this.currentPage = 1;
    //         this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
    //     });
    //     this.getCategories();
    //     // Lấy danh sách brands từ server
    //     this.categoryService.getBrandCategories().subscribe({
    //         next: (brands: any[]) => {
    //             debugger;
    //             this.brands = brands;
    //         },
    //         error: (err) => {
    //             console.error('Error fetching brands:', err);
    //         },
    //     });
    // }

    ngOnInit() {
        this.route.queryParams.subscribe((params: Params) => {
            this.keyword = params['keyword'] || '';
            this.selectedCategoryId = params['category'] ? +params['category'] : 0;
            this.selectedBrand = params['brand'] || '';
            this.minPrice = params['minPrice'] ? +params['minPrice'] : undefined;
            this.maxPrice = params['maxPrice'] ? +params['maxPrice'] : undefined;
            this.currentPage = params['page'] ? +params['page'] : 1;

            // Convert single brand to array for consistency
            if (this.selectedBrand) {
                this.selectedBrands = this.selectedBrand.split(',');
            } else {
                this.selectedBrands = [];
            }

            // Set price range if min/max are provided
            if (this.minPrice || this.maxPrice) {
                this.selectedPriceRange = {
                    min: this.minPrice || 0,
                    max: this.maxPrice || 1000000000
                };
            } else {
                this.selectedPriceRange = null;
            }
            
            // Check if any filters are applied
            const hasFilters = this.selectedBrands.length > 0 || this.selectedPriceRange;
            
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
        const hasFilters = this.selectedBrands.length > 0 || this.selectedPriceRange;
        
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
        const minPrice = this.selectedPriceRange?.min;
        const maxPrice = this.selectedPriceRange?.max;

        this.busyService.busy();
        this.productService.getProductsWithFilter(
            this.keyword,
            this.selectedCategoryId,
            this.currentPage,
            this.itemsPerPage,
            brandFilter,
            minPrice,
            maxPrice
        ).subscribe({
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

    // Khi thay đổi filter hãng

    // Khi thay đổi filter giá
    onPriceRangeChange(range: any) {
        this.selectedPriceRange = range;
        this.currentPage = 1;
        this.updateUrlAndFetch();
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

        // Add price range if exists
        if (this.selectedPriceRange) {
            if (this.selectedPriceRange.min > 0) {
                queryParams.minPrice = this.selectedPriceRange.min;
            }
            if (this.selectedPriceRange.max < 1000000000) {
                queryParams.maxPrice = this.selectedPriceRange.max;
            }
        }

        // Add page if not first page
        if (this.currentPage > 1) {
            queryParams.page = this.currentPage;
        }

        // Navigate with new query params
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            queryParamsHandling: 'replace'
        });
    }

    // Clear all filters
    clearFilters() {
        this.selectedBrands = [];
        this.selectedBrand = '';
        this.selectedPriceRange = null;
        this.minPrice = undefined;
        this.maxPrice = undefined;
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
            queryParamsHandling: 'replace'
        });
    }

    // Check if any filters are applied
    hasActiveFilters(): boolean {
        return this.selectedBrands.length > 0 || this.selectedPriceRange !== null;
    }

    addToCart(productId: number) {
        debugger;

        // Tìm thông tin sản phẩm
        const product = this.products.find((p) => p.id === productId);
        const productName = product ? product.name : 'Sản phẩm';

        try {
            this.busyService.busy();
            this.cartService.addToCart(productId, 1);

            // Hiển thị toast thành công
            this.toastr.success(`${productName} đã được thêm vào giỏ hàng thành công!`, 'Thêm vào giỏ hàng', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
                positionClass: 'toast-top-right',
            });
            this.busyService.idle();
        } catch (error) {
            // Hiển thị toast lỗi nếu có vấn đề
            this.toastr.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
                positionClass: 'toast-top-right',
            });
        }
    }

    buyNow(productId: number) {
        // Tìm thông tin sản phẩm
        const product = this.products.find((p) => p.id === productId);
        const productName = product ? product.name : 'Sản phẩm';

        try {
            this.cartService.addToCart(productId, 1);

            // Hiển thị toast thông báo
            this.toastr.info(`${productName} đã được thêm vào giỏ hàng. Chuyển hướng đến trang đặt hàng...`, 'Mua ngay', {
                timeOut: 2000,
                progressBar: true,
                closeButton: true,
                positionClass: 'toast-top-right',
            });

            // Chuyển hướng sau 1 giây để user thấy được toast
            setTimeout(() => {
                this.router.navigate(['/orders'], { state: { buyNow: true, productId: productId } });
            }, 1000);
        } catch (error) {
            this.toastr.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
                positionClass: 'toast-top-right',
            });
        }
    }
}
