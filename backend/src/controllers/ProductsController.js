const connection = require('../config/database');
const dayjs = require('dayjs');
const createUpload = require('../middleware/upload_image');
const deleteFileIfExists = require('../middleware/deleteFileIfExists');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.fieldname === 'img_3d' ? 'uploads/3d' : 'uploads/product';
        const fullPath = path.join(process.cwd(), 'public', folder);
        fs.mkdirSync(fullPath, { recursive: true });
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage }).fields([
    { name: 'primary_image', maxCount: 1 },
    { name: 'img_3d', maxCount: 1 }
]);
const processedImage = (rows, fieldName = 'image_data') => {
    return rows.map(row => row[fieldName]).filter(Boolean);
};


const createProduct = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ EC: 1, EM: 'Lỗi upload file' });

        try {
            const {
                product_code, name, company_id, category_id,
                screen, camera, cpu, gpu, battery,
                description, is_installment_available = false,
                operating_system, weight, dimensions, material,
                refresh_rate, screen_technology, charging_port, release_date, gift, link,
                bundled_products
            } = req.body;

            console.log(bundled_products)
            const [check] = await connection.query(
                `SELECT * FROM products WHERE product_code = ?`, [product_code]
            );
            if (check.length > 0)
                return res.status(400).json({ EC: 1, EM: 'Mã sản phẩm đã tồn tại' });

            const img3DFile = req.files?.['img_3d']?.[0];
            const primaryImage = req.files?.['primary_image']?.[0];

            const img3DPath = img3DFile ? `/uploads/3d/${img3DFile.filename}` : null;

            const [result] = await connection.query(
                `INSERT INTO products (
                    product_code, name, company_id, category_id,
                    screen, camera, cpu, gpu, battery,
                    description, is_installment_available, img_3d,
                    operating_system, weight, dimensions, material,
                    refresh_rate, screen_technology, charging_port, release_date, gift, link
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    product_code, name, company_id, category_id,
                    screen, camera, cpu, gpu, battery,
                    description, is_installment_available ? 1 : 0, img3DPath,
                    operating_system, weight, dimensions, material,
                    refresh_rate, screen_technology, charging_port, release_date, gift, link
                ]
            );

            const product_id = result.insertId;


            if (primaryImage) {
                const imagePath = `/uploads/product/${primaryImage.filename}`;
                await connection.query(
                    `INSERT INTO product_images (product_id, image_data, is_primary, is_detail)
                     VALUES (?, ?, 1, 0)`,
                    [product_id, imagePath]
                );
            }

            let bundles = bundled_products;

            if (typeof bundled_products === 'string') {
                try {
                    bundles = JSON.parse(bundled_products);
                } catch (err) {
                    console.error('❌ Không parse được bundled_products:', bundled_products);
                    bundles = [];
                }
            }

            if (Array.isArray(bundles)) {
                for (const item of bundles) {
                    const bundled_id = parseInt(item.bundled_product_id);
                    const discount = parseInt(item.discount_value);
                    if (!isNaN(bundled_id) && !isNaN(discount)) {
                        await connection.query(
                            `INSERT INTO bundled_products (main_product_id, bundled_product_id, discount_value)
                 VALUES (?, ?, ?)`,
                            [product_id, bundled_id, discount]
                        );
                    }
                }
            }

            return res.status(200).json({ EC: 0, EM: 'Tạo sản phẩm thành công' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ EC: 2, EM: 'Lỗi server' });
        }
    });
};


const updateProduct = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ EC: 1, EM: 'Lỗi upload file' });

        try {
            const id = req.params.id;
            const {
                product_code, name, company_id, category_id,
                screen, camera, cpu, gpu, battery,
                description, is_installment_available = false,
                operating_system, weight, dimensions, material,
                refresh_rate, screen_technology, charging_port, release_date, gift, link,
                remove_img_3d,
                bundled_products
            } = req.body;

            const [check] = await connection.query(`SELECT * FROM products WHERE id = ?`, [id]);
            if (check.length === 0)
                return res.status(404).json({ EC: 1, EM: 'Không tìm thấy sản phẩm' });

            let img3DPath = check[0].img_3d;
            const img3DFile = req.files?.['img_3d']?.[0];
            const primaryImage = req.files?.['primary_image']?.[0];

            if (remove_img_3d === 'true' && img3DPath) {
                deleteFileIfExists(img3DPath);
                img3DPath = null;
            }

            if (img3DFile) {
                if (img3DPath) deleteFileIfExists(img3DPath);
                img3DPath = `/uploads/3d/${img3DFile.filename}`;
            }

            await connection.query(
                `UPDATE products SET
                    product_code = ?, name = ?, company_id = ?, category_id = ?,
                    screen = ?, camera = ?, cpu = ?, gpu = ?, battery = ?,
                    description = ?, is_installment_available = ?, img_3d = ?,
                    operating_system = ?, weight = ?, dimensions = ?, material = ?,
                    refresh_rate = ?, screen_technology = ?, charging_port = ?, release_date = ?, gift = ?, link = ?
                 WHERE id = ?`,
                [
                    product_code, name, company_id, category_id,
                    screen, camera, cpu, gpu, battery,
                    description, is_installment_available ? 1 : 0, img3DPath,
                    operating_system, weight, dimensions, material,
                    refresh_rate, screen_technology, charging_port, release_date, gift, link,
                    id
                ]
            );

            if (primaryImage) {
                const [imgOld] = await connection.query(
                    `SELECT image_data FROM product_images
                     WHERE product_id = ? AND is_primary = 1 AND variant_id IS NULL`,
                    [id]
                );
                if (imgOld.length && imgOld[0].image_data) {
                    deleteFileIfExists(imgOld[0].image_data);
                }

                const newPath = `/uploads/product/${primaryImage.filename}`;
                await connection.query(
                    `DELETE FROM product_images WHERE product_id = ? AND is_primary = 1 AND variant_id IS NULL`,
                    [id]
                );
                await connection.query(
                    `INSERT INTO product_images (product_id, image_data, is_primary, is_detail)
                     VALUES (?, ?, 1, 0)`,
                    [id, newPath]
                );
            }


            if (req.body.bundled_products) {
                let bundleList = [];
                try {
                    bundleList = typeof req.body.bundled_products === 'string'
                        ? JSON.parse(req.body.bundled_products)
                        : req.body.bundled_products;
                } catch (err) {
                    console.error("Lỗi parse bundled_products:", err);
                    return res.status(400).json({ EC: 1, EM: "Dữ liệu bundled_products không hợp lệ" });
                }


                await connection.query(`DELETE FROM bundled_products WHERE main_product_id = ?`, [id]);


                for (const item of bundleList) {
                    if (item.bundled_product_id && item.discount_value != null) {
                        await connection.query(
                            `INSERT INTO bundled_products (main_product_id, bundled_product_id, discount_value)
                             VALUES (?, ?, ?)`,
                            [id, item.bundled_product_id, item.discount_value]
                        );
                    }
                }
            }

            return res.status(200).json({ EC: 0, EM: 'Cập nhật sản phẩm thành công' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ EC: 2, EM: 'Lỗi server' });
        }
    });
};




function calculateDynamicSalePrice(base, formula, value) {
    if (!formula) return base;
    const expression = formula
        .replace(/{{base}}/g, base)
        .replace(/{{value}}/g, value);
    try {
        return parseFloat(eval(expression).toFixed(2));
    } catch (error) {
        console.error("Lỗi tính sale_price:", error);
        return base;
    }
}

function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const rated = reviews.filter(r => r.rating !== null && !isNaN(r.rating));
    if (rated.length === 0) return 0;
    const sum = rated.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((sum / rated.length).toFixed(1));
}


const getAllProductVariantsExpandFormat = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const searchType = req.query.searchType || 'name';
        const category_id = req.query.category_id ? parseInt(req.query.category_id) : null;

        const allowedSearchTypes = ['name', 'product_code', 'is_active'];
        const isValidSearchType = allowedSearchTypes.includes(searchType);

        let baseQuery = `FROM products p
            JOIN companies c ON p.company_id = c.id
            JOIN product_categories pc ON p.category_id = pc.id
            WHERE 1 = 1 `;

        const queryParams = [];

        if (search && isValidSearchType) {
            baseQuery += ` AND p.${searchType} LIKE ?`;
            queryParams.push(`%${search}%`);
        }

        if (category_id) {
            baseQuery += ` AND p.category_id = ?`;
            queryParams.push(category_id);
        }

        const countQuery = `SELECT COUNT(p.id) AS total ${baseQuery}`;
        const selectQuery = `
            SELECT p.*, c.name AS company_name, pc.name AS category_name
            ${baseQuery}
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?`;

        const [totalRows] = await connection.query(countQuery, queryParams);
        const total = totalRows[0]?.total || 0;
        const totalPage = Math.ceil(total / limit);
        const [products] = await connection.query(selectQuery, [...queryParams, limit, offset]);

        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);

        const processedProducts = await Promise.all(products.map(async (product) => {

            const [primaryImageRows] = await connection.query(
                `SELECT image_data FROM product_images 
                 WHERE product_id = ? AND variant_id IS NULL AND is_primary = 1 
                 LIMIT 1`,
                [product.id]
            );
            const primary_image = primaryImageRows.length > 0
                ? primaryImageRows[0].image_data
                : null;


            const [variants] = await connection.query(
                `SELECT * FROM product_variants WHERE product_id = ?`,
                [product.id]
            );

            const processedVariants = await Promise.all(variants.map(async (variant) => {
                const [options] = await connection.query(
                    `SELECT * FROM product_variant_options WHERE variant_id = ?`,
                    [variant.id]
                );

                const [promotion] = await connection.query(
                    `SELECT pr.*, pt.name AS promotion_type_name, pt.code AS promotion_code
                     FROM promotions pr
                     JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                     WHERE pr.variant_id = ? AND pr.end_date > NOW()
                     ORDER BY pr.start_date DESC
                     LIMIT 1`,
                    [variant.id]
                );

                if (promotion[0]) {
                    promotion[0].start_date = dayjs(promotion[0].start_date).format("YYYY-MM-DD HH:mm:ss");
                    promotion[0].end_date = dayjs(promotion[0].end_date).format("YYYY-MM-DD HH:mm:ss");
                }

                const [images] = await connection.query(
                    `SELECT image_data FROM product_images 
                     WHERE product_id = ? AND variant_id = ? AND is_detail = 1`,
                    [product.id, variant.id]
                );

                const sale_price_map = options.map(opt => {
                    const extra = parseFloat(opt.extra_price || 0);
                    const base = parseFloat(variant.base_price);
                    const hasPromo = promotion.length && promoTypeMap[promotion[0].promotion_type_id];

                    let final_price;
                    if (hasPromo) {
                        const formula = promoTypeMap[promotion[0].promotion_type_id];
                        if (formula.trim() === "{{value}}") {
                            final_price = parseFloat(promotion[0].discount_value) + extra;
                        } else {
                            const totalBeforeDiscount = base + extra;
                            final_price = calculateDynamicSalePrice(
                                totalBeforeDiscount,
                                formula,
                                promotion[0].discount_value
                            );
                        }
                    } else {
                        final_price = base + extra;
                    }

                    return {
                        ...opt,
                        final_price
                    };
                });

                return {
                    ...variant,
                    options: sale_price_map,
                    images: processedImage(images, 'image_data'),
                    promotion: promotion[0] || null
                };
            }));


            const [reviews] = await connection.query(
                `SELECT rating FROM product_reviews WHERE product_id = ? AND is_active = 1`,
                [product.id]
            );
            const validReviews = reviews.filter(r => r.rating !== null && !isNaN(r.rating));
            const total_reviews = validReviews.length;

            const [bundledRows] = await connection.query(
                `SELECT 
        bp.bundled_product_id, 
        bp.discount_value, 
        p.name AS bundled_name
     FROM bundled_products bp
     JOIN products p ON p.id = bp.bundled_product_id
     WHERE bp.main_product_id = ?`,
                [product.id]
            );

            const bundled_products = bundledRows.map(b => ({
                bundled_product_id: b.bundled_product_id,
                discount_value: Number(b.discount_value),
                bundled_name: b.bundled_name
            }));

            return {
                ...product,
                primary_image,
                variants: processedVariants,
                average_rating: calculateAverageRating(reviews),
                total_reviews,
                bundled_products
            };
        }));

        return res.json({
            EC: 0,
            EM: "Lấy sản phẩm + biến thể + sản phẩm đi kèm thành công (expand)",
            data: {
                totalRow: total,
                totalPage,
                products: processedProducts
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
                products: []
            }
        });
    }
};



const deleteProduct = async (req, res) => {
    const { type, id } = req.query;

    if (!type || !id) {
        return res.status(400).json({ EC: 1, EM: 'Thiếu type hoặc id' });
    }

    try {
        if (type === 'product') {

            const [productRows] = await connection.query(
                `SELECT img_3d FROM products WHERE id = ?`, [id]
            );
            if (productRows.length && productRows[0].img_3d) {
                deleteFileIfExists(productRows[0].img_3d);
            }


            const [productImages] = await connection.query(
                `SELECT image_data FROM product_images WHERE product_id = ?`,
                [id]
            );
            productImages.forEach(img => deleteFileIfExists(img.image_data));


            await connection.query('DELETE FROM products WHERE id = ?', [id]);

        } else if (type === 'variant') {

            const [variantImages] = await connection.query(
                `SELECT image_data FROM product_images WHERE variant_id = ?`,
                [id]
            );
            variantImages.forEach(img => deleteFileIfExists(img.image_data));


            await connection.query('DELETE FROM product_variants WHERE id = ?', [id]);

        } else if (type === 'option') {

            await connection.query('DELETE FROM product_variant_options WHERE id = ?', [id]);

        } else {
            return res.status(400).json({ EC: 2, EM: 'Loại không hợp lệ (product, variant, option)' });
        }

        return res.status(200).json({ EC: 0, EM: 'Xóa thành công' });

    } catch (error) {
        console.error('Lỗi khi xóa:', error);
        return res.status(500).json({ EC: 3, EM: 'Lỗi server khi xóa' });
    }
};


const createVariant = async (req, res) => {
    const upload = createUpload("detail_images", "uploads/variant", true);
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ EC: 1, EM: "Lỗi upload ảnh" });
        }

        try {
            const {
                product_id, variant_code, color, base_price,
                promotion_type_code, discount_value, start_date, end_date
            } = req.body;

            if (!product_id || !variant_code || !color || !base_price) {
                return res.status(400).json({ EC: 1, EM: "Thiếu thông tin bắt buộc" });
            }

            const [check] = await connection.query(
                `SELECT * FROM product_variants WHERE variant_code = ?`,
                [variant_code]
            );
            if (check.length > 0) {
                return res.status(400).json({ EC: 1, EM: 'Mã biến thể đã tồn tại' });
            }

            const [result] = await connection.query(
                `INSERT INTO product_variants (product_id, variant_code, color, base_price)
                 VALUES (?, ?, ?, ?)`,
                [product_id, variant_code, color, base_price]
            );
            const variant_id = result.insertId;


            if (promotion_type_code && discount_value && start_date && end_date) {
                const [[promotionType]] = await connection.query(
                    `SELECT id FROM promotion_types WHERE code = ?`,
                    [promotion_type_code]
                );
                if (promotionType) {
                    await connection.query(
                        `INSERT INTO promotions (variant_id, promotion_type_id, discount_value, start_date, end_date)
                         VALUES (?, ?, ?, ?, ?)`,
                        [variant_id, promotionType.id, discount_value, start_date, end_date]
                    );
                }
            }


            const files = req.files || [];
            for (const file of files) {
                const imageURL = `/uploads/variant/${file.filename}`;
                await connection.query(
                    `INSERT INTO product_images (product_id, variant_id, image_data, is_primary, is_detail)
                     VALUES (?, ?, ?, 0, 1)`,
                    [product_id, variant_id, imageURL]
                );
            }

            return res.json({ EC: 0, EM: "Tạo biến thể thành công" });
        } catch (error) {
            console.error('Server error:', error);
            return res.json({ EC: 2, EM: "Lỗi server!" });
        }
    });
};

const updateVariant = async (req, res) => {
    const upload = createUpload("detail_images", "uploads/variant", true);
    upload(req, res, async (err) => {
        if (err) return res.json({ EC: 1, EM: "Lỗi upload ảnh" });

        try {
            const id = req.params.id;
            const {
                variant_code, product_id, color, base_price,
                promotion_type_code, discount_value, start_date, end_date
            } = req.body;


            let remainingList = [];
            if (req.body.remaining_images) {
                if (Array.isArray(req.body.remaining_images)) {
                    remainingList = req.body.remaining_images;
                } else {
                    remainingList = [req.body.remaining_images];
                }
            }


            const [check] = await connection.query(
                `SELECT * FROM product_variants WHERE id = ?`,
                [id]
            );
            if (check.length === 0)
                return res.json({ EC: 1, EM: 'Không tìm thấy biến thể' });

            await connection.query(
                `UPDATE product_variants SET product_id = ?, variant_code = ?, color = ?, base_price = ? WHERE id = ?`,
                [product_id, variant_code, color, base_price, id]
            );


            await connection.query(`DELETE FROM promotions WHERE variant_id = ?`, [id]);
            if (promotion_type_code && discount_value && start_date && end_date) {
                const [[promotionType]] = await connection.query(
                    `SELECT id FROM promotion_types WHERE code = ?`,
                    [promotion_type_code]
                );
                if (promotionType) {
                    await connection.query(
                        `INSERT INTO promotions (variant_id, promotion_type_id, discount_value, start_date, end_date)
                         VALUES (?, ?, ?, ?, ?)`,
                        [id, promotionType.id, discount_value, start_date, end_date]
                    );
                }
            }


            const [oldImages] = await connection.query(
                `SELECT image_data FROM product_images WHERE variant_id = ? AND is_detail = 1`,
                [id]
            );

            for (const { image_data } of oldImages) {
                if (!remainingList.includes(image_data)) {
                    deleteFileIfExists(path.join("public", image_data));
                    await connection.query(
                        `DELETE FROM product_images WHERE variant_id = ? AND image_data = ? AND is_detail = 1`,
                        [id, image_data]
                    );
                }
            }


            const files = req.files || [];
            for (const file of files) {
                const imageURL = `/uploads/variant/${file.filename}`;
                await connection.query(
                    `INSERT INTO product_images (product_id, variant_id, image_data, is_primary, is_detail)
                     VALUES (?, ?, ?, 0, 1)`,
                    [product_id, id, imageURL]
                );
            }

            return res.json({ EC: 0, EM: "Cập nhật biến thể thành công" });
        } catch (error) {
            console.error(error);
            return res.json({ EC: 2, EM: "Lỗi server!" });
        }
    });
};




const createOption = async (req, res) => {
    try {
        const { variant_id, ram, rom, extra_price, stock_quantity } = req.body;

        if (!variant_id) {
            return res.json({ EC: 1, EM: 'Thiếu ID biến thể!' });
        }

        await connection.query(
            `INSERT INTO product_variant_options (variant_id, ram, rom, extra_price, stock_quantity)
             VALUES (?, ?, ?, ?, ?)`,
            [variant_id, ram || null, rom || null, extra_price || 0, stock_quantity || 0]
        );

        return res.json({ EC: 0, EM: 'Tạo cấu hình thành công!' });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: 'Lỗi server!' });
    }
};


const updateOption = async (req, res) => {
    try {
        const id = req.params.id;
        const { ram, rom, extra_price, stock_quantity } = req.body;

        const [check] = await connection.query(
            `SELECT id FROM product_variant_options WHERE id = ?`,
            [id]
        );
        if (check.length === 0) {
            return res.json({ EC: 1, EM: 'Không tìm thấy cấu hình!' });
        }

        await connection.query(
            `UPDATE product_variant_options
             SET ram = ?, rom = ?, extra_price = ?, stock_quantity = ?
             WHERE id = ?`,
            [ram || null, rom || null, extra_price || 0, stock_quantity || 0, id]
        );

        return res.json({ EC: 0, EM: 'Cập nhật cấu hình thành công!' });
    } catch (error) {
        console.error(error);
        return res.json({ EC: 2, EM: 'Lỗi server!' });
    }
};


const updateProductActiveStatus = async (req, res) => {
    try {
        const { id, is_active } = req.body;

        if (!id || typeof is_active === 'undefined') {
            return res.status(400).json({
                EC: 1,
                EM: "Thiếu id hoặc is_active!"
            });
        }

        const [result] = await connection.query(
            `UPDATE products SET is_active = ? WHERE id = ?`,
            [is_active ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                EC: 2,
                EM: "Không tìm thấy sản phẩm cập nhật!"
            });
        }

        return res.status(200).json({
            EC: 0,
            EM: "Cập nhật trạng thái sản phẩm thành công!"
        });

    } catch (error) {
        console.error("Lỗi update is_active:", error);
        return res.status(500).json({
            EC: 3,
            EM: "Lỗi server khi cập nhật!"
        });
    }
};


const getBundledProductsByMainProductId = async (req, res) => {
    try {
        const { mainProductId } = req.params;

        const [rows] = await connection.query(`
            SELECT 
                bp.bundled_product_id,
                p.name AS product_name,
                v.base_price,
                bp.discount_value,
                pi.image_data
            FROM bundled_products bp
            JOIN products p ON bp.bundled_product_id = p.id
            LEFT JOIN (
                SELECT pv1.product_id, pv1.base_price
                FROM product_variants pv1
                JOIN (
                    SELECT product_id, MIN(id) AS min_id
                    FROM product_variants
                    GROUP BY product_id
                ) pv2 ON pv1.product_id = pv2.product_id AND pv1.id = pv2.min_id
            ) v ON v.product_id = p.id
            LEFT JOIN product_images pi 
                ON pi.product_id = p.id AND pi.is_primary = 1 AND pi.variant_id IS NULL
            WHERE bp.main_product_id = ?
        `, [mainProductId]);

        const result = rows.map(item => ({
            bundled_product_id: item.bundled_product_id,
            product_name: item.product_name,
            base_price: parseFloat(item.base_price || 0),
            discount_value: parseFloat(item.discount_value || 0),
            image: item.image_data
        }));

        return res.status(200).json({
            EC: 0,
            EM: 'Lấy sản phẩm gói kèm thành công',
            data: result
        });
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm gói kèm:', error);
        return res.status(500).json({
            EC: -1,
            EM: 'Lỗi server',
            data: []
        });
    }
};

const checkLowStock = async (req, res) => {
    try {
        const [rows] = await connection.query(`
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                p.product_code,
                pvo.id AS option_id,
                pvo.ram,
                pvo.rom,
                pvo.stock_quantity,
                pv.color,
                c.name AS company_name
            FROM products p
            JOIN product_variants pv ON p.id = pv.product_id
            JOIN product_variant_options pvo ON pv.id = pvo.variant_id
            JOIN companies c ON p.company_id = c.id
            WHERE pvo.stock_quantity < 5 AND pvo.stock_quantity >= 0
            ORDER BY pvo.stock_quantity ASC
        `);

        const lowStockProducts = rows.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.product_code,
            option_id: item.option_id,
            ram: item.ram,
            rom: item.rom,
            stock_quantity: item.stock_quantity,
            color: item.color,
            company_name: item.company_name
        }));

        return res.status(200).json({
            EC: 0,
            EM: 'Kiểm tra tồn kho thành công',
            data: lowStockProducts,
            count: lowStockProducts.length
        });
    } catch (error) {
        console.error('Lỗi khi kiểm tra tồn kho:', error);
        return res.status(500).json({
            EC: -1,
            EM: 'Lỗi server khi kiểm tra tồn kho',
            data: [],
            count: 0
        });
    }
};

module.exports = {
    getAllProductVariantsExpandFormat,
    deleteProduct,
    createProduct,
    updateProduct,
    createVariant,
    updateVariant,
    createOption,
    updateOption,
    updateProductActiveStatus,
    getBundledProductsByMainProductId,
    checkLowStock
};