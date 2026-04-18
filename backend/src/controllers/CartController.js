const connection = require("../config/database");

function calculateDynamicSalePrice(base, formula, value) {
    if (!formula) return base;
    const expression = formula
        .replace(/{{base}}/g, base)
        .replace(/{{value}}/g, value);
    try {
        return parseFloat(eval(expression).toFixed(2));
    } catch (error) {
        console.error("Lỗi tính sale_price:", error);
        return base;
    }
}
const addToCart = async (req, res) => {
    try {
        const { user_id, option_id, quantity } = req.body;
        if (!user_id || !option_id || !quantity) {
            return res.status(400).json({ EC: 1, EM: "Thiếu dữ liệu bắt buộc" });
        }


        const [carts] = await connection.query(
            "SELECT * FROM carts WHERE user_id = ?",
            [user_id]
        );

        let cart_id;
        if (carts.length === 0) {
            const [insertResult] = await connection.query(
                "INSERT INTO carts (user_id) VALUES (?)",
                [user_id]
            );
            cart_id = insertResult.insertId;
        } else {
            cart_id = carts[0].id;
        }


        const [item] = await connection.query(
            "SELECT * FROM cart_items WHERE cart_id = ? AND option_id = ?",
            [cart_id, option_id]
        );

        if (item.length > 0) {

            await connection.query(
                "UPDATE cart_items SET stock_quantity = stock_quantity + ? WHERE id = ?",
                [quantity, item[0].id]
            );
        } else {

            await connection.query(
                "INSERT INTO cart_items (cart_id, option_id, stock_quantity) VALUES (?, ?, ?)",
                [cart_id, option_id, quantity]
            );
        }

        return res.status(200).json({
            EC: 0,
            EM: "Thêm vào giỏ hàng thành công",
        });
    } catch (error) {
        console.error("Lỗi khi thêm vào giỏ:", error);
        return res.status(500).json({
            EC: -1,
            EM: "Lỗi server khi thêm sản phẩm vào giỏ",
        });
    }
};
const deleteCartItemById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ EC: 1, EM: "Thiếu id của cart_item" });
        }

        const [result] = await connection.query(
            "DELETE FROM cart_items WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ EC: 2, EM: "Không tìm thấy sản phẩm trong giỏ" });
        }

        return res.status(200).json({
            EC: 0,
            EM: "Xóa sản phẩm khỏi giỏ hàng thành công",
        });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm theo id:", error);
        return res.status(500).json({
            EC: -1,
            EM: "Lỗi server khi xóa sản phẩm khỏi giỏ",
        });
    }
};


