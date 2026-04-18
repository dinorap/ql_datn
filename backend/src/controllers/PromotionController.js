const connection = require('../config/database');


const getAllPromotionType = async (req, res) => {
    try {
        const [promotion] = await connection.query(
            `SELECT * FROM promotion_types `
        );

        if (!promotion || promotion.length === 0) {
            return res.json({ EC: 1, EM: "Không tìm thấy khuyến mại nào!" });
        }

        return res.json({
            EC: 0,
            EM: "Lấy thông tin thành công!",
            data: promotion
        });
    }
    catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
}
const getAllPromotionTypesWithPaginate = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search?.trim() || '';
        const searchType = req.query.searchType || 'name';

        const allowedSearchTypes = ['name', 'code'];
        const isValidSearchType = allowedSearchTypes.includes(searchType);

        let baseQuery = `FROM promotion_types WHERE 1=1`;
        const queryParams = [];

        if (search && isValidSearchType) {
            baseQuery += ` AND ${searchType} LIKE ?`;
            queryParams.push(`%${search}%`);
        }

        const countQuery = `SELECT COUNT(id) as total ${baseQuery}`;
        const selectQuery = `
            SELECT id, name, description, code, formula, created_at 
            ${baseQuery} 
            ORDER BY id DESC 
            LIMIT ? OFFSET ?
        `;

        const [countRows] = await connection.query(countQuery, queryParams);
        const total = countRows[0]?.total || 0;
        const totalPage = Math.ceil(total / limit);

        const [rows] = await connection.query(selectQuery, [...queryParams, limit, offset]);

        return res.status(200).json({
            EC: 0,
            EM: "Lấy loại khuyến mãi thành công!",
            data: {
                totalRow: total,
                totalPage,
                promotion_types: rows
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách promotion types:", error);
        return res.status(500).json({
            EC: 2,
            EM: "Lỗi server khi lấy loại khuyến mãi!",
            data: {
                totalRow: 0,
                totalPage: 0,
                promotion_types: []
            }
        });
    }
};

const createPromotionType = async (req, res) => {
    try {
        const { name, code, description, formula } = req.body;
        if (!name || !code || !formula) {
            return res.status(400).json({
                EC: 1,
                EM: `Thiếu thông tin bắt buộc ${name}, ${code}, ${formula})`
            });
        }

        const [exist] = await connection.query(
            `SELECT id FROM promotion_types WHERE name = ?`, [name]
        );

        if (exist.length > 0) {
            return res.json({
                EC: 2,
                EM: "Tên khuyến mãi đã tồn tại"
            });
        }

        await connection.query(
            `INSERT INTO promotion_types (name, code, description, formula) VALUES (?, ?, ?, ?)`,
            [name, code, description || null, formula]
        );

        return res.status(201).json({
            EC: 0,
            EM: "Thêm loại khuyến mãi thành công!"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 3, EM: "Lỗi server!" });
    }
};

const updatePromotionType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description, formula } = req.body;

        if (!name || !code || !formula) {
            return res.status(400).json({
                EC: 1,
                EM: "Thiếu thông tin bắt buộc (name, code, formula)"
            });
        }

        const [exist] = await connection.query(
            `SELECT id FROM promotion_types WHERE name = ? AND id != ?`,
            [name, id]
        );

        if (exist.length > 0) {
            return res.json({
                EC: 2,
                EM: "Tên khuyến mại đã tồn tại ở bản ghi khác"
            });
        }

        const [result] = await connection.query(
            `UPDATE promotion_types SET name = ?, code = ?, description = ?, formula = ? WHERE id = ?`,
            [name, code, description || null, formula, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ EC: 4, EM: "Không tìm thấy loại khuyến mãi" });
        }

        return res.json({
            EC: 0,
            EM: "Cập nhật loại khuyến mãi thành công!"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 3, EM: "Lỗi server!" });
    }
};

const deletePromotionType = async (req, res) => {
    try {
        const { id } = req.params;

        const [checkUse] = await connection.query(
            `SELECT id FROM promotions WHERE promotion_type_id = ?`, [id]
        );

        if (checkUse.length > 0) {
            return res.status(400).json({
                EC: 2,
                EM: "Không thể xóa vì loại khuyến mãi đang được sử dụng"
            });
        }

        const [result] = await connection.query(
            `DELETE FROM promotion_types WHERE id = ?`, [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ EC: 1, EM: "Không tìm thấy loại khuyến mãi để xóa" });
        }

        return res.json({
            EC: 0,
            EM: "Xóa loại khuyến mãi thành công!"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 3, EM: "Lỗi server!" });
    }
};


module.exports = {
    createPromotionType,
    getAllPromotionTypesWithPaginate,
    updatePromotionType,
    deletePromotionType,
    getAllPromotionType
};
