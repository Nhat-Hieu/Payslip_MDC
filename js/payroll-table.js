/**
 * payroll-table.js
 * Bảng lương tổng hợp toàn bộ nhân viên (Master Payroll Sheet) & Xuất Excel/CSV
 */

function renderPayrollTableTab(containerId, employees) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let rowsHtml = "";
    employees.forEach(emp => {
        rowsHtml += `
            <tr>
                <td class="col-sticky-1" style="text-align: center; font-weight: 500;">${emp.stt}</td>
                <td class="col-sticky-2" style="font-weight: 600; color: #1d4ed8; text-align: center;">${emp.id}</td>
                <td class="col-sticky-3" style="font-weight: 600;">${emp.name}</td>
                <td>${emp.department}</td>
                <td style="text-align: center;">${emp.workDays}/${emp.standardWorkDays}</td>
                <td style="text-align: right;">${window.formatVND(emp.baseSalary)}</td>
                <td style="text-align: right;">${window.formatVND(emp.workdaySalary)}</td>
                <td style="text-align: right;">${window.formatVND(emp.allowanceResponsibility)}</td>
                <td style="text-align: right;">${window.formatVND(emp.allowanceMeal)}</td>
                <td style="text-align: right;">${window.formatVND((emp.allowanceFuel || 0) + (emp.allowancePhone || 0))}</td>
                <td style="text-align: right;">${window.formatVND(emp.bonusKPI)}</td>
                <td style="text-align: right;">${window.formatVND(emp.overtimePay)}</td>
                <td style="text-align: right; font-weight: bold; background-color: #f8fafc;">${window.formatVND(emp.totalIncome)}</td>
                <td style="text-align: right;">${window.formatVND(emp.insuranceBHXH)}</td>
                <td style="text-align: right;">${window.formatVND(emp.insuranceBHYT)}</td>
                <td style="text-align: right;">${window.formatVND(emp.insuranceBHTN)}</td>
                <td style="text-align: right;">${window.formatVND(emp.taxTNCN)}</td>
                <td style="text-align: right;">${window.formatVND(emp.advancePayment || 0)}</td>
                <td style="text-align: right; font-weight: bold; color: #1d4ed8; background-color: #eff6ff;">${window.formatVND(emp.netSalary)}</td>
                <td>${emp.bankAccount || "-"}</td>
                <td>${emp.bankName || "-"}</td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="payroll-tab-wrapper">
            <div class="payroll-toolbar">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: 600; font-size: 14px; color: #0f172a;">Bảng Lương Tháng ${window.COMPANY_INFO.salaryMonth}</span>
                    <span style="background: #e2e8f0; font-size: 11.5px; padding: 2px 8px; border-radius: 4px; font-weight: 600; color: #334155;">${employees.length} Nhân sự</span>
                </div>
            </div>
            <div class="table-scroll-container">
                <table class="payroll-master-table">
                    <thead>
                        <tr>
                            <th class="col-sticky-1">STT</th>
                            <th class="col-sticky-2">Mã NV</th>
                            <th class="col-sticky-3">Họ và Tên</th>
                            <th>Bộ phận</th>
                            <th style="width: 75px;">Công</th>
                            <th>Lương CB</th>
                            <th>Lương ngày</th>
                            <th>PC Trách nhiệm</th>
                            <th>PC Ăn trưa</th>
                            <th>PC Xăng & ĐT</th>
                            <th>Thưởng KPI</th>
                            <th>Làm thêm (OT)</th>
                            <th style="background: #0f274a;">Tổng Gross</th>
                            <th>BHXH 8%</th>
                            <th>BHYT 1.5%</th>
                            <th>BHTN 1%</th>
                            <th>Thuế TNCN</th>
                            <th>Tạm ứng</th>
                            <th style="background: #0f274a; color: #38bdf8;">Thực Lĩnh (VND)</th>
                            <th>Số tài khoản</th>
                            <th>Ngân hàng</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Xuất toàn bộ bảng lương ra file Excel (.xlsx) qua SheetJS
function exportPayrollToExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Thư viện Excel đang tải, vui lòng thử lại sau 2 giây!");
        return;
    }

    const data = [
        [window.COMPANY_INFO.name],
        [`BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG ${window.COMPANY_INFO.salaryMonth}`],
        [`Ngày chi trả: ${window.COMPANY_INFO.payDate}`],
        [],
        [
            "STT", "Mã NV", "Họ và Tên", "Bộ phận", "Ngày vào làm", 
            "Ngày công", "Ngày chuẩn", "Lương CB", "Lương công thực tế", "PC Trách nhiệm", 
            "PC Ăn trưa", "PC Xăng & ĐT", "Thưởng KPI", "Làm thêm OT", "Tổng Thu Nhập (Gross)", 
            "BHXH (8%)", "BHYT (1.5%)", "BHTN (1%)", "Đoàn phí", "Thuế TNCN", "Tạm ứng", 
            "Tổng Giảm Trừ", "THỰC LĨNH (NET)", "Số Tài Khoản", "Ngân Hàng"
        ]
    ];

    window.EMPLOYEES.forEach(emp => {
        data.push([
            emp.stt,
            emp.id,
            emp.name,
            emp.department,
            emp.startDate || "",
            emp.workDays,
            emp.standardWorkDays,
            emp.baseSalary,
            emp.workdaySalary,
            emp.allowanceResponsibility,
            emp.allowanceMeal,
            (emp.allowanceFuel || 0) + (emp.allowancePhone || 0),
            emp.bonusKPI,
            emp.overtimePay,
            emp.totalIncome,
            emp.insuranceBHXH,
            emp.insuranceBHYT,
            emp.insuranceBHTN,
            emp.unionFee || 0,
            emp.taxTNCN,
            emp.advancePayment || 0,
            emp.totalDeduction,
            emp.netSalary,
            emp.bankAccount || "",
            emp.bankName || ""
        ]);
    });

    // Dòng tổng
    const totalGross = window.EMPLOYEES.reduce((s, e) => s + e.totalIncome, 0);
    const totalBHXH = window.EMPLOYEES.reduce((s, e) => s + e.insuranceBHXH, 0);
    const totalBHYT = window.EMPLOYEES.reduce((s, e) => s + e.insuranceBHYT, 0);
    const totalBHTN = window.EMPLOYEES.reduce((s, e) => s + e.insuranceBHTN, 0);
    const totalTax = window.EMPLOYEES.reduce((s, e) => s + e.taxTNCN, 0);
    const totalDeduct = window.EMPLOYEES.reduce((s, e) => s + e.totalDeduction, 0);
    const totalNet = window.EMPLOYEES.reduce((s, e) => s + e.netSalary, 0);

    data.push([
        "", "", "TỔNG CỘNG", "", "", "", "", "", "", "", "", "", "", "",
        totalGross, totalBHXH, totalBHYT, totalBHTN, "", totalTax, "", totalDeduct, totalNet, "", ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Luong_T${window.COMPANY_INFO.salaryMonth.replace('/', '_')}`);

    XLSX.writeFile(wb, `BangLuong_MocDongChau_${window.COMPANY_INFO.salaryMonth.replace('/', '_')}.xlsx`);
    if (window.showToast) window.showToast("Đã xuất file Excel thành công!", "success");
}

// Xuất CSV
function exportPayrollToCSV() {
    let csvContent = "\uFEFFSTT,Mã NV,Họ và Tên,Bộ phận,Ngày công,Lương CB,Tổng Gross,BHXH,Thuế TNCN,Thực Lĩnh,Số TK,Ngân Hàng\n";
    window.EMPLOYEES.forEach(emp => {
        csvContent += `"${emp.stt}","${emp.id}","${emp.name}","${emp.department}","${emp.workDays}","${emp.baseSalary}","${emp.totalIncome}","${emp.insuranceBHXH}","${emp.taxTNCN}","${emp.netSalary}","'${emp.bankAccount}'","${emp.bankName}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BangLuong_${window.COMPANY_INFO.salaryMonth.replace('/', '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast("Đã xuất file CSV thành công!", "success");
}

window.renderPayrollTableTab = renderPayrollTableTab;
window.exportPayrollToExcel = exportPayrollToExcel;
window.exportPayrollToCSV = exportPayrollToCSV;
