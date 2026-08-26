# Rule 03: Coding Standards & Ant Design Standards

## Quy chuẩn viết Code

1. **Thư viện UI Ant Design (`antd`):**
   - Sử dụng các Antd Component chuẩn như `Layout`, `Table`, `Card`, `Tag`, `Badge`, `Modal`, `Form`, `Statistic`.
   - Giữ giao diện đồng bộ theo tông màu chính `#1890ff` (Primary Blue), `#722ed1` (Purple), `#52c41a` (Success Green).

2. **Responsive Standards:**
   - Mọi giao diện phải có prop `scroll={{ x: 800 }}` hoặc `xs={24} sm={12} lg={8}` để chạy mượt cả trên Mobile (375px+) lẫn Desktop.

3. **Format Tiền Tệ & Ngày Tháng:**
   - Sử dụng helper từ `src/shared/utils/formatter.js` cho mọi giá trị VNĐ (`formatCurrency`).

4. **Xử lý Ngoại lệ (Error Handling):**
   - Mọi thao tác ghi/xóa dữ liệu phải sử dụng Antd `message.success()` hoặc `message.error()` để thông báo rõ ràng cho người dùng.
