const connection = require("../config/database");
const dayjs = require('dayjs');


function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const rated = reviews.filter(r => r.rating !== null && !isNaN(r.rating));
    if (rated.length === 0) return 0;
    const sum = rated.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((sum / rated.length).toFixed(1));
}
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
const getFlashSaleProducts = async (req, res) => {
    try {

        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);


        const [flashSaleVariants] = await connection.query(`
            SELECT 
                p.id AS product_id, p.name AS product_name, p.product_code, p.screen,p.refresh_rate,
                p.is_installment_available, p.description,p.is_active,
                v.id AS variant_id, v.color, v.base_price,
                pr.discount_value, pr.promotion_type_id, 
                pt.name AS promotion_type_name, pt.code AS promotion_code,
                pi.image_data AS image -- Chỉ lấy ảnh của product
            FROM products p
            JOIN (
                SELECT v.product_id, MIN(v.id) AS variant_id
                FROM product_variants v
                JOIN promotions pr ON v.id = pr.variant_id
                JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                WHERE pt.name = 'Flash Sale' AND pr.end_date > NOW()
                GROUP BY v.product_id
            ) AS fs ON p.id = fs.product_id
            JOIN product_variants v ON v.id = fs.variant_id
            JOIN promotions pr ON v.id = pr.variant_id AND pr.end_date > NOW()
            JOIN promotion_types pt ON pr.promotion_type_id = pt.id
            LEFT JOIN product_images pi 
                ON p.id = pi.product_id 
                AND pi.variant_id IS NULL 
                AND pi.is_primary = 1 -- Lấy ảnh tổng quan
            WHERE pt.name = 'Flash Sale' AND p.is_active = 1
            ORDER BY pr.start_date DESC
        `);

        const processedProducts = await Promise.all(flashSaleVariants.map(async (variant) => {

            const [options] = await connection.query(
                `SELECT * FROM product_variant_options WHERE variant_id = ? ORDER BY id ASC LIMIT 1`,
                [variant.variant_id]
            );
            const option = options[0] || null;

            const base_price = parseFloat(variant.base_price);
            const extra_price = option ? parseFloat(option.extra_price || 0) : 0;
            const total_before_discount = base_price + extra_price;

            const formula = promoTypeMap[variant.promotion_type_id];
            const final_price = formula
                ? calculateDynamicSalePrice(total_before_discount, formula, variant.discount_value)
                : total_before_discount;


            const [reviews] = await connection.query(
                `SELECT rating FROM product_reviews WHERE product_id = ? AND is_active = 1`,
                [variant.product_id]
            );
            const validReviews = reviews.filter(r => r.rating !== null && !isNaN(r.rating));
            const total_reviews = validReviews.length;
            const average_rating = calculateAverageRating(validReviews);

            return {
                product_id: variant.product_id,
                product_name: variant.product_name,
                product_code: variant.product_code,
                variant_id: variant.variant_id,
                color: variant.color,
                description: variant.description,
                is_active: variant.is_active,
                is_installment_available: variant.is_installment_available,
                screen: variant.screen,
                refresh_rate: variant.refresh_rate,
                ram: option ? option.ram : null,
                rom: option ? option.rom : null,
                base_price: total_before_discount,
                final_price,
                image: variant.image || null,
                promotion: {
                    promotion_code: variant.promotion_code,
                    promotion_type_name: variant.promotion_type_name,
                    discount_value: parseInt(variant.discount_value)
                },
                average_rating,
                total_reviews
            };
        }));

        return res.json({
            EC: 0,
            EM: "Lấy sản phẩm Flash Sale thành công!",
            data: processedProducts
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            EC: 2,
            EM: "Lỗi server!",
            data: []
        });
    }
};


const getTopProductsByCategory = async (req, res) => {
    try {
        const category_id = req.query.category_id ? parseInt(req.query.category_id) : null;
        if (!category_id) {
            return res.status(400).json({ EC: 1, EM: "Thiếu category_id!" });
        }

        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);

        const [topProducts] = await connection.query(`
            SELECT 
                p.id AS product_id, 
                p.name AS product_name, 
                p.product_code, 
                p.is_installment_available, 
                p.description,
                p.screen,
                p.refresh_rate,
                p.is_active,
                MAX(pi.image_data) AS image
                
            FROM products p
            LEFT JOIN product_images pi 
                ON p.id = pi.product_id 
                AND pi.variant_id IS NULL 
                AND pi.is_primary = 1
            WHERE p.category_id = ? AND p.is_active = 1
            GROUP BY p.id  
            LIMIT 8
        `, [category_id]);


        const processedProducts = await Promise.all(topProducts.map(async (product) => {
            const [variants] = await connection.query(
                `SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC LIMIT 1`,
                [product.product_id]
            );
            const variant = variants[0] || null;

            const [options] = variant ? await connection.query(
                `SELECT * FROM product_variant_options WHERE variant_id = ? ORDER BY id ASC LIMIT 1`,
                [variant.id]
            ) : [[]];
            const option = options[0] || null;

            const [promotion] = variant ? await connection.query(
                `SELECT pr.*, pt.name AS promotion_type_name, pt.code AS promotion_code
                 FROM promotions pr
                 JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                 WHERE pr.variant_id = ? AND pr.end_date > NOW()
                 ORDER BY pr.start_date DESC
                 LIMIT 1`,
                [variant.id]
            ) : [[]];
            const promo = promotion[0] || null;

            const [reviews] = await connection.query(
                `SELECT rating FROM product_reviews WHERE product_id = ? AND is_active = 1`,
                [product.product_id]
            );
            const validReviews = reviews.filter(r => r.rating !== null && !isNaN(r.rating));
            const total_reviews = validReviews.length;
            const average_rating = calculateAverageRating(validReviews);

            const base_price = variant ? parseFloat(variant.base_price) : 0;
            const extra_price = option ? parseFloat(option.extra_price || 0) : 0;
            const total_before_discount = base_price + extra_price;

            const final_price = promo ? calculateDynamicSalePrice(total_before_discount, promoTypeMap[promo.promotion_type_id], promo.discount_value) : total_before_discount;

            return {
                product_id: product.product_id,
                product_name: product.product_name,
                product_code: product.product_code,
                variant_id: variant ? variant.id : null,
                color: variant ? variant.color : null,
                description: product.description,
                is_active: product.is_active,
                is_installment_available: product.is_installment_available,
                ram: option ? option.ram : null,
                rom: option ? option.rom : null,
                screen: product.screen,
                refresh_rate: product.refresh_rate,
                base_price: total_before_discount,
                final_price,
                image: product.image || null,
                promotion: promo ? {
                    promotion_code: promo.promotion_code,
                    promotion_type_name: promo.promotion_type_name,
                    discount_value: parseInt(promo.discount_value)
                } : null,
                average_rating,
                total_reviews
            };
        }));
        const sortedProducts = processedProducts
            .sort((a, b) => {
                if (b.total_reviews === a.total_reviews) {
                    return b.average_rating - a.average_rating;
                }
                return b.total_reviews - a.total_reviews;
            })
            .slice(0, 10);
        return res.json({
            EC: 0,
            EM: "Lấy sản phẩm nổi bật theo danh mục thành công!",
            data: sortedProducts
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 2, EM: "Lỗi server!", data: [] });
    }
};


