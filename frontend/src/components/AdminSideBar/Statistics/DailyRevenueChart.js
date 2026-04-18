import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { getDailyRevenue } from '../../../services/apiStatistics';

const DailyRevenueChart = () => {
    const [data, setData] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            let res = await getDailyRevenue();
            if (res.EC === 0) {
                const formatted = res.data.map(item => ({
                    ...item,
                    sale_date: new Date(item.sale_date).toLocaleDateString('vi-VN'),
                }));
                setData(formatted);
            }
        };

        fetchData();
    }, []);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sale_date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="daily_revenue" stroke="#82ca9d" name="Doanh thu (VNĐ)" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default DailyRevenueChart;
