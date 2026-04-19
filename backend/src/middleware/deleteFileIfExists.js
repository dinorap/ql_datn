const fs = require("fs");
const path = require("path");


const deleteFileIfExists = (relativePath) => {
    try {
        if (!relativePath) return;

        const normalized = String(relativePath).replace(/^[/\\]+/, "");
        const fullPath = path.join(__dirname, "../../public", normalized);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (error) {
        console.error(`❌ Lỗi khi xóa file ${relativePath}:`, error);
    }
};

module.exports = deleteFileIfExists;
