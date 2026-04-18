const connection = require('../config/database');
const createUpload = require('../middleware/upload_image');
const deleteFileIfExists = require('../middleware/deleteFileIfExists');

const updateUserProfile = async (req, res) => {
    const upload = createUpload('avatar', 'uploads/avatar');

    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ EC: 1, EM: 'Lỗi upload ảnh đại diện!' });
        }

        try {
            const userId = req.user.userId;
            const { username, phone } = req.body;

            const hasTextFields = username !== undefined || phone !== undefined;
            const hasAvatar = req.file;

            if (!hasTextFields && !hasAvatar) {
                return res.json({ EC: 1, EM: "Không có thông tin nào để cập nhật!" });
            }

            const updateFields = [];
            const params = [];

            if (username !== undefined && username !== '') {
                updateFields.push('username = ?');
                params.push(username);
            }

            if (phone !== undefined && phone !== '') {
                updateFields.push('phone = ?');
                params.push(phone);
            }

            let avatarPath = null;
            if (req.file) {
                avatarPath = `/uploads/avatar/${req.file.filename}`;
                updateFields.push('avatar = ?');
                params.push(avatarPath);
            }

            if (updateFields.length === 0) {
                return res.json({ EC: 1, EM: "Không có trường hợp lệ để cập nhật!" });
            }

            const [user] = await connection.query(`SELECT avatar FROM users WHERE id = ?`, [userId]);
            const oldAvatar = user[0]?.avatar;

            params.push(userId);
            await connection.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);

            if (req.file && oldAvatar && oldAvatar !== avatarPath) {
                deleteFileIfExists(oldAvatar);
            }

            return res.json({ EC: 0, EM: "Cập nhật thông tin thành công!" });
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            return res.status(500).json({ EC: 2, EM: "Lỗi server!" });
        }
    });
};
const updateUserPassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        const [rows] = await connection.query(
            `SELECT password FROM users WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.json({ EC: 1, EM: "Người dùng không tồn tại!" });
        }

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) {
            return res.json({ EC: 1, EM: "Mật khẩu hiện tại không đúng!" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.query(
            `UPDATE users SET password = ? WHERE id = ?`,
            [hashedPassword, userId]
        );

        return res.json({ EC: 0, EM: "Cập nhật mật khẩu thành công!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 2, EM: "Lỗi server!" });
    }
};

module.exports = {
    updateUserProfile,
    updateUserPassword
};
