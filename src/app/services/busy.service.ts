import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
    providedIn: 'root',
})
export class BusyService {
    constructor(private spinnerService: NgxSpinnerService) {}

    busyRequestCount = 0;

    busy() {
        this.busyRequestCount++;
        this.spinnerService.show(undefined, {
            bdColor: 'rgba(0, 0, 0, 0.6)',
            color: '#007bff',
            size: 'medium',
            fullScreen: true,
            template: "<div class='custom-circular-spinner'></div><p style='color: white; margin-top: 20px; text-align: center;'>Đang tải...</p>"
        });
    }

    idle() {
        this.busyRequestCount--;

        if (this.busyRequestCount <= 0) {
            this.busyRequestCount = 0;
            this.spinnerService.hide();
        }
    }
}
