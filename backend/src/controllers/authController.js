const bcrypt = require("bcryptjs");
const validator = require("validator");
const connection = require("../config/database");
const jwt = require("jsonwebtoken");
const transporter = require("../config/email");
require('dotenv').config();


const registerUser = async (req, res) => {
    let { username, email, password, role, delay } = req.body;

    username = username.trim();
    email = email.trim();

    if (!username || !email || !password) {
        return res.json({ EC: 1, EM: "Thiếu thông tin cần thiết!" });
    }

    if (!validator.isEmail(email)) {
        return res.json({ EC: 1, EM: "Email không hợp lệ!" });
    }

    if (password.length < 6) {
        return res.json({ EC: 1, EM: "Mật khẩu phải có ít nhất 6 ký tự!" });
    }


    const validRoles = ["admin", "user", "news_manager", "product_manager"];
    if (role && !validRoles.includes(role)) {
        return res.json({ EC: 1, EM: "Role không hợp lệ!" });
    }

    try {
        const [existingUser] = await connection.query(
            `SELECT * FROM users WHERE email = ?`,
            [email]
        );
        if (existingUser.length > 0) {
            return res.json({ EC: 1, EM: "Email đã tồn tại!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await connection.query(
            `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, role || "user"]
        );
        const delayTime = parseInt(delay, 10) || 0;
        await new Promise(resolve => setTimeout(resolve, delayTime));
        return res.json({
            EC: 0, EM: "Đăng ký tài khoản thành công!",
            user: {
                id: result.insertId,
                username,
                email,
                role: role || "user",
            }
        });
    } catch (error) {
        console.error("Lỗi khi đăng ký user:", error);
        return res.json({ EC: 2, EM: "Lỗi server, vui lòng thử lại sau!" });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password, delay } = req.body;

        if (!email || !password) {
            return res.json({ EC: 1, EM: "Vui lòng nhập email và mật khẩu!" });
        }

        const [users] = await connection.query(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!users || users.length === 0) {
            return res.json({ EC: 1, EM: "Email hoặc mật khẩu không đúng!" });
        }

        const foundUser = users[0];

        if (foundUser.locker === 1) {
            return res.json({ EC: 3, EM: "Tài khoản của bạn đã bị khóa!" });
        }

        const isMatch = await bcrypt.compare(password, foundUser.password);
        if (!isMatch) {
            return res.json({ EC: 1, EM: "Email hoặc mật khẩu không đúng!" });
        }

        const accessToken = jwt.sign(
            { userId: foundUser.id, email: foundUser.email, role: foundUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { userId: foundUser.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        await connection.query(`UPDATE users SET refresh_token = ? WHERE id = ?`, [refreshToken, foundUser.id]);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });



        const delayTime = parseInt(delay, 10) || 0;
        if (delayTime > 0) {

            await new Promise(resolve => setTimeout(resolve, delayTime));
        }

        return res.json({
            EC: 0,
            EM: "Đăng nhập thành công!",
            user: {
                access_token: accessToken,
                refresh_token: refreshToken,
                id: foundUser.id,
                username: foundUser.username,
                email: foundUser.email,
                role: foundUser.role,
                avatar: foundUser.avatar
            }
        });

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        return res.json({ EC: 2, EM: "Lỗi server, vui lòng thử lại sau!" });
    }
};
const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await connection.query(`UPDATE users SET refresh_token = NULL WHERE refresh_token = ?`, [refreshToken]);
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            path: "/"
        });
        return res.json({ EC: 0, EM: "Đăng xuất thành công!" });

    } catch (error) {
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({ EC: 1, EM: "Vui lòng nhập email!" });
    }

    try {
        const [user] = await connection.query(`SELECT * FROM users WHERE email = ?`, [email]);
        if (user.length === 0) {
            return res.json({ EC: 2, EM: "Email không tồn tại!" });
        }

        const foundUser = user[0];

        const resetToken = jwt.sign(
            { userId: foundUser.id, email: foundUser.email },
            process.env.JWT_RESET_SECRET,
            { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m" }
        );

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            from: `"Admin Thế giới công nghệ" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Đặt lại mật khẩu",
            html: `<p>Click vào link sau để đặt lại mật khẩu (hiệu lực 15 phút):<br>
                    <a href="${resetLink}">${resetLink}</a></p>`
        });

        res.json({ EC: 0, EM: "Email đặt lại mật khẩu đã được gửi!", resetLink });
    } catch (error) {
        console.error("Lỗi quên mật khẩu:", error);
        res.json({ EC: 3, EM: "Lỗi server, vui lòng thử lại sau!" });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.json({ EC: 1, EM: "Thiếu token hoặc mật khẩu mới!" });
    }

    try {
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
        } catch (err) {
            return res.json({ EC: 3, EM: "Token đã hết hạn hoặc không hợp lệ!" });
        }
        const userId = decoded.userId;


        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await connection.query(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId]);

        res.json({ EC: 0, EM: "Cập nhật mật khẩu thành công!" });
    } catch (error) {
        console.error("Lỗi đặt lại mật khẩu:", error);
        res.json({ EC: 2, EM: "Token không hợp lệ hoặc đã hết hạn!", token: token });
    }
};

const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!refreshToken) {
            return res.json({ EC: 1, EM: "Không tìm thấy Refresh Token!" });
        }

        const [users] = await connection.query(`SELECT * FROM users WHERE refresh_token = ?`, [refreshToken]);
        if (!users || users.length === 0) {
            return res.status(403).json({ EC: 1, EM: "Refresh Token không hợp lệ!" });
        }

        const user = users[0];

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ EC: 1, EM: "Refresh Token hết hạn!" });

            const newAccessToken = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );

            return res.json({ EC: 0, EM: "Làm mới Access Token thành công!", access_token: newAccessToken });
        });

    } catch (error) {
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};

const getUserInfo = async (req, res) => {
    try {
        const [users] = await connection.query(
            `SELECT id, username, email, role FROM users WHERE id = ?`,
            [req.user.userId]);

        if (!users || users.length === 0) {
            return res.json({ EC: 1, EM: "Không tìm thấy người dùng!" });
        }

        return res.json({ EC: 0, EM: "Lấy thông tin thành công!", data: users[0] });
    } catch (error) {
        return res.json({ EC: 2, EM: "Lỗi server!" });
    }
};


module.exports = { registerUser, loginUser, forgotPassword, resetPassword, refreshToken, logoutUser, getUserInfo };
