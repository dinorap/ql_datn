import axios from '../utils/axiosCustomize';
const addRecentlyViewed = (data) => {
    return axios.post('/view/recently-viewed', data);
};
const getAllRecentlyViewed = (userId) => {
    return axios.get(`view/recently-viewed/${userId}`, {
        params: { t: Date.now() },
    });
};

const getSuggestRecenttly = (userId) => {
    return axios.get(`view/products/suggest/${userId}`, {
        params: { t: Date.now() },
    });
};
export {
    addRecentlyViewed,
    getAllRecentlyViewed,
    getSuggestRecenttly
}