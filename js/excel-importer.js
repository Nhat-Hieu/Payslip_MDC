/**
 * excel-importer.js
 * Xử lý nạp file Excel/CSV bảng lương và tải file mẫu
 */

function openImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.add('active');
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.remove('active');
}

// Tải file mẫu Excel chuẩn cho kế toán điền
function downloadExcelTemplate() {
    if (typeof XLSX === 'undefined') {
        alert("Đang tải thư viện xử lý Excel, vui lòng thử lại!");
        return;
    }

    const headers = [
        [window.COMPANY_INFO.name],
        ["BẢNG TÍNH LƯƠNG NHÂN VIÊN MẪU (DÙNG ĐỂ NẠP HỆ THỐNG)"],
        ["Lưu ý: Bạn có thể điền thông tin từ dòng 5 trở đi theo các cột bên dưới"],
        [],
        [
            "STT", "Mã NV", "Họ và Tên", "Chức danh", "Phòng ban", "Ngày vào làm", 
            "Ngày công", "Lương cơ bản", "PC Trách nhiệm", "PC Ăn trưa", "PC Xăng & ĐT", 
            "Thưởng KPI", "Làm thêm OT", "BHXH (8%)", "Thuế TNCN", "Tạm ứng", 
            "Số tài khoản", "Ngân hàng", "Số người phụ thuộc"
        ],
        [
            1, "HM001", "Nguyễn Văn Hoàng", "Giám Đốc", "Ban Giám Đốc", "02/01/2018", 
            26, 12500000, 1500000, 730000, 1000000, 0, 0, 1000000, 2707000, 0, 
            "19028374659012", "Techcombank", 2
        ],
        [
            2, "HM021", "Vương Thị Hạnh", "Kế toán thuế", "Phòng Kế Toán", "15/03/2021", 
            24, 16791667, 1500000, 673846, 1000000, 4000000, 423854, 1100000, 456250, 0, 
            "04712345678", "BIDV", 1
        ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Bang_Luong");
    XLSX.writeFile(wb, "Mau_Bang_Luong_MocDongChau.xlsx");
    if (window.showToast) window.showToast("Đã tải file Excel mẫu thành công!", "success");
}

// Xử lý nạp file Excel/CSV từ người dùng
function handleFileImport(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!jsonRows || jsonRows.length === 0) {
                alert("File Excel trống hoặc không có dữ liệu!");
                return;
            }

            // Tìm dòng header (dòng có chứa 'Họ và Tên' hoặc 'Mã NV')
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(jsonRows.length, 10); i++) {
                const row = jsonRows[i];
                if (row && row.some(cell => typeof cell === 'string' && (cell.includes("Họ") || cell.includes("Mã NV") || cell.includes("Tên")))) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                // Mặc định dòng đầu tiên là header nếu không tìm thấy
                headerRowIndex = 0;
            }

            const headerRow = jsonRows[headerRowIndex].map(h => (h || "").toString().trim().toLowerCase());
            const newEmployees = [];

            // Ánh xạ các cột
            const findCol = (keywords) => {
                return headerRow.findIndex(h => keywords.some(k => h.includes(k.toLowerCase())));
            };

            const colSTT = findCol(["stt"]);
            const colId = findCol(["mã nv", "ma nv", "mã nhân sự", "mã"]);
            const colName = findCol(["họ và tên", "họ tên", "tên"]);
            const colRole = findCol(["chức danh", "chức vụ", "vị trí"]);
            const colDept = findCol(["phòng ban", "bộ phận", "phòng"]);
            const colStartDate = findCol(["ngày vào làm", "ngày vào", "ngay vao"]);
            const colWorkDays = findCol(["ngày công", "công thực tế", "công"]);
            const colBase = findCol(["lương cơ bản", "lương cb", "lương thỏa thuận", "lương chính"]);
            const colResp = findCol(["trách nhiệm", "phụ cấp trách nhiệm"]);
            const colMeal = findCol(["ăn trưa", "phụ cấp ăn"]);
            const colFuel = findCol(["xăng", "đi lại", "điện thoại"]);
            const colBonus = findCol(["thưởng", "kpi", "hiệu quả"]);
            const colOT = findCol(["làm thêm", "ot", "tăng ca"]);
            const colBHXH = findCol(["bhxh", "bảo hiểm xã hội"]);
            const colTax = findCol(["thuế", "tncn", "thuế tncn"]);
            const colAdv = findCol(["tạm ứng", "ứng lương"]);
            const colBankAcc = findCol(["tài khoản", "số tài khoản", "stk"]);
            const colBankName = findCol(["ngân hàng", "tên ngân hàng"]);
            const colDep = findCol(["phụ thuộc", "người phụ thuộc", "npt"]);

            let count = 0;
            for (let i = headerRowIndex + 1; i < jsonRows.length; i++) {
                const row = jsonRows[i];
                if (!row || row.length === 0) continue;

                const name = colName !== -1 ? (row[colName] || "").toString().trim() : "";
                if (!name || name.toLowerCase().includes("tổng cộng")) continue;

                count++;
                const rawEmp = {
                    stt: colSTT !== -1 && row[colSTT] ? parseInt(row[colSTT], 10) : count,
                    id: colId !== -1 && row[colId] ? row[colId].toString().trim() : `HM${count.toString().padStart(3, '0')}`,
                    name: name,
                    role: colRole !== -1 && row[colRole] ? row[colRole].toString().trim() : "Nhân viên",
                    department: colDept !== -1 && row[colDept] ? row[colDept].toString().trim() : "Phòng Kinh Doanh",
                    startDate: colStartDate !== -1 && row[colStartDate] ? row[colStartDate].toString().trim() : "---",
                    workDays: colWorkDays !== -1 && !isNaN(row[colWorkDays]) ? Number(row[colWorkDays]) : 26,
                    standardWorkDays: 26,
                    baseSalary: colBase !== -1 && !isNaN(row[colBase]) ? Number(row[colBase]) : 10000000,
                    allowanceResponsibility: colResp !== -1 && !isNaN(row[colResp]) ? Number(row[colResp]) : 0,
                    allowanceMeal: colMeal !== -1 && !isNaN(row[colMeal]) ? Number(row[colMeal]) : 730000,
                    allowanceFuel: colFuel !== -1 && !isNaN(row[colFuel]) ? Number(row[colFuel]) : 500000,
                    allowancePhone: 0,
                    bonusKPI: colBonus !== -1 && !isNaN(row[colBonus]) ? Number(row[colBonus]) : 0,
                    overtimePay: colOT !== -1 && !isNaN(row[colOT]) ? Number(row[colOT]) : 0,
                    insuranceBHXH: colBHXH !== -1 && !isNaN(row[colBHXH]) ? Number(row[colBHXH]) : undefined,
                    hasExcelInsurance: colBHXH !== -1 && !isNaN(row[colBHXH]),
                    taxTNCN: colTax !== -1 && !isNaN(row[colTax]) ? Number(row[colTax]) : undefined,
                    hasExcelTax: colTax !== -1 && !isNaN(row[colTax]),
                    advancePayment: colAdv !== -1 && !isNaN(row[colAdv]) ? Number(row[colAdv]) : 0,
                    bankAccount: colBankAcc !== -1 && row[colBankAcc] ? row[colBankAcc].toString().trim() : "",
                    bankName: colBankName !== -1 && row[colBankName] ? row[colBankName].toString().trim() : "BIDV",
                    dependents: colDep !== -1 && !isNaN(row[colDep]) ? Number(row[colDep]) : 0
                };

                newEmployees.push(window.calculateSalaryRecord(rawEmp));
            }

            if (newEmployees.length === 0) {
                alert("Không tìm thấy dòng nhân viên hợp lệ nào trong file!");
                return;
            }

            // Tự động nhận diện kỳ lương (tháng/năm) từ tên file hoặc nội dung tiêu đề các dòng đầu
            let detectedMonth = null;
            const fullScanText = [file.name, firstSheetName, ...(jsonRows.slice(0, 6).map(r => Array.isArray(r) ? r.join(' ') : ''))].join(' ');
            const monthMatch = fullScanText.match(/(?:tháng\s*|t\s*)?([0-1]?[0-9])[\/\-_](202[0-9]|203[0-9])/i)
                            || fullScanText.match(/tháng\s*([0-1]?[0-9])\s*(?:năm)?\s*(202[0-9]|203[0-9])/i);
            
            if (monthMatch) {
                const m = parseInt(monthMatch[1], 10);
                const y = parseInt(monthMatch[2], 10);
                if (m >= 1 && m <= 12) {
                    detectedMonth = `${m.toString().padStart(2, '0')}/${y}`;
                    window.COMPANY_INFO.salaryMonth = detectedMonth;
                    // Tự động cập nhật ngày chi trả: ngày 05 của tháng kế tiếp
                    const nextM = m === 12 ? 1 : m + 1;
                    const nextY = m === 12 ? y + 1 : y;
                    window.COMPANY_INFO.payDate = `05/${nextM.toString().padStart(2, '0')}/${nextY}`;
                }
            }

            // Cập nhật danh sách nhân viên toàn cục
            window.EMPLOYEES = newEmployees;
            if (newEmployees.length > 0 && window.selectEmployeeById) {
                window.selectEmployeeById(newEmployees[0].id);
            }
            window.refreshAllViews();
            closeImportModal();
            if (window.showToast) {
                const monthMsg = detectedMonth ? ` (Kỳ lương ${detectedMonth})` : "";
                window.showToast(`Đã nạp thành công ${newEmployees.length} nhân sự${monthMsg} từ file Excel!`, "success");
            }

        } catch (err) {
            console.error(err);
            alert("Lỗi khi đọc file: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Nạp lại dữ liệu mẫu 48 nhân sự
function reloadDemoData() {
    window.EMPLOYEES = RAW_EMPLOYEES.map(calculateSalaryRecord);
    window.refreshAllViews();
    closeImportModal();
    if (window.showToast) window.showToast(`Đã khôi phục dữ liệu mẫu 48 nhân sự ${window.COMPANY_INFO.name}!`, "success");
}

window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.downloadExcelTemplate = downloadExcelTemplate;
window.handleFileImport = handleFileImport;
window.reloadDemoData = reloadDemoData;
