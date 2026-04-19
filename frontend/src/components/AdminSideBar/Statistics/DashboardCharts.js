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
import './DashboardCharts.scss';

const { RangePicker } = DatePicker;
const COLORS = ['#f97316', '#ef4444', '#fb7185', '#fb923c', '#dc2626', '#fca5a5', '#fdba74'];

const formatCurrency = (value = 0) =>
    `${Number(value || 0).toLocaleString('vi-VN')} đ`;

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

    const totalRevenue = dailyRevenue.reduce((sum, item) => sum + Number(item.daily_revenue || 0), 0);
    const avgRevenuePerDay = dailyRevenue.length > 0 ? totalRevenue / dailyRevenue.length : 0;
    const totalUnitsSold = topProducts.reduce((sum, item) => sum + Number(item.total_sold || 0), 0);

    const statCards = [
        {
            key: 'total-revenue',
            title: 'Tổng doanh thu',
            value: formatCurrency(totalRevenue),
            toneClass: 'tone-1',
        },
        {
            key: 'top-sold',
            title: 'Sản phẩm đã bán',
            value: Number(totalUnitsSold).toLocaleString('vi-VN'),
            toneClass: 'tone-2',
        },
        {
            key: 'avg-revenue',
            title: 'Doanh thu trung bình/ngày',
            value: formatCurrency(avgRevenuePerDay),
            toneClass: 'tone-3',
        },
        {
            key: 'category-count',
            title: 'Số danh mục có doanh thu',
            value: Number(revenueByCategory.length).toLocaleString('vi-VN'),
            toneClass: 'tone-4',
        },
    ];

    return (
        <div className="dashboard-charts">
            <Space className="dashboard-charts__date-filter">
                <span>Chọn khoảng thời gian:</span>
                <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                        if (dates) setDateRange(dates);
                    }}
                    allowClear={false}
                />
            </Space>

            <Row gutter={[16, 16]} className="dashboard-charts__stats">
                {statCards.map((card) => (
                    <Col key={card.key} xs={24} sm={12} xl={6}>
                        <div className={`stats-card ${card.toneClass}`}>
                            <p className="stats-card__value">{card.value}</p>
                            <span className="stats-card__label">{card.title}</span>
                        </div>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Top 10 sản phẩm bán chạy" bordered={false} className="dashboard-card">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={topProducts}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: -5, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffd9d2" />
                                <XAxis type="number" />
                                <YAxis dataKey="product_name" type="category" width={120} />
                                <Tooltip formatter={(value) => `${value} sản phẩm`} />
                                <Bar dataKey="total_sold" fill="#f97316" name="Số lượng bán" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>

                    </Card>
                </Col>



                <Col xs={24} lg={12}>
                    <Card title="Doanh thu theo danh mục" bordered={false} className="dashboard-card">
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
                            <div className="dashboard-charts__empty">
                                Không có dữ liệu doanh thu theo danh mục
                            </div>
                        )}

                    </Card>
                </Col>
                <Col xs={24} >
                    <Card title="Doanh thu theo ngày" bordered={false} className="dashboard-card">
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={dailyRevenue} margin={{ top: 20, right: 30, left: 30, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffd9d2" />
                                <XAxis dataKey="sale_date" />
                                <YAxis tickFormatter={(value) => value.toLocaleString('vi-VN')} width={70} />
                                <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`} />
                                <Line
                                    type="monotone"
                                    dataKey="daily_revenue"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: '#ef4444' }}
                                    name="Doanh thu (VNĐ)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardCharts;
