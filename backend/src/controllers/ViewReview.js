const connection = require("../config/database");
const { enqueueReviewSummaryJob } = require("../services/reviewSummaryService");

const createProductReview = async (req, res) => {
    const { product_id, user_id, rating, comment, parent_id = null } = req.body;
    const is_active = false;


    if (!product_id || !user_id || !comment) {
        return res.json({ EC: 1, EM: "Thiếu thông tin bình luận hoặc đánh giá" });
    }

    try {

        if (rating) {
            const [existing] = await connection.query(
                `SELECT id FROM product_reviews
                 WHERE product_id = ? AND user_id = ? AND rating IS NOT NULL AND parent_id IS NULL`,
                [product_id, user_id]
            );

            if (existing.length > 0) {
                return res.json({ EC: 2, EM: "Bạn đã đánh giá sản phẩm này rồi!" });
            }
            else {
                await connection.query(
                    `INSERT INTO product_reviews (product_id, user_id, rating, comment, parent_id, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
                    [product_id, user_id, rating || null, comment, parent_id, is_active]
                );
            }
        }
        else {
            await connection.query(
                `INSERT INTO product_reviews (product_id, user_id, rating, comment, parent_id, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
                [product_id, user_id, rating || null, comment, parent_id, true]
            );
        }

        if (parent_id === null) {
            await enqueueReviewSummaryJob(product_id, "review_created");
        }

        return res.json({ EC: 0, EM: rating ? "Gửi đánh giá thành công, chờ duyệt!" : "Bình luận đã được gửi!" });
    } catch (error) {
        console.error("Lỗi khi thêm đánh giá/bình luận:", error);
        return res.json({ EC: 3, EM: "Lỗi server khi thêm đánh giá/bình luận!" });
    }
};

module.exports = { createProductReview };
