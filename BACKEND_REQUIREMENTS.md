# BACKEND API REQUIREMENTS CHO DASHBOARD

## 🎯 Tổng quan
Frontend đã được cấu hình để tự động fallback giữa các phương pháp lấy dữ liệu:
1. **Dashboard API** (Recommended) → **Individual APIs** → **Mock Data**

## 📋 YÊU CẦU BACKEND

### 1. API Dashboard chính (RECOMMENDED)
```
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
      "orderDate": "2025-07-22",
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

### 2. API đếm Users (CẦN TẠO MỚI)
```
GET /api/users/count
```
**Response format:**
```json
{
  "total": 45
}
```

### 3. Cập nhật các API hiện có (TÙY CHỌN)

#### API Orders hiện có
```
GET /api/orders/get-orders-by-keyword?keyword=&page=0&limit=1
```
**Cần response có thêm:**
```json
{
  "content": [...],
  "totalElements": 156,  // ← Frontend sẽ dùng field này
  "totalPages": 156,
  "number": 0,
  "size": 1
}
```

#### API Products hiện có  
```
GET /api/products?keyword=&category_id=0&page=0&limit=1
```
**Cần response có thêm:**
```json
{
  "content": [...],
  "totalElements": 89,   // ← Frontend sẽ dùng field này
  "totalPages": 89,
  "number": 0,
  "size": 1
}
```

#### API Categories hiện có (ĐÃ ỔN)
```
GET /api/categories
```
**Response hiện tại đã đủ** - Frontend sẽ đếm array length

## 🔧 CHIẾN LƯỢC FALLBACK

Frontend đã được code để tự động:

1. **Thử dashboard API trước** (`/api/dashboard/stats`)
2. **Nếu fail → dùng individual APIs**:
   - Orders: `/api/orders/get-orders-by-keyword`
   - Products: `/api/products` 
   - Categories: `/api/categories`
   - Users: `/api/users/count`
3. **Nếu tất cả fail → dùng mock data**

## 🚀 KHUYẾN NGHỊ THỰC HIỆN

### Giai đoạn 1 (Ngay lập tức):
- Tạo endpoint `/api/users/count`
- Test với frontend hiện tại

### Giai đoạn 2 (Tối ưu):
- Tạo endpoint `/api/dashboard/stats` 
- Có thể cache dữ liệu 5-10 phút
- Tối ưu performance với 1 query thay vì 4 queries

### Giai đoạn 3 (Nâng cao):
- Thêm `recentOrders` và `topProducts` 
- Implement real-time updates với WebSocket

## 🧪 CÁCH TEST

1. **Không có backend API nào**: Frontend sẽ hiển thị mock data
2. **Có một số API**: Frontend sẽ hiển thị kết hợp thực tế + mock
3. **Có đầy đủ API**: Frontend sẽ hiển thị dữ liệu thực tế

## 📝 GHI CHÚ

- Frontend đã handle tất cả error cases
- Có loading states và retry functionality  
- Console.log sẽ hiển thị quá trình fallback
- API call được optimize với RxJS forkJoin
