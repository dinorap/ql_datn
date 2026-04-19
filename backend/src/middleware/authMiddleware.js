const jwt = require("jsonwebtoken");
const connection = require("../config/database");

const buildUserFromRefreshCookie = async (req) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return null;

    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decodedRefresh?.userId) return null;

    const [users] = await connection.query(
        `SELECT id, email, role, refresh_token FROM users WHERE id = ? LIMIT 1`,
        [decodedRefresh.userId]
    );

    if (!users || users.length === 0) return null;
    const user = users[0];
    if (!user.refresh_token || user.refresh_token !== refreshToken) return null;

    return {
        userId: user.id,
        email: user.email,
        role: user.role
    };
};

const authMiddleware = async (req, res, next) => {
    console.log("🔐 [AUTH] Middleware được gọi cho:", req.method, req.path);
    console.log("🔐 [AUTH] Headers:", req.headers);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        try {
            const userFromRefreshCookie = await buildUserFromRefreshCookie(req);
            if (userFromRefreshCookie) {
                console.log("✅ [AUTH] Không có access token, dùng refresh cookie hợp lệ");
                req.user = userFromRefreshCookie;
                return next();
            }
        } catch (error) {
            console.log("❌ [AUTH] Refresh cookie lỗi:", error.message);
        }

        console.log("❌ [AUTH] Không có token!");
        return res.status(401).json({ EC: 1, EM: "Chưa đăng nhập!" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🎫 [AUTH] Token nhận được:", token.substring(0, 20) + "...");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ [AUTH] Token hợp lệ, user:", decoded);
        req.user = decoded;
        return next();
    } catch (error) {
        console.log("❌ [AUTH] Token lỗi:", error.message);
        try {
            const userFromRefreshCookie = await buildUserFromRefreshCookie(req);
            if (userFromRefreshCookie) {
                console.log("✅ [AUTH] Access token lỗi, fallback refresh cookie thành công");
                req.user = userFromRefreshCookie;
                return next();
            }
        } catch (refreshError) {
            console.log("❌ [AUTH] Fallback refresh cookie lỗi:", refreshError.message);
        }

        return res.status(401).json({ EC: 1, EM: "Token hết hạn hoặc không hợp lệ!" });
    }
};

module.exports = authMiddleware;
