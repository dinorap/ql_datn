const connection = require("../config/database");

function calculateDynamicSalePrice(base, formula, value) {
    if (!formula) return base;
    const expression = formula
        .replace(/{{base}}/g, base)
        .replace(/{{value}}/g, value);
    try {
        return parseFloat(eval(expression).toFixed(2));
    } catch {
        return base;
    }
}

/** Bỏ ký tự wildcard LIKE và ký tự thừa — tránh SQL wildcard injection */
function sanitizeLikeFragment(str) {
    return String(str)
        .replace(/[%_\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function buildSearchCandidates(raw) {
    const s = String(raw || "")
        .trim()
        .replace(/\s+/g, " ");
    if (!s) return [];

    const lowered = s.toLowerCase();
    const noise =
        /điện thoại|dien thoai|smartphone|\bdt\b|\bđt\b|cho hỏi|xin hỏi|giá|gia|bao nhiêu|\bcửa hàng\b|\?|!/gi;
    const expanded = lowered
        .replace(noise, " ")
        .replace(/\bip\b/gi, "iphone ")
        .replace(/\biphone\s+/gi, "iphone ")
        .replace(/\s+/g, " ")
        .trim();

    const candidates = new Set();
    const add = (v) => {
        const t = String(v || "").trim();
        if (t.length >= 2) candidates.add(t);
    };

    add(s);
    add(expanded);

    const parts = expanded.split(" ").filter((p) => p.length >= 2);
    for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j <= Math.min(i + 5, parts.length); j++) {
            add(parts.slice(i, j).join(" "));
        }
    }
    parts.forEach((p) => add(p));

    return [...candidates].slice(0, 14);
}

function extractBrandHint(msg) {
    const m = String(msg || "").toLowerCase();
    if (m.includes("iphone") || /\bip\d/.test(m) || /\bip\s/.test(m)) return "iphone";
    if (m.includes("samsung") || m.includes("galaxy")) return "samsung";
    if (m.includes("xiaomi") || m.includes("redmi") || m.includes("poco")) return "xiaomi";
    if (m.includes("oppo")) return "oppo";
    if (m.includes("vivo")) return "vivo";
    if (m.includes("realme")) return "realme";
    if (m.includes("nothing")) return "nothing";
    if (m.includes("google pixel") || m.includes("pixel")) return "pixel";
    return null;
}

function extractPriceWindowHintVND(msg) {
    const text = String(msg || "").toLowerCase().replace(/,/g, ".");
    if (!text) return null;

    // "10 tr", "10 triệu", "10m", "10000k"
    const match = text.match(
        /(\d+(?:\.\d+)?)\s*(trieu|triệu|tr|m|k|nghìn|nghin|ngàn|ngan)\b/i
    );
    if (!match) return null;

    const value = parseFloat(match[1]);
    if (!Number.isFinite(value) || value <= 0) return null;

    const unit = match[2].toLowerCase();
    let centerVND = 0;
    if (unit === "k" || unit === "nghìn" || unit === "nghin" || unit === "ngàn" || unit === "ngan") {
        centerVND = value * 1_000;
    } else {
        centerVND = value * 1_000_000;
    }

    // Yeu cau: +-2 trieu quanh moc gia user hoi.
    const delta = 2_000_000;
    return {
        centerVND,
        minVND: Math.max(0, Math.round(centerVND - delta)),
        maxVND: Math.round(centerVND + delta),
    };
}

function isProductInPriceWindow(product, priceWindow) {
    if (!priceWindow) return true;
    const pMin = Number(product?.gia_tu_san_pham_con_hang_VND ?? product?.gia_sau_uu_dai_neu_co);
    const pMax = Number(product?.gia_den_san_pham_con_hang_VND ?? product?.gia_sau_uu_dai_neu_co);
    if (!Number.isFinite(pMin) && !Number.isFinite(pMax)) return false;
    const low = Number.isFinite(pMin) ? pMin : pMax;
    const high = Number.isFinite(pMax) ? pMax : pMin;
    // Giu san pham neu khoang gia cua no giao voi khoang user yeu cau.
    return low <= priceWindow.maxVND && high >= priceWindow.minVND;
}

function hasPhoneIntent(msg) {
    const text = String(msg || "").toLowerCase();
    return /\b(điện thoại|dien thoai|smartphone|\bdt\b|\bđt\b|iphone|galaxy|xiaomi|oppo|vivo|realme)\b/i.test(
        text
    );
}

function hasTopSellingIntent(msg) {
    const text = String(msg || "").toLowerCase();
    return /\b(hot|bán chạy|ban chay|best seller|mua nhiều|mua nhieu|nổi bật|noi bat)\b/i.test(
        text
    );
}

function isLikelyPhoneProduct(product) {
    const text = String(product?.ten || "").toLowerCase();
    if (!text) return false;
    // Loai cac tu khoa tablet de tranh goi y sai intent "dien thoai".
    if (/\b(ipad|tablet|tab|pad)\b/i.test(text)) return false;
    return true;
}

async function loadPromoTypeMap() {
    const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
    const map = {};
    promotionTypes.forEach((type) => {
        map[type.id] = type.formula;
    });
    return map;
}

async function queryProductsRows(likePattern, limit) {
    const [rows] = await connection.query(
        `
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.product_code,
            p.screen,
            p.cpu,
            p.battery,
            LEFT(p.description, 600) AS description_excerpt,
            c.name AS company_name,
            v.id AS variant_id,
            v.color,
            v.base_price,
            pr.discount_value,
            pr.promotion_type_id,
            pt.name AS promotion_type_name,
            pt.code AS promotion_code,
            COALESCE(
                (
                    SELECT SUM(vo.stock_quantity)
                    FROM product_variants pv2
                    JOIN product_variant_options vo ON vo.variant_id = pv2.id
                    WHERE pv2.product_id = p.id
                ),
                0
            ) AS total_stock,
            (
                SELECT MIN(pv3.base_price + COALESCE(vo3.extra_price, 0))
                FROM product_variants pv3
                JOIN product_variant_options vo3
                    ON vo3.variant_id = pv3.id AND vo3.stock_quantity > 0
                WHERE pv3.product_id = p.id
            ) AS min_price_in_stock
        FROM products p
        LEFT JOIN companies c ON c.id = p.company_id
        JOIN (
            SELECT v1.*
            FROM product_variants v1
            INNER JOIN (
                SELECT product_id, MIN(id) AS min_variant_id
                FROM product_variants
                GROUP BY product_id
            ) AS min_v ON v1.product_id = min_v.product_id AND v1.id = min_v.min_variant_id
        ) v ON p.id = v.product_id
        LEFT JOIN (
            SELECT pr1.*
            FROM promotions pr1
            INNER JOIN (
                SELECT variant_id, MAX(start_date) AS max_start
                FROM promotions
                WHERE end_date > NOW()
                GROUP BY variant_id
            ) latest ON pr1.variant_id = latest.variant_id AND pr1.start_date = latest.max_start
        ) pr ON v.id = pr.variant_id AND pr.end_date > NOW()
        LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
        WHERE
            p.is_active = 1
            AND (
                p.name LIKE ?
                OR p.screen LIKE ?
                OR p.cpu LIKE ?
                OR p.battery LIKE ?
                OR p.description LIKE ?
                OR EXISTS (
                    SELECT 1
                    FROM product_variants pvx
                    JOIN product_variant_options vox ON vox.variant_id = pvx.id
                    WHERE pvx.product_id = p.id
                      AND (
                        COALESCE(vox.ram, '') LIKE ?
                        OR COALESCE(vox.rom, '') LIKE ?
                      )
                )
            )
        ORDER BY p.id DESC
        LIMIT ?
        `,
        [
            likePattern,
            likePattern,
            likePattern,
            likePattern,
            likePattern,
            likePattern,
            likePattern,
            limit,
        ]
    );
    return rows;
}

async function queryProductsByPriceWindow(minVND, maxVND, limit, phoneOnly) {
    const [rows] = await connection.query(
        `
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.product_code,
            p.screen,
            p.cpu,
            p.battery,
            LEFT(p.description, 600) AS description_excerpt,
            c.name AS company_name,
            v.id AS variant_id,
            v.color,
            v.base_price,
            pr.discount_value,
            pr.promotion_type_id,
            pt.name AS promotion_type_name,
            pt.code AS promotion_code,
            COALESCE(
                (
                    SELECT SUM(vo.stock_quantity)
                    FROM product_variants pv2
                    JOIN product_variant_options vo ON vo.variant_id = pv2.id
                    WHERE pv2.product_id = p.id
                ),
                0
            ) AS total_stock,
            (
                SELECT MIN(pv3.base_price + COALESCE(vo3.extra_price, 0))
                FROM product_variants pv3
                JOIN product_variant_options vo3
                    ON vo3.variant_id = pv3.id AND vo3.stock_quantity > 0
                WHERE pv3.product_id = p.id
            ) AS min_price_in_stock
        FROM products p
        LEFT JOIN companies c ON c.id = p.company_id
        JOIN (
            SELECT v1.*
            FROM product_variants v1
            INNER JOIN (
                SELECT product_id, MIN(id) AS min_variant_id
                FROM product_variants
                GROUP BY product_id
            ) AS min_v ON v1.product_id = min_v.product_id AND v1.id = min_v.min_variant_id
        ) v ON p.id = v.product_id
        LEFT JOIN (
            SELECT pr1.*
            FROM promotions pr1
            INNER JOIN (
                SELECT variant_id, MAX(start_date) AS max_start
                FROM promotions
                WHERE end_date > NOW()
                GROUP BY variant_id
            ) latest ON pr1.variant_id = latest.variant_id AND pr1.start_date = latest.max_start
        ) pr ON v.id = pr.variant_id AND pr.end_date > NOW()
        LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
        WHERE
            p.is_active = 1
            AND (
                (
                    SELECT MIN(pv3.base_price + COALESCE(vo3.extra_price, 0))
                    FROM product_variants pv3
                    JOIN product_variant_options vo3
                        ON vo3.variant_id = pv3.id AND vo3.stock_quantity > 0
                    WHERE pv3.product_id = p.id
                ) BETWEEN ? AND ?
            )
            AND (
                ? = 0 OR EXISTS (
                    SELECT 1
                    FROM product_categories pc
                    WHERE pc.id = p.category_id
                      AND (
                        LOWER(pc.name) LIKE '%điện thoại%'
                        OR LOWER(pc.name) LIKE '%dien thoai%'
                        OR LOWER(pc.name) LIKE '%phone%'
                      )
                )
            )
        ORDER BY min_price_in_stock ASC, p.id DESC
        LIMIT ?
        `,
        [minVND, maxVND, phoneOnly ? 1 : 0, limit]
    );
    return rows;
}

async function queryLatestActiveProducts(limit) {
    const [rows] = await connection.query(
        `
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.product_code,
            p.screen,
            p.cpu,
            p.battery,
            LEFT(p.description, 600) AS description_excerpt,
            c.name AS company_name,
            v.id AS variant_id,
            v.color,
            v.base_price,
            pr.discount_value,
            pr.promotion_type_id,
            pt.name AS promotion_type_name,
            pt.code AS promotion_code,
            COALESCE(
                (
                    SELECT SUM(vo.stock_quantity)
                    FROM product_variants pv2
                    JOIN product_variant_options vo ON vo.variant_id = pv2.id
                    WHERE pv2.product_id = p.id
                ),
                0
            ) AS total_stock,
            (
                SELECT MIN(pv3.base_price + COALESCE(vo3.extra_price, 0))
                FROM product_variants pv3
                JOIN product_variant_options vo3
                    ON vo3.variant_id = pv3.id AND vo3.stock_quantity > 0
                WHERE pv3.product_id = p.id
            ) AS min_price_in_stock
        FROM products p
        LEFT JOIN companies c ON c.id = p.company_id
        JOIN (
            SELECT v1.*
            FROM product_variants v1
            INNER JOIN (
                SELECT product_id, MIN(id) AS min_variant_id
                FROM product_variants
                GROUP BY product_id
            ) AS min_v ON v1.product_id = min_v.product_id AND v1.id = min_v.min_variant_id
        ) v ON p.id = v.product_id
        LEFT JOIN (
            SELECT pr1.*
            FROM promotions pr1
            INNER JOIN (
                SELECT variant_id, MAX(start_date) AS max_start
                FROM promotions
                WHERE end_date > NOW()
                GROUP BY variant_id
            ) latest ON pr1.variant_id = latest.variant_id AND pr1.start_date = latest.max_start
        ) pr ON v.id = pr.variant_id AND pr.end_date > NOW()
        LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
        WHERE p.is_active = 1
        ORDER BY p.id DESC
        LIMIT ?
        `,
        [limit]
    );
    return rows;
}

async function queryTopSellingRows(limit, phoneOnly) {
    const [rows] = await connection.query(
        `
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.product_code,
            p.screen,
            p.cpu,
            p.battery,
            LEFT(p.description, 600) AS description_excerpt,
            c.name AS company_name,
            v.id AS variant_id,
            v.color,
            v.base_price,
            pr.discount_value,
            pr.promotion_type_id,
            pt.name AS promotion_type_name,
            pt.code AS promotion_code,
            COALESCE(
                (
                    SELECT SUM(vo.stock_quantity)
                    FROM product_variants pv2
                    JOIN product_variant_options vo ON vo.variant_id = pv2.id
                    WHERE pv2.product_id = p.id
                ),
                0
            ) AS total_stock,
            (
                SELECT MIN(pv3.base_price + COALESCE(vo3.extra_price, 0))
                FROM product_variants pv3
                JOIN product_variant_options vo3
                    ON vo3.variant_id = pv3.id AND vo3.stock_quantity > 0
                WHERE pv3.product_id = p.id
            ) AS min_price_in_stock,
            ts.total_sold
        FROM (
            SELECT oi.product_id, SUM(oi.quantity) AS total_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status_id = 4
            GROUP BY oi.product_id
            ORDER BY total_sold DESC, oi.product_id DESC
            LIMIT ?
        ) ts
        JOIN products p ON p.id = ts.product_id AND p.is_active = 1
        LEFT JOIN companies c ON c.id = p.company_id
        JOIN (
            SELECT v1.*
            FROM product_variants v1
            INNER JOIN (
                SELECT product_id, MIN(id) AS min_variant_id
                FROM product_variants
                GROUP BY product_id
            ) AS min_v ON v1.product_id = min_v.product_id AND v1.id = min_v.min_variant_id
        ) v ON p.id = v.product_id
        LEFT JOIN (
            SELECT pr1.*
            FROM promotions pr1
            INNER JOIN (
                SELECT variant_id, MAX(start_date) AS max_start
                FROM promotions
                WHERE end_date > NOW()
                GROUP BY variant_id
            ) latest ON pr1.variant_id = latest.variant_id AND pr1.start_date = latest.max_start
        ) pr ON v.id = pr.variant_id AND pr.end_date > NOW()
        LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
        WHERE (
            ? = 0 OR EXISTS (
                SELECT 1
                FROM product_categories pc
                WHERE pc.id = p.category_id
                  AND (
                    LOWER(pc.name) LIKE '%điện thoại%'
                    OR LOWER(pc.name) LIKE '%dien thoai%'
                    OR LOWER(pc.name) LIKE '%phone%'
                  )
            )
        )
        ORDER BY ts.total_sold DESC, p.id DESC
        LIMIT ?
        `,
        [limit * 4, phoneOnly ? 1 : 0, limit]
    );
    return rows;
}

/**
 * Giá từng option — trùng logic getProductDetail (ViewProductController).
 * Trước đây chat dùng KM của biến thể đầu + MIN giá toàn SP → sai (vd 30.09 vs 31.09).
 */
function computeOptionFinalPrice(variantBase, extra, promotionRow, promoTypeMap) {
    const base_price = parseFloat(variantBase);
    const extraNum = parseFloat(extra || 0);
    const base_option_price = base_price + extraNum;
    if (!promotionRow || !promotionRow.promotion_type_id) {
        return { final_price: base_option_price, base_option_price };
    }
    const formula = promoTypeMap[promotionRow.promotion_type_id];
    if (!formula) {
        return { final_price: base_option_price, base_option_price };
    }
    let final_price;
    if (String(formula).trim() === "{{value}}") {
        final_price = parseFloat(promotionRow.discount_value) + extraNum;
    } else {
        final_price = calculateDynamicSalePrice(
            base_price + extraNum,
            formula,
            promotionRow.discount_value
        );
    }
    return { final_price, base_option_price };
}

async function enrichProductsWithCorrectPricing(products, promoTypeMap) {
    if (!products?.length) return;
    const productIds = [...new Set(products.map((p) => p.id).filter(Boolean))];
    if (!productIds.length) return;

    const ph = productIds.map(() => "?").join(",");
    const [variants] = await connection.query(
        `SELECT * FROM product_variants WHERE product_id IN (${ph}) ORDER BY product_id, id`,
        productIds
    );
    if (!variants.length) return;

    const variantIds = variants.map((v) => v.id);
    const phv = variantIds.map(() => "?").join(",");

    const [optionsRows] = await connection.query(
        `SELECT * FROM product_variant_options WHERE variant_id IN (${phv}) ORDER BY variant_id, id`,
        variantIds
    );

    const [promoRows] = await connection.query(
        `
        SELECT pr.*
        FROM promotions pr
        INNER JOIN (
            SELECT variant_id, MAX(start_date) AS max_start
            FROM promotions
            WHERE end_date > NOW() AND variant_id IN (${phv})
            GROUP BY variant_id
        ) latest ON pr.variant_id = latest.variant_id AND pr.start_date = latest.max_start
        WHERE pr.end_date > NOW()
        `,
        variantIds
    );

    const promoByVid = new Map();
    for (const pr of promoRows) {
        if (!promoByVid.has(pr.variant_id)) promoByVid.set(pr.variant_id, pr);
    }

    const optionsByVid = new Map();
    for (const o of optionsRows) {
        if (!optionsByVid.has(o.variant_id)) optionsByVid.set(o.variant_id, []);
        optionsByVid.get(o.variant_id).push(o);
    }

    const variantsByPid = new Map();
    for (const v of variants) {
        if (!variantsByPid.has(v.product_id)) variantsByPid.set(v.product_id, []);
        variantsByPid.get(v.product_id).push(v);
    }

    for (const p of products) {
        const vlist = variantsByPid.get(p.id) || [];
        let totalStock = 0;
        let minFinal = Infinity;
        let maxFinal = -Infinity;
        const cac_mau_chi_tiet = [];

        for (const v of vlist) {
            const promotion = promoByVid.get(v.id);
            const opts = optionsByVid.get(v.id) || [];
            const lua_chon = [];

            for (const opt of opts) {
                const { final_price, base_option_price } = computeOptionFinalPrice(
                    v.base_price,
                    opt.extra_price,
                    promotion,
                    promoTypeMap
                );
                const st = parseInt(opt.stock_quantity, 10) || 0;
                totalStock += st;
                const fp = Math.round(final_price);
                if (st > 0) {
                    if (fp < minFinal) minFinal = fp;
                    if (fp > maxFinal) maxFinal = fp;
                }
                lua_chon.push({
                    ram: opt.ram || null,
                    rom: opt.rom || null,
                    ton_kho: st,
                    gia_sau_uu_dai_VND: fp,
                    gia_list_VND: Math.round(base_option_price),
                });
            }

            const tonMau = lua_chon.reduce((s, o) => s + o.ton_kho, 0);
            const pricesInStock = lua_chon
                .filter((o) => o.ton_kho > 0)
                .map((o) => o.gia_sau_uu_dai_VND);
            cac_mau_chi_tiet.push({
                ten_mau: v.color || "—",
                ton_tong_mau: tonMau,
                gia_tu_con_hang_VND: pricesInStock.length ? Math.min(...pricesInStock) : null,
                gia_den_con_hang_VND: pricesInStock.length ? Math.max(...pricesInStock) : null,
                cau_hinh: lua_chon,
            });
        }

        p.ton_kho_tong = totalStock;
        p.het_hang = totalStock <= 0;
        p.cac_mau_chi_tiet = cac_mau_chi_tiet;
        p.cac_mau = cac_mau_chi_tiet.map((m) => ({
            ten_mau: m.ten_mau,
            ton_kho_bien_the: m.ton_tong_mau,
            gia_tu_VND: m.gia_tu_con_hang_VND,
        }));
        p.gia_tu_san_pham_con_hang_VND = Number.isFinite(minFinal) ? minFinal : null;
        p.gia_den_san_pham_con_hang_VND =
            maxFinal >= 0 && Number.isFinite(maxFinal) ? maxFinal : null;
        p.gia_goc_tham_chieu = p.gia_tu_san_pham_con_hang_VND;
        p.gia_sau_uu_dai_neu_co = p.gia_tu_san_pham_con_hang_VND;
        p.dang_khuyen_mai = cac_mau_chi_tiet.some((m) =>
            (m.cau_hinh || []).some(
                (c) =>
                    c.gia_list_VND &&
                    c.gia_sau_uu_dai_VND &&
                    c.gia_sau_uu_dai_VND < c.gia_list_VND
            )
        );
        p.loai_km = p.dang_khuyen_mai
            ? "Ưu đãi theo biến thể/cấu hình (đối chiếu gia_list_VND vs gia_sau_uu_dai_VND)"
            : null;
    }
}

function shapeProduct(row, promoTypeMap) {
    const base = parseFloat(row.base_price);
    const minInStock = row.min_price_in_stock != null ? parseFloat(row.min_price_in_stock) : null;
    const priceBase = Number.isFinite(minInStock) ? minInStock : base;
    const formula = row.promotion_type_id ? promoTypeMap[row.promotion_type_id] : null;
    const finalPrice = formula
        ? calculateDynamicSalePrice(priceBase, formula, row.discount_value)
        : priceBase;
    const totalStock = parseInt(row.total_stock, 10) || 0;

    return {
        id: row.product_id,
        ten: row.product_name,
        ma: row.product_code,
        hang: row.company_name || null,
        man_hinh: row.screen || null,
        cpu: row.cpu || null,
        pin: row.battery || null,
        mo_ta_ngan: row.description_excerpt || null,
        mau_bien_the: row.color || null,
        ton_kho_tong: totalStock,
        het_hang: totalStock <= 0,
        gia_goc_tham_chieu: Math.round(priceBase),
        gia_sau_uu_dai_neu_co: Math.round(finalPrice),
        dang_khuyen_mai: Boolean(row.promotion_type_id),
        loai_km: row.promotion_type_name || null,
        cac_mau: [],
        cac_mau_chi_tiet: [],
    };
}

/**
 * Thu thập sản phẩm liên quan từ DB để nhét vào prompt (không bịa giá ngoài JSON này).
 * @param {string} searchText — gộp vài lượt chat + câu hiện tại để LIKE không bị lạc ngữ cảnh
 */
async function getCatalogContextForMessage(searchText) {
    const promoTypeMap = await loadPromoTypeMap();
    const priceWindow = extractPriceWindowHintVND(searchText);
    const hotIntent = hasTopSellingIntent(searchText);
    const candidates = buildSearchCandidates(searchText).sort(
        (a, b) => b.length - a.length
    );
    const byId = new Map();
    const phoneIntent = hasPhoneIntent(searchText);

    for (const term of candidates) {
        const safe = sanitizeLikeFragment(term);
        if (!safe) continue;
        const pat = `%${safe}%`;
        const rows = await queryProductsRows(pat, 8);
        for (const row of rows) {
            if (!byId.has(row.product_id)) {
                byId.set(row.product_id, shapeProduct(row, promoTypeMap));
            }
        }
        if (byId.size >= 10) break;
    }

    let matches = [...byId.values()].slice(0, 10);
    let similar = [];
    let similarReason = null;

    if (matches.length === 0) {
        const brand = extractBrandHint(searchText);
        let rows;
        if (brand === "iphone") {
            similarReason = "Không tìm thấy đúng tên trong kho — gợi ý các iPhone đang có.";
            rows = await queryProductsRows("%iphone%", 8);
        } else if (brand) {
            similarReason = `Không tìm thấy đúng tên trong kho — gợi ý các máy ${brand} đang có.`;
            rows = await queryProductsRows(`%${sanitizeLikeFragment(brand)}%`, 8);
        } else {
            similarReason = "Không khớp tên cụ thể — gợi ý một số máy đang mở bán.";
            const [fallback] = await connection.query(
                `
                SELECT
                    p.id AS product_id,
                    p.name AS product_name,
                    p.product_code,
                    p.screen,
                    p.cpu,
                    p.battery,
                    LEFT(p.description, 600) AS description_excerpt,
                    c.name AS company_name,
                    v.id AS variant_id,
                    v.color,
                    v.base_price,
                    pr.discount_value,
                    pr.promotion_type_id,
                    pt.name AS promotion_type_name,
                    pt.code AS promotion_code,
                    COALESCE(
                        (
                            SELECT SUM(vo.stock_quantity)
                            FROM product_variants pv2
                            JOIN product_variant_options vo ON vo.variant_id = pv2.id
                            WHERE pv2.product_id = p.id
                        ),
                        0
                    ) AS total_stock,
                    (
                        SELECT MIN(pv3.base_price + COALESCE(vo3.extra_price, 0))
                        FROM product_variants pv3
                        JOIN product_variant_options vo3
                            ON vo3.variant_id = pv3.id AND vo3.stock_quantity > 0
                        WHERE pv3.product_id = p.id
                    ) AS min_price_in_stock
                FROM products p
                LEFT JOIN companies c ON c.id = p.company_id
                JOIN (
                    SELECT v1.*
                    FROM product_variants v1
                    INNER JOIN (
                        SELECT product_id, MIN(id) AS min_variant_id
                        FROM product_variants
                        GROUP BY product_id
                    ) AS min_v ON v1.product_id = min_v.product_id AND v1.id = min_v.min_variant_id
                ) v ON p.id = v.product_id
                LEFT JOIN (
                    SELECT pr1.*
                    FROM promotions pr1
                    INNER JOIN (
                        SELECT variant_id, MAX(start_date) AS max_start
                        FROM promotions
                        WHERE end_date > NOW()
                        GROUP BY variant_id
                    ) latest ON pr1.variant_id = latest.variant_id AND pr1.start_date = latest.max_start
                ) pr ON v.id = pr.variant_id AND pr.end_date > NOW()
                LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                WHERE p.is_active = 1
                ORDER BY p.id DESC
                LIMIT 8
                `
            );
            rows = fallback;
        }
        similar = rows.map((r) => shapeProduct(r, promoTypeMap));
    }

    /** Mẫu khớp nhưng hết hàng toàn bộ → gợi ý máy cùng hãng còn hàng */
    let stockAlternatives = [];
    if (matches.length > 0 && matches.every((m) => m.het_hang)) {
        const brand = extractBrandHint(searchText);
        let rows = [];
        if (brand) {
            rows = await queryProductsRows(`%${sanitizeLikeFragment(brand)}%`, 20);
        } else {
            const [fallback] = await connection.query(
                `
                SELECT
                    p.id AS product_id,
                    p.name AS product_name,
                    p.product_code,
                    p.screen,
                    p.cpu,
                    p.battery,
                    LEFT(p.description, 600) AS description_excerpt,
                    c.name AS company_name,
                    v.id AS variant_id,
                    v.color,
                    v.base_price,
                    pr.discount_value,
                    pr.promotion_type_id,
                    pt.name AS promotion_type_name,
                    pt.code AS promotion_code,
                    COALESCE(
                        (
                            SELECT SUM(vo.stock_quantity)
                            FROM product_variants pv2
                            JOIN product_variant_options vo ON vo.variant_id = pv2.id
                            WHERE pv2.product_id = p.id
                        ),
                        0
                    ) AS total_stock,
                    (
                        SELECT MIN(pv3.base_price + COALESCE(vo3.extra_price, 0))
                        FROM product_variants pv3
                        JOIN product_variant_options vo3
                            ON vo3.variant_id = pv3.id AND vo3.stock_quantity > 0
                        WHERE pv3.product_id = p.id
                    ) AS min_price_in_stock
                FROM products p
                LEFT JOIN companies c ON c.id = p.company_id
                JOIN (
                    SELECT v1.*
                    FROM product_variants v1
                    INNER JOIN (
                        SELECT product_id, MIN(id) AS min_variant_id
                        FROM product_variants
                        GROUP BY product_id
                    ) AS min_v ON v1.product_id = min_v.product_id AND v1.id = min_v.min_variant_id
                ) v ON p.id = v.product_id
                LEFT JOIN (
                    SELECT pr1.*
                    FROM promotions pr1
                    INNER JOIN (
                        SELECT variant_id, MAX(start_date) AS max_start
                        FROM promotions
                        WHERE end_date > NOW()
                        GROUP BY variant_id
                    ) latest ON pr1.variant_id = latest.variant_id AND pr1.start_date = latest.max_start
                ) pr ON v.id = pr.variant_id AND pr.end_date > NOW()
                LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                WHERE p.is_active = 1
                ORDER BY p.id DESC
                LIMIT 24
                `
            );
            rows = fallback;
        }
        const seen = new Set(matches.map((m) => m.id));
        stockAlternatives = rows
            .map((r) => shapeProduct(r, promoTypeMap))
            .filter((p) => !p.het_hang && !seen.has(p.id))
            .slice(0, 6);
    }

    await enrichProductsWithCorrectPricing(matches, promoTypeMap);
    await enrichProductsWithCorrectPricing(similar, promoTypeMap);
    await enrichProductsWithCorrectPricing(stockAlternatives, promoTypeMap);

    // Neu user hoi "tam X trieu", loc theo khoang +-2 trieu.
    if (priceWindow) {
        matches = matches.filter((p) => isProductInPriceWindow(p, priceWindow));
        similar = similar.filter((p) => isProductInPriceWindow(p, priceWindow));
        stockAlternatives = stockAlternatives.filter((p) =>
            isProductInPriceWindow(p, priceWindow)
        );

        // Neu hoi theo budget ma sau loc bi rong, truy van truc tiep theo khoang gia.
        if (matches.length === 0) {
            const budgetRows = await queryProductsByPriceWindow(
                priceWindow.minVND,
                priceWindow.maxVND,
                12,
                phoneIntent
            );
            matches = budgetRows.map((r) => shapeProduct(r, promoTypeMap)).slice(0, 10);
            await enrichProductsWithCorrectPricing(matches, promoTypeMap);
            matches = matches.filter((p) => isProductInPriceWindow(p, priceWindow));
        }

        if (matches.length === 0 && similarReason) {
            similarReason = `${similarReason} Đã lọc theo khoảng giá ${priceWindow.minVND.toLocaleString("vi-VN")} - ${priceWindow.maxVND.toLocaleString("vi-VN")} VND.`;
        }
    }

    // Neu user hoi dien thoai, loai cac goi y tablet/pad.
    if (phoneIntent) {
        matches = matches.filter(isLikelyPhoneProduct);
        similar = similar.filter(isLikelyPhoneProduct);
        stockAlternatives = stockAlternatives.filter(isLikelyPhoneProduct);
    }

    // Khoi "cuu canh" cho query budget: loc truc tiep tu DB theo gia sau uu dai.
    // Muc tieu: neu user hoi dien thoai tam 15tr thi phai ra dung dien thoai 13-17tr.
    if (priceWindow) {
        const budgetPoolRows = await queryLatestActiveProducts(220);
        let budgetPool = budgetPoolRows.map((r) => shapeProduct(r, promoTypeMap));
        await enrichProductsWithCorrectPricing(budgetPool, promoTypeMap);

        budgetPool = budgetPool.filter((p) => !p.het_hang);
        if (phoneIntent) {
            budgetPool = budgetPool.filter(isLikelyPhoneProduct);
        }
        budgetPool = budgetPool.filter((p) => isProductInPriceWindow(p, priceWindow));

        if (budgetPool.length > 0) {
            matches = budgetPool.slice(0, 10);
            similar = [];
            stockAlternatives = [];
            similarReason = null;
        }
    }

    if (hotIntent) {
        const hotRows = await queryTopSellingRows(8, phoneIntent);
        let hotProducts = hotRows.map((r) => {
            const p = shapeProduct(r, promoTypeMap);
            p.da_ban = Number(r.total_sold || 0);
            return p;
        });
        await enrichProductsWithCorrectPricing(hotProducts, promoTypeMap);
        if (phoneIntent) {
            hotProducts = hotProducts.filter(isLikelyPhoneProduct);
        }
        if (hotProducts.length > 0) {
            matches = hotProducts.slice(0, 8);
            similar = [];
            stockAlternatives = [];
            similarReason = "Danh sách bán chạy dựa trên số lượng đơn đã hoàn tất (status_id = 4).";
        }
    }

    return {
        matches,
        similar,
        similarReason,
        stockAlternatives,
        candidatesTried: candidates,
    };
}

module.exports = {
    getCatalogContextForMessage,
    buildSearchCandidates,
};
