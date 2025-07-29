import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-toastlert',
    imports: [],
    templateUrl: './toastlert.component.html',
    styleUrl: './toastlert.component.scss',
})
export class ToastlertComponent {
    constructor(private toastr: ToastrService) {}

    showSuccess() {
        // Logic to show success toast
        this.toastr.success('Success message', 'Sucess');
    }

    showError() {
        // Logic to show error toast
    }

    showInfo() {
        // Logic to show info toast
    }

    showWarning() {
        // Logic to show warning toast
    }
}
