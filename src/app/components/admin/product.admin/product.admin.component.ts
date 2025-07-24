import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { Product } from '../../models.ts/product';
import { environment } from '../../../environments/environment';
import { Category } from '../../models.ts/category';

@Component({
    selector: 'app-product-admin',
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './product.admin.component.html',
    styleUrl: './product.admin.component.scss',
})
export class ProductAdminComponent implements OnInit {
    products: Product[] = [];
    categories: Category[] = [];
    currentProduct: Product | null = null;
    productForm: FormGroup;

    // Make Math available in template
    Math = Math;

    // Filter and pagination
    activeFilter = 'all';
    filteredProducts: Product[] = [];
    visiblePages: number[] = [];

    // Pagination
    currentPage = 0;
    itemsPerPage = 10;
    totalPages = 0;
    totalElements = 0;
    keyword = '';
    selectedCategoryId = 0; // Add category filter

    // Modal states
    showCreateModal = false;
    showEditModal = false;
    showDeleteModal = false;
    productToDelete: Product | null = null;

    loading = false;
    error = '';

    constructor(private productService: ProductService, private categoryService: CategoryService, private fb: FormBuilder) {
        this.productForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            price: ['', [Validators.required, Validators.min(0)]],
            description: ['', [Validators.required]],
            category_id: ['', [Validators.required]],
            thumbnail: [''],
            url: [''],
        });
    }

    ngOnInit(): void {
        this.loadProducts();
        this.loadCategories();
    }

    loadProducts(): void {
        this.loading = true;
        this.productService
            .getAllProductsForAdmin(this.currentPage, this.itemsPerPage, this.keyword, this.selectedCategoryId)
            .subscribe({
                next: (response: any) => {
                    console.log('Product API Response:', response);

                    // Handle different response formats
                    let products = [];
                    let totalPages = 0;
                    let totalElements = 0;

                    if (Array.isArray(response)) {
                        // Old format: direct array
                        products = response;
                        totalPages = Math.ceil(products.length / this.itemsPerPage);
                        totalElements = products.length;
                    } else if (response.result) {
                        // New format with result property
                        products = response.result;
                        totalPages = response.meta?.totalPage || Math.ceil(products.length / this.itemsPerPage);
                        totalElements = response.meta?.totalItems || products.length;
                    } else if (response.content) {
                        // Spring Boot format
                        products = response.content;
                        totalPages = response.totalPages || Math.ceil(products.length / this.itemsPerPage);
                        totalElements = response.totalElements || products.length;
                    }

                    // Add image URLs
                    products.forEach((product: Product) => {
                        product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                    });

                    this.products = products;
                    this.totalPages = Math.max(1, totalPages); // Ensure at least 1 page
                    this.totalElements = totalElements;
                    this.loading = false;
                    this.filterProducts();
                    this.updateVisiblePages();
                },
                error: (error) => {
                    console.error('Error loading products:', error);
                    this.error = 'Không thể tải danh sách sản phẩm';
                    this.loading = false;
                },
            });
    }

    loadCategories(): void {
        this.categoryService.getCategories().subscribe({
            next: (categories) => {
                this.categories = categories;
            },
            error: (error) => {
                console.error('Error loading categories:', error);
            },
        });
    }

    onSearch(): void {
        console.log('Search triggered with keyword:', this.keyword);
        console.log('Resetting to page 0');
        this.currentPage = 0;
        this.selectedCategoryId = 0; // Reset category when searching
        this.activeFilter = 'all'; // Reset filter when searching
        this.loadProducts();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadProducts();
    }

    onCategoryChange(): void {
        console.log('Category filter changed to:', this.selectedCategoryId);
        this.currentPage = 0;
        this.activeFilter = 'all'; // Reset filter when changing category
        this.loadProducts();
    }

    openCreateModal(): void {
        this.currentProduct = null;
        this.productForm.reset();
        this.showCreateModal = true;
    }

    openEditModal(product: Product): void {
        this.currentProduct = product;
        this.productForm.patchValue({
            name: product.name,
            price: product.price,
            description: product.description,
            category_id: product.category_id,
            thumbnail: product.thumbnail,
            url: product.url,
        });
        this.showEditModal = true;
    }

    openDeleteModal(product: Product): void {
        this.productToDelete = product;
        this.showDeleteModal = true;
    }

    closeModals(): void {
        this.showCreateModal = false;
        this.showEditModal = false;
        this.showDeleteModal = false;
        this.currentProduct = null;
        this.productToDelete = null;
        this.error = '';
    }

    onSubmit(): void {
        if (this.productForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        const formData = this.productForm.value;
        this.loading = true;

        if (this.currentProduct) {
            // Edit mode
            this.productService.updateProduct(this.currentProduct.id, formData).subscribe({
                next: () => {
                    this.loadProducts();
                    this.closeModals();
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error updating product:', error);
                    this.error = 'Không thể cập nhật sản phẩm';
                    this.loading = false;
                },
            });
        } else {
            // Create mode
            this.productService.createProduct(formData).subscribe({
                next: () => {
                    this.loadProducts();
                    this.closeModals();
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error creating product:', error);
                    this.error = 'Không thể tạo sản phẩm mới';
                    this.loading = false;
                },
            });
        }
    }

    confirmDelete(): void {
        if (!this.productToDelete) return;

        this.loading = true;
        this.productService.deleteProduct(this.productToDelete.id).subscribe({
            next: () => {
                this.loadProducts();
                this.closeModals();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error deleting product:', error);
                this.error = 'Không thể xóa sản phẩm';
                this.loading = false;
            },
        });
    }

    private markFormGroupTouched(): void {
        Object.keys(this.productForm.controls).forEach((key) => {
            const control = this.productForm.get(key);
            control?.markAsTouched();
        });
    }

    getCategoryName(categoryId: number): string {
        const category = this.categories.find((c) => c.id === categoryId);
        return category ? category.name : 'N/A';
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.productForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getFieldError(fieldName: string): string {
        const field = this.productForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return `${fieldName} là bắt buộc`;
            if (field.errors['minlength'])
                return `${fieldName} phải có ít nhất ${field.errors['minlength'].requiredLength} ký tự`;
            if (field.errors['min']) return `${fieldName} phải lớn hơn hoặc bằng ${field.errors['min'].min}`;
        }
        return '';
    }

    // Filter methods
    setActiveFilter(filter: string): void {
        this.activeFilter = filter;
        this.currentPage = 0; // Reset to first page when changing filter
        this.filterProducts();
        this.updateVisiblePages(); // Update pagination after filtering
    }

    filterProducts(): void {
        switch (this.activeFilter) {
            case 'available':
                this.filteredProducts = this.products.filter((product) => product.price > 0);
                break;
            case 'out-of-stock':
                this.filteredProducts = this.products.filter((product) => product.price === 0);
                break;
            case 'featured':
                this.filteredProducts = this.products.filter((product) => product.name.toLowerCase().includes('featured'));
                break;
            default:
                this.filteredProducts = [...this.products];
        }

        // Update pagination info for filtered results
        const filteredTotalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        console.log('Filter applied:', {
            filter: this.activeFilter,
            totalProducts: this.products.length,
            filteredProducts: this.filteredProducts.length,
            filteredTotalPages: filteredTotalPages,
        });
    }

    updateVisiblePages(): void {
        const totalPages = this.totalPages;
        const currentPage = this.currentPage + 1; // Convert 0-based to 1-based for display
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            this.visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            const end = Math.min(totalPages, start + maxVisible - 1);
            this.visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
    }
}
