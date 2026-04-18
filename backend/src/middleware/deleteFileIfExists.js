const fs = require("fs");
const path = require("path");


const deleteFileIfExists = (relativePath) => {
    try {
        if (!relativePath) return;

        const fullPath = path.join(process.cwd(), "public", relativePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (error) {
        console.error(`❌ Lỗi khi xóa file ${relativePath}:`, error);
    }
};

module.exports = deleteFileIfExists;
