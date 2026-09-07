/**
 * payslip.js
 * Tạo và render Phiếu Lương chuẩn A4 (Mẫu 02-LĐTL)
 */

function generatePayslipHTML(emp, comp) {
    comp = comp || window.COMPANY_INFO;
    const netWords = window.docSoThanhChu ? window.docSoThanhChu(emp.netSalary) : "";
    const formattedNet = window.formatVND ? window.formatVND(emp.netSalary) : emp.netSalary.toLocaleString('vi-VN');

    return `
    <div class="payslip-paper" id="payslip-${emp.id}">
        <!-- HEADER CÔNG TY & MẪU SỐ -->
        <div class="paper-header">
            <div class="company-meta">
                <div class="name">${comp.name}</div>
                <div class="detail">Nhà máy SX: ${comp.factoryAddress || "191 Thuận Hoá, P. Phú Bài, Huế"}</div>
                <div class="detail">Showroom: ${comp.showroomAddress || "Khu đô thị Phú Mỹ An, An Đông, Huế"}</div>
                <div class="detail">MST: ${comp.taxCode} | Hotline: ${comp.phone}</div>
            </div>
            <div class="form-meta">
                <div class="form-code">Mẫu số: ${comp.formCode || "02-LĐTL"}</div>
                <div style="margin-top: 4px; font-weight: 500;">Số phiếu: PL${comp.salaryMonth.replace('/', '')}-${emp.id}</div>
            </div>
        </div>

        <!-- TIÊU ĐỀ PHIẾU LƯƠNG -->
        <div class="payslip-title-block">
            <h1 class="payslip-title">PHIẾU LƯƠNG</h1>
            <div class="payslip-subtitle">Kỳ lương tháng ${comp.salaryMonth} - Ngày chi trả: ${comp.payDate}</div>
        </div>

        <!-- THÔNG TIN NHÂN SỰ (4 CỘT) -->
        <div class="employee-info-grid">
            <div class="info-item">
                <span class="info-label">Họ và tên:</span>
                <span class="info-val">${emp.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Mã nhân viên:</span>
                <span class="info-val" style="color: #1d4ed8;">${emp.id}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Chức danh:</span>
                <span class="info-val">${emp.role}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Bộ phận:</span>
                <span class="info-val">${emp.department}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Ngày vào làm:</span>
                <span class="info-val">${emp.startDate || "---"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Ngày công (Thực tế / Chuẩn):</span>
                <span class="info-val">${emp.workDays} / ${emp.standardWorkDays} ngày</span>
            </div>
            <div class="info-item">
                <span class="info-label">Số tài khoản:</span>
                <span class="info-val">${emp.bankAccount || "---"} - ${emp.bankName || "---"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Số người phụ thuộc:</span>
                <span class="info-val">${emp.dependents || 0} người</span>
            </div>
        </div>

        <!-- BẢNG NỘI DUNG CHI TIẾT (2 CỘT: NỘI DUNG & SỐ TIỀN) -->
        <table class="salary-table">
            <thead>
                <tr>
                    <th style="text-align: left; padding-left: 12px;">NỘI DUNG</th>
                    <th style="width: 190px; text-align: right; padding-right: 12px;">SỐ TIỀN (VNĐ)</th>
                </tr>
            </thead>
            <tbody>
                <!-- PHẦN A -->
                <tr class="row-section-header">
                    <td>A. CÁC KHOẢN THU NHẬP</td>
                    <td class="col-amount" style="font-weight: 700;">${window.formatVND(emp.totalIncome)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">1. Lương cơ bản / thỏa thuận</td>
                    <td class="col-amount">${window.formatVND(emp.baseSalary)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">2. Lương theo ngày công thực tế (${emp.workDays}/${emp.standardWorkDays} công)</td>
                    <td class="col-amount">${window.formatVND(emp.workdaySalary)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">3. Phụ cấp trách nhiệm / chức vụ</td>
                    <td class="col-amount">${window.formatVND(emp.allowanceResponsibility)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">4. Phụ cấp ăn trưa</td>
                    <td class="col-amount">${window.formatVND(emp.allowanceMeal)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">5. Phụ cấp xăng xe, đi lại & điện thoại</td>
                    <td class="col-amount">${window.formatVND((emp.allowanceFuel || 0) + (emp.allowancePhone || 0))}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">6. Thưởng doanh số / KPI / Hiệu quả công việc</td>
                    <td class="col-amount">${window.formatVND(emp.bonusKPI)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">7. Lương làm thêm giờ (OT)</td>
                    <td class="col-amount">${window.formatVND(emp.overtimePay)}</td>
                </tr>

                <!-- PHẦN B -->
                <tr class="row-section-header">
                    <td>B. CÁC KHOẢN GIẢM TRỪ</td>
                    <td class="col-amount" style="font-weight: 700; color: #b91c1c;">${window.formatVND(emp.totalDeduction)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">1. Bảo hiểm xã hội (BHXH ${(comp.rateBHXH !== undefined ? comp.rateBHXH : 8)}%)</td>
                    <td class="col-amount">${window.formatVND(emp.insuranceBHXH)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">2. Bảo hiểm y tế (BHYT ${(comp.rateBHYT !== undefined ? comp.rateBHYT : 1.5)}%)</td>
                    <td class="col-amount">${window.formatVND(emp.insuranceBHYT)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">3. Bảo hiểm thất nghiệp (BHTN ${(comp.rateBHTN !== undefined ? comp.rateBHTN : 1)}%)</td>
                    <td class="col-amount">${window.formatVND(emp.insuranceBHTN)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">4. Đoàn phí công đoàn</td>
                    <td class="col-amount">${window.formatVND(emp.unionFee || 0)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">5. Thuế thu nhập cá nhân (TNCN)</td>
                    <td class="col-amount">${window.formatVND(emp.taxTNCN)}</td>
                </tr>
                <tr>
                    <td style="padding-left: 16px;">6. Tạm ứng lương trong kỳ</td>
                    <td class="col-amount">${window.formatVND(emp.advancePayment || 0)}</td>
                </tr>

                <!-- PHẦN C -->
                <tr class="row-net-salary">
                    <td style="font-weight: bold;">C. THỰC LĨNH / THỰC NHẬN (A - B)</td>
                    <td class="col-amount">${formattedNet}</td>
                </tr>
            </tbody>
        </table>

        <!-- SỐ TIỀN BẰNG CHỮ -->
        <div class="amount-in-words-box">
            <strong>Số tiền bằng chữ:</strong> ${netWords}.
        </div>

        <!-- KHU VỰC KÝ TÊN -->
        <div class="signatures-grid">
            <div class="sig-col">
                <div class="sig-title">NGƯỜI LẬP PHIẾU</div>
                <div class="sig-note">(Ký, họ tên)</div>
            </div>
            <div class="sig-col">
                <div class="sig-title">KẾ TOÁN TRƯỞNG</div>
                <div class="sig-note">(Ký, họ tên)</div>
            </div>
            <div class="sig-col">
                <div class="sig-title">GIÁM ĐỐC</div>
                <div class="sig-note">(Ký, đóng dấu)</div>
            </div>
            <div class="sig-col">
                <div class="sig-title">NGƯỜI NHẬN LƯƠNG</div>
                <div class="sig-note">(Ký, họ tên)</div>
            </div>
        </div>
    </div>
    `;
}