const getCartByUserId = async (req, res) => {
    try {
        const userId = req.params.user_id;

        const [cartRows] = await connection.query(
            `SELECT id FROM carts WHERE user_id = ?`,
            [userId]
        );

        if (cartRows.length === 0) {
            return res.status(200).json({ EC: 0, EM: "Giỏ hàng rỗng ", data: [] });
        }

        const cartId = cartRows[0].id;

        const [items] = await connection.query(
            `SELECT 
                ci.id AS cart_item_id,
                ci.option_id,
                ci.stock_quantity AS cart_quantity,
                po.ram, po.rom, po.extra_price, po.stock_quantity AS option_stock_quantity,
                v.id AS variant_id, v.color, v.base_price, v.variant_code, v.product_id, v.created_at AS variant_created_at,
                p.name AS product_name, p.product_code,p.description,
                pm.discount_value, pt.formula,
                pt.code AS promotion_code, pm.end_date
            FROM cart_items ci
            JOIN product_variant_options po ON ci.option_id = po.id
            JOIN product_variants v ON po.variant_id = v.id
            JOIN products p ON v.product_id = p.id
            LEFT JOIN promotions pm ON pm.variant_id = v.id
            LEFT JOIN promotion_types pt ON pm.promotion_type_id = pt.id
            WHERE ci.cart_id = ?`,
            [cartId]
        );

        const result = [];

        for (const item of items) {
            const base_price = parseFloat(item.base_price);
            const extra = parseFloat(item.extra_price || 0);
            const discount = parseFloat(item.discount_value || 0);
            const hasPromo = item.formula && item.promotion_code;

            let final_price;
            let base_option_price = base_price + extra;
            if (hasPromo) {
                const formula = item.formula;
                final_price = formula.trim() === "{{value}}"
                    ? discount + extra
                    : calculateDynamicSalePrice(base_price + extra, formula, discount);
            } else {
                final_price = base_price + extra;
            }


            const [imgRow] = await connection.query(
                `SELECT image_data FROM product_images WHERE variant_id = ? ORDER BY id ASC LIMIT 1`,
                [item.variant_id]
            );
            const image = imgRow[0]?.image_data || null;


            const [variantsRaw] = await connection.query(
                `SELECT * FROM product_variants WHERE product_id = ?`,
                [item.product_id]
            );


            const [promotionsRaw] = await connection.query(
                `SELECT pr.*, pt.name AS promotion_type_name, pt.code AS promotion_code
                 FROM promotions pr
                 JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                 WHERE pr.variant_id IN (SELECT id FROM product_variants WHERE product_id = ?)`,
                [item.product_id]
            );


            const promoMap = {};
            promotionsRaw.forEach(pr => {
                promoMap[pr.variant_id] = {
                    id: pr.id,
                    variant_id: pr.variant_id,
                    promotion_type_id: pr.promotion_type_id,
                    discount_value: pr.discount_value,
                    start_date: pr.start_date,
                    end_date: pr.end_date,
                    created_at: pr.created_at,
                    promotion_type_name: pr.promotion_type_name,
                    promotion_code: pr.promotion_code
                };
            });


            const [allOptionsRaw] = await connection.query(
                `SELECT id, variant_id, ram, rom, extra_price, stock_quantity 
                 FROM product_variant_options 
                 WHERE variant_id IN (
                    SELECT id FROM product_variants WHERE product_id = ?
                 ) AND stock_quantity > 0`,
                [item.product_id]
            );


            const [allImagesRaw] = await connection.query(
                `SELECT variant_id, image_data FROM product_images WHERE product_id = ? ORDER BY id ASC`,
                [item.product_id]
            );


            const optionsMap = {};
            allOptionsRaw.forEach(opt => {
                if (!optionsMap[opt.variant_id]) optionsMap[opt.variant_id] = [];
                optionsMap[opt.variant_id].push({
                    id: opt.id,
                    variant_id: opt.variant_id,
                    ram: opt.ram,
                    rom: opt.rom,
                    extra_price: parseFloat(opt.extra_price || 0),
                    stock_quantity: opt.stock_quantity,
                    final_price: null
                });
            });


            const imagesMap = {};
            allImagesRaw.forEach(img => {
                if (!imagesMap[img.variant_id]) imagesMap[img.variant_id] = [];
                imagesMap[img.variant_id].push(img.image_data);
            });


            for (const variantId in optionsMap) {
                const variant = variantsRaw.find(v => v.id == variantId);
                const base_price = parseFloat(variant.base_price);
                const promotion = promoMap[variantId];
                optionsMap[variantId] = optionsMap[variantId].map(opt => {
                    const extra = opt.extra_price;
                    let final_price;
                    let base_option_price = base_price + extra;
                    if (promotion) {
                        const formula = promotion.promotion_code;
                        final_price = promotion.promotion_code === "fixed_amount"
                            ? base_price + extra - parseFloat(promotion.discount_value)
                            : promotion.promotion_code === "percentage"
                                ? (base_price + extra) * (1 - parseFloat(promotion.discount_value) / 100)
                                : base_price + extra;
                    } else {
                        final_price = base_price + extra;
                    }
                    return {
                        id: opt.id,
                        variant_id: opt.variant_id,
                        ram: opt.ram,
                        rom: opt.rom,
                        stock_quantity: opt.stock_quantity,
                        final_price,
                        base_option_price
                    };
                });
            }


            const variants = variantsRaw.map(variant => ({
                id: variant.id,
                product_id: variant.product_id,
                variant_code: variant.variant_code,
                color: variant.color,
                base_price: parseFloat(variant.base_price),
                options: optionsMap[variant.id] || [],
                images: imagesMap[variant.id] ? imagesMap[variant.id].slice(0, 1) : []

            }));

            result.push({
                cart_item_id: item.cart_item_id,
                option_id: item.option_id,
                variant_id: item.variant_id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_description: item.description,
                current: {
                    color: item.color,
                    ram: item.ram,
                    rom: item.rom,
                    base_price: base_price,
                    stock_quantity: item.cart_quantity,
                    final_price,
                    base_option_price,
                    image
                },
                variants
            });
        }

        return res.status(200).json({ EC: 0, EM: "Lấy giỏ hàng thành công", data: result });
    } catch (error) {
        console.error("Lỗi getCartByUserId:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server" });
    }
};


