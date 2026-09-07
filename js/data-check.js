/**
 * data-check.js
 * Kiểm tra tính hợp lệ, đối chiếu số liệu và rà soát bảng lương
 */

function runDataAudit(employees) {
    const missingBank = [];
    const abnormalWorkdays = [];
    const negativeNet = [];
    const abnormalTax = [];
    const insuranceWarnings = [];

    employees.forEach(emp => {
        // 1. Kiểm tra tài khoản ngân hàng
        if (!emp.bankAccount || emp.bankAccount.trim() === "" || !emp.bankName) {
            missingBank.push({ emp, reason: "Chưa có Số tài khoản hoặc Tên ngân hàng" });
        }

        // 2. Ngày công bất thường
        if (emp.workDays <= 0 || emp.workDays > (emp.standardWorkDays || 26)) {
            abnormalWorkdays.push({ 
                emp, 
                reason: emp.workDays <= 0 ? "Ngày công bằng 0" : `Ngày công (${emp.workDays}) vượt chuẩn (${emp.standardWorkDays})` 
            });
        }

        // 3. Thực nhận âm hoặc bằng 0
        if (emp.netSalary <= 0) {
            negativeNet.push({ emp, reason: `Thực nhận không dương: ${window.formatVND(emp.netSalary)} đ` });
        }

        // 4. Thuế TNCN bất thường
        if (emp.totalIncome > 20000000 && emp.taxTNCN === 0 && (emp.dependents || 0) <= 1) {
            abnormalTax.push({ emp, reason: "Thu nhập > 20 triệu nhưng chưa tính thuế TNCN (cần kiểm tra NPT)" });
        }

        // 5. Cảnh báo trần bảo hiểm
        if (emp.insuranceBHXH > 2880000) {
            insuranceWarnings.push({ emp, reason: "Mức trích BHXH vượt khung trần quy định (36tr x 8% = 2.880.000 đ)" });
        }
    });

    return {
        missingBank,
        abnormalWorkdays,
        negativeNet,
        abnormalTax,
        insuranceWarnings,
        totalIssues: missingBank.length + abnormalWorkdays.length + negativeNet.length + abnormalTax.length + insuranceWarnings.length
    };
}

