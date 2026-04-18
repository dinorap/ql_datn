const connection = require("../config/database");
const transporter = require("../config/email");
const getAllOrders = async (req, res) => {
    try {
        const { username, status, startDate, endDate, customer_name, page = 1, limit } = req.query;

        const usePagination = !!limit;
        const offset = (page - 1) * (limit || 10);
        const params = [];

        let baseQuery = `
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_statuses os ON o.status_id = os.id
            JOIN payment_methods pm ON o.payment_method_id = pm.id
            LEFT JOIN store_locations sl ON o.pickup_location_id = sl.id
            WHERE 1=1
        `;

        if (customer_name) {
            baseQuery += " AND o.customer_name LIKE ?";
            params.push(`%${customer_name}%`);
        }
        if (username) {
            baseQuery += " AND u.username LIKE ?";
            params.push(`%${username}%`);
        }
        if (status) {
            baseQuery += " AND os.code = ?";
            params.push(status);
        }
        if (startDate) {
            baseQuery += " AND o.created_at >= ?";
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            baseQuery += " AND o.created_at <= ?";
            params.push(`${endDate} 23:59:59`);
        }

        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const [[{ total }]] = await connection.query(countQuery, params);

        const selectQuery = `
            SELECT 
                o.id, o.user_id,
                u.username, u.email,
                o.customer_name, o.receiver_name, o.receiver_phone,
                o.total_price, o.phone, o.shipping_address, o.note,
                o.delivery_method,
                sl.name AS store_name, sl.address AS store_address,
                os.code AS status_code, os.name AS status_name,
                pm.name AS payment_method,
                o.created_at
            ${baseQuery}
            ORDER BY o.id DESC
            ${usePagination ? 'LIMIT ? OFFSET ?' : ''}
        `;
        const queryParams = usePagination ? [...params, +limit, +offset] : params;
        const [orders] = await connection.query(selectQuery, queryParams);

        const orderIds = orders.map(o => o.id);
        let items = [];
        if (orderIds.length > 0) {
            const [itemRows] = await connection.query(`
                SELECT 
                    oi.order_id, oi.name, oi.color, oi.ram, oi.rom,
                    oi.base_price, oi.final_price ,oi.quantity , oi.gift
                FROM order_items oi
                WHERE oi.order_id IN (?)
            `, [orderIds]);
            items = itemRows;
        }

        const orderMap = {};
        for (let order of orders) {
            order.items = [];
            orderMap[order.id] = order;

            order.full_address =
                order.delivery_method === 'pickup'
                    ? (order.store_name && order.store_address
                        ? `${order.store_name} - ${order.store_address}`
                        : 'Cửa hàng chưa xác định')
                    : order.shipping_address;
        }

        for (let item of items) {
            if (orderMap[item.order_id]) {
                orderMap[item.order_id].items.push(item);
            }
        }

        return res.status(200).json({
            EC: 0,
            EM: "Lấy danh sách đơn hàng thành công",
            data: {
                total,
                currentPage: +page,
                orders
            }
        });
    } catch (error) {
        console.error("Error in getAllOrders:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server khi lấy đơn hàng" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_id } = req.body;

        await connection.query(
            "UPDATE orders SET status_id = ? WHERE id = ?",
            [status_id, id]
        );

        return res.status(200).json({
            EC: 0,
            EM: "Cập nhật trạng thái đơn hàng thành công"
        });
    } catch (error) {
        console.error("Error in updateOrderStatus:", error);
        return res.status(500).json({
            EC: -1,
            EM: "Lỗi server khi cập nhật trạng thái đơn hàng"
        });
    }
};

