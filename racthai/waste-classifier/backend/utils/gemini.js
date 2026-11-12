/**
 * gemini.js - TICH HOP GOOGLE GEMINI AI
 * Xu ly: phan loai rac tu anh + chat hoi dap
 * Co cache ket qua de tiet kiem quota API
 * Co retry logic khi gap loi 503
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs   = require('fs');
const md5  = require('md5');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// ============================================
// DANH SACH LOAI RAC VA MAU SAC
// ============================================
const LOAI_RAC = {
  'organic':            { nhan: 'Rac huu co',       mau: '#4CAF50', bieu_tuong: '🌿' },
  'recyclable-plastic': { nhan: 'Nhua tai che',      mau: '#2196F3', bieu_tuong: '♻️' },
  'recyclable-paper':   { nhan: 'Giay tai che',      mau: '#03A9F4', bieu_tuong: '📄' },
  'recyclable-metal':   { nhan: 'Kim loai tai che',  mau: '#00BCD4', bieu_tuong: '🔩' },
  'recyclable-glass':   { nhan: 'Thuy tinh',         mau: '#009688', bieu_tuong: '🫙' },
  'non-recyclable':     { nhan: 'Khong tai che',     mau: '#F44336', bieu_tuong: '🚫' },
  'hazardous':          { nhan: 'Rac nguy hai',      mau: '#FFC107', bieu_tuong: '⚠️' },
  'electronic':         { nhan: 'Rac dien tu',       mau: '#9C27B0', bieu_tuong: '🔌' },
};

// Cache anh da phan tich (key = md5 cua file anh)
const cachePhanLoai = new Map();
const CACHE_TOI_DA  = 100;

// ============================================
// HAM RETRY
// ============================================
async function retryAsync(fn, maxRetries = 3, delayMs = 2000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const is503 = err.message?.includes('503') || err.message?.includes('overloaded') || err.message?.includes('unavailable');
      const is429 = err.status === 429 || err.message?.includes('RATE_LIMIT') || err.message?.includes('429');
      if ((is503 || is429) && attempt < maxRetries) {
        console.log(`[RETRY ${attempt}/${maxRetries}] ${err.message?.substring(0, 60)}... doi ${delayMs}ms`);
        await new Promise(r => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// ============================================
// HAM PHAN LOAI RAC TU ANH
// ============================================
async function phanLoaiRacTuAnh(duongDanAnh, hashAnh) {
  // Tra cache neu da phan tich anh nay roi
  if (hashAnh && cachePhanLoai.has(hashAnh)) {
    console.log('⚡ Dung cache cho anh:', hashAnh.substring(0, 8) + '...');
    return { ...cachePhanLoai.get(hashAnh), cached: true };
  }

  try {
    const duLieuAnh = fs.readFileSync(duongDanAnh);
    const base64    = duLieuAnh.toString('base64');
    const mimeType  = layMimeType(duongDanAnh);

    const prompt = `Ban la chuyen gia hang dau ve phan loai rac thai va tai che tai Viet Nam. Phan tich anh va nhan dien TAT CA cac vat pham rac.

Chi tra ve JSON THUAN TUY (khong co markdown, khong co backtick):
{
  "detections": [
    {
      "id": 1,
      "label": "Ten vat pham cu the bang tieng Viet (vi du: Chai nhua PET, Hop giay sua, Pin AA)",
      "category": "loai rac (chi dung 1 trong 8 loai: organic/recyclable-plastic/recyclable-paper/recyclable-metal/recyclable-glass/non-recyclable/hazardous/electronic)",
      "confidence": 0.95,
      "color": "ma hex tuong ung voi loai rac",
      "boundingBox": {
        "xPercent": 10,
        "yPercent": 20,
        "widthPercent": 30,
        "heightPercent": 40
      },
      "recyclingMethod": "Huong dan TAI CHE CHI TIET gom 3-5 buoc ro rang: (1) Chuan bi the nao, (2) Phan loai vao thung nao, (3) Co the tai su dung bang cach gi, (4) Neu khong tai che duoc thi xu ly the nao, (5) Luu y dac biet neu co (nguy hai, can xu ly rieng...)",
      "description": "Mo ta day du ve vat pham: chat lieu, tinh trang, kich thuoc uoc tinh, muc do o nhiem moi truong neu khong xu ly dung cach"
    }
  ],
  "summary": "Tom tat tong quan ve rac trong anh: so luong, loai rac chu yeu, muc do tai che duoc (tieng Viet, 2-3 cau)",
  "totalItems": 1,
  "categories": ["danh sach loai rac co trong anh"],
  "environmentalImpact": "Anh huong moi truong neu khong xu ly dung cach va loi ich neu tai che tot (1-2 cau)"
}

QUY TAC MAU:
- organic → #4CAF50
- recyclable-plastic → #2196F3
- recyclable-paper → #03A9F4
- recyclable-metal → #00BCD4
- recyclable-glass → #009688
- non-recyclable → #F44336
- hazardous → #FFC107
- electronic → #9C27B0

QUY TAC BOUNDING BOX: dung PHAN TRAM (0-100) so voi chieu rong/cao anh.

VI DU recyclingMethod CHAT LUONG CAO:
- Chai nhua PET: "(1) Rua sach, bo nap chai rieng. (2) Ep dep de tiet kiem cho. (3) Bỏ vao thung xanh duong tai che nhua. (4) Co the tai su dung lam binh tuoi cay, do choi handmade. (5) Khong dot vi sinh khi doc hai."
- Pin cu: "(1) KHONG vut vao rac thuong. (2) Mang den diem thu gom pin cu tai sieu thi, cua hang dien tu. (3) Pin lithium can xu ly dac biet, tranh de nhiet do cao. (4) Mot vien pin co the nhiem doc 1m2 dat trong 50 nam."

Neu khong thay rac: tra ve detections: []`;

    // Goi Gemini voi retry tu dong
    const ketQua = await retryAsync(async () => {
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      return await model.generateContent([
        prompt,
        { inlineData: { mimeType, data: base64 } }
      ]);
    });

    // Xu ly response: xoa markdown neu co
    const vanBan = ketQua.response.text().trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let duLieu;
    try {
      duLieu = JSON.parse(vanBan);
    } catch {
      duLieu = { detections: [], summary: 'Khong the phan tich anh. Vui long thu lai.', totalItems: 0, categories: [], loi: true };
    }

    // Gan them thong tin loai rac cho tung vat pham
    if (Array.isArray(duLieu.detections)) {
      duLieu.detections = duLieu.detections.map(vat => ({
        ...vat,
        thongTinLoai: LOAI_RAC[vat.category] || LOAI_RAC['non-recyclable']
      }));
    }

    const ketQuaCuoi = { ...duLieu, cached: false, thoiGianXuLy: new Date().toISOString() };

    // Luu vao cache
    if (hashAnh) {
      if (cachePhanLoai.size >= CACHE_TOI_DA) {
        cachePhanLoai.delete(cachePhanLoai.keys().next().value);
      }
      cachePhanLoai.set(hashAnh, ketQuaCuoi);
    }

    return ketQuaCuoi;

  } catch (loi) {
    console.error('[LOI GEMINI PHAN LOAI]', loi.message);
    if (loi.message?.includes('API_KEY_INVALID') || loi.message?.includes('API key')) {
      throw new Error('Gemini API key khong hop le. Kiem tra file .env');
    }
    if (loi.status === 429 || loi.message?.includes('RATE_LIMIT')) {
      throw new Error('Da vuot gioi han Gemini API. Vui long doi 1 phut roi thu lai.');
    }
    if (loi.message?.includes('503') || loi.message?.includes('overloaded')) {
      throw new Error('Gemini AI dang qua tai. Vui long thu lai sau vai giay.');
    }
    throw new Error('Khong the phan tich anh: ' + loi.message);
  }
}

// ============================================
// HAM CHAT VOI AI
// ============================================
async function chatVoiAI(tinNhan, lichSuChat = []) {
  try {
    const ketQua = await retryAsync(async () => {
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: `Ban la tro ly AI chuyen ve phan loai va xu ly rac thai tai Viet Nam.
Nhiem vu:
1. Tu van cach phan loai rac dung cach
2. Huong dan tai che va xu ly rac thai
3. Giai thich tac hai cua rac thai voi moi truong
4. Chia se meo song xanh, bao ve moi truong
5. Tra loi cac cau hoi lien quan den moi truong

Luu y:
- Luon tra loi bang TIENG VIET, than thien va de hieu
- Dung emoji de cau tra loi sinh dong hon
- Neu cau hoi khong lien quan den rac/moi truong, nhe nhang huong ve chu de nay`
      });

      const lichSuDinhDang = lichSuChat.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const phienChat = model.startChat({ history: lichSuDinhDang });
      return await phienChat.sendMessage(tinNhan);
    });

    return {
      phanHoi: ketQua.response.text(),
      tokens:  ketQua.response.usageMetadata?.totalTokenCount || 0
    };

  } catch (loi) {
    console.error('[LOI GEMINI CHAT]', loi.message);
    if (loi.message?.includes('API_KEY_INVALID')) throw new Error('Gemini API key khong hop le.');
    if (loi.status === 429) throw new Error('Da vuot gioi han Gemini. Vui long doi 1 phut.');
    if (loi.message?.includes('503') || loi.message?.includes('overloaded')) {
      throw new Error('Gemini AI dang qua tai. Vui long thu lai sau vai giay.');
    }
    throw new Error('Khong the ket noi AI: ' + loi.message);
  }
}

// ============================================
// HAM TIEN ICH
// ============================================
function layMimeType(duongDan) {
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  const ext = duongDan.split('.').pop().toLowerCase();
  return map[ext] || 'image/jpeg';
}

function tinhHashAnh(duongDan) {
  try { return md5(fs.readFileSync(duongDan)); }
  catch { return null; }
}

module.exports = { phanLoaiRacTuAnh, chatVoiAI, tinhHashAnh, LOAI_RAC };
