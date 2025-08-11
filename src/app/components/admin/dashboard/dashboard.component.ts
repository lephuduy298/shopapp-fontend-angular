import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { DashboardService, DashboardStats } from '../../../services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
    totalOrders: number = 0;
    totalProducts: number = 0;
    totalCategories: number = 0;
    totalUsers: number = 0;
    isLoading: boolean = false;
    error: string | null = null;

    constructor(private router: Router, private userService: UserService, private dashboardService: DashboardService) {}

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        debugger;
        this.isLoading = true;
        this.error = null;

        this.dashboardService.getDashboardStats().subscribe({
            next: (stats: DashboardStats) => {
                debugger;
                this.totalOrders = stats.totalOrders;
                this.totalProducts = stats.totalProducts;
                this.totalCategories = stats.totalCategories;
                this.totalUsers = stats.totalUsers;
                this.isLoading = false;
                console.log('Dashboard data loaded successfully:', stats);
            },
            error: (error: any) => {
                debugger;
                console.error('Lỗi khi tải dashboard:', error);
                this.error = 'Không thể tải dữ liệu dashboard';
                this.isLoading = false;
                // Service đã tự động fallback, nên không cần xử lý thêm
            },
        });
    }

    getCurrentDate(): string {
        return new Date().toLocaleDateString('vi-VN');
    }

    getAdminName(): string {
        const userInfo = this.userService.getUserFromLocalStorage();
        return userInfo?.userName || 'Admin';
    }

    navigateTo(section: string): void {
        this.router.navigate([`/admin/${section}`]);
    }

    viewReports(): void {
        // Có thể thêm logic để hiển thị báo cáo hoặc chuyển hướng
        alert('Chức năng báo cáo đang được phát triển');
    }
}