const createOrder = async (req, res) => {
    const {
        user_id,
        option_id,
        cart_items,
        total_price,
        payment_method_id,
        delivery_method,
        pickup_location_id,
        shipping_address,
        phone,
        customer_name,
        receiver_name,
        receiver_phone,
        note,
        image
    } = req.body;

    if (!user_id || !cart_items?.length || !payment_method_id || !delivery_method) {
        return res.status(400).json({
            EC: -1,
            EM: "Thiếu thông tin bắt buộc"
        });
    }

    // Lấy connection từ pool
    const dbConnection = await connection.getConnection();

    try {
        // Bắt đầu transaction
        await dbConnection.beginTransaction();

        // 1. KIỂM TRA TỒN KHO TRƯỚC KHI TẠO ĐƠN HÀNG
        for (const item of cart_items) {
            if (item.option_id) {
                const [stockCheck] = await dbConnection.query(
                    `SELECT stock_quantity, ram, rom 
                     FROM product_variant_options 
                     WHERE id = ? FOR UPDATE`, // Lock row để tránh race condition
                    [item.option_id]
                );

                if (!stockCheck || stockCheck.length === 0) {
                    await dbConnection.rollback();
                    return res.status(400).json({
                        EC: -1,
                        EM: `Không tìm thấy thông tin sản phẩm`
                    });
                }

                if (stockCheck[0].stock_quantity < item.quantity) {
                    await dbConnection.rollback();
                    return res.status(400).json({
                        EC: -1,
                        EM: `Sản phẩm ${item.name} (${stockCheck[0].ram}/${stockCheck[0].rom}) chỉ còn ${stockCheck[0].stock_quantity} trong kho. Bạn đang đặt ${item.quantity} sản phẩm.`
                    });
                }
            }
        }

        // 2. GIẢM TỒN KHO TRƯỚC
        for (const item of cart_items) {
            if (item.option_id) {
                await dbConnection.query(
                    `UPDATE product_variant_options
                     SET stock_quantity = stock_quantity - ?
                     WHERE id = ?`,
                    [item.quantity, item.option_id]
                );
            }
        }

        // 3. TẠO ĐƠN HÀNG
        const [result] = await dbConnection.query(
            `INSERT INTO orders
             (user_id, total_price, payment_method_id, status_id, delivery_method, 
              pickup_location_id, shipping_address, phone, customer_name, 
              receiver_name, receiver_phone, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                total_price,
                payment_method_id,
                1, // mặc định status_id = 1 (chờ xác nhận)
                delivery_method,
                pickup_location_id || null,
                shipping_address || null,
                phone || null,
                customer_name || null,
                receiver_name || null,
                receiver_phone || null,
                note || null
            ]
        );

        const orderId = result.insertId;

        // 4. THÊM CÁC ITEMS VÀO ĐƠN HÀNG
        for (const item of cart_items) {
            await dbConnection.query(
                `INSERT INTO order_items
                 (order_id, name, color, ram, rom, base_price, final_price, 
                  quantity, gift, image, product_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.name,
                    item.color,
                    item.ram,
                    item.rom,
                    item.base_price,
                    item.final_price,
                    item.quantity,
                    item.gift || null,
                    item.image,
                    item.product_id
                ]
            );
        }

        // Commit transaction nếu tất cả thành công
        await dbConnection.commit();

        return res.status(200).json({
            EC: 0,
            EM: "Tạo đơn hàng thành công",
            data: {
                order_id: orderId,
                message: "Đơn hàng đã được tạo và hàng tồn kho đã được cập nhật"
            }
        });

    } catch (error) {
        // Rollback nếu có lỗi xảy ra
        await dbConnection.rollback();

        console.error("Lỗi khi tạo đơn hàng:", error);

        // Trả về lỗi cụ thể
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            return res.status(409).json({
                EC: -1,
                EM: "Sản phẩm đang được xử lý bởi người dùng khác, vui lòng thử lại sau"
            });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                EC: -1,
                EM: "Đơn hàng đã tồn tại, vui lòng kiểm tra lại"
            });
        }

        return res.status(500).json({
            EC: -1,
            EM: "Lỗi server khi tạo đơn hàng. Vui lòng thử lại sau."
        });
    } finally {
        // Trả connection về pool (không đóng)
        dbConnection.release();
    }
};


