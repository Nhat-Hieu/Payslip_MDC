/**
 * app.js
 * Quản lý logic chính của ứng dụng Quản lý & In Phiếu Lương
 */

let currentEmployeeId = "HM001";
let activeTab = "payslip";
let filteredEmployees = [];

// Khởi tạo ứng dụng khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    // Khởi tạo danh sách phòng ban vào bộ lọc
    populateDepartmentFilter();

    // Lắng nghe sự kiện tìm kiếm & lọc
    const searchInput = document.getElementById("searchInput");
    const deptFilter = document.getElementById("deptFilter");
    const sortSelect = document.getElementById("sortSelect");

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (deptFilter) deptFilter.addEventListener("change", applyFilters);
    if (sortSelect) sortSelect.addEventListener("change", applyFilters);

    // Kéo thả file Excel vào vùng drop
    setupDragAndDrop();

    // Hiển thị ban đầu
    refreshAllViews();

    // Tự động căn chỉnh zoom vừa vặn khung hình khi vào trang lần đầu
    setTimeout(() => {
        zoomFit();
    }, 120);
}

function populateDepartmentFilter() {
    const deptFilter = document.getElementById("deptFilter");
    if (!deptFilter) return;

    const currentVal = deptFilter.value || "Tất cả bộ phận";
    const deptSet = new Set();
    (window.EMPLOYEES || []).forEach(e => {
        if (e.department && e.department.trim()) deptSet.add(e.department.trim());
    });

    const deptList = ["Tất cả bộ phận", ...Array.from(deptSet)];
    window.DEPARTMENTS = deptList;

    deptFilter.innerHTML = "";
    deptList.forEach(dept => {
        const opt = document.createElement("option");
        opt.value = dept;
        opt.textContent = dept;
        if (dept === currentVal) opt.selected = true;
        deptFilter.appendChild(opt);
    });
}

let taxFilterOnly = false;

function toggleTaxFilter() {
    taxFilterOnly = !taxFilterOnly;
    const badge = document.getElementById("taxFilterBadge");
    const card = document.getElementById("kpiCardTax");

    if (badge) badge.style.display = taxFilterOnly ? "inline-block" : "none";
    if (card) {
        if (taxFilterOnly) {
            card.style.borderColor = "#ef4444";
            card.style.background = "#fef2f2";
            showToast("Đang lọc hiển thị các nhân sự có phát sinh thuế TNCN", "info");
        } else {
            card.style.borderColor = "";
            card.style.background = "";
            showToast("Đã hiển thị lại toàn bộ nhân sự", "info");
        }
    }

    if (activeTab !== "payslip") {
        switchTab("payslip");
    }

    applyFilters();
}
window.toggleTaxFilter = toggleTaxFilter;