const searchSuggestions = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({ EC: 1, EM: "Thiếu keyword!" });
        }

        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);


        const [nameSuggestions] = await connection.query(
            `SELECT DISTINCT name FROM products WHERE name LIKE ? LIMIT 5`,
            [`%${keyword}%`]
        );


        const [products] = await connection.query(`
            SELECT 
                p.id AS product_id, p.name AS product_name, p.product_code, p.screen,p.is_active,
                v.id AS variant_id, v.color, v.base_price,
                pr.discount_value, pr.promotion_type_id, 
                pt.name AS promotion_type_name, pt.code AS promotion_code,
                pi.image_data AS image
            FROM products p
            JOIN (
                SELECT v1.* FROM product_variants v1
                JOIN (
                    SELECT product_id, MIN(id) AS min_variant_id
                    FROM product_variants
                    GROUP BY product_id
                ) AS min_v ON v1.product_id = min_v.product_id AND v1.id = min_v.min_variant_id
            ) v ON p.id = v.product_id
            LEFT JOIN promotions pr ON v.id = pr.variant_id AND pr.end_date > NOW()
            LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.variant_id IS NULL AND pi.is_primary = 1
            WHERE p.name LIKE ? AND is_active = 1
            LIMIT 5
        `, [`%${keyword}%`]);


        const processedProducts = products.map(product => {
            const base_price = parseFloat(product.base_price);
            const final_price = product.promotion_type_id
                ? calculateDynamicSalePrice(base_price, promoTypeMap[product.promotion_type_id], product.discount_value)
                : base_price;

            return {
                product_id: product.product_id,
                product_name: product.product_name,
                product_code: product.product_code,
                variant_id: product.variant_id,
                color: product.color,
                screen: product.screen,
                base_price,
                final_price,
                image: product.image || null,
                promotion: product.promotion_type_id ? {
                    promotion_code: product.promotion_code,
                    promotion_type_name: product.promotion_type_name,
                    discount_value: parseInt(product.discount_value)
                } : null
            };
        });

        return res.json({
            EC: 0,
            EM: "Lấy gợi ý tìm kiếm thành công!",
            data: {
                names: nameSuggestions.map(item => item.name),
                products: processedProducts
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 2, EM: "Lỗi server!", data: [] });
    }
};

