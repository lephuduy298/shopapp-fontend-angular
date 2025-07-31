import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { Product } from '../../models.ts/product';
import { ProductSpecification } from '../../models.ts/product.specification';
import { environment } from '../../../environments/environment';
import { Category } from '../../models.ts/category';
import { UpdateProductDTO } from '../../../dtos/product/update.product.dto';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-product-admin',
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './product.admin.component.html',
    styleUrl: './product.admin.component.scss',
})
export class ProductAdminComponent implements OnInit {
    @ViewChild('otherFileInput') otherFileInput!: ElementRef<HTMLInputElement>;

    products: Product[] = [];
    categories: Category[] = [];
    currentProduct: Product | null = null;
    productForm: FormGroup;

    // Make Math available in template
    Math = Math;

    // Image upload properties
    selectedMainImage: string | null = null;
    otherImages: (string | null)[] = [null, null, null, null];
    productTags: string[] = [];
    selectedMainImageFile: File | null = null;
    otherImagesFile: File[] = []; // For other images

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
    showDeleteImageModal = false;
    productToDelete: Product | null = null;

    // Delete image confirmation
    imageToDelete: {
        type: 'main' | 'other';
        index?: number;
    } | null = null;

    // Product specifications
    productSpecifications: ProductSpecification[] = [];
    
    // Track original specifications for change detection
    private originalSpecifications: ProductSpecification[] = [];

    // Default specifications for each category
    private defaultSpecifications: { [categoryName: string]: string[] } = {
        camera: ['Loại máy ảnh', 'Loại cảm biến', 'Loại ống kính', 'Chế độ lấy nét', 'Kích thước ảnh', 'Màn trập'],
        laptop: [
            'Loại card đồ họa',
            'Dung lượng RAM',
            'Loại RAM',
            'Ổ cứng',
            'Kích thước màn hình',
            'Công nghệ màn hình',
            'Pin',
            'Hệ điều hành',
            'Độ phân giải màn hình',
            'Loại CPU',
            'Cổng giao tiếp',
            'Hãng sản xuất',
        ],
        device: [
            'Kích thước màn hình',
            'Công nghệ màn hình',
            'Camera trước',
            'Camera sau',
            'Chipset',
            'Công nghệ NFC',
            'Dung lượng RAM',
            'Bộ nhớ trong',
            'Pin',
            'Hệ điều hành',
            'Độ phân giải màn hình',
            'Tính năng màn hình',
            'Loại CPU',
            'Hãng sản xuất',
        ],
    };

    loading = false;
    error = '';

