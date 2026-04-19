const multer = require('multer');
const path = require('path');
const fs = require('fs');

/** Luôn ghi vào backend/public/... dù chạy server từ thư mục khác (cwd). */
const publicRoot = path.join(__dirname, '../../public');

const createUpload = (fieldName, uploadDir, multiple = false) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const fullPath = path.join(publicRoot, uploadDir);
            fs.mkdirSync(fullPath, { recursive: true });
            cb(null, fullPath);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${file.originalname}`;
            cb(null, uniqueName);
        }
    });

    const upload = multer({ storage });
    return multiple
        ? upload.array(fieldName) : upload.single(fieldName);
};


module.exports = createUpload;
