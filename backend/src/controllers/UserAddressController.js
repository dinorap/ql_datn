const connection = require("../config/database");

const ensureUserAddressesTable = async () => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      city_id VARCHAR(20) NOT NULL,
      city_name VARCHAR(255) NOT NULL,
      district_id VARCHAR(20) NOT NULL,
      district_name VARCHAR(255) NOT NULL,
      ward_id VARCHAR(20) NOT NULL,
      ward_name VARCHAR(255) NOT NULL,
      detail_address VARCHAR(500) NOT NULL,
      note VARCHAR(500) NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_default (user_id, is_default),
      INDEX idx_user_id (user_id)
    )
  `);
};

// GET /api/user-address/:user_id
const getUserAddresses = async (req, res) => {
  const { user_id } = req.params;
  try {
    await ensureUserAddressesTable();
    const [rows] = await connection.query(
      `SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
      [user_id]
    );
    return res
      .status(200)
      .json({ EC: 0, EM: "Lấy danh sách địa chỉ thành công", data: rows });
  } catch (error) {
    console.error("getUserAddresses error:", error);
    return res.status(500).json({ EC: 1, EM: "Lỗi server" });
  }
};

// POST /api/user-address
const createAddress = async (req, res) => {
  const {
    user_id,
    full_name,
    phone,
    city_id,
    city_name,
    district_id,
    district_name,
    ward_id,
    ward_name,
    detail_address,
    note,
    is_default,
  } = req.body;
  try {
    await ensureUserAddressesTable();
    if (is_default) {
      await connection.query(
        `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
        [user_id]
      );
    }
    await connection.query(
      `INSERT INTO user_addresses
      (user_id, full_name, phone, city_id, city_name, district_id, district_name, ward_id, ward_name, detail_address, note, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        full_name,
        phone,
        city_id,
        city_name,
        district_id,
        district_name,
        ward_id,
        ward_name,
        detail_address,
        note,
        is_default ? 1 : 0,
      ]
    );
    return res.status(200).json({ EC: 0, EM: "Thêm địa chỉ thành công" });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: "Lỗi server" });
  }
};

// PUT /api/user-address/:id
const updateAddress = async (req, res) => {
  const { id } = req.params;
  const {
    full_name,
    phone,
    city_id,
    city_name,
    district_id,
    district_name,
    ward_id,
    ward_name,
    detail_address,
    note,
    is_default,
  } = req.body;
  try {
    await ensureUserAddressesTable();
    if (is_default) {
      const [old] = await connection.query(
        `SELECT user_id FROM user_addresses WHERE id = ?`,
        [id]
      );
      if (old.length > 0) {
        await connection.query(
          `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
          [old[0].user_id]
        );
      }
    }
    await connection.query(
      `UPDATE user_addresses
       SET full_name=?, phone=?, city_id=?, city_name=?, district_id=?, district_name=?, ward_id=?, ward_name=?, detail_address=?, note=?, is_default=?
       WHERE id = ?`,
      [
        full_name,
        phone,
        city_id,
        city_name,
        district_id,
        district_name,
        ward_id,
        ward_name,
        detail_address,
        note,
        is_default ? 1 : 0,
        id,
      ]
    );
    return res.status(200).json({ EC: 0, EM: "Cập nhật địa chỉ thành công" });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: "Lỗi server" });
  }
};

// DELETE /api/user-address/:id
const deleteAddress = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureUserAddressesTable();
    await connection.query(`DELETE FROM user_addresses WHERE id = ?`, [id]);
    return res.status(200).json({ EC: 0, EM: "Xóa địa chỉ thành công" });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: "Lỗi server" });
  }
};

// PATCH /api/user-address/:id/default
const setDefaultAddress = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureUserAddressesTable();
    const [rows] = await connection.query(
      `SELECT user_id FROM user_addresses WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ EC: 1, EM: "Không tìm thấy địa chỉ" });
    }
    const user_id = rows[0].user_id;
    await connection.query(
      `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
      [user_id]
    );
    await connection.query(`UPDATE user_addresses SET is_default = 1 WHERE id = ?`, [
      id,
    ]);
    return res
      .status(200)
      .json({ EC: 0, EM: "Cập nhật địa chỉ mặc định thành công" });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: "Lỗi server" });
  }
};

module.exports = {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
