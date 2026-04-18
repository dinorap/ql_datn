const connection = require("../config/database");
const getTopSellingProducts = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const [rows] = await connection.query(
            `
      SELECT 
          oi.product_id,
          ANY_VALUE(oi.name) AS product_name,
          SUM(oi.quantity) AS total_sold,
          SUM(oi.final_price * oi.quantity) AS total_revenue
      FROM 
          order_items oi
      JOIN 
          orders o ON oi.order_id = o.id
      WHERE 
    o.status_id = 4
    ${start_date && end_date ? "AND o.created_at >= ? AND o.created_at < ?" : ""}

      GROUP BY 
          oi.product_id
      ORDER BY 
          total_sold DESC
      LIMIT 10;
    `,
            start_date && end_date ? [start_date, end_date] : []
        );

        return res.status(200).json({
            EC: 0,
            EM: "Lấy top 10 sản phẩm bán chạy thành công",
            data: rows,
        });
    } catch (error) {
        console.error("❌ Lỗi khi lấy top sản phẩm:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server" });
    }
};



const getDailyRevenue = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const [rows] = await connection.query(
            `
      SELECT 
          DATE(o.created_at) AS sale_date,
          SUM(oi.final_price * oi.quantity) AS daily_revenue
      FROM 
          order_items oi
      JOIN 
          orders o ON oi.order_id = o.id
    WHERE 
    o.status_id = 4
    ${start_date && end_date ? "AND o.created_at >= ? AND o.created_at < ?" : ""}

      GROUP BY 
          sale_date
      ORDER BY 
          sale_date;
    `,
            start_date && end_date ? [start_date, end_date] : []
        );

        return res.status(200).json({
            EC: 0,
            EM: "Lấy doanh thu theo ngày thành công",
            data: rows,
        });
    } catch (error) {
        console.error("❌ Lỗi khi lấy doanh thu theo ngày:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server" });
    }
};


const getRevenueByCategory = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const [rows] = await connection.query(
            `
      SELECT 
          c.name AS category_name,
          SUM(oi.final_price * oi.quantity) AS total_revenue
      FROM 
          order_items oi
      JOIN 
          orders o ON oi.order_id = o.id
      JOIN 
          products p ON oi.product_id = p.id
      JOIN 
          product_categories c ON p.category_id = c.id
     WHERE 
    o.status_id = 4
    ${start_date && end_date ? "AND o.created_at >= ? AND o.created_at < ?" : ""}

      GROUP BY 
          c.id;
    `,
            start_date && end_date ? [start_date, end_date] : []
        );

        return res.status(200).json({
            EC: 0,
            EM: "Lấy doanh thu theo loại sản phẩm thành công",
            data: rows,
        });
    } catch (error) {
        console.error("❌ Lỗi khi lấy doanh thu theo loại:", error);
        return res.status(500).json({ EC: -1, EM: "Lỗi server" });
    }
};




module.exports = {
    getTopSellingProducts,
    getDailyRevenue,
    getRevenueByCategory,
};