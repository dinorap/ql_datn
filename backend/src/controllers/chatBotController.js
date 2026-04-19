const axios = require("axios");
const https = require("https");
require("dotenv").config();
const { getCatalogContextForMessage } = require("../services/chatBotCatalogService");

/** Thứ tự: thử trước → lỗi thì model tiếp theo */
const GEMINI_MODEL_FALLBACKS = [
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
];

const API_KEY = process.env.GEMINI_API_KEY;

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });

function geminiGenerateUrl(modelId) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
}

function extractGeminiReplyText(data) {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

/** Khách không muốn thấy nhãn “tham khảo chung…” trong chat */
function stripDisallowedDisclaimers(text) {
    if (!text) return text;
    return text
        .replace(
            /\(?\s*Tham khảo chung\s*,\s*không thuộc dữ liệu cửa hàng\s*\)?\.?\s*/gi,
            ""
        )
        .replace(/\s{2,}/g, " ")
        .trim();
}

const SYSTEM_INSTRUCTION = `Bạn là trợ lý chat cửa hàng "Thế giới công nghệ" (điện thoại / phụ kiện).

QUY TẮC DỮ LIỆU CỬA HÀNG (bắt buộc):
1. Giá (VNĐ), tồn kho, tên máy, mã, thông số trong shop CHỈ được lấy từ khối JSON "du_lieu_cua_hang". Giá đúng theo từng màu + RAM/ROM nằm trong "cac_mau_chi_tiet" → "cau_hinh" (gia_sau_uu_dai_VND, ton_kho, ram, rom). Khi khách hỏi một màu hoặc một cấu hình (vd Titan trắng 256GB), phải đọc đúng dòng cau_hinh khớp màu + ROM, không lấy nhầm giá của màu/cấu hình khác. Trường gia_sau_uu_dai_neu_co / gia_tu_san_pham_con_hang_VND chỉ là giá thấp nhất cả sản phẩm — chỉ dùng khi khách hỏi chung "giá từ bao nhiêu" mà không chỉ màu/cấu hình.
2. Nếu "san_pham_tim_thay" rỗng: nói rõ cửa hàng hiện không có đúng mẫu khách hỏi trong dữ liệu. Gợi ý tối đa 3 mẫu từ "goi_y_khi_khong_co_dung_mau" (chỉ nhắc máy có trong mảng đó), nêu tên + giá từ JSON.
3. Nếu có sản phẩm khớp nhưng "het_hang": true — báo hết hàng theo dữ liệu; nếu có "goi_y_con_hang_khi_het_hang" thì gợi ý tối đa 3 mẫu còn hàng từ đó (tên + giá), không nhắc máy không có trong các mảng JSON.
4. Nếu có sản phẩm còn hàng: trả lời ngắn gọn; khi hỏi màu/cấu hình thì liệt kê theo cac_mau_chi_tiet (đúng gia_sau_uu_dai_VND từng dòng cau_hinh). Tồn kho tổng: ton_kho_tong.
5. Phần "mo_ta_ngan" trong JSON là mô tả shop — ưu tiên dùng; không bịa thêm thông số kỹ thuật không có trong JSON hoặc trong câu hỏi.
6. TUYỆT ĐỐI không được ghi trong câu trả lời cụm "(Tham khảo chung, không thuộc dữ liệu cửa hàng)" hay bất kỳ nhãn/tiền tố tương tự. Trả lời tự nhiên; nếu bổ sung hiểu biết chung (ngoài JSON) thì ngắn gọn, không gán giá hay chương trình cửa hàng cho phần đó.
7. Hội thoại nhiều lượt: luôn đọc các lượt user/model phía trên. Câu ngắn như "còn màu nào", "giá màu X", "256GB bao nhiêu" là hỏi tiếp — trả lời đúng máy đó từ cac_mau_chi_tiet / cau_hinh; không liệt kê sản phẩm khác ngoài JSON.
8. Luôn trả lời tiếng Việt, giọng thân thiện, khoảng 3–8 câu, không dông dài.`;

const MAX_HISTORY_TURNS = 24;

function parseChatHistory(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter(
            (h) =>
                h &&
                typeof h.text === "string" &&
                (h.role === "user" || h.role === "assistant")
        )
        .map((h) => ({
            role: h.role,
            text: String(h.text).trim().slice(0, 6000),
        }))
        .filter((h) => h.text.length > 0)
        .slice(-MAX_HISTORY_TURNS);
}

/** Gemini cần lượt đầu là user (bỏ các lượt assistant đứng đầu). */
function trimHistoryForGemini(history) {
    const h = [...history];
    while (h.length > 0 && h[0].role !== "user") {
        h.shift();
    }
    return h;
}

/** Gộp vài lượt gần nhất để tìm sản phẩm trong DB (tránh câu ngắn lạc ngữ cảnh). */
function buildCatalogSearchText(message, history) {
    const lines = [];
    for (const turn of history.slice(-14)) {
        lines.push(turn.text);
    }
    lines.push(String(message || "").trim());
    return lines.filter(Boolean).join("\n").slice(0, 12000);
}

function buildGeminiContents(history, catalogJson, message) {
    const contents = [];
    const h = trimHistoryForGemini(parseChatHistory(history));
    while (h.length > 0 && h[h.length - 1].role === "user") {
        const popped = h.pop();
        message = [popped.text, message].filter(Boolean).join("\n").trim();
    }
    for (const turn of h) {
        if (turn.role === "user") {
            contents.push({ role: "user", parts: [{ text: turn.text }] });
        } else {
            contents.push({ role: "model", parts: [{ text: turn.text }] });
        }
    }
    const augmentedUserText = `=== DU_LIEU_CUA_HANG (JSON) ===
${catalogJson}
=== CAU_HOI_KHACH ===
${message}`;
    contents.push({ role: "user", parts: [{ text: augmentedUserText }] });
    return contents;
}

const chatBot = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({
                EC: 1,
                EM: "Missing 'message' field in request body.",
            });
        }

        const parsedHistory = parseChatHistory(history);

        let catalogPayload = {
            matches: [],
            similar: [],
            similarReason: null,
            stockAlternatives: [],
            candidatesTried: [],
        };
        try {
            const catalogSearchText = buildCatalogSearchText(message, parsedHistory);
            catalogPayload = await getCatalogContextForMessage(catalogSearchText);
        } catch (dbErr) {
            console.error("Chatbot DB catalog:", dbErr);
        }

        const duLieuCuaHang = {
            san_pham_tim_thay: catalogPayload.matches,
            goi_y_khi_khong_co_dung_mau:
                catalogPayload.matches.length === 0 ? catalogPayload.similar : [],
            goi_y_con_hang_khi_het_hang: catalogPayload.stockAlternatives || [],
            ghi_chu_tim_kiem: catalogPayload.similarReason,
        };

        const catalogJson = JSON.stringify(duLieuCuaHang);

        const requestData = {
            systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }],
            },
            contents: buildGeminiContents(parsedHistory, catalogJson, message),
            generationConfig: {
                temperature: 0.45,
                topK: 32,
                topP: 0.88,
                maxOutputTokens: 768,
            },
        };

        let lastError = null;
        for (const modelId of GEMINI_MODEL_FALLBACKS) {
            try {
                const url = `${geminiGenerateUrl(modelId)}?key=${API_KEY}`;
                const response = await axios.post(url, requestData, {
                    headers: { "Content-Type": "application/json" },
                    httpsAgent,
                    timeout: 45000,
                });
                const raw = stripDisallowedDisclaimers(
                    extractGeminiReplyText(response.data)
                );
                if (raw) {
                    return res.status(200).json({
                        EC: 0,
                        EM: "Thành công",
                        response_data: raw,
                    });
                }
                console.warn(
                    `[chatbot] Model ${modelId} trả về rỗng, thử model tiếp theo.`
                );
            } catch (err) {
                lastError = err;
                console.warn(
                    `[chatbot] Model ${modelId} lỗi:`,
                    err.response?.data || err.message
                );
            }
        }

        console.error(
            "Lỗi API Gemini (đã hết fallback):",
            lastError?.response?.data || lastError?.message || "Mọi model đều lỗi hoặc trả về rỗng"
        );
        return res.status(500).json({
            EC: 1,
            EM: "Lỗi khi gọi API Gemini",
            error:
                lastError?.response?.data ||
                lastError?.message ||
                "Mọi model đều lỗi hoặc trả về rỗng",
        });
    } catch (error) {
        console.error("Lỗi chatbot:", error.response?.data || error.message);
        return res.status(500).json({
            EC: 1,
            EM: "Lỗi chatbot",
            error: error.response?.data || error.message,
        });
    }
};

module.exports = { chatBot };