const updateCartItem = async (req, res) => {
    try {
        const { cart_item_id, option_id, stock_quantity } = req.body;

        if (!cart_item_id || !option_id || !stock_quantity) {
            return res.status(400).json({ EC: 1, EM: "Thiếu dữ liệu bắt buộc" });
        }

        const [existing] = await connection.query(
            'SELECT * FROM cart_items WHERE id = ?',
            [cart_item_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ EC: 2, EM: "Không tìm thấy item trong giỏ hàng" });
        }

        await connection.query(
            'UPDATE cart_items SET option_id = ?, stock_quantity = ? WHERE id = ?',
            [option_id, stock_quantity, cart_item_id]
        );

        return res.status(200).json({ EC: 0, EM: "Cập nhật giỏ hàng thành công" });
    } catch (error) {
        console.error("Lỗi updateCartItem:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server" });
    }
};

const getCartCountByUserId = async (req, res) => {
    try {
        const userId = req.params.user_id;
        const [rows] = await connection.query(
            `SELECT SUM(stock_quantity) AS count 
             FROM cart_items 
             WHERE cart_id = (SELECT id FROM carts WHERE user_id = ?)`,
            [userId]
        );
        const count = rows[0]?.count ?? 0;
        return res.status(200).json({ EC: 0, EM: 'OK', count });
    } catch (error) {
        console.error("Lỗi getCartCountByUserId:", error);
        return res.status(500).json({ EC: -1, EM: 'Lỗi server', count: 0 });
    }
};


const getAllStoreLocations = async (req, res) => {
    try {
        const [rows] = await connection.query(`
            SELECT id, name, address, phone, city, is_active, created_at, updated_at
            FROM store_locations
            ORDER BY id DESC
        `);

        return res.status(200).json({
            EC: 0,
            EM: "Lấy danh sách địa điểm cửa hàng thành công",
            data: rows
        });
    } catch (error) {
        console.error('Error fetching store locations:', error);
        return res.status(500).json({
            EC: -1,
            EM: "Lỗi server khi lấy danh sách cửa hàng"
        });
    }
};

const getAllPayment = async (req, res) => {
    try {
        const [rows] = await connection.query(`
            SELECT *
            FROM payment_methods
           
        `);

        return res.status(200).json({
            EC: 0,
            EM: "Lấy danh sách các phương thức thanh toán thành công",
            data: rows
        });
    } catch (error) {
        console.error('Error fetching store locations:', error);
        return res.status(500).json({
            EC: -1,
            EM: "Lỗi server khi lấy phương thức thanh toán"
        });
    }
};


