const connection = require('../config/database')
const createUpload = require("../middleware/upload_image")
const deleteFileIfExists = require('../middleware/deleteFileIfExists');

const getCompanies = async (req, res) => {
    try {
        const [companies] = await connection.query(`SELECT * FROM companies`);

        if (!companies || companies.length === 0) {
            return res.json({ EC: 1, EM: "Không tìm thấy hãng nào!" });
        }

        return res.json({
            EC: 0,
            EM: "Lấy thông tin thành công!",
            data: companies
        });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


const getTypeCompanies = async (req, res) => {
    try {
        const type_id = req.params.type_id;

        const [companies] = await connection.query(
            `SELECT * FROM companies WHERE type_id = ?`,
            [type_id]
        );

        if (!companies || companies.length === 0) {
            return res.json({ EC: 1, EM: "Không tìm thấy hãng nào theo loại đã chọn!" });
        }

        return res.json({
            EC: 0,
            EM: "Lấy thông tin thành công!",
            data: companies
        });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


const getAllAdvertise = async (req, res) => {
    try {
        const [advertise] = await connection.query(`SELECT * FROM advertise`);

        if (!advertise || advertise.length === 0) {
            return res.json({ EC: 1, EM: "Không tìm thấy quảng cáo nào!" });
        }

        return res.json({
            EC: 0,
            EM: "Lấy thông tin thành công!",
            data: advertise
        });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


const getAdvertise = async (req, res) => {
    try {
        const banner = req.params.banner;

        const [advertise] = await connection.query(
            `SELECT * FROM advertise WHERE banner = ?`, [banner]
        );

        if (!advertise || advertise.length === 0) {
            return res.json({ EC: 1, EM: "Không tìm thấy quảng cáo nào!" });
        }

        return res.json({
            EC: 0,
            EM: "Lấy thông tin thành công!",
            data: advertise
        });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


const getAdvertiseWithPaginate = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';
        const searchType = req.query.searchType || 'name';

        const allowedSearchTypes = ['name', 'banner'];
        const isValidSearchType = allowedSearchTypes.includes(searchType);

        let baseQuery = `FROM advertise WHERE 1=1`;
        const queryParams = [];

        if (searchTerm && isValidSearchType) {
            baseQuery += ` AND ${searchType} LIKE ?`;
            queryParams.push(`%${searchTerm}%`);
        }

        const countQuery = `SELECT COUNT(id) as total ${baseQuery}`;
        const selectQuery = `SELECT id, name, link, image, banner ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`;

        const [totalRows] = await connection.query(countQuery, queryParams);
        const total = totalRows[0].total;
        const totalPage = Math.ceil(total / limit);

        const [advertise] = await connection.query(
            selectQuery,
            [...queryParams, limit, offset]
        );

        return res.status(200).json({
            EC: 0,
            EM: "Lấy thông tin thành công!",
            data: {
                totalRow: total,
                totalPage,
                advertise
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            EC: 2,
            EM: "Lỗi server!",
            data: {
                totalRow: 0,
                totalPage: 0,
                advertise: []
            }
        });
    }
};


const deleteAdvertise = async (req, res) => {
    try {
        const id = req.params.id;

        const [existingAdvise] = await connection.query(
            `SELECT image FROM advertise WHERE id = ?`,
            [id]
        );

        if (existingAdvise.length === 0) {
            return res.json({ EC: 1, EM: "Banner không tồn tại!" });
        }

        const imagePath = existingAdvise[0].image;

        await connection.query(`DELETE FROM advertise WHERE id = ?`, [id]);

        if (imagePath) {
            deleteFileIfExists(imagePath);
        }

        return res.json({ EC: 0, EM: "Xóa banner thành công!" });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


const createAdvertise = async (req, res) => {
    try {
        const upload = createUpload('image', 'uploads/advertise');

        upload(req, res, async (err) => {
            if (err) {
                return res.json({ EC: 1, EM: "Lỗi upload ảnh quảng cáo" });
            }

            const { name, link, banner } = req.body;
            const imagePath = req.file ? `/uploads/advertise/${req.file.filename}` : null;

            if (!name || !link) {
                return res.json({ EC: 1, EM: "Thiếu thông tin bắt buộc!" });
            }

            const [existingAdvertise] = await connection.query(
                `SELECT id FROM advertise WHERE name = ?`,
                [name]
            );

            if (existingAdvertise.length > 0) {
                return res.json({ EC: 1, EM: "Tên quảng cáo đã được sử dụng!" });
            }

            const [result] = await connection.query(
                `INSERT INTO advertise (name, link, image, banner) VALUES (?, ?, ?, ?)`,
                [name, link, imagePath, banner || 0]
            );

            return res.json({
                EC: 0,
                EM: "Tạo banner quảng cáo thành công!",
                data: { id: result.insertId }
            });
        });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};

const updateAdvertise = async (req, res) => {
    try {
        const upload = createUpload('image', 'uploads/advertise');

        upload(req, res, async (err) => {
            if (err) {
                return res.json({ EC: 1, EM: "Lỗi upload ảnh banner" });
            }

            const advertiseId = req.params.id;
            const { name, link, banner, removeAvatar } = req.body;

            if (!name) {
                return res.json({ EC: 1, EM: "Thiếu thông tin bắt buộc!" });
            }

            const [existingAdvertise] = await connection.query(
                `SELECT image FROM advertise WHERE id = ?`,
                [advertiseId]
            );

            if (existingAdvertise.length === 0) {
                return res.json({ EC: 1, EM: "Banner không tồn tại!" });
            }

            const oldImage = existingAdvertise[0].image;

            const updateData = {
                name,
                link,
                banner: banner || 0,
            };

            if (req.file) {
                if (oldImage) {
                    deleteFileIfExists(oldImage);
                }
                updateData.image = `/uploads/advertise/${req.file.filename}`;
            }

            if (removeAvatar === "true") {
                if (oldImage) {
                    deleteFileIfExists(oldImage);
                }
                updateData.image = null;
            }

            await connection.query(
                `UPDATE advertise SET ? WHERE id = ?`,
                [updateData, advertiseId]
            );

            return res.json({
                EC: 0,
                EM: "Cập nhật thông tin thành công!",
                data: { id: advertiseId }
            });
        });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


module.exports = {
    getCompanies,
    getTypeCompanies,
    getAdvertise,
    getAllAdvertise,
    getAdvertiseWithPaginate,
    deleteAdvertise,
    createAdvertise,
    updateAdvertise
}
