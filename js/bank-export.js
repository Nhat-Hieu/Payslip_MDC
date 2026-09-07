/**
 * bank-export.js
 * Tạo và xuất file TXT chuyển khoản chi lương qua các ngân hàng Việt Nam
 */

const BANK_FORMATS = {
    "BIDV": {
        name: "Ngân hàng BIDV (Định dạng file TXT chi lương)",
        generate: (employees, comp) => {
            let lines = [];
            // Header format BIDV
            lines.push(`H|${comp.name}|${comp.salaryMonth.replace('/', '')}|${comp.payDate}`);
            employees.forEach((e, idx) => {
                const acc = (e.bankAccount || "").replace(/\s+/g, '');
                const cleanName = removeVietnameseTones(e.name).toUpperCase();
                const content = `CHI LUONG T${comp.salaryMonth.replace('/', '')} ${e.id}`;
                lines.push(`D|${idx + 1}|${acc}|${cleanName}|${Math.round(e.netSalary)}|${content}|${e.bankName || 'BIDV'}`);
            });
            const total = employees.reduce((s, e) => s + Math.round(e.netSalary), 0);
            lines.push(`T|${employees.length}|${total}`);
            return lines.join("\r\n");
        }
    },
    "VCB": {
        name: "Vietcombank (VCB Digibiz / VCB CashUp TXT)",
        generate: (employees, comp) => {
            let lines = [];
            employees.forEach((e, idx) => {
                const acc = (e.bankAccount || "").replace(/\s+/g, '');
                const cleanName = removeVietnameseTones(e.name).toUpperCase();
                const content = `CHI LUONG THANG ${comp.salaryMonth.replace('/', '')} CHO ${e.id}`;
                // STK,Tên,Số tiền,Nội dung
                lines.push(`${acc},${cleanName},${Math.round(e.netSalary)},${content}`);
            });
            return lines.join("\r\n");
        }
    },
    "TCB": {
        name: "Techcombank (Fast Payment Batch TXT)",
        generate: (employees, comp) => {
            let lines = [];
            employees.forEach((e, idx) => {
                const acc = (e.bankAccount || "").replace(/\s+/g, '');
                const cleanName = removeVietnameseTones(e.name).toUpperCase();
                lines.push(`${idx + 1}\t${acc}\t${cleanName}\t${Math.round(e.netSalary)}\tCHI LUONG T${comp.salaryMonth.replace('/', '')}\t${e.bankName || 'Techcombank'}`);
            });
            return lines.join("\r\n");
        }
    },
    "MB": {
        name: "MB Bank (File UNC Lương TXT)",
        generate: (employees, comp) => {
            let lines = [];
            employees.forEach((e, idx) => {
                const acc = (e.bankAccount || "").replace(/\s+/g, '');
                const cleanComp = removeVietnameseTones(comp.name).toUpperCase();
                lines.push(`${idx + 1};${acc};${cleanName};${Math.round(e.netSalary)};${cleanComp} CHI LUONG T${comp.salaryMonth.replace('/', '')}`);
            });
            return lines.join("\r\n");
        }
    },
    "ALL": {
        name: "Định dạng Chuẩn Chung (Hỗ trợ tất cả ngân hàng)",
        generate: (employees, comp) => {
            let lines = [];
            lines.push(`DANH SÁCH CHI LƯƠNG CHUYỂN KHOẢN - ${comp.name}`);
            lines.push(`Kỳ lương: ${comp.salaryMonth} - Ngày chi trả: ${comp.payDate}`);
            lines.push(`STT | Mã NV | Số Tài Khoản | Chủ Tài Khoản | Ngân Hàng | Số Tiền (VNĐ) | Nội Dung Chuyển Khoản`);
            lines.push(`---------------------------------------------------------------------------------------------------`);
            employees.forEach((e, idx) => {
                const content = `Chi luong thang ${comp.salaryMonth} ${e.id} - ${e.name}`;
                lines.push(`${idx + 1} | ${e.id} | ${e.bankAccount} | ${e.name} | ${e.bankName} | ${window.formatVND(e.netSalary)} | ${content}`);
            });
            const total = employees.reduce((s, e) => s + e.netSalary, 0);
            lines.push(`---------------------------------------------------------------------------------------------------`);
            lines.push(`TỔNG CỘNG: ${employees.length} NHÂN SỰ | TỔNG TIỀN: ${window.formatVND(total)} VNĐ`);
            return lines.join("\r\n");
        }
    }
};

function removeVietnameseTones(str) {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}

// Mở modal xuất file chuyển khoản ngân hàng
function openBankExportModal() {
    const modal = document.getElementById('bankExportModal');
    if (!modal) return;

    updateBankExportPreview();
    modal.classList.add('active');
}

function closeBankExportModal() {
    const modal = document.getElementById('bankExportModal');
    if (modal) modal.classList.remove('active');
}

function updateBankExportPreview() {
    const bankSelect = document.getElementById('bankFormatSelect');
    const filterBankSelect = document.getElementById('bankFilterSelect');
    const previewArea = document.getElementById('bankExportPreview');
    const summaryInfo = document.getElementById('bankExportSummary');

    const bankCode = bankSelect ? bankSelect.value : "BIDV";
    const bankFilter = filterBankSelect ? filterBankSelect.value : "ALL";

    let emps = window.EMPLOYEES || [];
    if (bankFilter !== "ALL") {
        emps = emps.filter(e => e.bankName && e.bankName.toLowerCase().includes(bankFilter.toLowerCase()));
    }

    const formatter = BANK_FORMATS[bankCode] || BANK_FORMATS["BIDV"];
    const content = formatter.generate(emps, window.COMPANY_INFO);

    if (previewArea) previewArea.value = content;

    const totalNet = emps.reduce((s, e) => s + e.netSalary, 0);
    if (summaryInfo) {
        summaryInfo.innerHTML = `Đang chọn: <strong>${emps.length}</strong> nhân sự • Tổng tiền chi lương: <strong style="color: #1d4ed8;">${window.formatVND(totalNet)} VNĐ</strong>`;
    }
}

function downloadBankExportTXT() {
    const previewArea = document.getElementById('bankExportPreview');
    const bankSelect = document.getElementById('bankFormatSelect');
    const bankCode = bankSelect ? bankSelect.value : "BIDV";
    const content = previewArea ? previewArea.value : "";

    if (!content) {
        alert("Không có nội dung chuyển khoản!");
        return;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChiLuong_${bankCode}_Thang${window.COMPANY_INFO.salaryMonth.replace('/', '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.showToast) window.showToast(`Đã xuất file chuyển khoản ngân hàng ${bankCode} thành công!`, "success");
    closeBankExportModal();
}

window.openBankExportModal = openBankExportModal;
window.closeBankExportModal = closeBankExportModal;
window.updateBankExportPreview = updateBankExportPreview;
window.downloadBankExportTXT = downloadBankExportTXT;
