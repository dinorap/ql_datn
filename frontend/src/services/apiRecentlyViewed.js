import axios from '../utils/axiosCustomize';
const addRecentlyViewed = (data) => {
    return axios.post('/view/recently-viewed', data);
};
const getAllRecentlyViewed = (userId) => {
    return axios.get(`view/recently-viewed/${userId}`);
};

const getSuggestRecenttly = (userId) => {
    return axios.get(`view/products/suggest/${userId}`);
};
export {
    addRecentlyViewed,
    getAllRecentlyViewed,
    getSuggestRecenttly
}