function renderAuditTab(containerId, employees) {
    const container = document.getElementById(containerId);
    if (!container) return;

    employees = employees || [];
    const totalCount = employees.length;

    // 1. Tính toán các chỉ tiêu tài chính
    const totalGross = employees.reduce((s, e) => s + (e.totalIncome || 0), 0);
    const totalDeduction = employees.reduce((s, e) => s + (e.totalDeduction || 0), 0);
    const grossMinusDeduction = totalGross - totalDeduction;
    const totalNet = employees.reduce((s, e) => s + (e.netSalary || 0), 0);
    const difference = Math.abs(grossMinusDeduction - totalNet);

    // 2. Kiểm tra mã nhân viên trùng
    const idMap = {};
    employees.forEach(e => {
        const id = (e.id || "").trim();
        if (id) {
            idMap[id] = (idMap[id] || 0) + 1;
        }
    });
    const duplicateIds = Object.keys(idMap).filter(id => idMap[id] > 1);
    const hasDuplicateIds = duplicateIds.length > 0;

    // 3. Rà soát tổng thể
    const audit = runDataAudit(employees);
    const isAllOk = difference === 0 && !hasDuplicateIds && audit.totalIssues === 0;

    // Bảng chỉ tiêu đối chiếu 2 cột (không có đường kẻ dọc)
    const tableHtml = `
        <div class="audit-reconcile-card">
            <table class="reconcile-table">
                <thead>
                    <tr>
                        <th class="col-target">CHỈ TIÊU ĐỐI CHIẾU</th>
                        <th class="col-value">GIÁ TRỊ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="col-target">Số phiếu sẽ tạo</td>
                        <td class="col-value">${totalCount} phiếu</td>
                    </tr>
                    <tr>
                        <td class="col-target">Tổng thu nhập - tổng khấu trừ</td>
                        <td class="col-value">${window.formatVND(grossMinusDeduction)} đ</td>
                    </tr>
                    <tr>
                        <td class="col-target">Tổng thực lĩnh</td>
                        <td class="col-value" style="color: #123359; font-weight: 700;">${window.formatVND(totalNet)} đ</td>
                    </tr>
                    <tr>
                        <td class="col-target">Chênh lệch</td>
                        <td class="col-value">
                            ${difference === 0 
                                ? '<span style="color: #059669; font-weight: 700;">0 đ <span style="font-size: 11.5px; font-weight: 600; color: #059669; background: #dcfce7; padding: 2px 7px; border-radius: 4px; margin-left: 4px;">Khớp 100%</span></span>' 
                                : `<span style="color: #dc2626; font-weight: 700;">${window.formatVND(difference)} đ <span style="font-size: 11.5px; font-weight: 600; color: #b91c1c; background: #fee2e2; padding: 2px 7px; border-radius: 4px; margin-left: 4px;">Chênh lệch</span></span>`}
                        </td>
                    </tr>
                    <tr>
                        <td class="col-target">Mã nhân viên trùng</td>
                        <td class="col-value">
                            ${!hasDuplicateIds 
                                ? '<span style="color: #059669; font-weight: 700;">0 <span style="font-size: 11.5px; font-weight: 600; color: #059669; background: #dcfce7; padding: 2px 7px; border-radius: 4px; margin-left: 4px;">Không trùng</span></span>' 
                                : `<span style="color: #dc2626; font-weight: 700;">${duplicateIds.length} mã trùng (${duplicateIds.join(", ")})</span>`}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Phần danh sách trường hợp cần kiểm tra lại (chỉ xuất hiện khi có vấn đề)
    let issueListHtml = "";
    if (!isAllOk) {
        const allFlagged = [
            ...audit.missingBank.map(item => ({ ...item, type: "Tài khoản", level: "Cảnh báo" })),
            ...audit.abnormalWorkdays.map(item => ({ ...item, type: "Ngày công", level: "Cảnh báo" })),
            ...audit.negativeNet.map(item => ({ ...item, type: "Thực nhận âm", level: "Lỗi nghiêm trọng" })),
            ...audit.abnormalTax.map(item => ({ ...item, type: "Thuế TNCN", level: "Lưu ý" })),
            ...audit.insuranceWarnings.map(item => ({ ...item, type: "BHXH", level: "Lưu ý" }))
        ];

        if (hasDuplicateIds) {
            duplicateIds.forEach(dupId => {
                const dupEmps = employees.filter(e => (e.id || "").trim() === dupId);
                dupEmps.forEach(e => {
                    allFlagged.unshift({
                        emp: e,
                        type: "Mã trùng",
                        level: "Lỗi nghiêm trọng",
                        reason: `Mã nhân viên ${dupId} bị trùng lặp`
                    });
                });
            });
        }

        if (allFlagged.length > 0) {
            const flaggedRows = allFlagged.map((item, idx) => {
                const badgeClass = item.level === "Lỗi nghiêm trọng" ? "badge-err" : "badge-warn";
                return `
                    <tr>
                        <td style="text-align: center;">${idx + 1}</td>
                        <td style="font-weight: 600;">
                            <a href="javascript:void(0)" onclick="window.selectEmployeeById('${item.emp.id}')" style="color: #1d4ed8; text-decoration: none;">
                                ${item.emp.name} (${item.emp.id})
                            </a>
                        </td>
                        <td>${item.emp.department}</td>
                        <td><span class="check-badge ${badgeClass}">${item.type}</span></td>
                        <td style="color: #475569;">${item.reason}</td>
                    </tr>
                `;
            }).join("");

            issueListHtml = `
                <div class="dept-table-container" style="margin-top: 16px;">
                    <div class="section-title-bar">
                        <h3>Chi Tiết Các Trường Hợp Cần Kiểm Tra Lại</h3>
                        <span style="font-size: 12px; color: #64748b;">Nhấp vào tên nhân viên để xem phiếu</span>
                    </div>
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;">STT</th>
                                <th>Họ và Tên (Mã NV)</th>
                                <th>Bộ phận</th>
                                <th>Loại kiểm tra</th>
                                <th>Nội dung chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${flaggedRows}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    container.innerHTML = `
        <div class="audit-tab-wrapper">
            <!-- BANNER TRẠNG THÁI -->
            <div class="audit-status-banner ${isAllOk ? 'success' : 'warning'}">
                <span style="display: flex; align-items: center;">
                    ${isAllOk 
                        ? '<svg class="icon-svg" style="width: 26px; height: 26px; color: #059669;" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
                        : '<svg class="icon-svg" style="width: 26px; height: 26px; color: #d97706;" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'}
                </span>
                <div>
                    <strong>${isAllOk ? 'Dữ liệu bảng lương hoàn toàn chính xác & sẵn sàng chi trả!' : 'Phát hiện dữ liệu cần kiểm tra lại trước khi chi trả'}</strong>
                    <div style="font-size: 12.5px; opacity: 0.9; margin-top: 2px;">
                        Đã tự động rà soát toàn bộ ${totalCount} nhân viên
                    </div>
                </div>
            </div>

            <!-- BẢNG CHỈ TIÊU ĐỐI CHIẾU 2 CỘT -->
            ${tableHtml}

            <!-- DANH SÁCH CHI TIẾT (NẾU CÓ ĐIỂM LƯU Ý) -->
            ${issueListHtml}
        </div>
    `;
}

window.runDataAudit = runDataAudit;
window.renderAuditTab = renderAuditTab;