const getAllProductsSearch = async (req, res) => {
    try {
        const {
            search,
            category_id, company_id,
            operating_system, ram, rom, color,
            screen, cpu, battery, gpu,
            material, refresh_rate,
            screen_technology, charging_port, gift,
            min_price, max_price,
            sortKey = 'p.id', sortOrder = 'DESC',
            page = 1, limit = 10
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClauses = [];
        const params = [];


        const handleMultiFilter = (value, column) => {
            if (!value) return;
            if (value.includes(',')) {
                const items = value.split(',').map(i => i.trim());
                whereClauses.push(`${column} IN (${items.map(() => '?').join(',')})`);
                params.push(...items);
            } else {
                whereClauses.push(`${column} = ?`);
                params.push(value);
            }
        };

        if (search !== undefined) {
            whereClauses.push(`p.name LIKE ?`);
            params.push(`%${search}%`);
        }


        handleMultiFilter(category_id, 'p.category_id');
        handleMultiFilter(company_id, 'p.company_id');
        handleMultiFilter(operating_system, 'p.operating_system');
        handleMultiFilter(screen, 'p.screen');
        handleMultiFilter(cpu, 'p.cpu');
        handleMultiFilter(battery, 'p.battery');
        handleMultiFilter(gpu, 'p.gpu');
        handleMultiFilter(material, 'p.material');
        handleMultiFilter(refresh_rate, 'p.refresh_rate');
        handleMultiFilter(screen_technology, 'p.screen_technology');
        handleMultiFilter(charging_port, 'p.charging_port');
        handleMultiFilter(gift, 'p.gift');
        handleMultiFilter(color, 'v.color');
        handleMultiFilter(ram, 'vo.ram');
        handleMultiFilter(rom, 'vo.rom');

        const priceRanges = req.query.price_ranges ? JSON.parse(req.query.price_ranges) : null;
        const screenRanges = req.query.screen_ranges ? JSON.parse(req.query.screen_ranges) : null;

        if (screenRanges?.length > 0) {
            const screenConditions = [];
            screenRanges.forEach(range => {
                if (Array.isArray(range) && range.length === 2) {
                    screenConditions.push(`(p.screen BETWEEN ? AND ?)`);
                    params.push(range[0], range[1]);
                }
            });
            if (screenConditions.length > 0) {
                whereClauses.push(`(${screenConditions.join(' OR ')})`);
            }
        }

        if (priceRanges?.length > 0) {
            const priceConditions = [];
            priceRanges.forEach(range => {
                if (Array.isArray(range) && range.length === 2) {
                    priceConditions.push(`((v.base_price + IFNULL(vo.extra_price, 0)) BETWEEN ? AND ?)`);
                    params.push(range[0], range[1]);
                }
            });
            if (priceConditions.length) {
                whereClauses.push(`(${priceConditions.join(' OR ')})`);
            }
        } else {
            if (min_price) {
                whereClauses.push(`(v.base_price + IFNULL(vo.extra_price, 0)) >= ?`);
                params.push(min_price);
            }
            if (max_price) {
                whereClauses.push(`(v.base_price + IFNULL(vo.extra_price, 0)) <= ?`);
                params.push(max_price);
            }
        }


        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';


        const [rows] = await connection.query(`
            SELECT 
                p.id AS product_id, p.name, p.product_code, p.company_id, p.release_date,
                p.refresh_rate, p.description, p.is_installment_available,p.screen, p.is_active, p.category_id,
                v.id AS variant_id, v.color, v.base_price,
                vo.ram, vo.rom, vo.extra_price,
                pr.discount_value, pr.promotion_type_id, pt.formula, pt.code AS promotion_code, pt.name AS promotion_type_name,
                pi.image_data AS image
            FROM products p
            JOIN (
                SELECT v.product_id, MIN(v.id) AS variant_id
                FROM product_variants v
                GROUP BY v.product_id
            ) AS first_variant ON p.id = first_variant.product_id
            JOIN product_variants v ON v.id = first_variant.variant_id
            LEFT JOIN (
                SELECT vo.variant_id, MIN(vo.id) AS option_id
                FROM product_variant_options vo
                GROUP BY vo.variant_id
            ) AS first_option ON v.id = first_option.variant_id
            LEFT JOIN product_variant_options vo ON vo.id = first_option.option_id
            LEFT JOIN (
                SELECT pr1.* FROM promotions pr1
                JOIN (
                    SELECT variant_id, MAX(start_date) AS max_start
                    FROM promotions
                    WHERE end_date > NOW()
                    GROUP BY variant_id
                ) AS latest ON pr1.variant_id = latest.variant_id AND pr1.start_date = latest.max_start
            ) pr ON v.id = pr.variant_id
            LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.variant_id IS NULL AND pi.is_primary = 1
            ${whereSQL}
        `, params);


        const processedProducts = await Promise.all(rows.map(async (item) => {
            const base_price = parseInt(item.base_price || 0) + parseInt(item.extra_price || 0);
            const final_price = item.formula
                ? calculateDynamicSalePrice(base_price, item.formula, item.discount_value)
                : base_price;

            const [reviews] = await connection.query(
                `SELECT rating FROM product_reviews WHERE product_id = ? `,
                [item.product_id]
            );

            const average_rating = calculateAverageRating(reviews);
            const total_reviews = reviews.length;

            return {
                product_id: item.product_id,
                product_name: item.name,
                product_code: item.product_code,
                company_id: item.company_id,
                release_date: item.release_date,
                variant_id: item.variant_id,
                refresh_rate: item.refresh_rate,
                is_active: item.is_active,
                screen: item.screen,
                description: item.description,
                category_id: item.category_id,
                promotion: item.promotion_type_id ? {
                    promotion_code: item.promotion_code,
                    promotion_type_name: item.promotion_type_name,
                    discount_value: parseInt(item.discount_value)
                } : null,
                is_installment_available: item.is_installment_available,
                color: item.color,
                ram: item.ram,
                rom: item.rom,
                base_price,
                final_price,
                average_rating,
                total_reviews,
                image: item.image || null
            };
        }));


        const sortedProducts = (['final_price', 'average_rating', 'release_date'].includes(sortKey))
            ? processedProducts.sort((a, b) => {
                const valA = a[sortKey] || 0;
                const valB = b[sortKey] || 0;
                return sortOrder === 'ASC' ? valA - valB : valB - valA;
            })
            : processedProducts;


        const total = sortedProducts.length;
        const totalPage = Math.ceil(total / limit);
        const paginatedProducts = sortedProducts.slice(offset, offset + limit);


        return res.json({
            EC: 0,
            EM: "Lấy sản phẩm + biến thể thành công (expand)",
            data: {
                totalRow: total,
                totalPage,
                products: paginatedProducts
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            EC: 2,
            EM: "Lỗi server",
            data: []
        });
    }
};





const getOneProductExpandFormat = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({ EC: 1, EM: "Missing productId", data: null });
        }


        const [productRows] = await connection.query(
            `SELECT p.*, c.name AS company_name, pc.name AS category_name
             FROM products p
             JOIN companies c ON p.company_id = c.id
             JOIN product_categories pc ON p.category_id = pc.id
             WHERE p.id = ?`,
            [productId]
        );

        if (productRows.length === 0) {
            return res.status(404).json({ EC: 1, EM: "Product not found", data: null });
        }

        const product = productRows[0];


        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);


        const [primaryImageRows] = await connection.query(
            `SELECT image_data FROM product_images 
             WHERE product_id = ? AND variant_id IS NULL AND is_primary = 1 
             LIMIT 1`,
            [productId]
        );
        const primary_image = primaryImageRows.length > 0
            ? primaryImageRows[0].image_data
            : null;


        const [variants] = await connection.query(
            `SELECT * FROM product_variants WHERE product_id = ?`,
            [productId]
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
                promotion[0].discount_value = parseInt(promotion[0].discount_value);
                promotion[0].start_date = dayjs(promotion[0].start_date).format("YYYY-MM-DD HH:mm:ss");
                promotion[0].end_date = dayjs(promotion[0].end_date).format("YYYY-MM-DD HH:mm:ss");
            }


            const [images] = await connection.query(
                `SELECT * FROM product_images 
                 WHERE product_id = ? AND variant_id = ? AND is_detail = 1`,
                [productId, variant.id]
            );
            const base_price = parseFloat(variant.base_price);


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
                base_price: base_price,
                options: sale_price_map,
                images: images.map(img => img.image_data),
                promotion: promotion[0] || null
            };
        }));


        const [reviewList] = await connection.query(
            `SELECT pr.*, u.username, u.role
   FROM product_reviews pr
   LEFT JOIN users u ON pr.user_id = u.id
   WHERE pr.product_id = ? AND pr.is_active = 1
   ORDER BY pr.created_at ASC`,
            [productId]
        );
        const total_reply = reviewList.length

        const parentReviews = reviewList.filter(r => r.parent_id === null);
        const replyReviews = reviewList.filter(r => r.parent_id !== null);


        const validRatings = parentReviews.filter(r => r.rating !== null && !isNaN(r.rating));
        const average_rating =
            validRatings.length > 0
                ? (validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length).toFixed(1)
                : 0;

        const total_reviews = validRatings.length;

        const ratingCounts = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };

        validRatings.forEach(r => {
            const rate = parseInt(r.rating);
            if (rate >= 1 && rate <= 5) {
                ratingCounts[rate]++;
            }
        });

        const productDetail = {
            ...product,
            primary_image,
            variants: processedVariants,
            average_rating,
            total_reviews,
            total_reply,
            rating_counts: ratingCounts,
            reviews: parentReviews,
            replies: replyReviews
        };


        return res.status(200).json({
            EC: 0,
            EM: "Lấy thông tin sản phẩm chi tiết thành công",
            data: productDetail
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            EC: -1,
            EM: "Internal server error",
            data: null
        });
    }
};



