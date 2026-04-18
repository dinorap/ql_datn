import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { getTopSellingProducts } from '../../../services/apiStatistics';

const TopSellingChart = () => {
    const [data, setData] = useState([]);
    const fetchData = async () => {
        let res = await getTopSellingProducts();
        if (res.EC === 0) {
            setData(res.data);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="product_name" type="category" />
                <Tooltip />
                <Bar dataKey="total_sold" fill="#8884d8" name="Số lượng bán" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default TopSellingChart;
