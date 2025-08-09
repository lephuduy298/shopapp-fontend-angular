import { Component, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';
// Update the import path if necessary, for example:
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, NgxSpinnerModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    // constructor(@Inject(AuthService) private authService: AuthService, private router: Router) {}
    // ngOnInit() {
    //     debugger;
    //     this.authService.refreshAccessToken().subscribe({
    //         next: (res) => {
    //             debugger;
    //             console.log('Token refreshed thành công');
    //             this.authService.setAccessToken(res.token);
    //             // Load dữ liệu khác nếu cần
    //         },
    //         error: (err) => {
    //             console.warn('Refresh token thất bại:', err);
    //             // Có thể redirect về login
    //         },
    //     });
    // }
}