const getAllProductSpecifications = async (req, res) => {
    try {

        const [productSpecs] = await connection.query(`
            SELECT DISTINCT 
                screen, cpu, battery, gpu, camera, operating_system, 
                weight, dimensions, material, refresh_rate, 
                screen_technology, charging_port, gift
            FROM products
        `);

        const [companies] = await connection.query(`
            SELECT id AS value, name AS label FROM companies
        `);
        const [categories] = await connection.query(`
            SELECT id AS value, name AS label FROM product_categories
        `);
        const [colors] = await connection.query(`SELECT DISTINCT color FROM product_variants`);
        const [rams] = await connection.query(`SELECT DISTINCT ram FROM product_variant_options`);
        const [roms] = await connection.query(`SELECT DISTINCT rom FROM product_variant_options`);
        const [priceStats] = await connection.query(`
         SELECT 
    MIN(v.base_price + IFNULL(o.extra_price, 0)) AS min_price,
    MAX(v.base_price + IFNULL(o.extra_price, 0)) AS max_price
FROM product_variant_options o
JOIN product_variants v ON o.variant_id = v.id


        `);


        const specSet = {
            screen: new Set(),
            cpu: new Set(),
            battery: new Set(),
            gpu: new Set(),
            operating_system: new Set(),
            material: new Set(),
            refresh_rate: new Set(),
            screen_technology: new Set(),
            charging_port: new Set(),
            gift: new Set()
        };

        for (let row of productSpecs) {
            for (let key in specSet) {
                if (row[key]) specSet[key].add(row[key]);
            }
        }

        return res.status(200).json({
            EC: 0,
            EM: "Thành công",
            data: {
                screen: [...specSet.screen],
                cpu: [...specSet.cpu],
                battery: [...specSet.battery],
                gpu: [...specSet.gpu],
                operating_system: [...specSet.operating_system],
                material: [...specSet.material],
                refresh_rate: [...specSet.refresh_rate],
                screen_technology: [...specSet.screen_technology],
                charging_port: [...specSet.charging_port],
                gift: [...specSet.gift],
                color: colors.map(c => c.color),
                ram: rams.map(r => r.ram),
                rom: roms.map(r => r.rom),
                min_price: priceStats[0]?.min_price || 0,
                max_price: priceStats[0]?.max_price || 0,
                company: companies,
                category: categories
            }
        });
    } catch (error) {
        console.error("getAllProductSpecifications error:", error);
        return res.status(500).json({
            EC: -1,
            EM: "Lỗi server",
            data: null
        });
    }
};