const getCartFromLocal = async (req, res) => {
    try {
        const items = req.body.items;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(200).json({ EC: 0, EM: "Không có sản phẩm", data: [] });
        }

        const optionIds = items.map(item => item.option_id);
        const optionMap = {};
        items.forEach(item => {
            optionMap[item.option_id] = {
                quantity: item.quantity,
                cart_item_id: item.cart_item_id
            };
        });

        const [rows] = await connection.query(`
      SELECT 
        po.id AS option_id, po.ram, po.rom, po.extra_price, po.stock_quantity AS option_stock_quantity,
        v.id AS variant_id, v.color, v.base_price, v.variant_code, v.product_id, v.created_at AS variant_created_at,
        p.name AS product_name, p.product_code, p.description,
        pm.discount_value, pt.formula, pt.code AS promotion_code, pm.end_date
      FROM product_variant_options po
      JOIN product_variants v ON po.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN promotions pm ON pm.variant_id = v.id
      LEFT JOIN promotion_types pt ON pm.promotion_type_id = pt.id
      WHERE po.id IN (?)
    `, [optionIds]);

        const result = [];

        for (const item of rows) {
            const { quantity, cart_item_id } = optionMap[item.option_id];
            const base_price = parseFloat(item.base_price);
            const extra = parseFloat(item.extra_price || 0);
            const discount = parseFloat(item.discount_value || 0);
            const hasPromo = item.formula && item.promotion_code;

            let final_price;
            const base_option_price = base_price + extra;

            if (hasPromo) {
                final_price = item.promotion_code === "fixed_amount"
                    ? base_option_price - discount
                    : item.promotion_code === "percentage"
                        ? base_option_price * (1 - discount / 100)
                        : base_option_price;
            } else {
                final_price = base_option_price;
            }


            const [imgRow] = await connection.query(
                `SELECT image_data FROM product_images WHERE variant_id = ? ORDER BY id ASC LIMIT 1`,
                [item.variant_id]
            );
            const image = imgRow[0]?.image_data || null;


            const [variantsRaw] = await connection.query(
                `SELECT * FROM product_variants WHERE product_id = ?`,
                [item.product_id]
            );


            const [promotionsRaw] = await connection.query(
                `SELECT pr.*, pt.name AS promotion_type_name, pt.code AS promotion_code
         FROM promotions pr
         JOIN promotion_types pt ON pr.promotion_type_id = pt.id
         WHERE pr.variant_id IN (SELECT id FROM product_variants WHERE product_id = ?)`,
                [item.product_id]
            );

            const promoMap = {};
            promotionsRaw.forEach(pr => {
                promoMap[pr.variant_id] = {
                    id: pr.id,
                    variant_id: pr.variant_id,
                    promotion_type_id: pr.promotion_type_id,
                    discount_value: pr.discount_value,
                    start_date: pr.start_date,
                    end_date: pr.end_date,
                    created_at: pr.created_at,
                    promotion_type_name: pr.promotion_type_name,
                    promotion_code: pr.promotion_code
                };
            });


            const [allOptionsRaw] = await connection.query(
                `SELECT id, variant_id, ram, rom, extra_price, stock_quantity 
         FROM product_variant_options 
         WHERE variant_id IN (
            SELECT id FROM product_variants WHERE product_id = ?
         ) AND stock_quantity > 0`,
                [item.product_id]
            );


            const [allImagesRaw] = await connection.query(
                `SELECT variant_id, image_data FROM product_images WHERE product_id = ? ORDER BY id ASC`,
                [item.product_id]
            );

            const optionsMap = {};
            allOptionsRaw.forEach(opt => {
                if (!optionsMap[opt.variant_id]) optionsMap[opt.variant_id] = [];
                optionsMap[opt.variant_id].push({
                    id: opt.id,
                    variant_id: opt.variant_id,
                    ram: opt.ram,
                    rom: opt.rom,
                    extra_price: parseFloat(opt.extra_price || 0),
                    stock_quantity: opt.stock_quantity,
                    final_price: null
                });
            });

            const imagesMap = {};
            allImagesRaw.forEach(img => {
                if (!imagesMap[img.variant_id]) imagesMap[img.variant_id] = [];
                imagesMap[img.variant_id].push(img.image_data);
            });


            for (const variantId in optionsMap) {
                const variant = variantsRaw.find(v => v.id == variantId);
                const base_price = parseFloat(variant.base_price);
                const promotion = promoMap[variantId];

                optionsMap[variantId] = optionsMap[variantId].map(opt => {
                    const extra = opt.extra_price;
                    let base_option_price = base_price + extra;
                    let final_price;

                    if (promotion) {
                        final_price = promotion.promotion_code === "fixed_amount"
                            ? base_option_price - parseFloat(promotion.discount_value)
                            : promotion.promotion_code === "percentage"
                                ? base_option_price * (1 - parseFloat(promotion.discount_value) / 100)
                                : base_option_price;
                    } else {
                        final_price = base_option_price;
                    }

                    return {
                        ...opt,
                        final_price,
                        base_option_price
                    };
                });
            }

            const variants = variantsRaw.map(variant => ({
                id: variant.id,
                product_id: variant.product_id,
                variant_code: variant.variant_code,
                color: variant.color,
                base_price: parseFloat(variant.base_price),
                options: optionsMap[variant.id] || [],
                images: imagesMap[variant.id] ? imagesMap[variant.id].slice(0, 1) : []
            }));

            result.push({
                cart_item_id,
                option_id: item.option_id,
                variant_id: item.variant_id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_description: item.description,
                current: {
                    color: item.color,
                    ram: item.ram,
                    rom: item.rom,
                    base_price,
                    stock_quantity: quantity,
                    final_price,
                    base_option_price,
                    image
                },
                variants
            });
        }

        return res.status(200).json({ EC: 0, EM: "Lấy giỏ hàng tạm thành công", data: result });
    } catch (error) {
        console.error("Lỗi getCartFromLocal:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server" });
    }
};

