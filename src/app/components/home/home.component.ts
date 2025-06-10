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

    constructor(private productService: ProductService, private categoryService: CategoryService) {}

    ngOnInit() {
        this.getProducts(this.keyword, this.selectedCategoryId, this.currentPage, this.itemsPerPage);
        this.getCategories();
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

    getProducts(keyword: string, selectedCategoryId: number, page: number, limit: number) {
        this.productService.getProducts(keyword, selectedCategoryId, page, limit).subscribe({
            next: (response: any) => {
                debugger;

                response.result.forEach((product: Product) => {
                    product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                    debugger;
                });
                this.products = response.result;
                this.totalPages = response.meta.totalPage;
                debugger;
                this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
            },
            complete: () => {
                debugger;
            },
            error: (error: any) => {
                // Xử lý lỗi nếu có
                debugger;
                alert(`Cannot get all products: ${error.error.message}`);
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
}
