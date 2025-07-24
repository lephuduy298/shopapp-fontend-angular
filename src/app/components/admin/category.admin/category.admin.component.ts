import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category } from '../../models.ts/category';
import { CategoryService } from '../../../services/category.service';

@Component({
    selector: 'app-category-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './category.admin.component.html',
    styleUrl: './category.admin.component.scss',
})
export class CategoryAdminComponent implements OnInit {
    categories: Category[] = [];
    filteredCategories: Category[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 10;
    totalPages: number = 0;
    totalItems: number = 0;
    keyword: string = '';
    visiblePages: number[] = [];
    
    // Modal states
    showAddModal: boolean = false;
    showEditModal: boolean = false;
    showDeleteModal: boolean = false;
    
    // Forms
    addForm!: FormGroup;
    editForm!: FormGroup;
    
    // Current category being edited/deleted
    selectedCategory: Category | null = null;
    
    // Loading states
    isLoading: boolean = false;
    isSubmitting: boolean = false;

    constructor(
        private categoryService: CategoryService,
        private formBuilder: FormBuilder
    ) {
        this.initializeForms();
    }

    ngOnInit(): void {
        this.loadCategories();
    }

    initializeForms(): void {
        this.addForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
        });

        this.editForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
        });
    }

    loadCategories(): void {
        this.isLoading = true;
        this.categoryService.getCategoriesWithPagination(this.keyword, this.currentPage, this.itemsPerPage).subscribe({
            next: (response: any) => {
                this.categories = response.result || response;
                this.totalPages = response.meta?.totalPage || Math.ceil(this.categories.length / this.itemsPerPage);
                this.totalItems = response.meta?.totalItems || this.categories.length;
                this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
                this.filteredCategories = [...this.categories];
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error loading categories:', error);
                this.isLoading = false;
                // Fallback to simple getCategories if pagination API doesn't exist
                this.loadCategoriesSimple();
            }
        });
    }

    loadCategoriesSimple(): void {
        this.categoryService.getCategories().subscribe({
            next: (categories: Category[]) => {
                this.categories = categories;
                this.totalItems = categories.length;
                this.totalPages = Math.ceil(categories.length / this.itemsPerPage);
                this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
                this.applyPagination();
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error loading categories:', error);
                this.isLoading = false;
            }
        });
    }

    applyPagination(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.filteredCategories = this.categories.slice(startIndex, endIndex);
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

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadCategories();
    }

    handleSearch(event: Event): void {
        event.preventDefault();
        this.currentPage = 1;
        this.loadCategories();
    }

    // Modal methods
    openAddModal(): void {
        this.showAddModal = true;
        this.addForm.reset();
    }

    openEditModal(category: Category): void {
        this.selectedCategory = category;
        this.showEditModal = true;
        this.editForm.patchValue({
            name: category.name
        });
    }

    openDeleteModal(category: Category): void {
        this.selectedCategory = category;
        this.showDeleteModal = true;
    }

    closeModals(): void {
        this.showAddModal = false;
        this.showEditModal = false;
        this.showDeleteModal = false;
        this.selectedCategory = null;
        this.isSubmitting = false;
    }

    // CRUD operations
    addCategory(): void {
        if (this.addForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            const categoryData: Omit<Category, 'id'> = this.addForm.value;
            
            this.categoryService.createCategory(categoryData).subscribe({
                next: (response: any) => {
                    console.log('Category added successfully:', response);
                    this.loadCategories();
                    this.closeModals();
                },
                error: (error: any) => {
                    console.error('Error adding category:', error);
                    this.isSubmitting = false;
                }
            });
        }
    }

    updateCategory(): void {
        if (this.editForm.valid && this.selectedCategory && !this.isSubmitting) {
            this.isSubmitting = true;
            const categoryData: Partial<Category> = this.editForm.value;
            
            this.categoryService.updateCategory(this.selectedCategory.id, categoryData).subscribe({
                next: (response: any) => {
                    console.log('Category updated successfully:', response);
                    this.loadCategories();
                    this.closeModals();
                },
                error: (error: any) => {
                    console.error('Error updating category:', error);
                    this.isSubmitting = false;
                }
            });
        }
    }

    deleteCategory(): void {
        if (this.selectedCategory && !this.isSubmitting) {
            this.isSubmitting = true;
            
            this.categoryService.deleteCategory(this.selectedCategory.id).subscribe({
                next: (response: any) => {
                    console.log('Category deleted successfully:', response);
                    this.loadCategories();
                    this.closeModals();
                },
                error: (error: any) => {
                    console.error('Error deleting category:', error);
                    this.isSubmitting = false;
                }
            });
        }
    }

    // Helper methods
    getFieldError(form: FormGroup, fieldName: string): string {
        const field = form.get(fieldName);
        if (field?.errors && field.touched) {
            if (field.errors['required']) return `${fieldName} is required`;
            if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
            if (field.errors['maxlength']) return `${fieldName} must be no more than ${field.errors['maxlength'].requiredLength} characters`;
        }
        return '';
    }
}
