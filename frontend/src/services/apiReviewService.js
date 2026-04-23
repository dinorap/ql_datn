import axios from '../utils/axiosCustomize';


const getAllReviewsWithPaginate = (page, limit, searchType, search) => {
    return axios.get(`api/review/paginate`, {
        params: {
            page: page,
            limit: limit,
            search: search,
            searchType: searchType,
        }
    });
};


const replyToReview = (parent_id, comment, user_id, product_id) => {
    return axios.post(`api/review/reply`, {
        parent_id,
        comment,
        user_id,
        product_id
    });
};


const updateAdminReply = (id, comment, user_id) => {
    return axios.put(`api/review/${id}`, {
        comment,
        user_id
    });
};


const deleteAdminReply = (id) => {
    return axios.delete(`api/review/reply/${id}`);
};


const deleteUserReview = (id) => {
    return axios.delete(`api/review/${id}`);
};


const updateReviewActiveStatus = (id, is_active) => {
    return axios.put(`api/review`, {
        id,
        is_active
    });
};

const createAdminReview = (product_id, rating, comment, user_id) => {
    return axios.post(`api/review/admin-create`, {
        product_id,
        rating,
        comment,
        user_id
    });
};

export {
    getAllReviewsWithPaginate,
    replyToReview,
    updateAdminReply,
    deleteAdminReply,
    deleteUserReview,
    updateReviewActiveStatus,
    createAdminReview
};
