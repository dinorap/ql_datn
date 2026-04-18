
import axios from '../utils/axiosCustomize';
const getFlashSaleProducts = () => {
    return axios.get(`view/flashsale`)
}
const getTopProductsByCategory = (category_id) => {
    return axios.get(`view/top-products`, {
        params: { category_id },

    });
};
const searchSuggestions = (keyword) => {
    return axios.get(`/view/search-product`, {
        params: { keyword },

    });
};

const getAllProductsSearch = (params) => {
    return axios.get(`/view/products`, {
        params: params,
    });
};

const getOneProductExpandFormat = (id) => {
    return axios.get(`/view/products/detail/${id}`)
};

const getAllProductSpecifications = () => {
    return axios.get(`/view/products/specs`)
}

const postReview = (product_id, user_id, rating, comment, parent_id = null) => {
    return axios.post(`/view/review`, {
        product_id,
        user_id,
        rating,
        comment,
        parent_id,
    });
};

const getSimilarProducts = (id) => {
    return axios.get(`/view/products/similar/${id}`)
}

const getProductReviews = (productId, page = 1, limit = 5, rating = null) => {
    const params = { page, limit };
    if (rating) params.rating = rating;
    return axios.get(`/view/products/reviews/${productId}`, { params });
};


const postSuggestCart = (productIds) => {
    return axios.post(`/view/product/suggest`, { productIds });
};


const getBundledProducts = (mainProductId) => {
    return axios.get(`/api/products/bundled/${mainProductId}`);
};
export {
    getFlashSaleProducts,
    getTopProductsByCategory,
    searchSuggestions,
    getAllProductsSearch,
    getOneProductExpandFormat,
    getAllProductSpecifications,
    postReview,
    getSimilarProducts,
    getProductReviews,
    postSuggestCart,
    getBundledProducts
}