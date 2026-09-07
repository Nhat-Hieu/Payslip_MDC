/**
 * vietnamese-number.js
 * Chuyển đổi số tiền thành chữ Tiếng Việt chuẩn kế toán
 */

const ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const Tien = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

function docSoBaChuSo(baso, daydu) {
    let tram = Math.floor(baso / 100);
    let chuc = Math.floor((baso % 100) / 10);
    let donvi = baso % 10;
    let ketqua = "";

    if (tram == 0 && chuc == 0 && donvi == 0) return "";

    if (daydu || tram != 0) {
        ketqua += ChuSo[tram] + " trăm ";
        if (chuc == 0 && donvi != 0) ketqua += "lẻ ";
    }

    if (chuc != 0 && chuc != 1) {
        ketqua += ChuSo[chuc] + " mươi";
        if (chuc == 0 && donvi != 0) ketqua = ketqua + " linh ";
    }

    if (chuc == 1) ketqua += "mười";

    switch (donvi) {
        case 1:
            if (chuc != 0 && chuc != 1) {
                ketqua += " mốt";
            } else {
                ketqua += " " + ChuSo[donvi];
            }
            break;
        case 5:
            if (chuc == 0) {
                ketqua += " " + ChuSo[donvi];
            } else {
                ketqua += " lăm";
            }
            break;
        default:
            if (donvi != 0) {
                ketqua += " " + ChuSo[donvi];
            }
            break;
    }
    return ketqua.trim();
}

function docSoThanhChu(soTien) {
    if (soTien === 0 || soTien === "0") return "Không đồng";
    if (!soTien) return "";

    let so = parseInt(soTien, 10);
    if (isNaN(so)) return "";

    let am = false;
    if (so < 0) {
        am = true;
        so = Math.abs(so);
    }

    let vitri = [];
    let temp = so;
    while (temp > 0) {
        vitri.push(temp % 1000);
        temp = Math.floor(temp / 1000);
    }

    let ketqua = "";
    for (let i = vitri.length - 1; i >= 0; i--) {
        let baso = vitri[i];
        if (baso > 0) {
            let chu = docSoBaChuSo(baso, i < vitri.length - 1);
            ketqua += chu + " " + Tien[i] + " ";
        }
    }

    ketqua = ketqua.trim();
    if (!ketqua) return "Không đồng";

    // Viết hoa chữ cái đầu tiên
    ketqua = ketqua.charAt(0).toUpperCase() + ketqua.slice(1);
    if (am) {
        ketqua = "Âm " + ketqua.charAt(0).toLowerCase() + ketqua.slice(1);
    }

    return ketqua + " đồng chẵn";
}

// Format số tiền VND có phân tách dấu chấm
function formatVND(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return "0";
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Xuất ra window
window.docSoThanhChu = docSoThanhChu;
window.formatVND = formatVND;
