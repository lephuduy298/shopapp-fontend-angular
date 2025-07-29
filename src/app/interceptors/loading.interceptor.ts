import { HttpInterceptorFn } from '@angular/common/http';
import { BusyService } from '../services/busy.service';
import { inject } from '@angular/core';
import { delay, finalize } from 'rxjs';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const busyService = inject(BusyService);
    busyService.busy();
    return next(req).pipe(
        delay(1000), // Giảm delay để test nhanh hơn
        finalize(() => {
            busyService.idle();
        })
    );
};