const getSimilarProducts = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) return res.status(400).json({ EC: 1, EM: "Thiếu productId!" });


        const [productRows] = await connection.query(`
      SELECT p.id, p.category_id, p.company_id, p.operating_system,
             v.id as variant_id, v.color, v.base_price,
             vo.ram, vo.rom
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id
      LEFT JOIN product_variant_options vo ON vo.variant_id = v.id
      WHERE p.id = ?
      LIMIT 1
    `, [productId]);

        if (productRows.length === 0) return res.status(404).json({ EC: 1, EM: "Không tìm thấy sản phẩm!", data: [] });
        const goc = productRows[0];


        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);


        const [candidates] = await connection.query(`
      SELECT 
          p.id AS product_id, p.name AS product_name, p.product_code, p.screen, p.refresh_rate,
          p.is_installment_available, p.description, p.is_active, p.operating_system, p.company_id,
          v.id AS variant_id, v.color, v.base_price,
          vo.ram, vo.rom,
          pi.image_data AS image,
          pr.discount_value, pr.promotion_type_id,
          pt.name AS promotion_type_name, pt.code AS promotion_code,
          (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_active = 1) AS avg_rating,
          (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_active = 1 AND rating IS NOT NULL) AS total_reviews
      FROM products p
      LEFT JOIN product_variants v ON v.id = (
          SELECT id FROM product_variants WHERE product_id = p.id ORDER BY id ASC LIMIT 1
      )
      LEFT JOIN product_variant_options vo ON vo.id = (
          SELECT id FROM product_variant_options WHERE variant_id = v.id ORDER BY id ASC LIMIT 1
      )
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.variant_id IS NULL AND pi.is_primary = 1
      LEFT JOIN promotions pr ON pr.variant_id = v.id AND pr.end_date > NOW()
      LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
      WHERE p.category_id = ? AND p.id != ?
    `, [goc.category_id, goc.id]);

        const processed = candidates.map(p => {
            const base_price = parseFloat(p.base_price || 0);
            const extra_price = 0;
            const total_before_discount = base_price + extra_price;

            const formula = promoTypeMap[p.promotion_type_id];
            const final_price = formula
                ? calculateDynamicSalePrice(total_before_discount, formula, p.discount_value)
                : total_before_discount;

            return {
                product_id: p.product_id,
                product_name: p.product_name,
                product_code: p.product_code,
                variant_id: p.variant_id,
                color: p.color,
                description: p.description,
                is_active: p.is_active,
                is_installment_available: p.is_installment_available,
                screen: p.screen,
                refresh_rate: p.refresh_rate,
                ram: p.ram,
                rom: p.rom,
                base_price: total_before_discount,
                final_price,
                image: p.image || null,
                promotion: p.promotion_code ? {
                    promotion_code: p.promotion_code,
                    promotion_type_name: p.promotion_type_name,
                    discount_value: parseInt(p.discount_value)
                } : null,
                average_rating: (p.avg_rating && !isNaN(p.avg_rating))
                    ? parseFloat(Number(p.avg_rating).toFixed(1))
                    : 0,
                total_reviews: p.total_reviews || 0
            };

        });


        const price_goc = parseFloat(goc.base_price);
        const scored = processed.map(p => {
            let score = 0;
            if (p.company_id === goc.company_id) score += 3;
            if (Math.abs(p.base_price - price_goc) <= 3000000 || Math.abs(p.base_price - price_goc) / price_goc <= 0.2) score += 2;
            if (p.ram && goc.ram && p.ram === goc.ram) score += 1;
            if (p.rom && goc.rom && p.rom === goc.rom) score += 1;
            if (p.operating_system && goc.operating_system && p.operating_system === goc.operating_system) score += 1;
            if (p.average_rating >= 4.0) score += 1;
            return { ...p, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const top10 = scored.slice(0, 10);

        return res.json({
            EC: 0,
            EM: "Lấy sản phẩm tương tự thành công!",
            data: top10
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: 2, EM: "Lỗi server!", data: [] });
    }
};


const getProductDetail = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) return res.status(400).json({ EC: 1, EM: "Missing productId", data: null });

        const [productRows] = await connection.query(
            `SELECT p.*, c.name AS company_name, pc.name AS category_name
             FROM products p
             JOIN companies c ON p.company_id = c.id
             JOIN product_categories pc ON p.category_id = pc.id
             WHERE p.id = ?`,
            [productId]
        );
        if (productRows.length === 0) return res.status(404).json({ EC: 1, EM: "Product not found", data: null });

        const product = productRows[0];

        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);

        const [primaryImageRows] = await connection.query(
            `SELECT image_data FROM product_images 
             WHERE product_id = ? AND variant_id IS NULL AND is_primary = 1 
             LIMIT 1`,
            [productId]
        );
        const primary_image = primaryImageRows.length ? primaryImageRows[0].image_data : null;

        const [variants] = await connection.query(`SELECT * FROM product_variants WHERE product_id = ?`, [productId]);

        const processedVariants = await Promise.all(variants.map(async (variant) => {
            const [options] = await connection.query(`SELECT * FROM product_variant_options WHERE variant_id = ?`, [variant.id]);
            const [promotion] = await connection.query(
                `SELECT pr.*, pt.name AS promotion_type_name, pt.code AS promotion_code
                 FROM promotions pr
                 JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                 WHERE pr.variant_id = ? AND pr.end_date > NOW()
                 ORDER BY pr.start_date DESC LIMIT 1`,
                [variant.id]
            );

            const [images] = await connection.query(
                `SELECT * FROM product_images WHERE product_id = ? AND variant_id = ? AND is_detail = 1`,
                [productId, variant.id]
            );


            const base_price = parseFloat(variant.base_price);
            const sale_price_map = options.map(opt => {
                const extra = parseFloat(opt.extra_price || 0);
                const hasPromo = promotion.length && promoTypeMap[promotion[0].promotion_type_id];
                let base_option_price = base_price + extra;
                let final_price;
                if (hasPromo) {
                    const formula = promoTypeMap[promotion[0].promotion_type_id];
                    final_price = formula.trim() === "{{value}}"
                        ? parseFloat(promotion[0].discount_value) + extra
                        : calculateDynamicSalePrice(base_price + extra, formula, promotion[0].discount_value);
                } else {
                    final_price = base_price + extra;
                }
                return { ...opt, final_price, base_option_price };
            });

            return {
                ...variant,

                base_price,
                options: sale_price_map,
                images: images.map(img => img.image_data),
                promotion: promotion[0] || null
            };
        }));

        const [reviewList] = await connection.query(
            `SELECT pr.*, u.username, u.role
   FROM product_reviews pr
   LEFT JOIN users u ON pr.user_id = u.id
   WHERE pr.product_id = ? AND pr.is_active = 1
   ORDER BY pr.created_at ASC`,
            [productId]
        );
        const validRatings = reviewList.filter(r => r.rating !== null && !isNaN(r.rating));
        const total_reviews = validRatings.length
        const average_rating =
            validRatings.length > 0
                ? (validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length).toFixed(1)
                : 0;
        return res.status(200).json({
            EC: 0,
            EM: "Lấy thông tin sản phẩm thành công",
            data: {
                ...product,
                total_reviews,
                average_rating,
                primary_image,
                variants: processedVariants
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: -1, EM: "Internal server error", data: null });
    }
};

