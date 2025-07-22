# 🚀 BACKEND API REQUIREMENTS CHO DASHBOARD

## 📋 TỔNG QUAN

Frontend Dashboard đã được thiết kế với 3 mức fallback tự động:
1. **Dashboard API** (Tối ưu) → **Individual APIs** → **Mock Data**

## 🎯 YÊU CẦU BACKEND CHI TIẾT

### ✅ PRIORITY 1 - CẦN NGAY (Để dashboard hoạt động với dữ liệu thực)

#### 1. API đếm Users (CHƯA CÓ)
```bash
GET /api/users/count
```
**Response format:**
```json
{
  "total": 45
}
```

#### 2. Cập nhật APIs hiện có để trả về total count

**API Orders hiện có:** `/api/orders/get-orders-by-keyword`
- ✅ Hiện tại có: `content`, `page`, `size`
- 🔧 **CẦN THÊM:** `totalElements` hoặc `total`

```json
{
  "content": [...],
  "totalElements": 156,  // ← Frontend cần field này
  "totalPages": 156,
  "number": 0,
  "size": 1
}
```

**API Products hiện có:** `/api/products`
- ✅ Hiện tại có: array products
- 🔧 **CẦN THÊM:** wrapper object với `totalElements`

```json
{
  "content": [...],
  "totalElements": 89,   // ← Frontend cần field này
  "totalPages": 89,
  "number": 0,
  "size": 1
}
```

**API Categories hiện có:** `/api/categories`
- ✅ **ĐÃ ỔN** - Frontend sẽ đếm array length

### 🚀 PRIORITY 2 - TỐI ỐI (Recommend)

#### Dashboard API tổng hợp
```bash
GET /api/dashboard/stats
```
**Response format:**
```json
{
  "totalOrders": 156,
  "totalProducts": 89,
  "totalCategories": 12,
  "totalUsers": 45,
  "recentOrders": [
    {
      "id": 1,
      "orderDate": "2025-07-23",
      "totalMoney": 500000,
      "status": "completed",
      "customerName": "Nguyễn Văn A"
    }
  ],
  "topProducts": [
    {
      "id": 1,
      "name": "iPhone 15",
      "price": 25000000,
      "soldQuantity": 150,
      "imageUrl": "https://..."
    }
  ]
}
```

### 🎁 PRIORITY 3 - NÂNG CAO (Tương lai)

```bash
GET /api/dashboard/orders/recent?limit=5
GET /api/dashboard/products/top?limit=5
```

## 🔧 CÁCH FRONTEND XỬ LÝ

### Luồng hoạt động:
1. **Thử Dashboard API** (`/api/dashboard/stats`)
   - Nếu thành công → Hiển thị dữ liệu
   
2. **Fallback: Individual APIs**
   - Orders: `/api/orders/get-orders-by-keyword?page=0&limit=1`
   - Products: `/api/products?page=0&limit=1` 
   - Categories: `/api/categories`
   - Users: `/api/users/count`
   
3. **Fallback cuối: Mock Data**
   - Nếu tất cả APIs fail

### Console logs để debug:
```javascript
// Success
"Dashboard data loaded successfully: {totalOrders: 156, ...}"

// Fallback level 1
"Dashboard API không khả dụng, fallback to individual APIs"

// Fallback level 2  
"Không thể lấy tổng đơn hàng"
"API /users/count chưa có, backend cần tạo endpoint này"

// Fallback cuối
"Lỗi khi lấy dữ liệu từ individual APIs, sử dụng mock data"
```

## 🧪 CÁCH TEST

### Hiện tại (chưa có backend APIs):
- Dashboard sẽ hiển thị mock data
- Console sẽ log lỗi các API calls

### Sau khi có `/api/users/count`:
- Số users sẽ hiển thị thực tế
- Orders, Products, Categories vẫn là mock data

### Sau khi cập nhật Orders/Products APIs:
- Tất cả số liệu sẽ thực tế trừ Users

### Sau khi có Dashboard API:
- 1 API call duy nhất
- Performance tối ưu
- Có thể cache 5-10 phút

## 📝 GHI CHÚ IMPLEMENTATION

### Backend Controller Example:
```java
@RestController
@RequestMapping("/api")
public class DashboardController {
    
    @GetMapping("/users/count")
    public ResponseEntity<Map<String, Long>> getUserCount() {
        long count = userService.getTotalUsers();
        return ResponseEntity.ok(Map.of("total", count));
    }
    
    @GetMapping("/dashboard/stats") 
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        // Tổng hợp tất cả thống kê trong 1 query
        return ResponseEntity.ok(dashboardService.getStats());
    }
}
```

### Database Queries tối ưu:
```sql
-- Thay vì SELECT * FROM orders, chỉ cần:
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM products;  
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM users;
```

## ✅ CHECKLIST BACKEND

- [ ] Tạo endpoint `/api/users/count`
- [ ] Cập nhật Orders API để trả về `totalElements`
- [ ] Cập nhật Products API để trả về `totalElements`
- [ ] Test với Frontend dashboard
- [ ] (Optional) Tạo `/api/dashboard/stats` endpoint
- [ ] (Optional) Implement caching cho dashboard stats
