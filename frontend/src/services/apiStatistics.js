import axios from '../utils/axiosCustomize';
const getTopSellingProducts = ({ start_date, end_date }) => {
    const query = start_date && end_date
        ? `?start_date=${start_date}&end_date=${end_date}`
        : "";
    return axios.get(`/api/top-products${query}`);
};
const getDailyRevenue = ({ start_date, end_date }) => {
    const query = start_date && end_date
        ? `?start_date=${start_date}&end_date=${end_date}`
        : "";
    return axios.get(`/api/daily-revenue${query}`);
};
const getRevenueByProduct = ({ start_date, end_date }) => {
    const query = start_date && end_date
        ? `?start_date=${start_date}&end_date=${end_date}`
        : "";
    return axios.get(`/api/revenue-by-product${query}`);
};


export { getTopSellingProducts, getDailyRevenue, getRevenueByProduct }