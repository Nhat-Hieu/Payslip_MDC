# Payslip MDC

Ứng dụng web quản lý bảng lương, in phiếu lương khổ A4 và xuất file chuyển khoản ngân hàng từ file Excel.

🌐 **Live Demo:** [https://nhat-hieu.github.io/Payslip_MDC/](https://nhat-hieu.github.io/Payslip_MDC/)

## Tính năng

- **In phiếu lương A4:** Xem và in phiếu lương đơn lẻ hoặc in hàng loạt cho toàn bộ nhân viên theo mẫu chuẩn A4.
- **Nạp file Excel:** Kéo thả file bảng lương Excel/CSV, hệ thống tự động nhận diện cột, phòng ban và kỳ lương.
- **Thống kê bộ phận:** Biểu đồ và bảng chi tiết quỹ lương, bảo hiểm, thuế theo từng phòng ban.
- **Bảng lương tổng hợp:** Xem bảng lương toàn công ty và xuất lại file Excel/CSV.
- **Xuất file ngân hàng:** Xuất file TXT chi lương hàng loạt theo định dạng BIDV, Vietcombank, Techcombank...
- **Bảo mật:** Xử lý dữ liệu trực tiếp trên trình duyệt (client-side), không lưu trữ hay gửi dữ liệu ra máy chủ bên ngoài.

## Công nghệ sử dụng

- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Thư viện: SheetJS (xlsx), JSZip, html2pdf.js

## Cài đặt & Khởi chạy

### Chạy trực tiếp
Truy cập [https://nhat-hieu.github.io/Payslip_MDC/](https://nhat-hieu.github.io/Payslip_MDC/) trên trình duyệt.

### Chạy localhost
1. Clone dự án:
   ```bash
   git clone https://github.com/Nhat-Hieu/Payslip_MDC.git
   ```
2. Khởi chạy:
   - Nhấp đúp chuột vào file `chay-he-thong.bat`
   - Hoặc chạy lệnh:
     ```bash
     npm start
     ```
3. Truy cập `http://localhost:3000`
