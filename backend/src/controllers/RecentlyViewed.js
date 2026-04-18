const connection = require("../config/database");

const createRecentlyViewedProduct = async (req, res) => {
    const {
        product_id, product_name, description, is_active,
        is_installment_available, screen, refresh_rate, screen_technology,
        base_price, final_price, image,
        promotion_code, promotion_type_name, discount_value,
        average_rating, total_reviews, user_id
    } = req.body;

    try {
        await connection.query(`DELETE FROM recently_viewed_products WHERE product_id = ?`, [product_id]);

        const sql = `
          INSERT INTO recently_viewed_products (
            product_id, product_name, description, is_active,
            is_installment_available, screen, refresh_rate, screen_technology,
            base_price, final_price, image,
            promotion_code, promotion_type_name, discount_value,
            average_rating, total_reviews , user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        await connection.query(sql, [
            product_id, product_name, description, is_active,
            is_installment_available, screen, refresh_rate, screen_technology,
            base_price, final_price, image,
            promotion_code, promotion_type_name, discount_value,
            average_rating, total_reviews, user_id
        ]);

        return res.status(201).json({
            EC: 0,
            EM: "Thêm sản phẩm đã xem thành công"
        });
    } catch (error) {
        console.error("❌ Lỗi khi thêm sản phẩm:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server" });
    }
};


const getAllRecentlyViewedProducts = async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await connection.query(
            `SELECT * FROM recently_viewed_products WHERE user_id = ? ORDER BY viewed_at DESC LIMIT 10`, [userId]
        );
        return res.status(200).json({
            EC: 0,
            EM: "Lấy 10 sản phẩm đã xem gần nhất thành công",
            data: rows
        });
    } catch (error) {
        console.error("❌ Lỗi khi lấy dữ liệu:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server" });
    }
};


module.exports = { createRecentlyViewedProduct, getAllRecentlyViewedProducts };