const sendOrderConfirmation = async (req, res) => {
    try {
        const { email, customer_name, cart_items, total_price } = req.body;

        if (!email || !cart_items?.length || !total_price) {
            return res.status(400).json({ EC: 1, EM: "Thiếu thông tin để gửi mail" });
        }

        const productLines = cart_items.map(item => {
            return `${item.name} - ${item.color} - ${item.ram}/${item.rom} x ${item.quantity}`;
        }).join('<br>');

        const htmlContent = `
      <p>Xin chào ${customer_name || 'khách hàng'},</p>
      <p>Đơn hàng của bạn đã được đặt thành công.</p>
      <p><b>Chi tiết đơn hàng:</b></p>
      <p>${productLines}</p>
      <p><b>Tổng tiền: </b>${Number(total_price).toLocaleString()}₫</p>
      <p>Cảm ơn bạn đã mua sắm tại Thế giới công nghệ.</p>
    `;

        await transporter.sendMail({
            from: `"Thế giới công nghệ" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Xác nhận đơn hàng",
            html: htmlContent
        });

        return res.status(200).json({ EC: 0, EM: "Gửi mail thành công" });
    } catch (err) {
        console.error("Lỗi gửi mail:", err);
        return res.status(500).json({ EC: -1, EM: "Lỗi server khi gửi mail" });
    }
};

const getUserOrderHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, start_date, end_date } = req.query;

        if (!userId) {
            return res.status(400).json({ EC: -1, EM: "Thiếu user_id" });
        }

        const params = [userId];

        let whereStatus = "";
        if (status) {
            whereStatus = "AND os.code = ?";
            params.push(status);
        }

        let whereDate = "";
        if (start_date && end_date) {
            whereDate = "AND DATE(o.created_at) BETWEEN ? AND ?";
            params.push(start_date, end_date);
        }

        const [orders] = await connection.query(
            `
      SELECT 
        o.id, o.created_at,
        os.code AS status_code,
        os.name AS status_name,
        o.delivery_method,
        o.total_price,
        pm.name AS payment_method
      FROM orders o
      JOIN order_statuses os ON o.status_id = os.id
      JOIN payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.user_id = ?
      ${whereStatus}
      ${whereDate}
      ORDER BY o.created_at DESC
      `,
            params
        );

        if (!orders.length) {
            return res.status(200).json({ EC: 0, EM: "Không có đơn hàng nào", data: [] });
        }

        const orderIds = orders.map(o => o.id);
        const [items] = await connection.query(
            `
      SELECT 
        order_id, name, color, ram, rom, quantity, final_price, image
      FROM order_items
      WHERE order_id IN (?)
      `,
            [orderIds]
        );

        const orderMap = {};
        for (const order of orders) {
            order.items = [];
            orderMap[order.id] = order;
        }

        for (const item of items) {
            if (orderMap[item.order_id]) {
                orderMap[item.order_id].items.push(item);
            }
        }

        return res.status(200).json({
            EC: 0,
            EM: "Lấy lịch sử đơn hàng thành công",
            data: orders
        });
    } catch (error) {
        console.error("Lỗi trong getUserOrderHistory:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server khi lấy lịch sử đơn hàng" });
    }
};



const cancelOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const [rows] = await connection.query(
            `SELECT status_id FROM orders WHERE id = ?`,
            [orderId]
        );

        if (!rows.length) {
            return res.status(404).json({ EC: -1, EM: "Đơn hàng không tồn tại" });
        }

        const currentStatusId = rows[0].status_id;
        if (currentStatusId !== 1) {
            return res.status(400).json({ EC: -1, EM: "Chỉ được huỷ đơn ở trạng thái 'Chờ xác nhận'" });
        }

        await connection.query(
            `UPDATE orders SET status_id = 5 WHERE id = ?`,
            [orderId]
        );

        return res.status(200).json({
            EC: 0,
            EM: "Huỷ đơn hàng thành công"
        });
    } catch (error) {
        console.error("❌ Lỗi huỷ đơn:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server khi huỷ đơn hàng" });
    }
};


const getPurchasedProducts = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ EC: -1, EM: "Thiếu userId" });
        }

        const [rows] = await connection.query(`
      SELECT DISTINCT oi.product_id
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND o.status_id = 4
    `, [userId]);

        const purchasedProductIds = rows.map(row => row.product_id);

        return res.status(200).json({
            EC: 0,
            EM: "Lấy danh sách sản phẩm đã mua thành công",
            data: purchasedProductIds
        });
    } catch (error) {
        console.error("Error getPurchasedProducts:", error);
        return res.status(500).json({ EC: -2, EM: "Lỗi server" });
    }
};


module.exports = {
    getAllOrders,
    updateOrderStatus,
    createOrder,
    sendOrderConfirmation,
    getUserOrderHistory,
    cancelOrder,
    getPurchasedProducts
};
