const createUpload = require("../middleware/upload_image")
const deleteFileIfExists = require('../middleware/deleteFileIfExists');
const connection = require('../config/database')

const getAllNews = async (req, res) => {
    try {
        const [news] = await connection.query(`SELECT * FROM news`);
        if (!news || news.length === 0) {
            return res.json({ EC: 1, EM: "Không tìm thấy tin tức nào!" });
        }

        return res.json({ EC: 0, EM: "Lấy thông tin thành công!", data: news });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


const getNewsWithPaginate = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';
        const searchType = req.query.searchType || 'name';
        const video = req.query.video;

        const allowedSearchTypes = ['name', 'author'];
        const isValidSearchType = allowedSearchTypes.includes(searchType);

        let baseQuery = `FROM news WHERE 1=1`;
        const queryParams = [];

        if (searchTerm && isValidSearchType) {
            baseQuery += ` AND ${searchType} LIKE ?`;
            queryParams.push(`%${searchTerm}%`);
        }

        if (video !== undefined) {
            baseQuery += ` AND video = ?`;
            queryParams.push(video);
        }

        const countQuery = `SELECT COUNT(id) as total ${baseQuery}`;
        const selectQuery = `SELECT * ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`;

        const [totalRows] = await connection.query(countQuery, queryParams);
        const total = totalRows[0].total;
        const totalPage = Math.ceil(total / limit);

        const [news] = await connection.query(selectQuery, [...queryParams, limit, offset]);

        return res.status(200).json({
            EC: 0,
            EM: "Lấy thông tin thành công!",
            data: {
                totalRow: total,
                totalPage,
                news
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
                news: []
            }
        });
    }
};


const deleteNews = async (req, res) => {
    try {
        const id = req.params.id;

        const [news] = await connection.query(
            `SELECT image FROM news WHERE id = ?`,
            [id]
        );

        if (news.length === 0) {
            return res.json({ EC: 1, EM: "Tin tức không tồn tại!" });
        }

        await connection.query(`DELETE FROM news WHERE id = ?`, [id]);

        if (news[0].image) {
            deleteFileIfExists(news[0].image);
        }

        return res.json({ EC: 0, EM: "Xóa tin tức thành công!" });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


const createNews = async (req, res) => {
    try {
        const upload = createUpload('image', 'uploads/news');
        upload(req, res, async (err) => {
            if (err) {
                return res.json({ EC: 1, EM: "Lỗi upload ảnh tin tức" });
            }

            const { name, link, video, linkvideo, author, description } = req.body;

            if (!name || !link) {
                return res.json({ EC: 1, EM: "Thiếu thông tin bắt buộc!" });
            }

            const [existingNews] = await connection.query(
                `SELECT id FROM news WHERE name = ?`,
                [name]
            );
            if (existingNews.length > 0) {
                return res.json({ EC: 1, EM: "Tên tin tức đã được sử dụng!" });
            }

            const imagePath = req.file ? `/uploads/news/${req.file.filename}` : null;

            const [result] = await connection.query(
                `INSERT INTO news (name, link, image, video, linkvideo, author, description)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [name, link, imagePath, video || 0, linkvideo, author, description]
            );

            return res.json({
                EC: 0,
                EM: "Tạo tin tức thành công!",
                data: { id: result.insertId }
            });
        });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


const updateNews = async (req, res) => {
    try {
        const upload = createUpload('image', 'uploads/news');
        upload(req, res, async (err) => {
            if (err) {
                return res.json({ EC: 1, EM: "Lỗi upload ảnh tin tức" });
            }

            const newsId = req.params.id;
            const { name, link, video, removeAvatar, linkvideo, author, description } = req.body;

            if (!name) {
                return res.json({ EC: 1, EM: "Thiếu thông tin bắt buộc!" });
            }

            const [existingNews] = await connection.query(
                `SELECT image FROM news WHERE id = ?`,
                [newsId]
            );
            if (existingNews.length === 0) {
                return res.json({ EC: 1, EM: "Tin tức không tồn tại!" });
            }

            const updateData = {
                name,
                link,
                video: video || 0,
                linkvideo,
                author,
                description
            };

            if (req.file) {
                updateData.image = `/uploads/news/${req.file.filename}`;
                deleteFileIfExists(existingNews[0].image);
            } else if (removeAvatar === "true") {
                updateData.image = null;
                deleteFileIfExists(existingNews[0].image);
            }

            await connection.query(`UPDATE news SET ? WHERE id = ?`, [updateData, newsId]);

            return res.json({
                EC: 0,
                EM: "Cập nhật tin tức thành công!",
                data: { id: newsId }
            });
        });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};



const getNews = async (req, res) => {
    try {
        const video = req.params.video;
        const [news] = await connection.query(
            `SELECT * FROM news Where video = ? ORDER BY id DESC`, [video]
        );

        if (!news || news.length === 0) {
            return res.json({ EC: 1, EM: "Không tìm thấy tin tức nào!" });
        }

        return res.json({
            EC: 0,
            EM: "Lấy thông tin thành công!",
            data: news
        });
    }
    catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
}


module.exports = {
    getNews,
    getAllNews,
    getNewsWithPaginate,
    deleteNews,
    createNews,
    updateNews
}
