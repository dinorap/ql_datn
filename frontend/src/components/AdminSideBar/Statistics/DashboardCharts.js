import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, Row, Col, DatePicker, Space } from 'antd';
import { useEffect, useState } from 'react';
import {
    getTopSellingProducts,
    getDailyRevenue,
    getRevenueByProduct,
} from '../../../services/apiStatistics';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28EF0', '#F08080', '#6AC259'];

const DashboardCharts = () => {
    const [topProducts, setTopProducts] = useState([]);
    const [dailyRevenue, setDailyRevenue] = useState([]);
    const [revenueByCategory, setRevenueByCategory] = useState([]);
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(29, 'day'),
        dayjs()
    ]);

    const fetchData = async () => {
        const [start, end] = dateRange;
        const payload = {
            start_date: start.format('YYYY-MM-DD'),
            end_date: end.add(1, 'day').format('YYYY-MM-DD'),
        };

        const res1 = await getTopSellingProducts(payload);
        const res2 = await getDailyRevenue(payload);
        const res3 = await getRevenueByProduct(payload);
        if (res1.EC === 0) {
            const formatted = res1.data.map(item => ({
                ...item,
                total_revenue: parseFloat(item.total_revenue),
                total_sold: parseInt(item.total_sold),
            }));
            setTopProducts(formatted);
        }

        if (res2.EC === 0) {
            const formatted = res2.data.map(item => ({
                ...item,
                sale_date: new Date(item.sale_date).toLocaleDateString('vi-VN'),
                daily_revenue: parseFloat(item.daily_revenue),
            }));
            setDailyRevenue(formatted);
        }

        if (res3.EC === 0) {
            const formatted = res3.data.map(item => ({
                ...item,
                total_revenue: parseFloat(item.total_revenue),
            }));
            setRevenueByCategory(formatted);
        }
    };



    useEffect(() => {
        fetchData();
    }, [dateRange]);

    return (
        <div style={{ padding: 20 }}>
            <Space style={{ marginBottom: 20 }}>
                <span>📅 Chọn khoảng thời gian:</span>
                <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                        if (dates) setDateRange(dates);
                    }}
                    allowClear={false}
                />
            </Space>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="🔝 Top 10 sản phẩm bán chạy" bordered={false}>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={topProducts}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: -5, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="product_name" type="category" width={120} />
                                <Tooltip formatter={(value) => `${value} sản phẩm`} />
                                <Bar dataKey="total_sold" fill="#8884d8" name="Số lượng bán" />
                            </BarChart>
                        </ResponsiveContainer>

                    </Card>
                </Col>



                <Col xs={24} lg={12}>
                    <Card title="📊 Doanh thu theo danh mục" bordered={false}>
                        {revenueByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={revenueByCategory}
                                        dataKey="total_revenue"
                                        nameKey="category_name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {revenueByCategory.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>

                        ) : (
                            <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
                                Không có dữ liệu doanh thu theo danh mục
                            </div>
                        )}

                    </Card>
                </Col>
                <Col xs={24} >
                    <Card title="📈 Doanh thu theo ngày" bordered={false}>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={dailyRevenue} margin={{ top: 20, right: 30, left: 30, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="sale_date" />
                                <YAxis tickFormatter={(value) => value.toLocaleString('vi-VN')} width={70} />
                                <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`} />
                                <Line type="monotone" dataKey="daily_revenue" stroke="#82ca9d" name="Doanh thu (VNĐ)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardCharts;
