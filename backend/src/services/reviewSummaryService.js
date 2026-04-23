const axios = require("axios");
const https = require("https");
const connection = require("../config/database");

const GEMINI_MODEL_FALLBACKS = [
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
];

const API_KEY = process.env.GEMINI_API_KEY;
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });

function buildSafeSummaryFallback({ oldSummary, newReviews, contextReviews, stats }) {
    const sourceReviews = (contextReviews && contextReviews.length > 0) ? contextReviews : newReviews;
    const reviewTexts = sourceReviews
        .map((r) => String(r.comment || "").toLowerCase())
        .filter(Boolean);

    const hasAny = (keywords) => reviewTexts.some((text) => keywords.some((k) => text.includes(k)));
    const tones = [];
    if (hasAny(["đẹp", "sang", "thiết kế", "xịn"])) tones.push("thiết kế đẹp");
    if (hasAny(["pin", "trâu", "khỏe", "dùng lâu"])) tones.push("pin ổn, dùng bền");
    if (hasAny(["giao hàng nhanh", "ship nhanh", "đóng gói", "đóng gói kỹ"])) tones.push("giao hàng nhanh, đóng gói tốt");
    if (hasAny(["giao chậm", "ship chậm", "giao lâu", "đợi lâu", "trễ", "chậm"])) tones.push("giao hàng còn chậm");
    if (hasAny(["âm thanh", "loa", "mic", "nghe rõ"])) tones.push("trải nghiệm sử dụng tốt");
    if (hasAny(["nóng", "lỗi", "lag", "chậm", "không ổn"])) tones.push("vẫn có một vài phản hồi cần cải thiện");

    const intro = Number(stats.average_rating) >= 4
        ? "Người dùng đánh giá sản phẩm khá tích cực."
        : Number(stats.average_rating) >= 3
            ? "Đánh giá về sản phẩm ở mức trung bình khá."
            : "Đánh giá về sản phẩm còn khá trái chiều.";

    const detail = tones.length
        ? `Ý chính: ${tones.slice(0, 3).join(", ")}.`
        : "Ý chính: người dùng đánh giá ổn về trải nghiệm thực tế.";

    const summaryText = [intro, detail].filter(Boolean).join(" ");

    return {
        summary_text: summaryText,
        highlights: [
            tones[0] || "Nhiều nhận xét tích cực về trải nghiệm thực tế",
            tones[1] || "Ý kiến người dùng tương đối nhất quán",
            `Đã cập nhật từ ${newReviews.length} đánh giá mới`,
        ],
        recommendation_percent: Math.min(
            100,
            Math.max(0, Math.round((Number(stats.average_rating) / 5) * 100))
        ),
    };
}

