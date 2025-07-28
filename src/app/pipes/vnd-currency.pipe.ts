import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vndCurrency',
  standalone: true
})
export class VndCurrencyPipe implements PipeTransform {

  transform(value: number | string | undefined | null): string {
    if (!value || value === undefined || value === null || isNaN(Number(value))) {
      return '0 ₫';
    }

    const numValue = Number(value);
    
    // Format số với dấu phẩy phân cách hàng nghìn
    const formatted = numValue.toLocaleString('vi-VN');
    
    return `${formatted} ₫`;
  }
}