// Xuất file HTML đơn lẻ cho 1 nhân viên
function downloadSinglePayslipHTML(emp, comp) {
    const payslipHTML = generatePayslipHTML(emp, comp);
    const fullDocument = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phiếu Lương - ${emp.name} (${emp.id})</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; background: #eaedf2; display: flex; justify-content: center; }
        .payslip-paper { background: #fff; width: 210mm; min-height: 297mm; padding: 20mm; box-shadow: 0 4px 15px rgba(0,0,0,0.15); box-sizing: border-box; }
        .paper-header { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .company-meta .name { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #0c2d48; }
        .company-meta .detail { font-size: 12px; color: #333; font-style: italic; font-weight: normal; }
        .form-meta { text-align: right; font-size: 12px; }
        .form-code { font-weight: normal; font-size: 12px; }
        .payslip-title-block { text-align: center; margin: 15px 0; }
        .payslip-title { font-size: 22px; font-weight: bold; color: #0c2d48; margin: 0; }
        .payslip-subtitle { font-size: 13px; font-style: italic; margin-top: 4px; }
        .employee-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; background: #fbfbfb; border: 1px solid #ddd; padding: 10px 14px; margin-bottom: 14px; font-size: 13px; }
        .info-item { display: flex; }
        .info-label { width: 150px; color: #444; }
        .info-val { font-weight: bold; }
        .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
        .salary-table th, .salary-table td { border: 1px solid #222; padding: 6px 8px; }
        .salary-table th { background-color: #123359; color: #fff; text-align: center; }
        .col-stt { text-align: center; width: 40px; }
        .col-amount { text-align: right; font-family: 'Segoe UI', Arial, sans-serif; }
        .row-section-header td { background-color: #f1f5f9; font-weight: bold; }
        .row-net-salary td { background-color: #e0f2fe; font-weight: bold; color: #0369a1; font-size: 15px; }
        .amount-in-words-box { margin: 10px 0 16px; font-size: 13px; font-style: italic; padding: 6px 10px; background: #fdfdfd; border-left: 3px solid #123359; }
        .signatures-grid { display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; margin-top: 25px; }
        .sig-title { font-weight: bold; font-size: 13px; }
        .sig-note { font-size: 11px; color: #555; font-style: italic; margin-bottom: 50px; }
        .sig-name { font-weight: bold; font-size: 13px; }
        @media print {
            body { background: #fff; margin: 0; }
            .payslip-paper { box-shadow: none; width: 100%; padding: 10mm; }
        }
    </style>
</head>
<body>
    ${payslipHTML}
</body>
</html>`;

    const blob = new Blob([fullDocument], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PhieuLuong_${emp.id}_${emp.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

window.generatePayslipHTML = generatePayslipHTML;
window.downloadSinglePayslipHTML = downloadSinglePayslipHTML;