function parseAiJson(rawText) {
    if (!rawText) return null;
    const cleaned = String(rawText).trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryMs(error) {
    const fromHeader = Number(error?.response?.headers?.["retry-after"]);
    if (Number.isFinite(fromHeader) && fromHeader > 0) {
        return Math.min(fromHeader * 1000, 15000);
    }

    const msg = String(error?.response?.data?.error?.message || error?.message || "");
    const matched = msg.match(/retry in\s+([0-9.]+)s/i);
    if (!matched) return 0;
    const seconds = Number(matched[1]);
    if (!Number.isFinite(seconds) || seconds <= 0) return 0;
    return Math.min(Math.ceil(seconds * 1000), 15000);
}

function isQuotaOrRateLimitError(error) {
    const statusCode = Number(error?.response?.status || 0);
    const statusText = String(error?.response?.data?.error?.status || "");
    return statusCode === 429 || /RESOURCE_EXHAUSTED|RATE_LIMIT/i.test(statusText);
}

async function ensureReviewSummaryTables() {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS product_review_summary_cache (
            product_id INT PRIMARY KEY,
            summary_text TEXT NULL,
            highlights JSON NULL,
            recommendation_percent INT NULL,
            total_reviews INT NOT NULL DEFAULT 0,
            average_rating DECIMAL(3,1) NOT NULL DEFAULT 0.0,
            rating_counts JSON NULL,
            last_review_id_processed INT NOT NULL DEFAULT 0,
            source VARCHAR(20) NOT NULL DEFAULT 'rule',
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS product_review_summary_jobs (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            product_id INT NOT NULL,
            trigger_type VARCHAR(30) NOT NULL DEFAULT 'review_updated',
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            attempts INT NOT NULL DEFAULT 0,
            next_retry_at DATETIME NULL,
            last_error TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_jobs_status_created (status, created_at),
            INDEX idx_jobs_product (product_id)
        )
    `);

    const [columns] = await connection.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'product_review_summary_jobs'
           AND COLUMN_NAME = 'next_retry_at'
         LIMIT 1`
    );

    if (!columns || columns.length === 0) {
        await connection.query(`
            ALTER TABLE product_review_summary_jobs
            ADD COLUMN next_retry_at DATETIME NULL AFTER attempts
        `);
    }
}

async function enqueueReviewSummaryJob(productId, triggerType = "review_updated") {
    if (!productId) return;
    await connection.query(
        `INSERT INTO product_review_summary_jobs (product_id, trigger_type, status) VALUES (?, ?, 'pending')`,
        [productId, triggerType]
    );
}

async function getReviewSummaryByProductId(productId) {
    const [rows] = await connection.query(
        `SELECT * FROM product_review_summary_cache WHERE product_id = ? LIMIT 1`,
        [productId]
    );
    return rows[0] || null;
}

async function loadReviewStats(productId) {
    const [rows] = await connection.query(
        `SELECT rating, comment, id
         FROM product_reviews
         WHERE product_id = ? AND parent_id IS NULL AND is_active = 1
         ORDER BY id ASC`,
        [productId]
    );

    const validRatings = rows.filter((r) => r.rating !== null && !isNaN(r.rating));
    const totalReviews = validRatings.length;
    const averageRating = totalReviews > 0
        ? Number(
            (validRatings.reduce((sum, r) => sum + Number(r.rating), 0) / totalReviews).toFixed(1)
        )
        : 0;

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    validRatings.forEach((r) => {
        const n = parseInt(r.rating, 10);
        if (n >= 1 && n <= 5) ratingCounts[n] += 1;
    });

    return {
        allReviews: rows,
        total_reviews: totalReviews,
        average_rating: averageRating,
        rating_counts: ratingCounts,
        last_review_id: rows.length ? rows[rows.length - 1].id : 0,
    };
}

async function callGeminiForSummary({ oldSummary, newReviews, contextReviews, stats }) {
    if (!API_KEY) return null;

    const prompt = `
Bạn là AI tổng hợp đánh giá sản phẩm cho trang thương mại điện tử.
Nhiệm vụ: cập nhật lại summary ngắn gọn, trung lập, dễ hiểu cho người mua.

Dữ liệu summary cũ:
${oldSummary?.summary_text || "(chưa có)"}

Đánh giá mới (chỉ phần mới):
${JSON.stringify(newReviews)}

Mẫu đánh giá gần nhất (để giữ đúng ý chính nếu không có review mới):
${JSON.stringify(contextReviews || [])}

Số liệu hiện tại:
${JSON.stringify({
        average_rating: stats.average_rating,
        total_reviews: stats.total_reviews,
        rating_counts: stats.rating_counts,
    })}

Yêu cầu output đúng JSON, không thêm text ngoài JSON:
{
  "summary_text": "2-4 câu tiếng Việt, không ghi kiểu 'điểm trung bình X/Y từ N lượt đánh giá'",
  "highlights": ["3-4 ý ngắn tiếng Việt"],
  "recommendation_percent": 0-100
}
Lưu ý: nếu có ý tiêu cực cụ thể trong review (ví dụ giao hàng chậm, pin yếu, lỗi), phải nêu ngắn gọn trong summary_text.
`.trim();

    const requestData = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.35,
            topP: 0.9,
            maxOutputTokens: 512,
        },
    };

    let minRetryMs = 0;

    for (const modelId of GEMINI_MODEL_FALLBACKS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;
            const response = await axios.post(url, requestData, {
                headers: { "Content-Type": "application/json" },
                httpsAgent,
                timeout: 25000,
            });
            const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const parsed = parseAiJson(text);
            if (parsed?.summary_text) return parsed;
        } catch (error) {
            const retryMs = extractRetryMs(error);
            if (!minRetryMs || (retryMs > 0 && retryMs < minRetryMs)) {
                minRetryMs = retryMs;
            }
            console.warn(
                `[review-summary] Gemini ${modelId} failed -> fallback model tiếp`,
                error?.response?.data || error.message
            );

            // 429/quota thì chuyển model kế tiếp ngay, không kẹt retry cùng model.
            if (isQuotaOrRateLimitError(error)) continue;
        }
    }

    if (minRetryMs > 0) {
        const retriableError = new Error(`GEMINI_ALL_MODELS_RATE_LIMITED|retry_ms=${minRetryMs}`);
        retriableError.code = "GEMINI_ALL_MODELS_RATE_LIMITED";
        retriableError.retryMs = minRetryMs;
        throw retriableError;
    }

    return null;
}