const getProductReviewsPaginate = async (req, res) => {
    try {
        const { productId } = req.params;
        let { page, limit, rating } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 5;
        const offset = (page - 1) * limit;

        if (!productId) {
            return res.status(400).json({ EC: 1, EM: "Thiếu productId", data: null });
        }


        let ratingFilter = '';
        let ratingParams = [];
        if (rating) {
            ratingFilter = ' AND rating = ? ';
            ratingParams.push(Number(rating));
        }


        const [parentCountRows] = await connection.query(
            `SELECT COUNT(*) as total FROM product_reviews WHERE product_id = ? AND parent_id IS NULL AND is_active = 1${ratingFilter}`,
            [productId, ...ratingParams]
        );
        const total_parent_reviews = parentCountRows[0]?.total || 0;


        const [parentReviews] = await connection.query(
            `SELECT pr.*, u.username, u.role,u.avatar
                 FROM product_reviews pr
                 LEFT JOIN users u ON pr.user_id = u.id
                 WHERE pr.product_id = ? AND pr.parent_id IS NULL AND pr.is_active = 1${ratingFilter}
                 ORDER BY pr.created_at DESC
                 LIMIT ? OFFSET ?`,
            [productId, ...ratingParams, limit, offset]
        );


        const [replyReviews] = await connection.query(
            `SELECT pr.*, u.username, u.role,u.avatar   
                 FROM product_reviews pr
                 LEFT JOIN users u ON pr.user_id = u.id
                 WHERE pr.product_id = ? AND pr.parent_id IS NOT NULL AND pr.is_active = 1
                 ORDER BY pr.created_at ASC`,
            [productId]
        );


        const [allParentReviews] = await connection.query(
            `SELECT rating
                 FROM product_reviews
                 WHERE product_id = ? AND parent_id IS NULL AND is_active = 1`,
            [productId]
        );

        const validRatings = allParentReviews.filter(r => r.rating !== null && !isNaN(r.rating));
        const average_rating =
            validRatings.length > 0
                ? (validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length).toFixed(1)
                : 0;

        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        validRatings.forEach(r => {
            const rate = parseInt(r.rating);
            if (rate >= 1 && rate <= 5) ratingCounts[rate]++;
        });


        const total_reviews = validRatings.length;

        const [reviewList] = await connection.query(
            `SELECT pr.*, u.username, u.role
                 FROM product_reviews pr
                 LEFT JOIN users u ON pr.user_id = u.id
                 WHERE pr.product_id = ? AND pr.is_active = 1
                 ORDER BY pr.created_at ASC`,
            [productId]
        );
        const total_reply = reviewList.length;

        return res.status(200).json({
            EC: 0,
            EM: "Lấy review sản phẩm thành công",
            data: {
                average_rating,
                total_reviews,
                total_reply,
                total_parent_reviews,
                rating_counts: ratingCounts,
                reviews: parentReviews,
                replies: replyReviews
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy review sản phẩm:", error);
        return res.status(500).json({ EC: -1, EM: "Internal server error", data: null });
    }
};

const getRecommendedProductsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const [viewedRows] = await connection.query(`
            SELECT product_id FROM recently_viewed_products
            WHERE user_id = ?
            ORDER BY viewed_at DESC
            LIMIT 5
        `, [userId]);

        if (viewedRows.length === 0) {
            return res.json({ EC: 0, EM: "Chưa có dữ liệu đã xem", data: [] });
        }

        const viewedProductIds = viewedRows.map(r => r.product_id);

        const [viewedProducts] = await connection.query(`
            SELECT 
                p.id, p.company_id, p.category_id, p.operating_system,
                vo.ram, vo.rom, v.base_price
            FROM products p
            LEFT JOIN product_variants v ON v.id = (
                SELECT id FROM product_variants WHERE product_id = p.id ORDER BY id ASC LIMIT 1
            )
            LEFT JOIN product_variant_options vo ON vo.id = (
                SELECT id FROM product_variant_options WHERE variant_id = v.id ORDER BY id ASC LIMIT 1
            )
            WHERE p.id IN (?)
        `, [viewedProductIds]);

        const viewedOrderMap = new Map();
        viewedRows.forEach((row, idx) => {
            // Sản phẩm xem gần nhất có trọng số cao hơn.
            viewedOrderMap.set(row.product_id, 5 - idx);
        });

        const makeFrequencyMap = (rows, keyGetter) => {
            const map = new Map();
            rows.forEach((row) => {
                const key = keyGetter(row);
                if (key === null || key === undefined || key === "") return;
                const weight = viewedOrderMap.get(row.id) || 1;
                map.set(key, (map.get(key) || 0) + weight);
            });
            return map;
        };

        const categoryWeightMap = makeFrequencyMap(viewedProducts, (r) => r.category_id);
        const companyWeightMap = makeFrequencyMap(viewedProducts, (r) => r.company_id);
        const osWeightMap = makeFrequencyMap(viewedProducts, (r) => r.operating_system);
        const ramWeightMap = makeFrequencyMap(viewedProducts, (r) => r.ram);
        const romWeightMap = makeFrequencyMap(viewedProducts, (r) => r.rom);

        const categoryIds = [...categoryWeightMap.keys()];
        const dominantCategoryId = [...categoryWeightMap.entries()]
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const prices = viewedProducts
            .map((p) => parseFloat(p.base_price || 0))
            .filter((price) => Number.isFinite(price) && price > 0);
        const avgPrice = prices.length
            ? prices.reduce((sum, p) => sum + p, 0) / prices.length
            : 0;
        const minPrice = avgPrice > 0 ? avgPrice * 0.6 : 0;
        const maxPrice = avgPrice > 0 ? avgPrice * 1.4 : Number.MAX_SAFE_INTEGER;

        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);

        let candidates = [];

        for (const categoryId of categoryIds) {
            const [result] = await connection.query(`
                SELECT 
                    p.id AS product_id, p.name AS product_name, p.product_code, p.screen, p.refresh_rate, p.screen_technology,
                    p.is_installment_available, p.description, p.is_active, p.operating_system, p.company_id,
                    v.id AS variant_id, v.color, v.base_price,
                    vo.ram, vo.rom,
                    pi.image_data AS image,
                    pr.discount_value, pr.promotion_type_id,
                    pt.name AS promotion_type_name, pt.code AS promotion_code,
                    (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_active = 1) AS avg_rating,
                    (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_active = 1 AND rating IS NOT NULL) AS total_reviews
                FROM products p
                LEFT JOIN product_variants v ON v.id = (
                    SELECT id FROM product_variants WHERE product_id = p.id ORDER BY id ASC LIMIT 1
                )
                LEFT JOIN product_variant_options vo ON vo.id = (
                    SELECT id FROM product_variant_options WHERE variant_id = v.id ORDER BY id ASC LIMIT 1
                )
                LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.variant_id IS NULL AND pi.is_primary = 1
                LEFT JOIN promotions pr ON pr.variant_id = v.id AND pr.end_date > NOW()
                LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                WHERE p.id NOT IN (?) AND p.category_id = ? AND v.base_price BETWEEN ? AND ?
                LIMIT 20
            `, [viewedProductIds, categoryId, minPrice, maxPrice]);

            candidates.push(...result);
        }

        const uniqueMap = new Map();
        const mergeCandidates = (rows = []) => {
            rows.forEach((p) => {
                if (!uniqueMap.has(p.product_id)) {
                    uniqueMap.set(p.product_id, p);
                }
            });
        };
        mergeCandidates(candidates);

        // Nguồn dữ liệu gợi ý ban đầu lọc theo khoảng giá có thể quá hẹp.
        // Nếu kết quả quá ít, mở rộng dần để tránh chỉ hiện 1 sản phẩm.
        if (uniqueMap.size < 10) {
            for (const categoryId of categoryIds) {
                const [fallbackByCategory] = await connection.query(`
                    SELECT 
                        p.id AS product_id, p.name AS product_name, p.product_code, p.screen, p.refresh_rate, p.screen_technology,
                        p.is_installment_available, p.description, p.is_active, p.operating_system, p.company_id,
                        v.id AS variant_id, v.color, v.base_price,
                        vo.ram, vo.rom,
                        pi.image_data AS image,
                        pr.discount_value, pr.promotion_type_id,
                        pt.name AS promotion_type_name, pt.code AS promotion_code,
                        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_active = 1) AS avg_rating,
                        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_active = 1 AND rating IS NOT NULL) AS total_reviews
                    FROM products p
                    LEFT JOIN product_variants v ON v.id = (
                        SELECT id FROM product_variants WHERE product_id = p.id ORDER BY id ASC LIMIT 1
                    )
                    LEFT JOIN product_variant_options vo ON vo.id = (
                        SELECT id FROM product_variant_options WHERE variant_id = v.id ORDER BY id ASC LIMIT 1
                    )
                    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.variant_id IS NULL AND pi.is_primary = 1
                    LEFT JOIN promotions pr ON pr.variant_id = v.id AND pr.end_date > NOW()
                    LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                    WHERE p.id NOT IN (?) AND p.category_id = ? AND p.is_active = 1
                    LIMIT 20
                `, [viewedProductIds, categoryId]);
                mergeCandidates(fallbackByCategory);
                if (uniqueMap.size >= 10) break;
            }
        }

        if (uniqueMap.size < 10) {
            const [fallbackGlobal] = await connection.query(`
                SELECT 
                    p.id AS product_id, p.name AS product_name, p.product_code, p.screen, p.refresh_rate, p.screen_technology,
                    p.is_installment_available, p.description, p.is_active, p.operating_system, p.company_id,
                    v.id AS variant_id, v.color, v.base_price,
                    vo.ram, vo.rom,
                    pi.image_data AS image,
                    pr.discount_value, pr.promotion_type_id,
                    pt.name AS promotion_type_name, pt.code AS promotion_code,
                    (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_active = 1) AS avg_rating,
                    (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_active = 1 AND rating IS NOT NULL) AS total_reviews
                FROM products p
                LEFT JOIN product_variants v ON v.id = (
                    SELECT id FROM product_variants WHERE product_id = p.id ORDER BY id ASC LIMIT 1
                )
                LEFT JOIN product_variant_options vo ON vo.id = (
                    SELECT id FROM product_variant_options WHERE variant_id = v.id ORDER BY id ASC LIMIT 1
                )
                LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.variant_id IS NULL AND pi.is_primary = 1
                LEFT JOIN promotions pr ON pr.variant_id = v.id AND pr.end_date > NOW()
                LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                WHERE p.id NOT IN (?) AND p.is_active = 1
                LIMIT 30
            `, [viewedProductIds]);
            mergeCandidates(fallbackGlobal);
        }

        candidates = Array.from(uniqueMap.values());


        const processed = candidates.map(p => {
            const base_price = parseFloat(p.base_price || 0);
            const total_before_discount = base_price;

            const formula = promoTypeMap[p.promotion_type_id];
            const final_price = formula
                ? calculateDynamicSalePrice(total_before_discount, formula, p.discount_value)
                : total_before_discount;

            const categorySignal = categoryWeightMap.get(p.category_id) || 0;
            const companySignal = companyWeightMap.get(p.company_id) || 0;
            const osSignal = osWeightMap.get(p.operating_system) || 0;
            const ramSignal = ramWeightMap.get(p.ram) || 0;
            const romSignal = romWeightMap.get(p.rom) || 0;

            let score = 0;
            score += categorySignal * 1.2;
            score += companySignal * 1.8; // Ví dụ user xem Apple nhiều -> ưu tiên Apple
            score += osSignal * 0.8;
            score += ramSignal * 0.7;
            score += romSignal * 0.7;

            // Ưu tiên đúng loại sản phẩm người dùng đang xem gần đây (vd iPhone => điện thoại).
            if (dominantCategoryId !== null) {
                if (p.category_id === dominantCategoryId) score += 4;
                else score -= 2.5;
            }

            if (avgPrice > 0 && Number.isFinite(base_price) && base_price > 0) {
                const priceDiffRatio = Math.abs(base_price - avgPrice) / avgPrice;
                if (priceDiffRatio <= 0.12) score += 3;
                else if (priceDiffRatio <= 0.25) score += 2;
                else if (priceDiffRatio <= 0.4) score += 1;
            }

            const rating = Number(p.avg_rating || 0);
            if (rating >= 4.5) score += 2.5;
            else if (rating >= 4.0) score += 1.5;
            else if (rating >= 3.5) score += 0.75;

            const totalReviews = Number(p.total_reviews || 0);
            if (totalReviews >= 100) score += 1.5;
            else if (totalReviews >= 50) score += 1;
            else if (totalReviews >= 20) score += 0.5;

            return {
                product_id: p.product_id,
                product_name: p.product_name,
                product_code: p.product_code,
                variant_id: p.variant_id,
                color: p.color,
                description: p.description,
                is_active: p.is_active,
                is_installment_available: p.is_installment_available,
                screen: p.screen,
                refresh_rate: p.refresh_rate,
                screen_technology: p.screen_technology,
                ram: p.ram,
                rom: p.rom,
                base_price: total_before_discount,
                final_price,
                image: p.image || null,
                promotion_code: p.promotion_code,
                promotion_type_name: p.promotion_type_name,
                discount_value: parseInt(p.discount_value),
                average_rating: (p.avg_rating && !isNaN(p.avg_rating))
                    ? parseFloat(Number(p.avg_rating).toFixed(1))
                    : 0,
                total_reviews: p.total_reviews || 0,
                score
            };
        });


        const sorted = processed
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if ((b.total_reviews || 0) !== (a.total_reviews || 0)) {
                    return (b.total_reviews || 0) - (a.total_reviews || 0);
                }
                return (b.average_rating || 0) - (a.average_rating || 0);
            });

        const sameCategory = dominantCategoryId === null
            ? sorted
            : sorted.filter((item) => item.category_id === dominantCategoryId);
        const otherCategories = dominantCategoryId === null
            ? []
            : sorted.filter((item) => item.category_id !== dominantCategoryId);

        // Ưu tiên phần lớn kết quả cùng category; chỉ bù từ category khác khi không đủ.
        const top10 = [
            ...sameCategory.slice(0, 8),
            ...otherCategories.slice(0, 10),
        ].slice(0, 10);

        return res.json({ EC: 0, EM: "Gợi ý thành công", data: top10 });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server", data: [] });
    }
};

