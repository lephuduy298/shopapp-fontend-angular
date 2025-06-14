import { Component, OnInit } from '@angular/core';
import { UserResponse } from '../../responses/user/user.response';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { TokenService } from '../../services/token.service';
import { NavigationEnd, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
    selector: 'app-header',
    imports: [CommonModule, FormsModule, NgbPopoverModule, RouterLink],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
    userResponse?: UserResponse | null;
    isPopoverOpen = false;
    activeNavItem: number = 0;

    constructor(
        private userService: UserService,
        private popoverModule: NgbPopoverModule,
        private tokenService: TokenService,
        private router: Router
    ) {
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            const url = event.urlAfterRedirects;

            // Xác định route hiện tại để set active
            if (url === '/') {
                this.activeNavItem = 0;
            } else if (url.startsWith('/notifications')) {
                this.activeNavItem = 1;
            } else if (url.startsWith('/orders')) {
                this.activeNavItem = 2;
            }
        });
    }

    ngOnInit(): void {
        debugger;
        this.userResponse = this.userService.getUserFromLocalStorage();
    }

    togglePopover(event: Event): void {
        event.preventDefault();
        this.isPopoverOpen = !this.isPopoverOpen;
    }

    handleItemClick(index: number) {
        if (index === 0) {
            debugger;
            this.router.navigate(['/user-profile']);
        } else if (index === 2) {
            this.userService.removeUserFromLocalStorage();
            this.tokenService.removeToken();
            this.userResponse = this.userService.getUserFromLocalStorage();
        }
        this.isPopoverOpen = false; // Close the popover after clicking an item
    }

    setActiveNavItem(index: number) {
        this.activeNavItem = index;
        alert(this.activeNavItem);
    }
}