async function generateAndSaveSummary(productId) {
    const oldSummary = await getReviewSummaryByProductId(productId);
    const stats = await loadReviewStats(productId);

    if (stats.total_reviews === 0) {
        await connection.query(`DELETE FROM product_review_summary_cache WHERE product_id = ?`, [productId]);
        return null;
    }

    const lastProcessed = oldSummary?.last_review_id_processed || 0;
    const newReviews = stats.allReviews
        .filter((r) => r.id > lastProcessed)
        .map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: String(r.comment || "").trim().slice(0, 500),
        }));

    const contextReviews = stats.allReviews
        .slice(-8)
        .map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: String(r.comment || "").trim().slice(0, 500),
        }));

    const aiResult = await callGeminiForSummary({ oldSummary, newReviews, contextReviews, stats });
    const computed = aiResult || buildSafeSummaryFallback({ oldSummary, newReviews, contextReviews, stats });

    const summaryText = String(computed.summary_text || "").trim().slice(0, 4000);
    const highlights = Array.isArray(computed.highlights)
        ? computed.highlights.map((x) => String(x).trim()).filter(Boolean).slice(0, 5)
        : [];
    const recommendationPercent = Number.isFinite(Number(computed.recommendation_percent))
        ? Math.min(100, Math.max(0, Math.round(Number(computed.recommendation_percent))))
        : Math.min(100, Math.max(0, Math.round((stats.average_rating / 5) * 100)));

    await connection.query(
        `INSERT INTO product_review_summary_cache
            (product_id, summary_text, highlights, recommendation_percent, total_reviews, average_rating, rating_counts, last_review_id_processed, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            summary_text = VALUES(summary_text),
            highlights = VALUES(highlights),
            recommendation_percent = VALUES(recommendation_percent),
            total_reviews = VALUES(total_reviews),
            average_rating = VALUES(average_rating),
            rating_counts = VALUES(rating_counts),
            last_review_id_processed = VALUES(last_review_id_processed),
            source = VALUES(source),
            updated_at = CURRENT_TIMESTAMP`,
        [
            productId,
            summaryText,
            JSON.stringify(highlights),
            recommendationPercent,
            stats.total_reviews,
            stats.average_rating,
            JSON.stringify(stats.rating_counts),
            stats.last_review_id,
            aiResult ? "gemini" : "rule",
        ]
    );

    return {
        product_id: productId,
        summary_text: summaryText,
        highlights,
        recommendation_percent: recommendationPercent,
        total_reviews: stats.total_reviews,
        average_rating: stats.average_rating,
        rating_counts: stats.rating_counts,
        source: aiResult ? "gemini" : "rule",
    };
}

module.exports = {
    ensureReviewSummaryTables,
    enqueueReviewSummaryJob,
    getReviewSummaryByProductId,
    generateAndSaveSummary,
};