const getSuggestCart = async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.json({ EC: 0, EM: "Danh sách sản phẩm trống", data: [] });
        }

        const [viewedProducts] = await connection.query(`
            SELECT p.id, p.company_id, p.category_id, p.operating_system,
                   vo.ram, vo.rom, v.base_price
            FROM products p
            LEFT JOIN product_variants v ON v.product_id = p.id
            LEFT JOIN product_variant_options vo ON vo.variant_id = v.id
            WHERE p.id IN (?)
        `, [productIds]);

        if (viewedProducts.length === 0) {
            return res.json({ EC: 0, EM: "Không tìm thấy sản phẩm", data: [] });
        }

        const categories = [...new Set(viewedProducts.map(p => p.category_id))];
        const companies = [...new Set(viewedProducts.map(p => p.company_id))];
        const operatingSystems = [...new Set(viewedProducts.map(p => p.operating_system).filter(Boolean))];

        const avgPrice = viewedProducts.reduce((sum, p) => sum + parseFloat(p.base_price || 0), 0) / viewedProducts.length;
        const minPrice = avgPrice * 0.7;
        const maxPrice = avgPrice * 1.3;

        const [promotionTypes] = await connection.query(`SELECT * FROM promotion_types`);
        const promoTypeMap = {};
        promotionTypes.forEach(type => promoTypeMap[type.id] = type.formula);


        let candidates = [];

        for (const categoryId of categories) {
            const [categoryCandidates] = await connection.query(`
                SELECT 
                    p.id AS product_id, p.name AS product_name, p.product_code, p.screen, p.refresh_rate, p.screen_technology,
                    p.is_installment_available, p.description, p.is_active, p.operating_system, p.company_id,
                    v.id AS variant_id, v.color, v.base_price,
                    vo.ram, vo.rom,
                    pi.image_data AS image,
                    pr.discount_value, pr.promotion_type_id,
                    pt.name AS promotion_type_name, pt.code AS promotion_code,
                    (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_active = 1) AS avg_rating,
                    (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_active = 1 AND rating IS NOT NULL) AS total_reviews
                FROM products p
                LEFT JOIN product_variants v ON v.id = (
                    SELECT id FROM product_variants WHERE product_id = p.id ORDER BY id ASC LIMIT 1
                )
                LEFT JOIN product_variant_options vo ON vo.id = (
                    SELECT id FROM product_variant_options WHERE variant_id = v.id ORDER BY id ASC LIMIT 1
                )
                LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.variant_id IS NULL AND pi.is_primary = 1
                LEFT JOIN promotions pr ON pr.variant_id = v.id AND pr.end_date > NOW()
                LEFT JOIN promotion_types pt ON pr.promotion_type_id = pt.id
                WHERE p.id NOT IN (?) AND p.category_id = ? AND v.base_price BETWEEN ? AND ?
                LIMIT 20
            `, [productIds, categoryId, minPrice, maxPrice]);

            candidates.push(...categoryCandidates);
        }

        const processed = candidates.map(p => {
            const base_price = parseFloat(p.base_price || 0);
            const total_before_discount = base_price;
            const formula = promoTypeMap[p.promotion_type_id];
            const final_price = formula
                ? calculateDynamicSalePrice(total_before_discount, formula, p.discount_value)
                : total_before_discount;

            let score = 0;
            if (companies.includes(p.company_id)) score += 3;
            if (operatingSystems.includes(p.operating_system)) score += 1;
            if (p.ram && viewedProducts.find(v => v.ram === p.ram)) score += 1;
            if (p.rom && viewedProducts.find(v => v.rom === p.rom)) score += 1;
            if (p.avg_rating >= 4.0) score += 1;

            return {
                product_id: p.product_id,
                product_name: p.product_name,
                product_code: p.product_code,
                variant_id: p.variant_id,
                color: p.color,
                description: p.description,
                is_active: p.is_active,
                is_installment_available: p.is_installment_available,
                screen: p.screen,
                refresh_rate: p.refresh_rate,
                screen_technology: p.screen_technology,
                ram: p.ram,
                rom: p.rom,
                base_price: total_before_discount,
                final_price,
                image: p.image || null,
                promotion_code: p.promotion_code,
                promotion_type_name: p.promotion_type_name,
                discount_value: parseInt(p.discount_value),
                average_rating: (p.avg_rating && !isNaN(p.avg_rating))
                    ? parseFloat(Number(p.avg_rating).toFixed(1))
                    : 0,
                total_reviews: p.total_reviews || 0,
                score
            };
        });

        const top10 = processed
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        return res.json({ EC: 0, EM: "Gợi ý thành công", data: top10 });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server", data: [] });
    }
};


module.exports = {
    getFlashSaleProducts,
    getTopProductsByCategory,
    searchSuggestions,
    getAllProductsSearch,
    getOneProductExpandFormat,
    getAllProductSpecifications,
    getSimilarProducts,
    getProductDetail,
    getProductReviewsPaginate,
    getRecommendedProductsByUser,
    getSuggestCart
}