const mergeCartFromLocal = async (req, res) => {
    try {
        const { user_id, items } = req.body;

        if (!user_id || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ EC: 1, EM: "Thiếu user_id hoặc dữ liệu giỏ hàng" });
        }


        const [carts] = await connection.query(
            "SELECT * FROM carts WHERE user_id = ?",
            [user_id]
        );

        let cart_id;
        if (carts.length === 0) {
            const [insertResult] = await connection.query(
                "INSERT INTO carts (user_id) VALUES (?)",
                [user_id]
            );
            cart_id = insertResult.insertId;
        } else {
            cart_id = carts[0].id;
        }


        for (const item of items) {
            const { option_id, quantity } = item;


            if (!option_id || !quantity) continue;


            const [existingRows] = await connection.query(
                "SELECT * FROM cart_items WHERE cart_id = ? AND option_id = ?",
                [cart_id, option_id]
            );

            if (existingRows.length > 0) {

                await connection.query(
                    "UPDATE cart_items SET stock_quantity = stock_quantity + ? WHERE id = ?",
                    [quantity, existingRows[0].id]
                );
            } else {

                await connection.query(
                    "INSERT INTO cart_items (cart_id, option_id, stock_quantity) VALUES (?, ?, ?)",
                    [cart_id, option_id, quantity]
                );
            }
        }

        return res.status(200).json({
            EC: 0,
            EM: "Đã đồng bộ giỏ hàng từ local thành công",
        });
    } catch (error) {
        console.error("Lỗi mergeCartFromLocal:", error);
        return res.status(500).json({
            EC: -1,
            EM: "Lỗi server khi đồng bộ giỏ hàng",
        });
    }
};


module.exports = {
    addToCart,
    deleteCartItemById,
    getCartByUserId,
    updateCartItem,
    getCartCountByUserId,
    getAllStoreLocations,
    getAllPayment,
    getCartFromLocal,
    mergeCartFromLocal
};
