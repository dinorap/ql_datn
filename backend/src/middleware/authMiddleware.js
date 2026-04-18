const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    console.log("🔐 [AUTH] Middleware được gọi cho:", req.method, req.path);
    console.log("🔐 [AUTH] Headers:", req.headers);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("❌ [AUTH] Không có token!");
        return res.status(401).json({ EC: 1, EM: "Chưa đăng nhập!" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🎫 [AUTH] Token nhận được:", token.substring(0, 20) + "...");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ [AUTH] Token hợp lệ, user:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.log("❌ [AUTH] Token lỗi:", error.message);
        return res.status(401).json({ EC: 1, EM: "Token hết hạn hoặc không hợp lệ!" });
    }
};

module.exports = authMiddleware;