    constructor(
        private productService: ProductService,
        private categoryService: CategoryService,
        private fb: FormBuilder,
        private toastr: ToastrService
    ) {
        this.productForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            price: ['', [Validators.required, Validators.min(0)]],
            description: ['', [Validators.required]],
            category_id: ['', [Validators.required]],
            thumbnail: [''],
            url: [''],
            active: [true],
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
                    this.toastr.error('Không thể tải danh sách sản phẩm', 'Lỗi');
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
                this.toastr.error('Không thể tải danh sách danh mục', 'Lỗi');
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
        this.productForm.patchValue({
            active: true,
            category_id: '', // Ensure no category is selected initially
        });
        this.selectedMainImage = null;
        this.selectedMainImageFile = null;
        this.otherImages = [null, null, null, null];
        this.otherImagesFile = [];
        this.productTags = [];
        this.productSpecifications = []; // Start with empty specifications
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
            active: true,
        });
        this.selectedMainImage =
            product.url || product.thumbnail ? `${environment.apiBaseUrl}/products/images/${product.thumbnail}` : null;

        // Always ensure otherImages has exactly 4 elements
        this.otherImages = [null, null, null, null];
        if (product.product_images && product.product_images.length > 0) {
            product.product_images.slice(0, 4).forEach((img, index) => {
                if (img.image_url) {
                    this.otherImages[index] = `${environment.apiBaseUrl}/products/images/${img.image_url}`;
                }
            });
        }

        // Load product specifications
        this.productSpecifications = product.product_specifications || [];
        // Store original specifications for change detection
        this.originalSpecifications = JSON.parse(JSON.stringify(this.productSpecifications));
        console.log('Product specifications loaded:', this.productSpecifications);
        console.log('Original specifications stored:', this.originalSpecifications);

        this.productTags = [];
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
        this.showDeleteImageModal = false;
        this.currentProduct = null;
        this.productToDelete = null;
        this.imageToDelete = null;
        this.selectedMainImage = null;
        this.selectedMainImageFile = null;
        this.otherImages = [null, null, null, null];
        this.otherImagesFile = [];
        this.productTags = [];
        this.productSpecifications = [];
        this.originalSpecifications = [];
        this.error = '';
    }

    onSubmit(): void {
        if (this.productForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        // Validate specifications before submit
        if (!this.validateAllSpecifications()) {
            return;
        }

        this.loading = true;
        this.error = '';

        if (this.currentProduct) {
            // Edit mode - handle differently for updates
            this.handleUpdateProduct();
        } else {
            // Create mode - prepare FormData with all fields
            const formData = this.prepareFormDataForSubmit();
            this.createProduct(formData);
        }
    }

    // Validate all specifications before submit
    private validateAllSpecifications(): boolean {
        const invalidSpecs = this.productSpecifications.filter((spec) => {
            if (!spec) return true;
            const name = spec.spec_name?.trim() || '';
            const value = spec.spec_value?.trim() || '';
            return name === '' || value === '' || name.length < 2;
        });

        if (invalidSpecs.length > 0) {
            this.toastr.error(
                'Có thông số kỹ thuật không hợp lệ. Tên và giá trị không được để trống và tên phải có ít nhất 2 ký tự.',
                'Lỗi validation'
            );
            return false;
        }

        // Check for duplicate spec names
        const specNames = this.productSpecifications
            .filter((spec) => this.isSpecificationValid(spec))
            .map((spec) => spec.spec_name.trim().toLowerCase());

        const duplicateNames = specNames.filter((name, index) => specNames.indexOf(name) !== index);
        if (duplicateNames.length > 0) {
            this.toastr.error('Có tên thông số kỹ thuật bị trùng lặp. Vui lòng kiểm tra lại.', 'Lỗi validation');
            return false;
        }

        return true;
    }

    // Check if specifications have changed
    private hasSpecificationsChanged(): boolean {
        // Get current processed specifications
        const currentSpecs = this.productSpecifications
            .filter((spec) => this.isSpecificationValid(spec))
            .map((spec) => ({
                id: spec.id && spec.id > 0 ? spec.id : 0,
                spec_name: spec.spec_name.trim(),
                spec_value: spec.spec_value.trim(),
            }));

        // Get original processed specifications
        const originalSpecs = this.originalSpecifications
            .filter((spec) => this.isSpecificationValid(spec))
            .map((spec) => ({
                id: spec.id && spec.id > 0 ? spec.id : 0,
                spec_name: spec.spec_name.trim(),
                spec_value: spec.spec_value.trim(),
            }));

        // Check if lengths are different
        if (currentSpecs.length !== originalSpecs.length) {
            console.log('Specifications changed: different lengths');
            return true;
        }

        // Check each specification for changes
        for (let i = 0; i < currentSpecs.length; i++) {
            const current = currentSpecs[i];
            const original = originalSpecs[i];

            if (
                current.id !== original.id ||
                current.spec_name !== original.spec_name ||
                current.spec_value !== original.spec_value
            ) {
                console.log('Specifications changed: content difference at index', i);
                console.log('Current:', current);
                console.log('Original:', original);
                return true;
            }
        }

        console.log('No specifications changes detected');
        return false;
    }

    private handleUpdateProduct(): void {
        debugger;
        const formData = new FormData();

        // Add product JSON data
        const updateProductDTO = new UpdateProductDTO({
            name: this.productForm.get('name')?.value,
            price: this.productForm.get('price')?.value,
            description: this.productForm.get('description')?.value,
            category_id: this.productForm.get('category_id')?.value,
            active: this.productForm.get('active')?.value,
        });

        formData.append('product', new Blob([JSON.stringify(updateProductDTO)], { type: 'application/json' }));

        // Only process and send specifications if there are changes
        const specificationsChanged = this.hasSpecificationsChanged();
        console.log('Specifications changed:', specificationsChanged);

        if (specificationsChanged) {
            // Process and add specifications with improved handling
            const processedSpecifications = this.productSpecifications
                .filter((spec) => this.isSpecificationValid(spec))
                .map((spec) => {
                    const processedSpec: any = {
                        spec_name: spec.spec_name.trim(),
                        spec_value: spec.spec_value.trim(),
                    };

                    // Only include ID if it's a valid existing ID (greater than 0)
                    if (spec.id && spec.id > 0) {
                        processedSpec.id = spec.id;
                    }

                    return processedSpec;
                });

            console.log('Sending updated specifications to backend:', processedSpecifications);
            formData.append('specifications', new Blob([JSON.stringify(processedSpecifications)], { type: 'application/json' }));
        } else {
            console.log('No specification changes detected, skipping specifications update for better performance');
        }

        console.log('=== FORM DATA CONTENTS ===');
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
        }

        // Only add thumbnail if a new one is selected
        if (this.selectedMainImageFile) {
            formData.append('thumbnail', this.selectedMainImageFile);
        }

        // Add other images if any
        this.otherImagesFile.forEach((file, index) => {
            if (file) {
                formData.append('images', file);
            }
        });

        this.updateProduct(formData);
    }

    private prepareFormDataForSubmit(): FormData {
        const formData = new FormData();

        // Add product JSON data
        const updateProductDTO = new UpdateProductDTO({
            name: this.productForm.get('name')?.value,
            price: this.productForm.get('price')?.value,
            description: this.productForm.get('description')?.value,
            category_id: this.productForm.get('category_id')?.value,
            active: this.productForm.get('active')?.value,
        });

        formData.append('product', new Blob([JSON.stringify(updateProductDTO)], { type: 'application/json' }));

        // Process and add specifications for create
        const processedSpecifications = this.productSpecifications
            .filter((spec) => this.isSpecificationValid(spec))
            .map((spec) => ({
                spec_name: spec.spec_name.trim(),
                spec_value: spec.spec_value.trim(),
                // Don't include ID for new products
            }));

        console.log('Sending specifications for create:', processedSpecifications);

        // Send specifications array (even if empty)
        formData.append('specifications', new Blob([JSON.stringify(processedSpecifications)], { type: 'application/json' }));

        // For create, always add thumbnail field (empty blob if no file selected)
        if (this.selectedMainImageFile) {
            formData.append('thumbnail', this.selectedMainImageFile);
        } else {
            // Add empty blob to satisfy backend requirements for create
            formData.append('thumbnail', new Blob([]), '');
        }

        // Add other images if any
        this.otherImagesFile.forEach((file, index) => {
            if (file) {
                formData.append('images', file);
            }
        });

        return formData;
    }

    private createProduct(formData: FormData): void {
        this.productService.createProduct(formData).subscribe({
            next: (response) => {
                console.log('Product created successfully:', response);
                this.loadProducts();
                this.closeModals();
                this.loading = false;
                this.toastr.success('Sản phẩm đã được tạo thành công!', 'Thành công');
            },
            error: (error) => {
                console.error('Error creating product:', error);
                this.handleError(error, 'Không thể tạo sản phẩm mới');
            },
        });
    }

    private updateProduct(formData: FormData): void {
        if (!this.currentProduct) return;

        this.productService.updateProduct(this.currentProduct.id, formData).subscribe({
            next: (response) => {
                console.log('Product updated successfully:', response);
                this.loadProducts();
                this.closeModals();
                this.loading = false;
                this.toastr.success('Sản phẩm đã được cập nhật thành công!', 'Thành công');
            },
            error: (error) => {
                console.error('Error updating product:', error);
                // Log chi tiết error để debug
                console.error('Full error object:', error);
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                console.error('Error details:', error.error);

                // Nếu là JSON, parse và log
                if (error.error && typeof error.error === 'string') {
                    try {
                        const parsedError = JSON.parse(error.error);
                        console.error('Parsed error:', parsedError);
                    } catch (e) {
                        console.error('Raw error string:', error.error);
                    }
                }

                this.handleError(error, 'Không thể cập nhật sản phẩm');
            },
        });
    }

    private handleError(error: any, defaultMessage: string): void {
        this.loading = false;
        let errorMessage = defaultMessage;

        // Handle different types of errors
        if (error.status === 400) {
            // Validation errors
            if (error.error && error.error.message) {
                errorMessage = error.error.message;
            } else if (error.error && typeof error.error === 'string') {
                errorMessage = error.error;
            } else if (error.error && error.error.errors) {
                // Handle validation errors array
                const errorMessages = Object.values(error.error.errors).flat();
                errorMessage = errorMessages.join(', ');
            } else if (error.error && error.error.details) {
                // Handle detailed validation errors
                errorMessage = Array.isArray(error.error.details) ? error.error.details.join(', ') : error.error.details;
            } else {
                errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin specifications.';
            }
        } else if (error.status === 401) {
            errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
        } else if (error.status === 403) {
            errorMessage = 'Truy cập bị từ chối.';
        } else if (error.status === 404) {
            errorMessage = 'Không tìm thấy sản phẩm.';
        } else if (error.status === 500) {
            errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }

        this.error = errorMessage;
        this.toastr.error(errorMessage, 'Lỗi');
    }

    confirmDelete(): void {
        if (!this.productToDelete) return;

        this.loading = true;
        this.productService.deleteProduct(this.productToDelete.id).subscribe({
            next: () => {
                debugger;
                this.loadProducts();
                this.closeModals();
                this.loading = false;
                this.toastr.success('Sản phẩm đã được xóa thành công!', 'Thành công');
            },
            error: (error) => {
                debugger;
                console.error('Error deleting product:', error);
                this.error = 'Không thể xóa sản phẩm';
                this.loading = false;
                this.toastr.error('Không thể xóa sản phẩm', 'Lỗi');
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

    // Get current selected category name for display
    getCurrentCategoryName(): string {
        const categoryId = this.productForm.get('category_id')?.value;
        if (categoryId && categoryId !== '') {
            return this.getCategoryName(parseInt(categoryId));
        }
        return '';
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

    // Image upload methods
    onMainImageSelected(event: any): void {
        this.selectedMainImageFile = event.target.files[0];
        if (this.selectedMainImageFile) {
            const reader = new FileReader();
            // this.productForm.patchValue({ thumbnail: this.selectedMainImageFile.name });
            // this.productForm.get('mainImage')?.setValue(this.selectedMainImageFile.name);

            reader.onload = (e: any) => {
                this.selectedMainImage = e.target.result;
                // Update form control for backend compatibility
            };
            reader.readAsDataURL(this.selectedMainImageFile);
        }
    }

    onOtherImageSelected(event: any): void {
        const file = event.target.files[0];
        if (file && this.currentOtherImageIndex !== null) {
            // Store the file for later upload
            this.otherImagesFile[this.currentOtherImageIndex] = file;

            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.otherImages[this.currentOtherImageIndex!] = e.target.result;
                this.currentOtherImageIndex = null;
            };
            reader.readAsDataURL(file);
        }
    }

    private currentOtherImageIndex: number | null = null;

    selectOtherImage(index: number): void {
        this.currentOtherImageIndex = index;
        if (this.otherFileInput) {
            this.otherFileInput.nativeElement.click();
        }
    }

    addOtherImage(): void {
        const emptyIndex = this.otherImages.findIndex((img) => img === null);
        if (emptyIndex !== -1) {
            this.selectOtherImage(emptyIndex);
        }
    }

    removeOtherImage(index: number): void {
        // Check if we have a current product with existing images
        if (this.currentProduct && this.currentProduct.product_images && this.currentProduct.product_images[index]) {
            const imageToDelete = this.currentProduct.product_images[index];
            const imageId = imageToDelete.id;

            // Call API to delete the image from backend
            this.productService.deleteProductImage(imageId).subscribe({
                next: (response) => {
                    console.log('Image deleted from backend successfully:', response);
                    
                    // Remove from UI after successful API call
                    this.otherImages[index] = null;
                    
                    // Remove from current product's images array
                    this.currentProduct!.product_images.splice(index, 1);
                    
                    // Also remove the corresponding file if exists
                    if (this.otherImagesFile[index]) {
                        this.otherImagesFile.splice(index, 1);
                    }

                    this.toastr.success('Ảnh đã được xóa thành công.', 'Thành công');
                },
                error: (error) => {
                    console.error('Error deleting image from backend:', error);
                    this.toastr.error('Có lỗi xảy ra khi xóa ảnh. Vui lòng thử lại.', 'Lỗi');
                }
            });
        } else {
            // If it's a new image (not yet saved to backend), just remove from UI
            console.log('Removing new image from UI only');
            
            // Remove from UI
            this.otherImages[index] = null;
            
            // Also remove the corresponding file if exists
            if (this.otherImagesFile[index]) {
                this.otherImagesFile.splice(index, 1);
            }

            this.toastr.success('Ảnh đã được xóa khỏi danh sách.', 'Thành công');
        }
    }

    removeMainImage(): void {
        // Show custom confirmation modal
        this.imageToDelete = { type: 'main' };
        this.showDeleteImageModal = true;
    }

    // Confirm delete image from custom modal
    confirmDeleteImage(): void {
        if (!this.imageToDelete) return;

        if (this.imageToDelete.type === 'main') {
            this.performDeleteMainImage();
        } else if (this.imageToDelete.type === 'other' && this.imageToDelete.index !== undefined) {
            this.performDeleteOtherImage(this.imageToDelete.index);
        }

        // Close modal
        this.showDeleteImageModal = false;
        this.imageToDelete = null;
    }

    // Cancel delete image
    cancelDeleteImage(): void {
        this.showDeleteImageModal = false;
        this.imageToDelete = null;
    }

    private performDeleteMainImage(): void {
        // Only remove from UI, don't call API
        console.log('Removing main image from UI only');

        // Remove from UI
        this.selectedMainImage = null;
        this.selectedMainImageFile = null;

        // Update current product if in edit mode
        if (this.currentProduct) {
            this.currentProduct.thumbnail = '';
            this.currentProduct.url = '';
        }

        this.toastr.success('Ảnh chính đã được xóa khỏi danh sách.', 'Thành công');
    }

    private performDeleteOtherImage(index: number): void {
        // Only remove from UI, don't call API
        console.log('Removing other image at index:', index, 'from UI only');

        // Remove from UI
        this.otherImages[index] = null;

        // Remove from current product's images array if in edit mode
        if (this.currentProduct && this.currentProduct.product_images && this.currentProduct.product_images[index]) {
            // Mark as removed but don't actually delete from array to maintain indices
            // This will be handled during save/update
        }

        // Also remove the corresponding file if exists
        if (this.otherImagesFile[index]) {
            this.otherImagesFile.splice(index, 1);
        }

        this.toastr.success('Ảnh đã được xóa khỏi danh sách.', 'Thành công');
    }

    // Get delete image confirmation message
    getDeleteImageMessage(): string {
        if (!this.imageToDelete) return '';

        if (this.imageToDelete.type === 'main') {
            return 'Bạn có chắc chắn muốn xóa ảnh chính này khỏi danh sách?';
        } else {
            return 'Bạn có chắc chắn muốn xóa ảnh này khỏi danh sách?';
        }
    }

    // Tag management methods
    addTag(event: any): void {
        const tagValue = event.target.value.trim();
        if (tagValue && !this.productTags.includes(tagValue)) {
            this.productTags.push(tagValue);
            event.target.value = '';
        }
    }

    removeTag(tag: string): void {
        const index = this.productTags.indexOf(tag);
        if (index > -1) {
            this.productTags.splice(index, 1);
        }
    }

    // Check if there are empty image slots
    hasEmptyImageSlot(): boolean {
        return this.otherImages.some((img) => img === null);
    }

    // Product Specifications methods
    addSpecification(): void {
        this.productSpecifications.push({
            id: 0, // Temporary ID for new specs
            spec_name: '',
            spec_value: '',
        });
    }

    // Create default specifications based on category
    private createDefaultSpecifications(categoryId: number): void {
        // Find category by ID
        const category = this.categories.find((c) => c.id === categoryId);
        if (!category) return;

        // Get category name in lowercase for matching
        const categoryName = category.name.toLowerCase();
        console.log('Creating default specs for category:', categoryName);

        // Find matching default specifications
        let defaultSpecs: string[] = [];

        // Check if category name contains any of our predefined categories
        if (
            categoryName.includes('camera') ||
            categoryName.includes('máy ảnh') ||
            categoryName.includes('cam') ||
            categoryName.includes('photo')
        ) {
            defaultSpecs = this.defaultSpecifications['camera'];
            console.log('Matched camera category');
        } else if (
            categoryName.includes('laptop') ||
            categoryName.includes('máy tính') ||
            categoryName.includes('computer') ||
            categoryName.includes('pc')
        ) {
            defaultSpecs = this.defaultSpecifications['laptop'];
            console.log('Matched laptop category');
        } else if (
            categoryName.includes('device') ||
            categoryName.includes('điện thoại') ||
            categoryName.includes('smartphone') ||
            categoryName.includes('tablet') ||
            categoryName.includes('phone') ||
            categoryName.includes('mobile')
        ) {
            defaultSpecs = this.defaultSpecifications['device'];
            console.log('Matched device category');
        } else {
            console.log('No matching category found, using empty specifications');
        }

        // Create specifications with empty values for user to fill
        this.productSpecifications = defaultSpecs.map((specName) => ({
            id: 0,
            spec_name: specName,
            spec_value: '', // Empty value for user to fill
        }));

        console.log(`Created ${this.productSpecifications.length} default specifications for category: ${category.name}`);
    }

    // Handle category change in create mode
    onCategoryChangeInForm(): void {
        const categoryId = this.productForm.get('category_id')?.value;

        // Only create default specs if we're in create mode (not edit mode)
        if (this.showCreateModal && categoryId && categoryId !== '') {
            this.createDefaultSpecifications(parseInt(categoryId));
        }
    }

    // Reset specifications to default for current category
    resetToDefaultSpecifications(): void {
        const categoryId = this.productForm.get('category_id')?.value;
        if (categoryId && categoryId !== '') {
            // if (confirm('Bạn có chắc chắn muốn reset về thông số mặc định? Tất cả thay đổi hiện tại sẽ bị mất.')) {
            this.createDefaultSpecifications(parseInt(categoryId));
            // this.toastr.info('Đã reset về thông số mặc định', 'Thông báo');
            // }
        }
    }

    removeSpecification(index: number): void {
        this.productSpecifications.splice(index, 1);
    }

    updateSpecificationName(index: number, event: any): void {
        const value = event.target.value;
        if (this.productSpecifications[index]) {
            this.productSpecifications[index].spec_name = value;
        }
    }

    updateSpecificationValue(index: number, event: any): void {
        const value = event.target.value;
        if (this.productSpecifications[index]) {
            this.productSpecifications[index].spec_value = value;
        }
    }

    isSpecificationValid(spec: ProductSpecification): boolean {
        if (!spec) return false;

        const name = spec.spec_name?.trim() || '';
        const value = spec.spec_value?.trim() || '';

        // Kiểm tra cả tên và giá trị không được rỗng
        if (name === '' || value === '') return false;

        // Kiểm tra độ dài tối thiểu
        if (name.length < 2 || value.length < 1) return false;

        return true;
    }
}
