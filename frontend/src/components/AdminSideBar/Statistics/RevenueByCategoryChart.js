import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { getRevenueByProduct } from '../../../services/apiStatistics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28EF0', '#F08080', '#6AC259'];

const RevenueByCategoryChart = () => {
    const [data, setData] = useState([]);

    const fetchData = async () => {
        let res = await getRevenueByProduct();
        if (res.EC === 0) {
            setData(res.data);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="total_revenue"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default RevenueByCategoryChart;
