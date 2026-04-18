const connection = require('../config/database');
const getAllReviewsWithPaginate = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const searchType = req.query.searchType || 'product_name';

        const allowedSearchTypes = ['username', 'product_name'];
        const isValidSearchType = allowedSearchTypes.includes(searchType);
        const isActiveFilter = req.query.is_active;
        if (isActiveFilter === '1') {
            baseQuery += ` AND pr.is_active = 1`;
        }


        let baseQuery = `   
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.id
            LEFT JOIN products p ON pr.product_id = p.id
            WHERE pr.parent_id IS NULL
        `;
        const queryParams = [];

        if (search && isValidSearchType) {
            if (searchType === 'username') {
                baseQuery += ` AND u.username LIKE ?`;
                queryParams.push(`%${search}%`);
            } else if (searchType === 'product_name') {
                baseQuery += ` AND p.name LIKE ?`;
                queryParams.push(`%${search}%`);
            } else {
                baseQuery += ` AND pr.${searchType} = ?`;
                queryParams.push(search);
            }
        }

        const countQuery = `SELECT COUNT(pr.id) AS total ${baseQuery}`;
        const selectQuery = `
            SELECT pr.*, u.username, p.name AS product_name
            ${baseQuery}
            ORDER BY pr.product_id DESC, pr.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [countRows] = await connection.query(countQuery, queryParams);
        const total = countRows[0]?.total || 0;
        const totalPage = Math.ceil(total / limit);
        const [parentReviews] = await connection.query(selectQuery, [...queryParams, limit, offset]);

        const parentIds = parentReviews.map(r => r.id);
        let childReviews = [];
        if (parentIds.length > 0) {
            const [children] = await connection.query(
                `SELECT pr.*, u.username
                 FROM product_reviews pr
                 LEFT JOIN users u ON pr.user_id = u.id
                 WHERE pr.parent_id IN (${parentIds.map(() => '?').join(',')})
                 ORDER BY pr.created_at ASC`,
                parentIds
            );
            childReviews = children;
        }

        const reviewMap = {};
        parentReviews.forEach(p => {
            reviewMap[p.id] = { ...p, replies: [] };
        });
        childReviews.forEach(c => {
            if (reviewMap[c.parent_id]) {
                reviewMap[c.parent_id].replies.push(c);
            }
        });

        const nestedReviews = Object.values(reviewMap);

        return res.json({
            EC: 0,
            EM: "Lấy đánh giá thành công!",
            data: {
                totalRow: total,
                totalPage,
                reviews: nestedReviews
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            EC: 2,
            EM: "Lỗi server khi lấy đánh giá!",
            data: []
        });
    }
};

const replyToReview = async (req, res) => {
    const { product_id, parent_id, comment, user_id } = req.body;

    const is_active = true;
    if (!parent_id || !comment) {
        return res.json({ EC: 1, EM: "Thiếu thông tin phản hồi" });
    }

    try {
        await connection.query(
            `INSERT INTO product_reviews (product_id, user_id, rating, comment, parent_id ,is_active)
             VALUES (?, ?, NULL, ?, ?,?)`,
            [product_id, user_id, comment, parent_id, is_active]
        );

        return res.json({ EC: 0, EM: "Phản hồi thành công!" });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server khi phản hồi!" });
    }
};

const updateAdminReply = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, user_id } = req.body;

        if (!id || !comment) {
            return res.status(400).json({
                EC: 1,
                EM: "Thiếu thông tin phản hồi"
            });
        }

        const [result] = await connection.query(
            `UPDATE product_reviews 
             SET comment = ? ,
             user_id =?
             WHERE id = ? AND parent_id IS NOT NULL`,
            [comment, user_id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ EC: 1, EM: "Không tìm thấy phản hồi hoặc không có quyền chỉnh sửa ok" });
        }

        return res.json({
            EC: 0,
            EM: "Cập nhật phản hồi thành công"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 2, EM: "Lỗi server!" });
    }
};

const deleteAdminReply = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await connection.query(
            `DELETE FROM product_reviews 
             WHERE id = ? AND parent_id IS NOT NULL`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ EC: 1, EM: "Không tìm thấy phản hồi hoặc không có quyền xóa" });
        }

        return res.json({
            EC: 0,
            EM: "Xóa phản hồi thành công"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 2, EM: "Lỗi server!" });
    }
};

const deleteUserReview = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await connection.query(
            `DELETE FROM product_reviews 
             WHERE id = ? AND parent_id IS NULL`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ EC: 1, EM: "Không tìm thấy đánh giá" });
        }

        return res.json({
            EC: 0,
            EM: "Xóa đánh giá thành công"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 2, EM: "Lỗi server!" });
    }
};

const updateReviewActiveStatus = async (req, res) => {
    try {
        const { id, is_active } = req.body;

        if (!id || typeof is_active === 'undefined') {
            return res.status(400).json({
                EC: 1,
                EM: "Thiếu id hoặc is_active!"
            });
        }

        const [result] = await connection.query(
            `UPDATE product_reviews SET is_active = ? WHERE id = ?`,
            [is_active ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                EC: 2,
                EM: "Không tìm thấy đánh giá để cập nhật!"
            });
        }

        return res.status(200).json({
            EC: 0,
            EM: "Cập nhật trạng thái duyệt đánh giá thành công!"
        });

    } catch (error) {
        console.error("Lỗi update is_active:", error);
        return res.status(500).json({
            EC: 3,
            EM: "Lỗi server khi cập nhật!"
        });
    }
};
module.exports = {
    getAllReviewsWithPaginate,
    replyToReview,
    updateAdminReply,
    deleteAdminReply,
    deleteUserReview,
    updateReviewActiveStatus
}