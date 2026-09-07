/**
 * department.js
 * Thống kê và tổng hợp quỹ lương theo từng phòng ban
 * Giao diện Biểu đồ thanh ngang (Horizontal Bar Chart) & Bảng chi tiết 6 cột chuẩn
 */

function calculateDepartmentStats(employees) {
    const map = {};

    employees.forEach(emp => {
        const dept = (emp.department || "Khác").trim();
        if (!map[dept]) {
            map[dept] = {
                department: dept,
                count: 0,
                totalBase: 0,
                totalWorkdaySalary: 0,
                totalAllowances: 0,
                totalBonus: 0,
                totalGross: 0,
                totalInsurance: 0,
                totalTax: 0,
                totalNet: 0
            };
        }

        const d = map[dept];
        d.count += 1;
        d.totalBase += (emp.baseSalary || 0);
        d.totalWorkdaySalary += (emp.workdaySalary || 0);
        d.totalAllowances += (emp.allowanceResponsibility || 0) + (emp.allowanceMeal || 0) + (emp.allowanceFuel || 0) + (emp.allowancePhone || 0);
        d.totalBonus += (emp.bonusKPI || 0) + (emp.overtimePay || 0);
        d.totalGross += (emp.totalIncome || 0);
        d.totalInsurance += (emp.insuranceBHXH || 0) + (emp.insuranceBHYT || 0) + (emp.insuranceBHTN || 0);
        d.totalTax += (emp.taxTNCN || 0);
        d.totalNet += (emp.netSalary || 0);
    });

    const list = Object.values(map);
    const companyTotalGross = list.reduce((sum, item) => sum + item.totalGross, 0);
    const companyTotalNet = list.reduce((sum, item) => sum + item.totalNet, 0);
    const companyTotalInsurance = list.reduce((sum, item) => sum + item.totalInsurance, 0);
    const companyTotalTax = list.reduce((sum, item) => sum + item.totalTax, 0);

    // Sắp xếp giảm dần theo Tổng thu nhập (Gross) như trong ảnh mẫu
    list.sort((a, b) => b.totalGross - a.totalGross);

    // Tính tỷ trọng theo Tổng thu nhập công ty
    list.forEach(item => {
        item.percentage = companyTotalGross > 0 ? ((item.totalGross / companyTotalGross) * 100).toFixed(1) : "0.0";
    });

    return {
        departments: list,
        companyTotalGross,
        companyTotalNet,
        companyTotalInsurance,
        companyTotalTax,
        totalHeadcount: employees.length
    };
}

function renderDepartmentTab(containerId, employees) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = calculateDepartmentStats(employees);
    const maxGross = stats.departments.length > 0 ? stats.departments[0].totalGross : 1;

    // 1. Dựng HTML biểu đồ thanh ngang (Horizontal Bar Chart)
    const chartHtml = stats.departments.map(d => {
        const barWidth = maxGross > 0 ? ((d.totalGross / maxGross) * 100).toFixed(1) : 0;
        return `
            <div class="dept-bar-row">
                <div class="dept-bar-label">
                    <div class="dept-name">${d.department}</div>
                    <div class="dept-count">${d.count} người</div>
                </div>
                <div class="dept-bar-track">
                    <div class="dept-bar-fill" style="width: ${barWidth}%;"></div>
                </div>
                <div class="dept-bar-stats">
                    <span class="dept-bar-amount">${window.formatVND(d.totalGross)}</span>
                    <span class="dept-bar-pct">${d.percentage}%</span>
                </div>
            </div>
        `;
    }).join("");

    // 2. Dựng HTML bảng chi tiết tổng hợp (6 cột chuẩn theo ảnh mẫu)
    const tableRowsHtml = stats.departments.map(d => {
        return `
            <tr>
                <td class="col-dept-name">${d.department}</td>
                <td class="col-dept-count">${d.count}</td>
                <td class="col-dept-money">${window.formatVND(d.totalGross)}</td>
                <td class="col-dept-money">${window.formatVND(d.totalInsurance)}</td>
                <td class="col-dept-money">${d.totalTax > 0 ? window.formatVND(d.totalTax) : "0"}</td>
                <td class="col-dept-money col-dept-net">${window.formatVND(d.totalNet)}</td>
            </tr>
        `;
    }).join("");

    container.innerHTML = `
        <div class="dept-tab-wrapper">
            <!-- BIỂU ĐỒ THANH NGANG THỐNG KÊ THEO BỘ PHẬN -->
            <div class="dept-chart-container">
                ${chartHtml}
            </div>

            <!-- BẢNG TỔNG HỢP CHI TIẾT THEO BỘ PHẬN -->
            <div class="dept-table-container">
                <table class="dept-summary-table">
                    <thead>
                        <tr>
                            <th style="text-align: left; width: 26%;">BỘ PHẬN</th>
                            <th style="text-align: center; width: 10%;">NGƯỜI</th>
                            <th style="text-align: right; width: 16%;">TỔNG THU NHẬP</th>
                            <th style="text-align: right; width: 16%;">BẢO HIỂM</th>
                            <th style="text-align: right; width: 16%;">THUẾ TNCN</th>
                            <th style="text-align: right; width: 16%;">THỰC LĨNH</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="text-align: left; font-weight: 700;">TỔNG CỘNG</td>
                            <td style="text-align: center; font-weight: 700;">${stats.totalHeadcount}</td>
                            <td style="text-align: right; font-weight: 700;">${window.formatVND(stats.companyTotalGross)}</td>
                            <td style="text-align: right; font-weight: 700;">${window.formatVND(stats.companyTotalInsurance)}</td>
                            <td style="text-align: right; font-weight: 700;">${window.formatVND(stats.companyTotalTax)}</td>
                            <td style="text-align: right; font-weight: 700; color: #123359;">${window.formatVND(stats.companyTotalNet)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
}

window.calculateDepartmentStats = calculateDepartmentStats;
window.renderDepartmentTab = renderDepartmentTab;
