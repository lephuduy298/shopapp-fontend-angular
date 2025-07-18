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

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule],
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
        private cartService: CartService
    ) {}

    ngOnInit() {
        this.route.queryParams.subscribe((params: Params) => {
            this.keyword = params['keyword'] || '';
            this.selectedCategoryId = params['category'] ? +params['category'] : 0;
            this.currentPage = 1;
            this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
        });
        this.getCategories();
        // Lấy danh sách brands từ server
        this.categoryService.getBrandCategories().subscribe({
            next: (brands: any[]) => {
                debugger;
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
        this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
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
        // Gọi lại getProducts để filter theo hãng ngay khi chọn
        this.currentPage = 1;
        this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
    }

    getProducts(keyword: string, selectedCategoryId: number, page: number, limit: number) {
        // Nếu có filter hãng hoặc giá thì lấy toàn bộ sản phẩm để filter ở frontend
        const needFrontendFilter = this.selectedBrands.length > 0 || this.selectedPriceRange;
        const fetchPage = needFrontendFilter ? 1 : page;
        const fetchLimit = needFrontendFilter ? 10000 : limit;
        this.productService.getProducts(keyword, selectedCategoryId, fetchPage, fetchLimit).subscribe({
            next: (response: any) => {
                debugger;

                response.result.forEach((product: Product) => {
                    product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                });
                let filtered = response.result;
                // Nếu có filter thì filter toàn bộ và phân trang lại ở frontend
                if (needFrontendFilter) {
                    debugger;
                    // Lọc theo hãng
                    if (this.selectedBrands.length > 0) {
                        debugger;
                        filtered = filtered.filter((p: any) => {
                            debugger;
                            const brandSpec = p.product_specifications.find(
                                (spec: any) =>
                                    spec.spec_name?.toLowerCase() === 'hãng sản xuất' ||
                                    spec.spec_value?.toLowerCase() === 'hãng sản xuất'
                            );
                            return brandSpec && this.selectedBrands.includes(brandSpec.spec_value);
                        });
                    }

                    // Lọc theo giá
                    if (this.selectedPriceRange) {
                        filtered = filtered.filter(
                            (p: any) => p.price >= this.selectedPriceRange.min && p.price <= this.selectedPriceRange.max
                        );
                    }
                    const filteredTotal = filtered.length;
                    this.totalPages = Math.max(1, Math.ceil(filteredTotal / this.itemsPerPage));
                    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
                    const endIdx = startIdx + this.itemsPerPage;
                    this.products = filtered.slice(startIdx, endIdx);
                } else {
                    // Không filter, phân trang như backend trả về
                    this.products = filtered;
                    this.totalPages = response.meta.totalPage;
                }
                this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
                debugger;
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                // Xử lý lỗi nếu có
                debugger;
                console.log(`Cannot get all products: ${error.error.message}`);
            },
        });
    }

    onPageChange(page: number) {
        debugger;
        this.currentPage = page;
        this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
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
        this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
    }

    addToCart(productId: number) {
        debugger;
        this.cartService.addToCart(productId, 1);
        // this.toastService.showSuccess('Item successfully added to your cart!');
    }
}
