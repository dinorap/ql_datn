const bcrypt = require("bcryptjs");
const connection = require("../config/database");
require('dotenv').config();
const createUpload = require("../middleware/upload_image")
const deleteFileIfExists = require('../middleware/deleteFileIfExists');

const uploadAvatar = createUpload("avatar", "uploads/avatar");

const createUser = async (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return res.json({ EC: 1, EM: "Lỗi upload ảnh đại diện" });

    try {
      const { username, email, password, role, locker } = req.body;
      const roleToSave = (role || 'user').toLowerCase();
      if (!username || !email || !password) {
        return res.json({ EC: 1, EM: "Thiếu thông tin bắt buộc!" });
      }

      const [existingUser] = await connection.query(
        `SELECT id FROM users WHERE email = ?`,
        [email]
      );
      if (existingUser.length > 0) {
        return res.json({ EC: 1, EM: "Email đã được sử dụng!" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const avatarPath = req.file ? `/uploads/avatar/${req.file.filename}` : null;

      const [result] = await connection.query(
        `INSERT INTO users (username, email, password, role, avatar, locker)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, roleToSave, avatarPath, locker || 0]
      );

      return res.json({
        EC: 0,
        EM: "Tạo người dùng thành công!",
        data: { id: result.insertId }
      });
    } catch (error) {
      console.error(error);
      return res.json({ EC: 2, EM: "Lỗi server!" });
    }
  });
};


const updateUser = async (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return res.json({ EC: 1, EM: "Lỗi upload ảnh đại diện" });

    try {
      const userId = req.params.id;
      const { username, email, role, locker, removeAvatar } = req.body;
      const roleToSave = (role || 'user').toLowerCase();
      if (!username) {
        return res.json({ EC: 1, EM: "Thiếu thông tin bắt buộc!" });
      }


      const [existingUser] = await connection.query(
        `SELECT avatar FROM users WHERE id = ?`,
        [userId]
      );
      if (existingUser.length === 0) {
        return res.json({ EC: 1, EM: "Người dùng không tồn tại!" });
      }

      const oldAvatar = existingUser[0].avatar;


      const [emailCheck] = await connection.query(
        `SELECT id FROM users WHERE email = ? AND id != ?`,
        [email, userId]
      );
      if (emailCheck.length > 0) {
        return res.json({
          EC: 1,
          EM: "Email đã được sử dụng bởi người dùng khác!",
        });
      }

      const updateData = {
        username,
        email,
        role: roleToSave,
        locker: locker || 0,
      };


      if (req.file) {
        if (oldAvatar) deleteFileIfExists(oldAvatar);
        updateData.avatar = `/uploads/avatar/${req.file.filename}`;
      }


      if (removeAvatar === "true") {
        if (oldAvatar) deleteFileIfExists(oldAvatar);
        updateData.avatar = null;
      }

      await connection.query(`UPDATE users SET ? WHERE id = ?`, [updateData, userId]);

      return res.json({
        EC: 0,
        EM: "Cập nhật thông tin thành công!",
        data: { id: userId, avatar: updateData.avatar || null }
      });
    } catch (error) {
      console.error(error);
      return res.json({ EC: 2, EM: "Lỗi server!" });
    }
  });
};


const getAllUsers = async (req, res) => {
  try {
    const [users] = await connection.query(
      `SELECT id, username, email, role, avatar, locker FROM users ORDER BY id DESC`
    );

    if (!users || users.length === 0) {
      return res.json({ EC: 1, EM: "Không tìm thấy người dùng nào!" });
    }

    return res.json({
      EC: 0,
      EM: "Lấy thông tin thành công!",
      data: users
    });
  } catch (error) {
    console.error(error);
    return res.json({ EC: 2, EM: "Lỗi server!" });
  }
};


const getUserWithPaginate = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    const searchType = req.query.searchType || 'username';

    const allowedSearchTypes = ['username', 'email', 'role', 'locker'];
    const isValidSearchType = allowedSearchTypes.includes(searchType);

    let baseQuery = `FROM users WHERE 1=1`;
    const queryParams = [];

    if (searchTerm && isValidSearchType) {
      baseQuery += ` AND ${searchType} LIKE ?`;
      queryParams.push(`%${searchTerm}%`);
    }

    const countQuery = `SELECT COUNT(id) as total ${baseQuery}`;
    const selectQuery = `SELECT id, username, email, role, avatar, locker ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`;

    const [totalRows] = await connection.query(countQuery, queryParams);
    const total = totalRows[0].total;
    const totalPage = Math.ceil(total / limit);

    const [users] = await connection.query(
      selectQuery,
      [...queryParams, limit, offset]
    );

    return res.status(200).json({
      EC: 0,
      EM: users.length > 0 ? "Lấy thông tin thành công!" : (searchTerm ? "Không tìm thấy người dùng phù hợp!" : "Không tìm thấy người dùng nào!"),
      data: {
        totalRow: total,
        totalPage,
        users
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
        users: []
      }
    });
  }
};


const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const [user] = await connection.query(
      `SELECT id, username, email, role, avatar, locker FROM users WHERE id = ?`,
      [userId]
    );

    if (!user || user.length === 0) {
      return res.json({ EC: 1, EM: "Không tìm thấy người dùng!" });
    }

    return res.json({ EC: 0, EM: "Lấy thông tin thành công!", data: user[0] });
  } catch (error) {
    console.error(error);
    return res.json({ EC: 2, EM: "Lỗi server!" });
  }
};


const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;


    const [existingUser] = await connection.query(
      `SELECT avatar FROM users WHERE id = ?`,
      [userId]
    );

    if (existingUser.length === 0) {
      return res.json({ EC: 1, EM: "Người dùng không tồn tại!" });
    }

    const avatarPath = existingUser[0].avatar;


    await connection.query(
      `DELETE FROM users WHERE id = ?`,
      [userId]
    );


    if (avatarPath) {
      deleteFileIfExists(avatarPath);
    }

    return res.json({ EC: 0, EM: "Xóa người dùng thành công!" });
  } catch (error) {
    console.error(error);
    return res.json({ EC: 2, EM: "Lỗi server!" });
  }
};



const updateLocker = async (req, res) => {
  try {
    const userId = req.params.id;
    const [existingUser] = await connection.query(
      `SELECT id FROM users WHERE id = ?`,
      [userId]
    );

    if (existingUser.length === 0) {
      return res.json({ EC: 1, EM: "Người dùng không tồn tại!" });
    }

    const locker = Number(req.body.locker);


    if (locker !== 0 && locker !== 1) {
      return res.json({ EC: 1, EM: `Giá trị locker không hợp lệ!` });
    }

    await connection.query(
      `UPDATE users SET locker = ? WHERE id = ?`,
      [locker, userId]
    );

    return res.json({
      EC: 0,
      EM: locker === 0 ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
      data: { id: userId, locker: locker }
    });
  }
  catch (err) {
    console.error(err);
    return res.json({ EC: 2, EM: "Lỗi server!" });
  }
}

module.exports = { getAllUsers, deleteUser, updateUser, createUser, getUserWithPaginate, getUserById, updateLocker }