function applyFilters() {
    const searchVal = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const deptVal = document.getElementById("deptFilter")?.value || "Tất cả bộ phận";
    const sortVal = document.getElementById("sortSelect")?.value || "stt";

    let result = [...window.EMPLOYEES];

    // 1. Lọc theo bộ phận
    if (deptVal !== "Tất cả bộ phận") {
        result = result.filter(e => e.department === deptVal);
    }

    // 2. Lọc người có phát sinh thuế TNCN
    if (taxFilterOnly) {
        result = result.filter(e => (e.taxTNCN || 0) > 0);
    }

    // 3. Tìm kiếm theo Tên, Mã NV, Chức vụ
    if (searchVal) {
        result = result.filter(e =>
            e.name.toLowerCase().includes(searchVal) ||
            e.id.toLowerCase().includes(searchVal) ||
            e.role.toLowerCase().includes(searchVal) ||
            (e.bankAccount && e.bankAccount.includes(searchVal))
        );
    }

    // 4. Sắp xếp
    if (sortVal === "stt") {
        result.sort((a, b) => a.stt - b.stt);
    } else if (sortVal === "name") {
        result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (sortVal === "id") {
        result.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sortVal === "net-desc") {
        result.sort((a, b) => b.netSalary - a.netSalary);
    } else if (sortVal === "net-asc") {
        result.sort((a, b) => a.netSalary - b.netSalary);
    } else if (sortVal === "tax-desc") {
        result.sort((a, b) => (b.taxTNCN || 0) - (a.taxTNCN || 0));
    }

    filteredEmployees = result;
    renderSidebarList();
}

function renderSidebarList() {
    const listContainer = document.getElementById("employeeList");
    const countInfo = document.getElementById("sidebarSummaryCount");
    const totalInfo = document.getElementById("sidebarSummaryTotal");

    if (!listContainer) return;

    // Cập nhật tổng
    const totalNet = filteredEmployees.reduce((sum, e) => sum + e.netSalary, 0);
    if (countInfo) {
        if (taxFilterOnly) {
            countInfo.innerHTML = `<span style="color: #b91c1c; font-weight: 700;">${filteredEmployees.length} người có thuế</span> <span onclick="window.toggleTaxFilter()" style="cursor:pointer; text-decoration:underline; margin-left:4px; font-weight:normal;" title="Bỏ lọc">(bỏ lọc)</span>`;
        } else {
            countInfo.textContent = `${filteredEmployees.length}/${window.EMPLOYEES.length} người`;
        }
    }
    if (totalInfo) {
        if (taxFilterOnly) {
            const totalTax = filteredEmployees.reduce((sum, e) => sum + (e.taxTNCN || 0), 0);
            totalInfo.innerHTML = `<span style="color: #b91c1c; font-weight: 700;">Thuế: ${window.formatVND(totalTax)} đ</span>`;
        } else {
            totalInfo.textContent = `${window.formatVND(totalNet)} đ`;
        }
    }

    if (filteredEmployees.length === 0) {
        listContainer.innerHTML = `
            <div style="padding: 30px 15px; text-align: center; color: #94a3b8; font-size: 13px;">
                Không tìm thấy nhân sự phù hợp
            </div>
        `;
        return;
    }

    let html = "";
    filteredEmployees.forEach(emp => {
        const isActive = emp.id === currentEmployeeId;
        const taxBadge = taxFilterOnly
            ? `<div style="font-size: 11px; color: #dc2626; font-weight: 600; margin-top: 1px;">Thuế TNCN: ${window.formatVND(emp.taxTNCN)} đ</div>`
            : "";
        html += `
            <div class="employee-card ${isActive ? 'active' : ''}" onclick="window.selectEmployeeById('${emp.id}')">
                <div class="card-stt">${emp.stt}</div>
                <div class="card-info">
                    <div class="card-name">${emp.name}</div>
                    <div class="card-role">
                        <span>${emp.id}</span>
                        <span>•</span>
                        <span>${emp.role}</span>
                    </div>
                    ${taxBadge}
                </div>
                <div class="card-amount">${window.formatVND(emp.netSalary)}</div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function selectEmployeeById(id) {
    currentEmployeeId = id;
    renderSidebarList();
    renderCurrentPayslip();

    // Nếu đang ở Tab khác thì tự động chuyển về Tab Phiếu lương để xem
    if (activeTab !== "payslip") {
        switchTab("payslip");
    }
}

function getCurrentEmployee() {
    const found = window.EMPLOYEES.find(e => e.id === currentEmployeeId);
    return found || window.EMPLOYEES[0] || null;
}

function renderCurrentPayslip() {
    const paperContainer = document.getElementById("payslipContainer");
    if (!paperContainer) return;

    const emp = getCurrentEmployee();
    if (!emp) {
        paperContainer.innerHTML = `<div style="padding: 40px; color: #666;">Chưa có dữ liệu nhân viên</div>`;
        return;
    }

    paperContainer.innerHTML = window.generatePayslipHTML(emp, window.COMPANY_INFO);
    applyZoom();
}

// Chuyển đổi qua lại giữa các Tab
function switchTab(tabName) {
    activeTab = tabName;

    // Cập nhật nút tab
    document.querySelectorAll(".tab-btn").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Cập nhật tab pane
    document.querySelectorAll(".tab-pane").forEach(pane => {
        if (pane.id === `tab-${tabName}`) {
            pane.classList.add("active");
        } else {
            pane.classList.remove("active");
        }
    });

    // Render nội dung tương ứng của từng tab
    if (tabName === "payslip") {
        renderCurrentPayslip();
        setTimeout(() => {
            zoomFit();
        }, 80);
    } else if (tabName === "department") {
        window.renderDepartmentTab("deptTabContent", window.EMPLOYEES);
    } else if (tabName === "payroll") {
        window.renderPayrollTableTab("payrollTabContent", window.EMPLOYEES);
    } else if (tabName === "audit") {
        window.renderAuditTab("auditTabContent", window.EMPLOYEES);
    }
}

// Tính toán và hiển thị thanh 6 KPI dưới Header
function updateTopKpis() {
    const employees = window.EMPLOYEES || [];
    const totalGross = employees.reduce((s, e) => s + (e.totalIncome || 0), 0);
    const totalInsurance = employees.reduce((s, e) => s + (e.insuranceBHXH || 0) + (e.insuranceBHYT || 0) + (e.insuranceBHTN || 0), 0);
    const totalTax = employees.reduce((s, e) => s + (e.taxTNCN || 0), 0);
    const totalDeduction = employees.reduce((s, e) => s + (e.totalDeduction || 0), 0);
    const totalNet = employees.reduce((s, e) => s + (e.netSalary || 0), 0);
    const totalHeadcount = employees.length;

    const elGross = document.getElementById("topKpiGross");
    const elIns = document.getElementById("topKpiInsurance");
    const elTax = document.getElementById("topKpiTax");
    const elTaxCount = document.getElementById("topKpiTaxCount");
    const elDeduct = document.getElementById("topKpiDeduction");
    const elNet = document.getElementById("topKpiNet");
    const elAvgNet = document.getElementById("topKpiAvgNet");
    const elCount = document.getElementById("topKpiHeadcount");
    const elDeptCount = document.getElementById("topKpiDeptCount");

    const taxCount = employees.filter(e => (e.taxTNCN || 0) > 0).length;
    const avgNet = totalHeadcount > 0 ? Math.round(totalNet / totalHeadcount) : 0;
    const depts = new Set(employees.map(e => e.department)).size;

    const insPercent = totalGross > 0 ? ((totalInsurance / totalGross) * 100).toFixed(1) : "0.0";
    const elInsSub = document.getElementById("topKpiInsuranceSub");
    if (elInsSub) {
        elInsSub.textContent = `Thực tế: ${insPercent}% quỹ lương (từng người)`;
    }

    if (elGross) elGross.textContent = `${window.formatVND(totalGross)} đ`;
    if (elIns) elIns.textContent = `${window.formatVND(totalInsurance)} đ`;
    if (elTax) elTax.textContent = `${window.formatVND(totalTax)} đ`;
    if (elTaxCount) elTaxCount.textContent = `${taxCount} người phát sinh thuế (Bấm để xem)`;
    if (elDeduct) elDeduct.textContent = `${window.formatVND(totalDeduction)} đ`;
    if (elNet) elNet.textContent = `${window.formatVND(totalNet)} đ`;
    if (elAvgNet) elAvgNet.textContent = `Bình quân ${window.formatVND(avgNet)} đ/người`;
    if (elCount) elCount.textContent = `${totalHeadcount}`;
    if (elDeptCount) elDeptCount.textContent = `${depts} bộ phận`;
}

// Làm mới tất cả các view
function refreshAllViews() {
    // Cập nhật header công ty
    const headerTitle = document.getElementById("headerCompanyTitle");
    const headerMeta = document.getElementById("headerMetaInfo");
    if (headerTitle) headerTitle.textContent = window.COMPANY_INFO.name;
    if (headerMeta) {
        headerMeta.innerHTML = `
            <span>Bảng lương tháng ${window.COMPANY_INFO.salaryMonth}</span>
            <span class="separator">•</span>
            <span>Ngày chi trả: ${window.COMPANY_INFO.payDate}</span>
            <span class="separator">•</span>
            <span id="headerStandardDays">Ngày công chuẩn: ${window.COMPANY_INFO.standardWorkDays || 26} ngày</span>
        `;
    }

    populateDepartmentFilter();
    updateTopKpis();
    applyFilters();
    switchTab(activeTab);
}

// CHẾ ĐỘ XUẤT: 'print' (In / Lưu PDF) hoặc 'download' (Tải PDF)
let currentExportMode = 'print';

// Chuyển đổi qua lại giữa In / Lưu PDF và Tải PDF
function setExportMode(mode) {
    currentExportMode = mode;
    const switchEl = document.getElementById("exportSwitch");
    const btnPrint = document.getElementById("segBtnPrint");
    const btnDownload = document.getElementById("segBtnDownload");
    const btnMain = document.getElementById("btnMainExportAction");
    const btnAll = document.getElementById("btnAllExportAction");
    const btnRange = document.getElementById("btnRangeExportAction");
    const noticeText = document.getElementById("exportNoticeText");

    if (mode === 'download') {
        if (switchEl) switchEl.classList.add("mode-download");
        if (btnPrint) btnPrint.classList.remove("active");
        if (btnDownload) btnDownload.classList.add("active");

        if (btnMain) {
            btnMain.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> <span>Tải PDF phiếu đang xem</span>`;
            btnMain.title = "Tải trực tiếp tệp .pdf chuẩn khổ A4 của nhân sự đang chọn về máy tính";
        }
        if (btnAll) {
            btnAll.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> <span>Tải tất cả (.ZIP)</span>`;
            btnAll.title = "Tải toàn bộ phiếu lương dạng file nén .zip";
        }
        if (btnRange) {
            btnRange.innerHTML = `Tải khoảng`;
            btnRange.title = "Tải các phiếu theo khoảng STT chỉ định";
        }
        if (noticeText) {
            noticeText.innerHTML = `<strong>Tải PDF trực tiếp:</strong> Hệ thống tự động kết xuất và tải tệp .PDF chuẩn khổ A4 về máy tính (không cần qua hộp thoại in). Đầy đủ nội dung chữ ký và biểu mẫu.`;
        }
    } else {
        if (switchEl) switchEl.classList.remove("mode-download");
        if (btnPrint) btnPrint.classList.add("active");
        if (btnDownload) btnDownload.classList.remove("active");

        if (btnMain) {
            btnMain.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg> <span>In phiếu đang xem</span>`;
            btnMain.title = "Mở hộp thoại in trình duyệt để in ra giấy hoặc Lưu dưới dạng PDF (Ctrl+P)";
        }
        if (btnAll) {
            btnAll.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> <span>In tất cả</span>`;
            btnAll.title = "In toàn bộ 48 phiếu lương (mỗi nhân sự 1 trang A4)";
        }
        if (btnRange) {
            btnRange.innerHTML = `In khoảng`;
            btnRange.title = "In các phiếu theo khoảng STT chỉ định";
        }
        if (noticeText) {
            noticeText.innerHTML = `<strong>In / Lưu PDF cho bản nét nhất (chữ vector, đúng khổ A4).</strong> Trong hộp thoại in chọn <em>Đích: Save as PDF</em>, <em>Lề (Margins): None</em>, và bật <em>Background graphics</em>. <strong>Mẹo:</strong> gõ tên/mã rồi nhấn <em>Enter</em> để in ngay phiếu đó; dùng <em>↑ ↓</em> để chuyển người.`;
        }
    }
}

// Thực thi hành động xuất cho phiếu hiện tại theo chế độ đang chọn
function executeCurrentExportAction() {
    if (currentExportMode === 'download') {
        downloadCurrentPayslipPDF();
    } else {
        printCurrentPayslip();
    }
}

// Thực thi hành động xuất cho tất cả phiếu theo chế độ đang chọn
function executeAllExportAction() {
    if (currentExportMode === 'download') {
        downloadAllPayslipsZip();
    } else {
        printAllPayslips();
    }
}

// Thực thi hành động xuất theo khoảng STT theo chế độ đang chọn
function executeRangeExportAction() {
    const fromVal = parseInt(document.getElementById("rangeFrom")?.value || "1", 10);
    const toVal = parseInt(document.getElementById("rangeTo")?.value || "10", 10);

    if (currentExportMode === 'download') {
        downloadRangePayslipsZip(fromVal, toVal);
    } else {
        printRangePayslips();
    }
}

// In phiếu lương đang xem (hoặc lưu PDF qua hộp thoại in của trình duyệt)
function printCurrentPayslip() {
    const emp = getCurrentEmployee();
    if (!emp) return;

    // Thiết lập vùng in đơn lẻ
    const batchContainer = document.getElementById("batchPrintContainer");
    if (batchContainer) {
        batchContainer.innerHTML = window.generatePayslipHTML(emp, window.COMPANY_INFO);
    }

    window.print();
}

// Tải file PDF trực tiếp cho phiếu lương đang xem (sử dụng html2pdf)
function downloadCurrentPayslipPDF() {
    const emp = getCurrentEmployee();
    if (!emp) return;

    const paperEl = document.querySelector("#payslipContainer .payslip-paper");
    if (!paperEl) {
        showToast("Không tìm thấy nội dung phiếu lương!", "warning");
        return;
    }

    if (typeof html2pdf === 'undefined') {
        showToast("Đang mở hộp thoại in để lưu file PDF...", "info");
        printCurrentPayslip();
        return;
    }

    const btn = document.getElementById("btnMainExportAction");
    const originalText = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> <span>Đang tạo PDF...</span>`;
    }
    showToast(`Đang xuất file PDF cho ${emp.name}...`, "info");

    const opt = {
        margin: 0,
        filename: `PhieuLuong_${emp.id}_${emp.name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(paperEl).save().then(() => {
        showToast(`Đã tải file PDF cho ${emp.name} thành công!`, "success");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }).catch(err => {
        console.error("Lỗi khi tạo PDF:", err);
        showToast("Có lỗi khi tạo PDF, mở hộp thoại in để lưu...", "warning");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
        printCurrentPayslip();
    });
}

// In toàn bộ 48 phiếu lương (Mỗi người 1 trang A4)
function printAllPayslips() {
    const batchContainer = document.getElementById("batchPrintContainer");
    if (!batchContainer) return;

    let allHtml = "";
    window.EMPLOYEES.forEach(emp => {
        allHtml += window.generatePayslipHTML(emp, window.COMPANY_INFO);
    });

    batchContainer.innerHTML = allHtml;
    showToast(`Đang chuẩn bị in toàn bộ ${window.EMPLOYEES.length} phiếu lương...`, "success");
    setTimeout(() => {
        window.print();
    }, 300);
}

// In theo khoảng chỉ định (Ví dụ từ phiếu X đến Y)
function printRangePayslips() {
    const fromVal = parseInt(document.getElementById("rangeFrom")?.value || "1", 10);
    const toVal = parseInt(document.getElementById("rangeTo")?.value || "10", 10);

    const selected = window.EMPLOYEES.filter(e => e.stt >= fromVal && e.stt <= toVal);
    if (selected.length === 0) {
        alert(`Không tìm thấy phiếu nào trong khoảng từ ${fromVal} đến ${toVal}!`);
        return;
    }

    const batchContainer = document.getElementById("batchPrintContainer");
    if (!batchContainer) return;

    let html = "";
    selected.forEach(emp => {
        html += window.generatePayslipHTML(emp, window.COMPANY_INFO);
    });

    batchContainer.innerHTML = html;
    showToast(`Đang chuẩn bị in ${selected.length} phiếu lương (từ STT ${fromVal} đến ${toVal})...`, "success");
    setTimeout(() => {
        window.print();
    }, 300);
}

// Tải phiếu đang xem dạng HTML đơn lẻ
function downloadCurrentPayslip() {
    const emp = getCurrentEmployee();
    if (emp) {
        window.downloadSinglePayslipHTML(emp, window.COMPANY_INFO);
        showToast(`Đã tải phiếu lương ${emp.name} thành công!`, "success");
    }
}

// Tải tất cả phiếu lương thành file nén ZIP
async function downloadAllPayslipsZip() {
    if (typeof JSZip === 'undefined') {
        alert("Thư viện JSZip đang tải, vui lòng thử lại sau giây lát!");
        return;
    }

    showToast("Đang tạo gói ZIP các phiếu lương...", "info");
    const zip = new JSZip();
    const folder = zip.folder(`PhieuLuong_MocDongChau_T${window.COMPANY_INFO.salaryMonth.replace('/', '')}`);

    window.EMPLOYEES.forEach(emp => {
        const payslipHTML = window.generatePayslipHTML(emp, window.COMPANY_INFO);
        const fullDoc = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Phiếu lương - ${emp.name}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; }
        .payslip-paper { width: 100%; border: 1px solid #333; padding: 20px; }
        .paper-header { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .company-meta .name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .employee-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 15px 0; border: 1px solid #ccc; padding: 10px; }
        .salary-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .salary-table th, .salary-table td { border: 1px solid #333; padding: 5px 8px; }
        .salary-table th { background: #123359; color: #fff; }
        .col-amount { text-align: right; }
        .row-net-salary td { font-weight: bold; background: #e0f2fe; }
        .signatures-grid { display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; margin-top: 25px; }
        .sig-note { font-style: italic; font-size: 11px; margin-bottom: 40px; }
    </style>
</head>
<body>
    ${payslipHTML}
</body>
</html>`;
        folder.file(`PL_${emp.id}_${emp.name.replace(/\s+/g, '_')}.html`, fullDoc);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PhieuLuong_MocDongChau_T${window.COMPANY_INFO.salaryMonth.replace('/', '')}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Đã tải xong file nén ZIP tất cả phiếu lương!", "success");
}

// Tải các phiếu theo khoảng STT thành file nén ZIP
async function downloadRangePayslipsZip(fromVal, toVal) {
    if (typeof JSZip === 'undefined') {
        alert("Thư viện JSZip đang tải, vui lòng thử lại sau giây lát!");
        return;
    }

    const selected = window.EMPLOYEES.filter(e => e.stt >= fromVal && e.stt <= toVal);
    if (selected.length === 0) {
        alert(`Không tìm thấy phiếu nào trong khoảng từ ${fromVal} đến ${toVal}!`);
        return;
    }

    showToast(`Đang tạo gói ZIP ${selected.length} phiếu lương (từ ${fromVal} đến ${toVal})...`, "info");
    const zip = new JSZip();
    const folder = zip.folder(`PhieuLuong_T${window.COMPANY_INFO.salaryMonth.replace('/', '')}_STT_${fromVal}_${toVal}`);

    selected.forEach(emp => {
        const payslipHTML = window.generatePayslipHTML(emp, window.COMPANY_INFO);
        const fullDoc = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Phiếu lương - ${emp.name}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; }
        .payslip-paper { width: 100%; border: 1px solid #333; padding: 20px; }
        .paper-header { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .company-meta .name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .employee-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 15px 0; border: 1px solid #ccc; padding: 10px; }
        .salary-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .salary-table th, .salary-table td { border: 1px solid #333; padding: 5px 8px; }
        .salary-table th { background: #123359; color: #fff; }
        .col-amount { text-align: right; }
        .row-net-salary td { font-weight: bold; background: #e0f2fe; }
        .signatures-grid { display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; margin-top: 25px; }
        .sig-note { font-style: italic; font-size: 11px; margin-bottom: 40px; }
    </style>
</head>
<body>
    ${payslipHTML}
</body>
</html>`;
        folder.file(`PL_${emp.id}_${emp.name.replace(/\s+/g, '_')}.html`, fullDoc);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PhieuLuong_STT_${fromVal}_${toVal}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã tải xong gói ZIP ${selected.length} phiếu lương!`, "success");
}

// Thiết lập kéo thả file
function setupDragAndDrop() {
    const dropZone = document.getElementById("fileDropZone");
    const fileInput = document.getElementById("excelFileInput");

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
            window.handleFileImport(e.target.files[0]);
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files[0]) {
            window.handleFileImport(dt.files[0]);
        }
    });
}

// Toast thông báo
function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

// Modal Cấu hình thông tin công ty
function openCompanySettingsModal() {
    const modal = document.getElementById("companySettingsModal");
    if (!modal) return;

    document.getElementById("settingCompName").value = window.COMPANY_INFO.name;
    document.getElementById("settingFactoryAddress").value = window.COMPANY_INFO.factoryAddress || "";
    document.getElementById("settingShowroomAddress").value = window.COMPANY_INFO.showroomAddress || "";
    document.getElementById("settingCompTax").value = window.COMPANY_INFO.taxCode;
    document.getElementById("settingCompPhone").value = window.COMPANY_INFO.phone;
    document.getElementById("settingSalaryMonth").value = window.COMPANY_INFO.salaryMonth;
    document.getElementById("settingPayDate").value = window.COMPANY_INFO.payDate;
    const stdDaysInput = document.getElementById("settingStandardDays");
    if (stdDaysInput) stdDaysInput.value = window.COMPANY_INFO.standardWorkDays || 26;

    const rateBHXHInput = document.getElementById("settingRateBHXH");
    if (rateBHXHInput) rateBHXHInput.value = window.COMPANY_INFO.rateBHXH !== undefined ? window.COMPANY_INFO.rateBHXH : 8;
    const rateBHYTInput = document.getElementById("settingRateBHYT");
    if (rateBHYTInput) rateBHYTInput.value = window.COMPANY_INFO.rateBHYT !== undefined ? window.COMPANY_INFO.rateBHYT : 1.5;
    const rateBHTNInput = document.getElementById("settingRateBHTN");
    if (rateBHTNInput) rateBHTNInput.value = window.COMPANY_INFO.rateBHTN !== undefined ? window.COMPANY_INFO.rateBHTN : 1;

    modal.classList.add("active");
}

function closeCompanySettingsModal() {
    const modal = document.getElementById("companySettingsModal");
    if (modal) modal.classList.remove("active");
}

function saveCompanySettings() {
    window.COMPANY_INFO.name = document.getElementById("settingCompName").value.trim();
    window.COMPANY_INFO.factoryAddress = document.getElementById("settingFactoryAddress").value.trim();
    window.COMPANY_INFO.showroomAddress = document.getElementById("settingShowroomAddress").value.trim();
    window.COMPANY_INFO.address = `Nhà máy: ${window.COMPANY_INFO.factoryAddress} | Showroom: ${window.COMPANY_INFO.showroomAddress}`;
    window.COMPANY_INFO.taxCode = document.getElementById("settingCompTax").value.trim();
    window.COMPANY_INFO.phone = document.getElementById("settingCompPhone").value.trim();
    window.COMPANY_INFO.salaryMonth = document.getElementById("settingSalaryMonth").value.trim();
    window.COMPANY_INFO.payDate = document.getElementById("settingPayDate").value.trim();

    const stdDaysInput = document.getElementById("settingStandardDays");
    if (stdDaysInput) {
        const val = parseInt(stdDaysInput.value, 10);
        if (!isNaN(val) && val > 0) {
            window.COMPANY_INFO.standardWorkDays = val;
        }
    }

    const bhxhInput = document.getElementById("settingRateBHXH");
    if (bhxhInput && !isNaN(parseFloat(bhxhInput.value))) {
        window.COMPANY_INFO.rateBHXH = parseFloat(bhxhInput.value);
    }
    const bhytInput = document.getElementById("settingRateBHYT");
    if (bhytInput && !isNaN(parseFloat(bhytInput.value))) {
        window.COMPANY_INFO.rateBHYT = parseFloat(bhytInput.value);
    }
    const bhtnInput = document.getElementById("settingRateBHTN");
    if (bhtnInput && !isNaN(parseFloat(bhtnInput.value))) {
        window.COMPANY_INFO.rateBHTN = parseFloat(bhtnInput.value);
    }

    // Tự động tính toán lại bảng lương theo tỷ lệ bảo hiểm mới cho toàn bộ nhân sự (trừ những dòng có số cố định từ file Excel)
    if (window.EMPLOYEES && window.EMPLOYEES.length > 0) {
        window.EMPLOYEES = window.EMPLOYEES.map(emp => {
            const raw = { ...emp };
            if (!emp.hasExcelInsurance) {
                delete raw.insuranceBHXH;
                delete raw.insuranceBHYT;
                delete raw.insuranceBHTN;
            }
            if (!emp.hasExcelTax) {
                delete raw.taxTNCN;
            }
            delete raw.totalDeduction;
            delete raw.netSalary;
            return window.calculateSalaryRecord(raw);
        });
    }

    refreshAllViews();
    closeCompanySettingsModal();
    showToast("Đã cập nhật thông tin công ty và tỷ lệ bảo hiểm thành công!", "success");
}

// Quản lý Zoom xem trước phiếu lương (Mặc định 1.1: hiển thị to, rõ, thấy từ đầu đến hết thanh tiêu đề xanh)
let currentZoom = 1.1;

function zoomIn() {
    currentZoom = Math.min(Math.round((currentZoom + 0.1) * 100) / 100, 1.6);
    applyZoom();
}

function zoomOut() {
    currentZoom = Math.max(Math.round((currentZoom - 0.1) * 100) / 100, 0.5);
    applyZoom();
}

function zoomFit() {
    // Vừa khung chuẩn to rõ 1.1 (thấy từ đầu đến ngang dòng tiêu đề xanh)
    const scrollContainer = document.querySelector(".paper-scroll-container");
    const paper = document.querySelector("#payslipContainer .payslip-paper");

    if (scrollContainer && paper) {
        const availWidth = scrollContainer.clientWidth - 28;
        const paperWidth = paper.offsetWidth || 794;
        // Nếu màn hình quá hẹp nhỏ hơn khổ A4 thì tự co vừa chiều ngang, còn bình thường luôn là 1.1
        if (availWidth > 0 && paperWidth > 0 && availWidth < (paperWidth * 1.1)) {
            currentZoom = Math.round((availWidth / paperWidth) * 100) / 100;
        } else {
            currentZoom = 1.1;
        }
    } else {
        currentZoom = 1.1;
    }

    applyZoom();

    // Cuộn về đỉnh để thấy từ đầu đến dòng tiêu đề xanh
    if (scrollContainer) {
        scrollContainer.scrollTop = 0;
    }
}

function applyZoom() {
    const container = document.getElementById("payslipContainer");
    const paper = document.querySelector("#payslipContainer .payslip-paper");
    if (!container) return;

    container.style.transform = `scale(${currentZoom})`;
    container.style.transformOrigin = "top center";

    // Cập nhật chiều cao container để khung cuộn vừa khít
    if (paper) {
        const origHeight = paper.offsetHeight || 920;
        container.style.height = `${Math.round(origHeight * currentZoom)}px`;
    }
}

// Đóng thanh thông báo vàng để mở rộng tối đa khung nhìn
function dismissNoticeBanner() {
    const banner = document.getElementById("exportNoticeBanner");
    if (banner) {
        banner.style.display = "none";
    }
}
window.dismissNoticeBanner = dismissNoticeBanner;

// Lắng nghe thay đổi kích thước cửa sổ
window.addEventListener("resize", () => {
    if (activeTab === "payslip" && currentZoom === 1.1) {
        applyZoom();
    }
});

// Điều hướng chuyển người bằng phím mũi tên Lên/Xuống
window.addEventListener("keydown", (e) => {
    const isSearchInput = e.target && e.target.id === "searchInput";
    if (e.target.tagName !== "INPUT" || isSearchInput) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            navigateEmployee(1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            navigateEmployee(-1);
        } else if (e.key === "Enter" && isSearchInput) {
            e.preventDefault();
            downloadCurrentPayslip();
        }
    }
});

// Đảm bảo khi người dùng nhấn Ctrl + P trực tiếp từ bàn phím thì vùng in luôn sẵn sàng
window.addEventListener("beforeprint", () => {
    const batchContainer = document.getElementById("batchPrintContainer");
    if (batchContainer && (!batchContainer.innerHTML || batchContainer.innerHTML.trim() === "")) {
        const emp = getCurrentEmployee();
        if (emp) {
            batchContainer.innerHTML = window.generatePayslipHTML(emp, window.COMPANY_INFO);
        }
    }
});

window.addEventListener("afterprint", () => {
    const batchContainer = document.getElementById("batchPrintContainer");
    if (batchContainer) {
        batchContainer.innerHTML = "";
    }
});

function navigateEmployee(direction) {
    if (!filteredEmployees || filteredEmployees.length === 0) return;
    const currentIndex = filteredEmployees.findIndex(emp => emp.id === currentEmployeeId);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= filteredEmployees.length) nextIndex = filteredEmployees.length - 1;

    const nextEmp = filteredEmployees[nextIndex];
    if (nextEmp && nextEmp.id !== currentEmployeeId) {
        selectEmployeeById(nextEmp.id);
        setTimeout(() => {
            const activeCard = document.querySelector(".employee-card.active");
            if (activeCard) activeCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }, 50);
    }
}

window.selectEmployeeById = selectEmployeeById;
window.switchTab = switchTab;
window.refreshAllViews = refreshAllViews;
window.setExportMode = setExportMode;
window.executeCurrentExportAction = executeCurrentExportAction;
window.executeAllExportAction = executeAllExportAction;
window.executeRangeExportAction = executeRangeExportAction;
window.printCurrentPayslip = printCurrentPayslip;
window.printAllPayslips = printAllPayslips;
window.printRangePayslips = printRangePayslips;
window.downloadCurrentPayslip = downloadCurrentPayslip;
window.downloadCurrentPayslipPDF = downloadCurrentPayslipPDF;
window.downloadAllPayslipsZip = downloadAllPayslipsZip;
window.downloadRangePayslipsZip = downloadRangePayslipsZip;
window.showToast = showToast;
window.openCompanySettingsModal = openCompanySettingsModal;
window.closeCompanySettingsModal = closeCompanySettingsModal;
window.saveCompanySettings = saveCompanySettings;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.zoomFit = zoomFit;

// =========================================================
// BẢO VỆ MÃ NGUỒN: Chặn Ctrl+U, Ctrl+I, F12, chuột phải...
// =========================================================
(function() {
    // 1. Chặn menu chuột phải (Không cho Inspect / Xem nguồn)
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
    });

    // 2. Chặn các tổ hợp phím tắt kiểm tra mã nguồn
    window.addEventListener("keydown", (e) => {
        const key = (e.key || "").toLowerCase();
        const ctrlOrCmd = e.ctrlKey || e.metaKey;

        // F12 (Mở DevTools)
        if (e.key === "F12" || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + U (Xem nguồn trang)
        if (ctrlOrCmd && key === "u") {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + I hoặc Ctrl + Shift + I (Mở DevTools Element)
        if (ctrlOrCmd && key === "i") {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + Shift + J (Mở DevTools Console)
        if (ctrlOrCmd && e.shiftKey && key === "j") {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + Shift + C (Chọn phần tử kiểm tra)
        if (ctrlOrCmd && e.shiftKey && key === "c") {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + S (Chặn lưu mã nguồn HTML)
        if (ctrlOrCmd && key === "s") {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
})();

